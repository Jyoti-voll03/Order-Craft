import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  initialOrders,
  initialProduction,
  initialInventory,
  initialCustomers,
  initialSettings,
  monthlyOrderTrends,
} from '../data/mockData';

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
  const [orders, setOrders] = useState(() => loadFromStorage(STORAGE_KEYS.ORDERS, initialOrders));
  const [production, setProduction] = useState(() => loadFromStorage(STORAGE_KEYS.PRODUCTION, initialProduction));
  const [inventory, setInventory] = useState(() => loadFromStorage(STORAGE_KEYS.INVENTORY, initialInventory));
  const [customers, setCustomers] = useState(() => loadFromStorage(STORAGE_KEYS.CUSTOMERS, initialCustomers));
  const [settings, setSettings] = useState(() => loadFromStorage(STORAGE_KEYS.SETTINGS, initialSettings));

  const [toasts, setToasts] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [isSessionLocked, setIsSessionLocked] = useState(false);

  // Sync changes to localStorage
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

  // Toast helper
  const addToast = (title, type = 'success', description = '') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, type, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Enriched inventory with computed stockStatus
  const enrichedInventory = useMemo(() => {
    return inventory.map((item) => ({
      ...item,
      stockStatus: getStockStatus(item.availableQuantity, item.minStockLevel),
    }));
  }, [inventory]);

  // Enriched customers with dynamic order count
  const enrichedCustomers = useMemo(() => {
    return customers.map((cust) => {
      const matchingOrders = orders.filter(
        (o) =>
          o.customerName.toLowerCase() === cust.name.toLowerCase() ||
          (o.companyName && cust.company && o.companyName.toLowerCase() === cust.company.toLowerCase())
      );
      return {
        ...cust,
        ordersCount: (cust.baseOrders || 0) + matchingOrders.length,
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
          message: `Only ${item.availableQuantity} ${item.unit} left in ${item.location || 'Warehouse'} (Min: ${item.minStockLevel}).`,
          type: 'warning',
          time: '35m ago',
          link: '/inventory',
        });
      }
    });

    orders
      .filter((o) => o.priority === 'Urgent' && (o.status === 'Pending' || o.status === 'In Production'))
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
        const match = String(o.id).match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 1000;
      })
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 1000;
    return `ORD-2026-${maxNum + 1}`;
  };

  const getNextProductionId = () => {
    const nums = production
      .map((p) => {
        const match = String(p.id).match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 500;
      })
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 500;
    return `PRD-${maxNum + 1}`;
  };

  const getNextInventoryId = () => {
    const nums = inventory
      .map((i) => {
        const match = String(i.id).match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 300;
      })
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 300;
    return `INV-${maxNum + 1}`;
  };

  const getNextCustomerId = () => {
    const nums = customers
      .map((c) => {
        const match = String(c.id).match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 200;
      })
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 200;
    return `CUS-${maxNum + 1}`;
  };

  // --- ORDER ACTIONS ---
  const addOrder = (orderData) => {
    const newOrder = {
      ...orderData,
      id: orderData.id || getNextOrderId(),
      quantity: Number(orderData.quantity) || 1,
      unitPrice: Number(orderData.unitPrice) || 150,
    };
    setOrders((prev) => [newOrder, ...prev]);
    addToast(`Order ${newOrder.id} Created`, 'success', `${newOrder.productName} for ${newOrder.customerName}`);
    return newOrder;
  };

  const updateOrder = (id, updatedData) => {
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
    addToast(`Order ${id} Updated`, 'success', 'Changes saved to local state.');
  };

  const updateOrderStatus = (id, newStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    addToast(`Order ${id} Status → ${newStatus}`, 'info', 'Order pipeline updated.');
  };

  const deleteOrder = (id) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    addToast(`Order ${id} Deleted`, 'warning', 'Record removed from system.');
  };

  // --- PRODUCTION ACTIONS ---
  const addProduction = (prodData) => {
    const newProd = {
      ...prodData,
      id: prodData.id || getNextProductionId(),
      quantity: Number(prodData.quantity) || 1,
      progress: Number(prodData.progress) || 0,
    };
    setProduction((prev) => [newProd, ...prev]);
    if (newProd.orderId && newProd.status === 'In Progress') {
      setOrders((prev) =>
        prev.map((o) => (o.id === newProd.orderId ? { ...o, status: 'In Production' } : o))
      );
    }
    addToast(`Production Run ${newProd.id} Scheduled`, 'success', `${newProd.productName} assigned to ${newProd.supervisor}`);
    return newProd;
  };

  const updateProduction = (id, updatedData) => {
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
    addToast(`Production ${id} Updated`, 'success', 'Shop floor schedule updated.');
  };

  const startProduction = (id) => {
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
          o.id === linkedOrderId && (o.status === 'Pending' || o.status === 'Confirmed')
            ? { ...o, status: 'In Production' }
            : o
        )
      );
    }
    addToast(`Production ${id} Started`, 'success', 'Work center activated & order set to In Production.');
  };

  const completeProduction = (id) => {
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
        prev.map((o) => (o.id === linkedOrderId ? { ...o, status: 'Completed' } : o))
      );
    }
    addToast(`Production ${id} Completed (100%)`, 'success', 'Batch finished and linked order marked Completed!');
  };

  const updateProductionProgress = (id, deltaOrValue, isAbsolute = false) => {
    setProduction((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newProgress = Math.max(
          0,
          Math.min(100, isAbsolute ? Number(deltaOrValue) : item.progress + Number(deltaOrValue))
        );
        let newStatus = item.status;
        if (newProgress === 100) newStatus = 'Completed';
        else if (newProgress >= 85 && item.status !== 'Completed') newStatus = 'Quality Check';
        else if (newProgress > 0 && item.status === 'Scheduled') newStatus = 'In Progress';
        else if (newProgress === 0 && item.status === 'In Progress') newStatus = 'Scheduled';
        return { ...item, progress: newProgress, status: newStatus };
      })
    );
  };

  const deleteProduction = (id) => {
    setProduction((prev) => prev.filter((p) => p.id !== id));
    addToast(`Production Run ${id} Removed`, 'warning', 'Removed from production schedule.');
  };

  // --- INVENTORY ACTIONS ---
  const addInventoryItem = (itemData) => {
    const newItem = {
      ...itemData,
      id: itemData.id || getNextInventoryId(),
      availableQuantity: Number(itemData.availableQuantity) || 0,
      minStockLevel: Number(itemData.minStockLevel) || 10,
      unitCost: Number(itemData.unitCost) || 25,
    };
    setInventory((prev) => [newItem, ...prev]);
    addToast(`Item ${newItem.id} Added`, 'success', `${newItem.name} added to inventory.`);
    return newItem;
  };

  const updateInventoryItem = (id, updatedData) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updatedData,
              availableQuantity: Number(updatedData.availableQuantity ?? item.availableQuantity),
              minStockLevel: Number(updatedData.minStockLevel ?? item.minStockLevel),
              unitCost: Number(updatedData.unitCost ?? item.unitCost),
            }
          : item
      )
    );
    addToast(`Inventory ${id} Updated`, 'success', 'Stock levels and thresholds recalculated.');
  };

  const adjustInventoryStock = (id, delta) => {
    let targetName = '';
    let updatedQty = 0;
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        targetName = item.name;
        updatedQty = Math.max(0, Number(item.availableQuantity) + Number(delta));
        return { ...item, availableQuantity: updatedQty };
      })
    );
    addToast(
      `Stock Adjusted (${delta > 0 ? `+${delta}` : delta})`,
      delta > 0 ? 'success' : 'info',
      `${targetName} now has ${updatedQty} units.`
    );
  };

  const deleteInventoryItem = (id) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
    addToast(`Inventory Item ${id} Deleted`, 'warning', 'Removed from warehouse catalog.');
  };

  // --- CUSTOMER ACTIONS ---
  const addCustomer = (custData) => {
    const newCust = {
      ...custData,
      id: custData.id || getNextCustomerId(),
      baseOrders: Number(custData.baseOrders) || 0,
      status: custData.status || 'Active',
    };
    setCustomers((prev) => [newCust, ...prev]);
    addToast(`Customer ${newCust.name} Added`, 'success', `${newCust.company} registered in directory.`);
    return newCust;
  };

  const updateCustomer = (id, updatedData) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
    );
    addToast(`Customer ${id} Updated`, 'success', 'Directory information updated.');
  };

  const deleteCustomer = (id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    addToast(`Customer ${id} Removed`, 'warning', 'Customer removed from directory.');
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

  const resetDemoData = () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setOrders(initialOrders);
    setProduction(initialProduction);
    setInventory(initialInventory);
    setCustomers(initialCustomers);
    setSettings(initialSettings);
    setReadNotificationIds([]);
    addToast(
      'Demo Data Restored',
      'success',
      'All orders, production runs, inventory, and customers reset to factory defaults.'
    );
  };

  const value = {
    orders,
    production,
    inventory: enrichedInventory,
    customers: enrichedCustomers,
    settings,
    monthlyOrderTrends,
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
