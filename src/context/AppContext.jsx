import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  initialOrders,
  initialProduction,
  initialInventory,
  initialCustomers,
  initialSettings,
  monthlyOrderTrends as defaultMonthlyTrends,
} from '../data/mockData';
import { loginToBackend, resetBackendDemoData } from '../services/api';
import { orderService } from '../services/orderService';
import { productionService } from '../services/productionService';
import { inventoryService } from '../services/inventoryService';
import { customerService } from '../services/customerService';
import { dashboardService } from '../services/dashboardService';
import { reportService } from '../services/reportService';

const AppContext = createContext(null);

const STORAGE_KEYS = {
  ORDERS: 'ordercraft_orders_v1',
  PRODUCTION: 'ordercraft_production_v1',
  INVENTORY: 'ordercraft_inventory_v1',
  CUSTOMERS: 'ordercraft_customers_v1',
  SETTINGS: 'ordercraft_settings_v1',
};

export function getStockStatus(availableQuantity, minStockLevel) {
  const qty = Number(availableQuantity) || 0;
  const min = Number(minStockLevel) || 0;
  if (qty <= 0) return 'Out of Stock';
  if (qty <= min) return 'Low Stock';
  return 'In Stock';
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Failed to load ${key} from localStorage`, e);
    return fallback;
  }
}

export function AppProvider({ children }) {
  const [orders, setOrders] = useState(() =>
    loadFromStorage(STORAGE_KEYS.ORDERS, initialOrders)
  );
  const [production, setProduction] = useState(() =>
    loadFromStorage(STORAGE_KEYS.PRODUCTION, initialProduction)
  );
  const [inventory, setInventory] = useState(() =>
    loadFromStorage(STORAGE_KEYS.INVENTORY, initialInventory)
  );
  const [customers, setCustomers] = useState(() =>
    loadFromStorage(STORAGE_KEYS.CUSTOMERS, initialCustomers)
  );
  const [settings, setSettings] = useState(() =>
    loadFromStorage(STORAGE_KEYS.SETTINGS, initialSettings)
  );
  const [monthlyOrderTrends, setMonthlyOrderTrends] =
    useState(defaultMonthlyTrends);
  const [reportsData, setReportsData] = useState(null);

  // Backend connectivity & loading states
  const [isLoading, setIsLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [backendError, setBackendError] = useState(null);

  const [toasts, setToasts] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [isSessionLocked, setIsSessionLocked] = useState(false);

  // Toast helper
  const addToast = useCallback((title, type = 'success', description = '') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, type, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch all data from Express + MongoDB Backend
  const refreshFromBackend = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        // Authenticate default demo operator to obtain JWT token
        await loginToBackend().catch(() => null);

        const [
          apiOrders,
          apiProduction,
          apiInventory,
          apiCustomers,
          apiDashboard,
          apiReports,
        ] = await Promise.all([
          orderService.getAll(),
          productionService.getAll(),
          inventoryService.getAll(),
          customerService.getAll(),
          dashboardService.getStats().catch(() => null),
          reportService.getReports().catch(() => null),
        ]);

        if (Array.isArray(apiOrders) && apiOrders.length > 0) {
          setOrders(apiOrders);
        }
        if (Array.isArray(apiProduction) && apiProduction.length > 0) {
          setProduction(apiProduction);
        }
        if (Array.isArray(apiInventory) && apiInventory.length > 0) {
          setInventory(apiInventory);
        }
        if (Array.isArray(apiCustomers) && apiCustomers.length > 0) {
          setCustomers(apiCustomers);
        }
        if (apiDashboard?.monthlyOrderTrends) {
          setMonthlyOrderTrends(apiDashboard.monthlyOrderTrends);
        }
        if (apiReports) {
          setReportsData(apiReports);
        }

        setBackendConnected(true);
        setBackendError(null);
      } catch (err) {
        setBackendConnected(false);
        setBackendError(
          'Unable to connect to server. Please make sure the backend is running.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initial load from backend on mount + auto-reconnect if server is booting
  useEffect(() => {
    refreshFromBackend(false);
  }, [refreshFromBackend]);

  useEffect(() => {
    if (backendConnected) return undefined;
    const timer = setInterval(() => {
      refreshFromBackend(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [backendConnected, refreshFromBackend]);

  // Sync changes to localStorage as fallback cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.warn(e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTION, JSON.stringify(production));
    } catch (e) {
      console.warn(e);
    }
  }, [production]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    } catch (e) {
      console.warn(e);
    }
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.warn(e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn(e);
    }
  }, [settings]);

  // Enriched inventory with computed stockStatus
  const enrichedInventory = useMemo(() => {
    return inventory.map((item) => {
      const qty = Number(item.availableQuantity ?? item.quantity ?? 0);
      const min = Number(item.minStockLevel ?? item.minimumStock ?? 0);
      return {
        ...item,
        id: item.id || item.itemId,
        name: item.name || item.itemName,
        availableQuantity: qty,
        minStockLevel: min,
        stockStatus: getStockStatus(qty, min),
      };
    });
  }, [inventory]);

  // Enriched customers with dynamic order count
  const enrichedCustomers = useMemo(() => {
    return customers.map((cust) => {
      const custName = cust.name || cust.customerName || '';
      const custCompany = cust.company || cust.companyName || '';
      const matchingOrders = orders.filter(
        (o) =>
          (o.customerName &&
            o.customerName.toLowerCase() === custName.toLowerCase()) ||
          (o.companyName &&
            custCompany &&
            o.companyName.toLowerCase() === custCompany.toLowerCase())
      );
      return {
        ...cust,
        id: cust.id || cust.customerId,
        name: custName,
        company: custCompany,
        ordersCount: (Number(cust.baseOrders) || 0) + matchingOrders.length,
        recentOrders: matchingOrders,
      };
    });
  }, [customers, orders]);

  // Dynamic notifications derived from current system state
  const notifications = useMemo(() => {
    const list = [];
    enrichedInventory.forEach((item) => {
      if (item.stockStatus === 'Out of Stock') {
        list.push({
          id: `notif-oos-${item.id}`,
          title: `Out of Stock: ${item.name}`,
          message: `Item ${item.id} has 0 ${item.unit} remaining (Min: ${item.minStockLevel}). Reorder from ${item.supplier}.`,
          type: 'critical',
          time: '10m ago',
          link: '/inventory',
        });
      } else if (item.stockStatus === 'Low Stock') {
        list.push({
          id: `notif-low-${item.id}`,
          title: `Low Stock Alert: ${item.name}`,
          message: `Only ${item.availableQuantity} ${item.unit} left in ${
            item.location || 'Warehouse'
          } (Min: ${item.minStockLevel}).`,
          type: 'warning',
          time: '35m ago',
          link: '/inventory',
        });
      }
    });

    orders
      .filter(
        (o) =>
          o.priority === 'Urgent' &&
          (o.status === 'Pending' || o.status === 'In Production')
      )
      .forEach((o) => {
        list.push({
          id: `notif-ord-${o.id}`,
          title: `Urgent Order ${o.id} (${o.status})`,
          message: `${o.productName} (${o.quantity} units) for ${o.customerName} due ${o.expectedDelivery}.`,
          type: 'info',
          time: '1h ago',
          link: '/orders',
        });
      });

    return list.map((n) => ({
      ...n,
      read: readNotificationIds.includes(n.id),
    }));
  }, [enrichedInventory, orders, readNotificationIds]);

  const markAllNotificationsRead = () => {
    setReadNotificationIds(notifications.map((n) => n.id));
    addToast('Notifications cleared', 'info', 'All system alerts marked as read.');
  };

  // ID generators
  const getNextOrderId = () => {
    const nums = orders
      .map((o) => {
        const match = String(o.id || o.orderId).match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 1000;
      })
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 1000;
    return `ORD-2026-${maxNum + 1}`;
  };

  const getNextProductionId = () => {
    const nums = production
      .map((p) => {
        const match = String(p.id || p.productionId).match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 500;
      })
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 500;
    return `PRD-${maxNum + 1}`;
  };

  const getNextInventoryId = () => {
    const nums = inventory
      .map((i) => {
        const match = String(i.id || i.itemId).match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 300;
      })
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 300;
    return `INV-${maxNum + 1}`;
  };

  const getNextCustomerId = () => {
    const nums = customers
      .map((c) => {
        const match = String(c.id || c.customerId).match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 200;
      })
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 200;
    return `CUS-${maxNum + 1}`;
  };

  // --- ORDER ACTIONS ---
  const addOrder = async (orderData) => {
    const newOrder = {
      ...orderData,
      id: orderData.id || getNextOrderId(),
      quantity: Number(orderData.quantity) || 1,
      unitPrice: Number(orderData.unitPrice) || 150,
    };
    setOrders((prev) => [newOrder, ...prev]);

    try {
      const saved = await orderService.create(newOrder);
      if (saved) {
        setOrders((prev) =>
          prev.map((o) => (o.id === newOrder.id ? saved : o))
        );
      }
      addToast(
        `Order ${newOrder.id} Created`,
        'success',
        `${newOrder.productName} saved to MongoDB.`
      );
    } catch (err) {
      addToast(
        `Order ${newOrder.id} Created (Local)`,
        'info',
        `${newOrder.productName} saved to local state.`
      );
    }
    return newOrder;
  };

  const updateOrder = async (id, updatedData) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? {
              ...order,
              ...updatedData,
              quantity: Number(updatedData.quantity ?? order.quantity),
              unitPrice: Number(updatedData.unitPrice ?? order.unitPrice),
            }
          : order
      )
    );

    try {
      const saved = await orderService.update(id, updatedData);
      if (saved) {
        setOrders((prev) => prev.map((o) => (o.id === id ? saved : o)));
      }
      addToast(`Order ${id} Updated`, 'success', 'Changes persisted to MongoDB.');
    } catch (err) {
      addToast(`Order ${id} Updated`, 'success', 'Changes saved to local state.');
    }
  };

  const updateOrderStatus = async (id, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
    try {
      await orderService.update(id, { status: newStatus });
      addToast(
        `Order ${id} Status → ${newStatus}`,
        'info',
        'Order status synced with MongoDB.'
      );
    } catch (err) {
      addToast(
        `Order ${id} Status → ${newStatus}`,
        'info',
        'Order pipeline updated locally.'
      );
    }
  };

  const deleteOrder = async (id) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    try {
      await orderService.remove(id);
      addToast(
        `Order ${id} Deleted`,
        'warning',
        'Record removed from MongoDB database.'
      );
    } catch (err) {
      addToast(`Order ${id} Deleted`, 'warning', 'Record removed from system.');
    }
  };

  // --- PRODUCTION ACTIONS ---
  const addProduction = async (prodData) => {
    const newProd = {
      ...prodData,
      id: prodData.id || getNextProductionId(),
      quantity: Number(prodData.quantity) || 1,
      progress: Number(prodData.progress) || 0,
    };
    setProduction((prev) => [newProd, ...prev]);

    if (newProd.orderId && newProd.status === 'In Progress') {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === newProd.orderId ? { ...o, status: 'In Production' } : o
        )
      );
    }

    try {
      const saved = await productionService.create(newProd);
      if (saved) {
        setProduction((prev) =>
          prev.map((p) => (p.id === newProd.id ? saved : p))
        );
      }
      addToast(
        `Production Run ${newProd.id} Scheduled`,
        'success',
        `${newProd.productName} saved to MongoDB.`
      );
    } catch (err) {
      addToast(
        `Production Run ${newProd.id} Scheduled`,
        'success',
        `${newProd.productName} assigned to ${newProd.supervisor}.`
      );
    }
    return newProd;
  };

  const updateProduction = async (id, updatedData) => {
    setProduction((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updatedData,
              quantity: Number(updatedData.quantity ?? item.quantity),
              progress: Number(updatedData.progress ?? item.progress),
            }
          : item
      )
    );

    try {
      const saved = await productionService.update(id, updatedData);
      if (saved) {
        setProduction((prev) => prev.map((p) => (p.id === id ? saved : p)));
      }
      addToast(`Production ${id} Updated`, 'success', 'Shop floor schedule synced to MongoDB.');
    } catch (err) {
      addToast(`Production ${id} Updated`, 'success', 'Shop floor schedule updated.');
    }
  };

  const startProduction = async (id) => {
    let linkedOrderId = null;
    setProduction((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          linkedOrderId = item.orderId;
          const nextProgress = item.progress === 0 ? 15 : item.progress;
          return { ...item, status: 'In Progress', progress: nextProgress };
        }
        return item;
      })
    );
    if (linkedOrderId) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === linkedOrderId &&
          (o.status === 'Pending' || o.status === 'Confirmed')
            ? { ...o, status: 'In Production' }
            : o
        )
      );
    }

    try {
      await productionService.updateStatus(id, { status: 'In Progress' });
    } catch (err) {
      // Fallback handled by optimistic update
    }

    addToast(
      `Production ${id} Started`,
      'success',
      'Work center activated & order set to In Production.'
    );
  };

  const completeProduction = async (id) => {
    let linkedOrderId = null;
    setProduction((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          linkedOrderId = item.orderId;
          return { ...item, status: 'Completed', progress: 100 };
        }
        return item;
      })
    );
    if (linkedOrderId) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === linkedOrderId ? { ...o, status: 'Completed' } : o
        )
      );
    }

    try {
      await productionService.updateStatus(id, {
        status: 'Completed',
        progress: 100,
      });
    } catch (err) {
      // Fallback handled by optimistic update
    }

    addToast(
      `Production ${id} Completed (100%)`,
      'success',
      'Batch finished and linked order marked Completed!'
    );
  };

  const updateProductionProgress = async (id, deltaOrValue, isAbsolute = false) => {
    let computedProgress = 0;
    setProduction((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newProgress = Math.max(
          0,
          Math.min(
            100,
            isAbsolute
              ? Number(deltaOrValue)
              : item.progress + Number(deltaOrValue)
          )
        );
        computedProgress = newProgress;
        let newStatus = item.status;
        if (newProgress === 100) newStatus = 'Completed';
        else if (newProgress >= 85 && item.status !== 'Completed')
          newStatus = 'Quality Check';
        else if (newProgress > 0 && item.status === 'Scheduled')
          newStatus = 'In Progress';
        else if (newProgress === 0 && item.status === 'In Progress')
          newStatus = 'Scheduled';
        return { ...item, progress: newProgress, status: newStatus };
      })
    );

    try {
      await productionService.updateProgress(
        id,
        isAbsolute ? { progress: computedProgress } : { delta: deltaOrValue }
      );
    } catch (err) {
      // Local state already updated
    }
  };

  const deleteProduction = async (id) => {
    setProduction((prev) => prev.filter((p) => p.id !== id));
    try {
      await productionService.remove(id);
      addToast(
        `Production Run ${id} Removed`,
        'warning',
        'Removed from MongoDB production schedule.'
      );
    } catch (err) {
      addToast(
        `Production Run ${id} Removed`,
        'warning',
        'Removed from production schedule.'
      );
    }
  };

  // --- INVENTORY ACTIONS ---
  const addInventoryItem = async (itemData) => {
    const newItem = {
      ...itemData,
      id: itemData.id || getNextInventoryId(),
      availableQuantity: Number(itemData.availableQuantity) || 0,
      minStockLevel: Number(itemData.minStockLevel) || 10,
      unitCost: Number(itemData.unitCost) || 25,
    };
    setInventory((prev) => [newItem, ...prev]);

    try {
      const saved = await inventoryService.create(newItem);
      if (saved) {
        setInventory((prev) =>
          prev.map((i) => (i.id === newItem.id ? saved : i))
        );
      }
      addToast(
        `Item ${newItem.id} Added`,
        'success',
        `${newItem.name} saved to MongoDB.`
      );
    } catch (err) {
      addToast(
        `Item ${newItem.id} Added`,
        'success',
        `${newItem.name} added to inventory.`
      );
    }
    return newItem;
  };

  const updateInventoryItem = async (id, updatedData) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updatedData,
              availableQuantity: Number(
                updatedData.availableQuantity ?? item.availableQuantity
              ),
              minStockLevel: Number(
                updatedData.minStockLevel ?? item.minStockLevel
              ),
              unitCost: Number(updatedData.unitCost ?? item.unitCost),
            }
          : item
      )
    );

    try {
      const saved = await inventoryService.update(id, updatedData);
      if (saved) {
        setInventory((prev) => prev.map((i) => (i.id === id ? saved : i)));
      }
      addToast(
        `Inventory ${id} Updated`,
        'success',
        'Stock levels updated in MongoDB.'
      );
    } catch (err) {
      addToast(
        `Inventory ${id} Updated`,
        'success',
        'Stock levels and thresholds recalculated.'
      );
    }
  };

  const adjustInventoryStock = async (id, delta) => {
    let targetName = '';
    let updatedQty = 0;
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        targetName = item.name;
        updatedQty = Math.max(0, Number(item.availableQuantity) + Number(delta));
        return { ...item, availableQuantity: updatedQty, quantity: updatedQty };
      })
    );

    try {
      const saved = await inventoryService.update(id, { delta });
      if (saved) {
        setInventory((prev) => prev.map((i) => (i.id === id ? saved : i)));
      }
    } catch (err) {
      // Local state already updated
    }

    addToast(
      `Stock Adjusted (${delta > 0 ? `+${delta}` : delta})`,
      delta > 0 ? 'success' : 'info',
      `${targetName} now has ${updatedQty} units.`
    );
  };

  const deleteInventoryItem = async (id) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
    try {
      await inventoryService.remove(id);
      addToast(
        `Inventory Item ${id} Deleted`,
        'warning',
        'Removed from MongoDB warehouse catalog.'
      );
    } catch (err) {
      addToast(
        `Inventory Item ${id} Deleted`,
        'warning',
        'Removed from warehouse catalog.'
      );
    }
  };

  // --- CUSTOMER ACTIONS ---
  const addCustomer = async (custData) => {
    const newCust = {
      ...custData,
      id: custData.id || getNextCustomerId(),
      baseOrders: Number(custData.baseOrders) || 0,
      status: custData.status || 'Active',
    };
    setCustomers((prev) => [newCust, ...prev]);

    try {
      const saved = await customerService.create(newCust);
      if (saved) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === newCust.id ? saved : c))
        );
      }
      addToast(
        `Customer ${newCust.name} Added`,
        'success',
        `${newCust.company} saved to MongoDB.`
      );
    } catch (err) {
      addToast(
        `Customer ${newCust.name} Added`,
        'success',
        `${newCust.company} registered in directory.`
      );
    }
    return newCust;
  };

  const updateCustomer = async (id, updatedData) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
    );
    try {
      const saved = await customerService.update(id, updatedData);
      if (saved) {
        setCustomers((prev) => prev.map((c) => (c.id === id ? saved : c)));
      }
      addToast(
        `Customer ${id} Updated`,
        'success',
        'Directory information updated in MongoDB.'
      );
    } catch (err) {
      addToast(
        `Customer ${id} Updated`,
        'success',
        'Directory information updated.'
      );
    }
  };

  const deleteCustomer = async (id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    try {
      await customerService.remove(id);
      addToast(
        `Customer ${id} Removed`,
        'warning',
        'Customer deleted from MongoDB directory.'
      );
    } catch (err) {
      addToast(
        `Customer ${id} Removed`,
        'warning',
        'Customer removed from directory.'
      );
    }
  };

  // --- SETTINGS & DEMO RESET ---
  const updateSettings = (section, data) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }));
    addToast('Settings Saved', 'success', `Updated ${section} configuration.`);
  };

  const resetDemoData = async () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setSettings(initialSettings);
    setReadNotificationIds([]);

    try {
      await resetBackendDemoData();
      await refreshFromBackend(true);
      addToast(
        'MongoDB Demo Data Restored',
        'success',
        'All orders, production runs, inventory, and customers reset in MongoDB.'
      );
    } catch (err) {
      setOrders(initialOrders);
      setProduction(initialProduction);
      setInventory(initialInventory);
      setCustomers(initialCustomers);
      addToast(
        'Demo Data Restored (Local)',
        'success',
        'All orders, production runs, inventory, and customers reset to factory defaults.'
      );
    }
  };

  const value = {
    orders,
    production,
    inventory: enrichedInventory,
    customers: enrichedCustomers,
    settings,
    monthlyOrderTrends,
    reportsData,
    isLoading,
    backendConnected,
    backendError,
    refreshFromBackend,
    notifications,
    toasts,
    isSessionLocked,
    setIsSessionLocked,
    addToast,
    removeToast,
    markAllNotificationsRead,
    // Orders
    getNextOrderId,
    addOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    // Production
    getNextProductionId,
    addProduction,
    updateProduction,
    startProduction,
    completeProduction,
    updateProductionProgress,
    deleteProduction,
    // Inventory
    getNextInventoryId,
    addInventoryItem,
    updateInventoryItem,
    adjustInventoryStock,
    deleteInventoryItem,
    // Customers
    getNextCustomerId,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    // Settings & Reset
    updateSettings,
    resetDemoData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
