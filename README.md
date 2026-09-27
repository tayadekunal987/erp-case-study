# ERP Case Study Application

Full-stack ERP system built with Node.js/Express, PostgreSQL, and React (Vite).

---

## Prerequisites

- **Node.js**: v18+ installed
- **PostgreSQL**: v14+ installed and running

---

## 1. Database Setup

1. Make sure your PostgreSQL server is running.
2. Verify or update backend credentials in `backend/.env`:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5433
   DB_NAME=erp_case_study
   DB_USER=postgres
   DB_PASSWORD=password
   JWT_SECRET=erp_case_study_secret_2026
   ```
3. Initialize the database schema and sample data:
   ```bash
   cd backend
   # Seed default users (if DB tables already exist)
   node seed-users.js
   ```

---

## 2. Start Backend Server

Open a terminal and run:

```bash
cd backend
npm install
npm run dev
```

> **Note for Windows PowerShell users:** If you see an error about `npm.ps1 cannot be loaded`, run:
> ```powershell
> npm.cmd run dev
> ```
> or:
> ```powershell
> node src/server.js
> ```

The backend API runs on: **http://localhost:5000**  
Health check: **http://localhost:5000/api/health**

---

## 3. Start Frontend App

Open a second terminal and run:

```bash
cd frontend
npm install
npm run dev
```

> **Note for Windows PowerShell users:** If PowerShell script execution is restricted, run:
> ```powershell
> npm.cmd run dev
> ```

The frontend runs on: **http://localhost:5173**

---

## 4. Default Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Sales User** | `sales@erp.com` | `Sales@123` |
| **Administrator** | `admin@erp.com` | `Admin@123` |

*Tip: The login page includes quick-fill buttons to autofill demo credentials with a single click.*
