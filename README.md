# OrderCraft – Manufacturing Order and Management System (Frontend)

**OrderCraft** is a modern, responsive SaaS-style Manufacturing ERP and Order Management System built with **React.js (Vite)**, **Tailwind CSS**, **Lucide React**, **Recharts**, and **React Router DOM**.

Designed for a live college project demonstration, every module operates interactively in the browser using realistic sample manufacturing data and automatic `localStorage` persistence.

---

## 1. Technology Stack

- **Frontend Framework:** React 18 with Vite
- **Styling:** Tailwind CSS (Custom Dark Navy Blue `#0f172a` & Industrial Orange `#f97316` theme)
- **Icons:** Lucide React (`lucide-react`)
- **Visualizations & Charts:** Recharts (`recharts`)
- **Routing:** React Router DOM v6 (`react-router-dom`)
- **State & Persistence:** React Context API (`AppContext.jsx`) + `localStorage` with one-click Demo Data Reset

---

## 2. Core Modules & Features

1. **Dashboard (`/`)**
   - 5 KPI Summary Cards: Total Orders, Pending Orders, Active Production, Completed Orders, and Low Stock Items.
   - Monthly Order & Fulfillment Trends Line Chart + Production Status Distribution Doughnut Chart.
   - Recent Customer Orders table, Live Production Activity progress bars, and Critical Inventory Alerts with instant `+50 Restock` buttons.
2. **Orders Management (`/orders`)**
   - Searchable and multi-filterable Orders table (filter by Status, Priority, and Order Date range).
   - Auto-generated Order IDs (`ORD-2026-XXXX`), Add New Order modal with validation, Edit Order, View Order Specification modal, inline Status switcher, and Delete Confirmation dialog.
3. **Production Management (`/production`)**
   - Toggle between **Table View** and **Interactive Schedule Cards View**.
   - One-click **Start Production** and **Complete Production (100%)** actions that automatically synchronize the linked Customer Order status.
   - Interactive progress controls (`-10%`, `+10%`, and range slider).
4. **Inventory Management (`/inventory`)**
   - Dynamic stock status engine (`In Stock`, `Low Stock`, `Out of Stock`) based on `Available Quantity` vs `Minimum Stock Level`.
   - Quick stock adjustment controls (`-10`, `+25`, `Restock +50`), category & status filters, and validated Add/Edit/Delete workflows.
5. **Customer Management (`/customers`)**
   - B2B Customer Directory with full search, Add/Edit/Delete Customer modals, and an interactive **Customer Dossier & Order History** modal showing live orders linked to each client.
6. **Reports & Analytics (`/reports`)**
   - Monthly order bar charts, Completed vs Pending order distribution, Supervisor production performance, Inventory category summary, Top Customer rankings, date range filters, and **one-click CSV Report Export**.
7. **Settings (`/settings`)**
   - Editable Company Profile & Operator Profile (updates Sidebar & Navbar live), Notification toggles, Appearance density toggles, **Reset Demo Data**, and an interactive **Session Lock / Logout** screen.

---

## 3. Getting Started (Run Locally)

### Prerequisites
- **Node.js** (v18+ recommended) and **npm**

### Installation & Development Server

```bash
# 1. Navigate into the project directory
cd ordercraft

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

Open **`http://localhost:5173`** in your browser to view and demonstrate the application.
