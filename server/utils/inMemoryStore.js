const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Persistent JSON-file-backed Mongoose-compatible database engine.
 * Activates automatically when a local MongoDB service (mongod on port 27017)
 * is not running on the host machine, saving all collections to
 * `server/data/ordercraft_db.json` so all CRUD changes persist across restarts.
 */
const DB_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DB_DIR, 'ordercraft_db.json');

let collections = {
  orders: [],
  production: [],
  inventory: [],
  customers: [],
  users: [],
};

function loadDiskDatabase() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        collections = {
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          production: Array.isArray(parsed.production) ? parsed.production : [],
          inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
          customers: Array.isArray(parsed.customers) ? parsed.customers : [],
          users: Array.isArray(parsed.users) ? parsed.users : [],
        };
      }
    }
  } catch (err) {
    console.warn('[Database] Could not read disk database file, initializing new store:', err.message);
  }
}

function saveDiskDatabase() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(collections, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Database] Failed to persist database to disk:', err.message);
  }
}

// Load existing persisted records immediately on startup
loadDiskDatabase();

function matchesFilter(doc, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, cond] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(cond)) {
      const anyMatch = cond.some((sub) => matchesFilter(doc, sub));
      if (!anyMatch) return false;
      continue;
    }

    const val = doc[key];
    if (cond instanceof RegExp) {
      if (!cond.test(String(val ?? ''))) return false;
    } else if (
      cond &&
      typeof cond === 'object' &&
      !(cond instanceof Date)
    ) {
      if (cond.$gte !== undefined && String(val) < String(cond.$gte)) return false;
      if (cond.$lte !== undefined && String(val) > String(cond.$lte)) return false;
    } else if (val !== cond) {
      return false;
    }
  }
  return true;
}

function createDocumentInstance(collectionName, rawData, options = {}) {
  const doc = {
    _id: rawData._id || new mongoose.Types.ObjectId().toString(),
    createdAt: rawData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...rawData,
  };

  Object.defineProperty(doc, 'save', {
    enumerable: false,
    configurable: true,
    value: async function () {
      this.updatedAt = new Date().toISOString();
      if (options.beforeSave) {
        await options.beforeSave(this);
      }
      if (!collections[collectionName]) {
        collections[collectionName] = [];
      }
      const list = collections[collectionName];
      const idx = list.findIndex((item) => String(item._id) === String(this._id));
      if (idx >= 0) {
        list[idx] = this;
      } else {
        list.unshift(this);
      }
      saveDiskDatabase();
      return this;
    },
  });

  Object.defineProperty(doc, 'toJSON', {
    enumerable: false,
    configurable: true,
    value: function () {
      const clone = { ...this };
      if (options.transform) {
        return options.transform(this, clone);
      }
      return clone;
    },
  });

  if (options.methods) {
    for (const [mName, fn] of Object.entries(options.methods)) {
      Object.defineProperty(doc, mName, {
        enumerable: false,
        configurable: true,
        value: fn.bind(doc),
      });
    }
  }

  return doc;
}

function hydrateCollection(collectionName, options = {}) {
  if (!collections[collectionName]) {
    collections[collectionName] = [];
  }
  collections[collectionName] = collections[collectionName].map((raw) =>
    createDocumentInstance(collectionName, raw, options)
  );
  return collections[collectionName];
}

function wrapQueryResult(items) {
  let current = [...items];
  const queryPromise = Promise.resolve(current);

  const chain = {
    sort(sortSpec = {}) {
      const entries = Object.entries(sortSpec);
      if (entries.length > 0) {
        const [field, dir] = entries[0];
        current.sort((a, b) => {
          const av = a[field] ?? '';
          const bv = b[field] ?? '';
          if (av < bv) return dir === -1 ? 1 : -1;
          if (av > bv) return dir === -1 ? -1 : 1;
          return 0;
        });
      }
      return chain;
    },
    select(_fields) {
      return chain;
    },
    lean() {
      return chain;
    },
    then(resolve, reject) {
      return Promise.resolve(current).then(resolve, reject);
    },
    catch(reject) {
      return queryPromise.catch(reject);
    },
  };

  return chain;
}

function createHybridModel(mongooseModel, collectionName, options = {}) {
  hydrateCollection(collectionName, options);

  const isMongoConnected = () => mongoose.connection.readyState === 1;

  return new Proxy(mongooseModel, {
    get(target, prop) {
      if (isMongoConnected()) {
        const val = target[prop];
        return typeof val === 'function' ? val.bind(target) : val;
      }

      const store = hydrateCollection(collectionName, options);

      if (prop === 'find') {
        return (filter = {}) => {
          const matched = store.filter((d) => matchesFilter(d, filter));
          return wrapQueryResult(matched);
        };
      }

      if (prop === 'findOne') {
        return (filter = {}) => {
          const found = store.find((d) => matchesFilter(d, filter)) || null;
          return {
            select: () => Promise.resolve(found),
            lean: () => Promise.resolve(found),
            then: (res, rej) => Promise.resolve(found).then(res, rej),
          };
        };
      }

      if (prop === 'findById') {
        return (id) => {
          const found = store.find((d) => String(d._id) === String(id)) || null;
          return {
            select: () => Promise.resolve(found),
            then: (res, rej) => Promise.resolve(found).then(res, rej),
          };
        };
      }

      if (prop === 'create') {
        return async (data) => {
          const inst = createDocumentInstance(collectionName, data, options);
          await inst.save();
          return inst;
        };
      }

      if (prop === 'insertMany') {
        return async (arr = []) => {
          const created = [];
          for (const item of arr) {
            const inst = createDocumentInstance(collectionName, item, options);
            if (options.beforeSave) await options.beforeSave(inst);
            collections[collectionName].push(inst);
            created.push(inst);
          }
          saveDiskDatabase();
          return created;
        };
      }

      if (prop === 'deleteMany') {
        return async () => {
          const count = collections[collectionName].length;
          collections[collectionName] = [];
          saveDiskDatabase();
          return { deletedCount: count };
        };
      }

      if (prop === 'countDocuments') {
        return async (filter = {}) => {
          return store.filter((d) => matchesFilter(d, filter)).length;
        };
      }

      if (prop === 'findOneAndUpdate') {
        return async (filter = {}, updates = {}) => {
          const found = store.find((d) => matchesFilter(d, filter));
          if (!found) return null;
          Object.assign(found, updates);
          await found.save();
          return found;
        };
      }

      if (prop === 'findOneAndDelete') {
        return async (filter = {}) => {
          const idx = collections[collectionName].findIndex((d) =>
            matchesFilter(d, filter)
          );
          if (idx === -1) return null;
          const [removed] = collections[collectionName].splice(idx, 1);
          saveDiskDatabase();
          return removed;
        };
      }

      if (prop === 'findByIdAndDelete') {
        return async (id) => {
          const idx = collections[collectionName].findIndex(
            (d) => String(d._id) === String(id)
          );
          if (idx === -1) return null;
          const [removed] = collections[collectionName].splice(idx, 1);
          saveDiskDatabase();
          return removed;
        };
      }

      return target[prop];
    },
  });
}

module.exports = { createHybridModel, bcrypt, DB_FILE };
