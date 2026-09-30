# OrderCraft – Manufacturing Order and Management System (Full-Stack)

**OrderCraft** is a modern, full-stack SaaS-style Manufacturing ERP and Order Management System built with **React.js (Vite)**, **Tailwind CSS**, **Node.js**, **Express.js**, and **MongoDB (Mongoose)**.

The application connects the React frontend via a dedicated Axios API service layer (`src/services/`) to an Express.js + MongoDB REST API (`server/`), while retaining automatic `localStorage` fallback so the frontend continues operating smoothly even if the backend server is offline.

---

## 1. Technology Stack

### Frontend (`src/`)
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS (Dark Navy Blue `#0f172a` & Industrial Orange `#f97316` ERP theme)
- **Icons & Charts:** Lucide React (`lucide-react`) & Recharts (`recharts`)
- **Routing & HTTP Client:** React Router DOM v6 (`react-router-dom`) & Axios (`axios`)
- **State & Fallback Persistence:** React Context API (`AppContext.jsx`) + `localStorage` fallback

### Backend (`server/`)
- **Runtime & Framework:** Node.js & Express.js
- **Database & ODM:** MongoDB & Mongoose (`ordercraft` database, with automatic embedded MongoDB fallback via `mongodb-memory-server` if a local `mongod` service is not running)
- **Authentication & Security:** JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`), `helmet`, `cors`, `express-validator`, and `morgan`

---

## 2. Project Structure

```text
ordercraft/
├── src/
│   ├── components/          # Reusable UI components (Sidebar, Navbar, StatCard, DataTable, Modal, etc.)
│   ├── pages/               # 7 core pages (Dashboard, Orders, Production, Inventory, Customers, Reports, Settings)
│   ├── services/            # Axios REST API service layer
│   │   ├── api.js
│   │   ├── orderService.js
│   │   ├── productionService.js
│   │   ├── inventoryService.js
│   │   ├── customerService.js
│   │   ├── dashboardService.js
│   │   └── reportService.js
│   ├── context/
│   │   └── AppContext.jsx   # Global state syncing MongoDB API + localStorage fallback
│   ├── layouts/
│   │   └── MainLayout.jsx
│   ├── data/
│   │   └── mockData.js      # Offline fallback dataset
│   ├── App.jsx
│   └── main.jsx
│
├── server/
│   ├── config/
│   │   └── db.js            # MongoDB connection + auto-seeding
│   ├── controllers/         # Business logic for Auth, Orders, Production, Inventory, Customers, Dashboard, Reports
│   ├── models/              # Mongoose schemas (Order, Production, Inventory, Customer, User)
│   ├── routes/              # Express routers (/api/auth, /api/orders, /api/production, etc.)
│   ├── middleware/          # JWT authMiddleware, errorMiddleware, validationMiddleware
│   ├── utils/
│   │   └── generateId.js    # Sequential ID generator (ORD-2026-XXXX, PRD-XXX, INV-XXX, CUS-XXX)
│   ├── seed/
│   │   └── seedData.js      # Database seeder (10 customers, 15 orders, 10 production runs, 15 inventory items, admin user)
│   ├── server.js            # Express application entry point
│   └── package.json
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 3. Environment Variables

Create or inspect `.env` in the root folder (and/or `server/.env`):

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ordercraft
JWT_SECRET=ordercraft_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:5000/api
```

---

## 4. Installation & Running the Project

### Step 1: Install Dependencies

```bash
# Install Frontend dependencies (from project root)
npm install

# Install Backend dependencies
cd server
npm install
```

### Step 2: Seed Demo Data (Optional)

```bash
cd server
npm run seed
```
*(Note: The backend also automatically seeds the database on startup if the `ordercraft` database is empty!)*

### Step 3: Start the Backend Server (`http://localhost:5000`)

```bash
cd server
npm run dev
```

### Step 4: Start the Frontend Dev Server (`http://localhost:5173`)

Open a second terminal in the root `ordercraft` folder:

```bash
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 5. Demo Login Credentials (Local Development)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@ordercraft-mfg.in` | `password123` |
| **Manager** | `manager@ordercraft-mfg.in` | `password123` |
| **UI Session Lock PIN** | *(Any / Default)* | `2026` |

---

## 6. REST API Endpoints Summary

| Module | Method & Endpoint | Description |
| :--- | :--- | :--- |
| **Auth** | `POST /api/auth/register` | Register a new user account |
| | `POST /api/auth/login` | Authenticate user & receive JWT token |
| | `GET /api/auth/me` | Get current logged-in user profile |
| **Dashboard** | `GET /api/dashboard` | Live KPI counts, monthly trends, production status distribution, alerts |
| **Orders** | `GET /api/orders` | List orders (supports `?status=`, `?priority=`, `?search=`, `?startDate=`, `?endDate=`) |
| | `GET /api/orders/:id` | Get single order details |
| | `POST /api/orders` | Create a new customer order |
| | `PUT /api/orders/:id` | Update an existing order |
| | `DELETE /api/orders/:id` | Delete an order |
| **Production** | `GET /api/production` | List production runs |
| | `POST /api/production` | Schedule a new production run |
| | `PUT /api/production/:id` | Update production record |
| | `PATCH /api/production/:id/progress` | Update progress % (auto-completes at 100%) |
| | `PATCH /api/production/:id/status` | Start or complete production & sync linked order |
| | `DELETE /api/production/:id` | Remove production run |
| **Inventory** | `GET /api/inventory` | List inventory items (supports `?search=`, `?status=Low%20Stock`) |
| | `POST /api/inventory` | Add new inventory item (auto-computes stock status) |
| | `PUT /api/inventory/:id` | Update item or adjust stock (`{ delta: 50 }`) |
| | `DELETE /api/inventory/:id` | Delete inventory item |
| **Customers** | `GET /api/customers` | List B2B customers with calculated order counts |
| | `GET /api/customers/:id/orders` | Get full order history for a customer |
| | `POST /api/customers` | Add a new customer |
| | `PUT /api/customers/:id` | Update customer details |
| | `DELETE /api/customers/:id` | Delete customer |
| **Reports** | `GET /api/reports` | Aggregated manufacturing reports (supports `?startDate=&endDate=`) |
| **Demo Reset** | `POST /api/demo/reset` | Reset MongoDB collections to fresh factory demo dataset |

---

## 7. Troubleshooting

- **Local MongoDB Service Not Running:** If `mongodb://127.0.0.1:27017/ordercraft` is not running on your machine, `server/config/db.js` automatically starts an embedded MongoDB instance (`mongodb-memory-server`) and seeds it with all 15 orders, 10 customers, 10 production runs, and 15 inventory items so the backend API works out-of-the-box.
- **Backend Server Stopped:** If the backend server (`localhost:5000`) is stopped, the React frontend displays a friendly notice and continues functioning using its `localStorage` fallback cache.
