# 🛒🔐 SecurePay: Advanced E-Commerce & Cryptographic Payment System

![Status](https://img.shields.io/badge/Status-Complete-success) ![Stack](https://img.shields.io/badge/Stack-React%20%7C%20FastAPI%20%7C%20MongoDB-blue) ![Security](https://img.shields.io/badge/Security-AES--256%20%7C%20SHA--256%20%7C%20JWT-red)

**SecurePay** is a full-stack, enterprise-grade e-commerce application designed primarily to demonstrate **high-level data and information security**. It features a fully functional frontend shopping experience, combined with a highly secure backend that simulates a UPI Payment Gateway featuring Military-Grade encryption, cryptographic hashing, and algorithmic fraud detection.

---

## 📑 Table of Contents
1. [Abstract & Overview](#-abstract--overview)
2. [Complete Feature List](#-complete-feature-list)
3. [Deep Dive: Security Implementations](#-deep-dive-security-implementations)
4. [System Data Flow (Transaction Lifecycle)](#-system-data-flow-transaction-lifecycle)
5. [Database Architecture](#-database-architecture)
6. [Folder Structure](#-folder-structure)
7. [API Endpoints](#-api-endpoints)
8. [Installation & Setup](#-installation--setup)

---

## 📖 Abstract & Overview
Standard e-commerce applications are prone to database leaks, man-in-the-middle attacks, and internal tampering. SecurePay addresses these vulnerabilities by strictly utilizing **Zero-Trust principles**. 

Instead of storing sensitive payment IDs (e.g., UPI IDs) in plain text, the system uses symmetric **AES-256** encryption. Instead of trusting internal database states, it relies on cryptographic **SHA-256** integrity hashing. User access is gated by strict **JWT algorithms**, and physical passwords are computationally hashed out of existence via **Bcrypt**. 

---

## ✨ Complete Feature List

### 🖥️ Frontend (React, Vite, TypeScript)
* **Glassmorphic UI:** Premium, modern dark-themed user interface utilizing CSS variables and backdrop-filters.
* **Component-Based Architecture:** Fully modular design spanning `<Navbar />`, `<TransactionHistory />`, and contextual providers.
* **State Management:** Global `AuthContext` and `CartContext` handling complex states dynamically.
* **Axios Interceptors:** Automatic insertion of `Bearer JWT` tokens into HTTP request headers preventing unauthorized routing.
* **Responsive Multi-Step Checkout:** User-friendly forms that logically progress from Cart → UPI Input → Dynamic OTP Verification → Processing → Success/Fail display.

### ⚙️ Backend (Python, FastAPI)
* **High-Performance Routing:** Modular split using `FastAPI APIRouter` for Authentication, Products, Cart, and Payments.
* **Dependency Injection:** Secures endpoints elegantly via a `Depends(get_current_user)` parameter check.
* **Fake Bank Simulator:** Randomized algorithmic simulator returning 90% Success / 10% Failed responses to mimic real-world bank network instabilities.
* **Adaptive Database Resiliency:** System dynamically falls back to an "In-Memory" Python dictionary database if MongoDB Atlas connection drops, ensuring zero downtime.

---

## 🛡️ Deep Dive: Security Implementations

This project implements **5 Pillars of Security**:

### 1. Authentication (JSON Web Tokens - JWT)
* Uses `HS256` symmetric algorithm to cryptographically sign session tokens.
* Tokens are given a strict **60-minute Time-To-Live (TTL)**.
* Prevents CSRF and active session hijacking out-of-the-box.

### 2. Password Cryptography (Bcrypt)
* Plaintext passwords NEVER touch the database.
* Passwords are run through `bcrypt` using **12 computational salt rounds**.
* Prevents brute-forcing and renders stolen databases useless to attackers.

### 3. Data Confidentiality (AES-256 EAX)
* Sensitive financial fields (like a user's UPI ID and the exact transaction amount) are intercepted.
* Utilizing `pycryptodome`, they are symmetrically encrypted into `upi_id_encrypted` strings before database insertion.
* Only the backend server possessing the root `AES_KEY` can decrypt this data.

### 4. Database Integrity Verification (SHA-256)
* Prevent internal database manipulation. If a hacker manually changes database column `status` from `Failed` to `Success`, the system detects it.
* Generates a final `SHA-256` hash representing the exact combination of (User ID + Final Amount + Bank Result + Timestamp).

### 5. Algorithmic Fraud Detection & Rate Limiting
* **Rate Limiting:** `SlowAPI` monitors endpoint access. Spamming the login or payment buttons triggers a `429 Too Many Requests` API block.
* **Velocity Checking:** A custom utility sweeps for anomalies. Repeated micro-transactions within seconds trigger suspensions. Exceptionally high transactions (e.g. >₹1,00,000) are programmatically rejected as "High Risk".

---

## 🔀 System Data Flow (Transaction Lifecycle)
How data moves securely from User to Server to Database:

1. **Frontend Input:** User attempts to pay ₹2,499 with UPI `user@bank`.
2. **Frontend Intercept:** React attaches the user's `JWT` to the POST request.
3. **Backend Middleware:** FastAPI verifies the JWT signature and extracts the User ID.
4. **Fraud Check:** Backend scans past 60 seconds of DB logs to ensure the user isn't spamming payments.
5. **Encryption Phase:** `user@bank` is encrypted via AES-256.
6. **OTP Phase:** A 6-digit OTP is generated, paired with the exact pending transaction ID, and given a 5-minute database expiry.
7. **Verification & Bank Phase:** User inputs OTP. Backend decrypts the AES-256 UPI ID, sends it to the Fake Bank API.
8. **Integrity Lock Phase:** Bank returns "Success". Backend bundles the data, hashes it via SHA-256, and logs the final unchangeable `transaction_hash`.

---

## 🗄️ Database Architecture

NoSQL setup featuring the following core structure:

**1. `users` Collection**
```json
{
  "_id": "uuid",
  "email": "user@test.com",
  "name": "User",
  "password_hash": "$2b$12$KdhXdM5F...",
  "is_admin": false,
  "created_at": "ISO-8601"
}
```

**2. `transactions` Collection (Secured)**
```json
{
  "_id": "uuid",
  "user_id": "uuid",
  "upi_id_encrypted": "1a2b3c4d5e...",       // AES-256 Ciphertext
  "amount_encrypted": "9f8e7d6c5b...",       // AES-256 Ciphertext
  "amount": 2499,                            // For Front-End display
  "status": "success",
  "risk_level": "low",
  "transaction_hash": "e3b0c44298fc1c149...",// SHA-256 Integrity Hash
  "bank_ref": "BNK498140",
  "timestamp": "ISO-8601"
}
```

---

## 📂 Folder Structure

```text
SecurePay/
├── backend/                  # FastAPI Application
│   ├── database/             # MongoDB Motor async setup & fallback logic
│   ├── models/               # Pydantic schemas (Data Validation)
│   ├── routes/               # API endpoint modules
│   ├── utils/                # Core Security Logic (AES, SHA, Bcrypt, Fraud)
│   ├── .env                  # AES Key, JWT Secret, Mongo URI
│   ├── main.py               # Uvicorn entry point & CORS
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # React Application
│   ├── src/
│   │   ├── components/       # UI (Navbar, Inputs)
│   │   ├── context/          # React Auth/Cart Contexts
│   │   ├── pages/            # View routing (Home, Cart, Checkout, History)
│   │   ├── services/         # Axios API interceptors
│   │   ├── App.tsx           # React router dom definitions
│   │   └── index.css         # Custom Design System
│   └── package.json          # Node dependencies
│
├── README.md                 # You are here
└── PROJECT_REPORT.md         # Academic formatting of security principles
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description | Security Requirement |
|--------|---------|-------------|----------------------|
| `POST` | `/api/auth/register` | Create new account | None |
| `POST` | `/api/auth/login` | Receive JWT Token | None |
| `GET` | `/api/auth/me` | Fetch user details | **JWT Bearer** |
| `GET` | `/api/products/` | Fetch catalog | None |
| `POST` | `/api/payment/initiate`| Encrypt data, fraud check, generate OTP | **JWT Bearer** |
| `POST` | `/api/payment/verify-otp`| Process bank, generate SHA-256 hash | **JWT Bearer** |
| `GET` | `/api/payment/history`| Fetch transaction list | **JWT Bearer** |

---

## ⚙️ Installation & Setup

### Prerequisites
* `Node.js` and `npm` installed.
* `Python 3.10+` installed.

### 1. Backend Configuration
Open terminal and navigate to the backend directory:
```bash
cd backend
```
Activate the virtual environment (Windows):
```powershell
.\venv\Scripts\Activate.ps1
```
Install requirements:
```bash
pip install -r requirements.txt
```
Ensure you have a `.env` file in the `backend/` folder resembling:
```env
JWT_SECRET=your_super_secret_jwt_key
AES_KEY=0123456789abcdef0123456789abcdef  # Must be 16, 24, or 32 bytes
DATABASE_NAME=secure_ecommerce
MONGODB_URI=mongodb+srv://...           # Optional: Will fallback to memory if empty
```
Start the Server:
```bash
uvicorn main:app --reload
```

### 2. Frontend Configuration
Open a **new** terminal and navigate to the frontend directory:
```bash
cd frontend
```
Install modules:
```bash
npm install
```
Start Development UI:
```bash
npm run dev
```

The application will be accessible at `http://localhost:5174/` (or `5173`).

---

## 👑 Default Admin Credentials
When the backend boots, it automatically seeds the database with a high-security Admin profile (to prove bcrypt viability):

* **Email:** `admin@securepay.com`
* **Password:** `AdminSecure@2026`

Enjoy exploring your impenetrable E-Commerce architecture!
