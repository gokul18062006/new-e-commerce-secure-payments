# 📄 Project Report: Secure E-Commerce Application with UPI Gateway

**Course/Domain:** Data & Information Security  
**Project Title:** Secure Pay - E-Commerce Platform with Cryptographic Security Controls  

---

## 1. Abstract
The "Secure Pay" application is a full-stack, end-to-end e-commerce platform demonstrating modern data information security principles. The system implements a robust shopping architecture while utilizing enterprise-grade cryptographic standards (AES-256, SHA-256, Bcrypt, JWT) to secure sensitive user details, authentication workflows, and financial transaction integrity. This project illustrates how applications can mitigate interception, tampering, and unauthorized access.

---

## 2. Introduction
In standard web applications, transactional data and user information are highly susceptible to cyber threats like Man-In-The-Middle (MITM) attacks, database breaches, and unauthorized tampering. 

This project establishes a simulated UPI payment gateway that addresses these threats through:
- **Confidentiality:** Symmetrical encryption of sensitive user financial identities.
- **Integrity:** Cryptographic hashing to prevent database tampering.
- **Authentication:** Token-based stateless verification combined with salted asynchronous hashing.

---

## 3. System Architecture

The application is built using a modern decoupled architecture:
* **Frontend (Client):** Developed in React.js and TypeScript. Responsibilities include rendering the UI, maintaining local state contexts (Auth, Cart), and gracefully handling HTTP interceptors for JWT token injection.
* **Backend (API Server):** Developed using FastAPI (Python). It acts as the core controller, processing logic, invoking cryptographic libraries, and interfacing securely with the database.
* **Database (Storage):** MongoDB Atlas (NoSQL) accessed via asynchronous Motor drivers, featuring fail-safes (in-memory fallback) to ensure zero-downtime execution.

---

## 4. Security Implementation & Cryptography

The core focus of this project is the integration of advanced security measures:

### 4.1 Authentication & Authorization
* **Mechanism:** JSON Web Tokens (JWT) using the `HS256` symmetric algorithm.
* **Details:** Upon successful login, a token is issued with a strict 60-minute Time-To-Live (TTL). React Axios interceptors automatically attach this token to `Authorization` headers. The backend validates claims before responding to sensitive routes `/me`, `/payment/initiate`, etc.

### 4.2 Password Security
* **Mechanism:** `Bcrypt` with 12 salt rounds.
* **Details:** Plaintext passwords are mathematically hashed before storing. Brute force or rainbow table attacks are mitigated by Bcrypt's high computational cost. 
* **Implementation:** The application explicitly seeds a highly secure "Super Admin" account (`admin@securepay.com`) solely utilizing Bcrypt hashes.

### 4.3 Data Confidentiality (Symmetric Encryption)
* **Mechanism:** `AES-256` in `EAX` mode.
* **Details:** Financial data (e.g., UPI IDs like `user@upi`) must not sit in the database in plaintext. `AES-256 (Advanced Encryption Standard)` encrypts this data into an illegible ciphertext `upi_id_encrypted`. Only the backend, possessing the root `.env` AES key, can decrypt it during transaction verification.

### 4.4 Data Integrity (Hashing)
* **Mechanism:** `SHA-256` Cryptographic Hashing.
* **Details:** To prevent internal database manipulation (a hacker altering "Failed" to "Success"), every completed transaction is serialized (Time, ID, Status, Amount) and hashed using SHA-256 (`transaction_hash`). If data is maliciously altered, recalculating the hash will expose the discrepancy.

### 4.5 Multi-Factor Verification & Fraud Prevention
* **OTP Verification:** Dynamic 6-digit One Time Passwords (OTPs) are created during checkout with a strict 5-minute TTL to verify identity intent.
* **Algorithmic Fraud Detection:** The system actively sweeps for anomalies. Repeated micro-transactions within seconds trigger rate-limits. Extremely high transactions (e.g. >₹1,00,000) are programmatically flagged as "High Risk".

---

## 5. Typical Workflow Path (Transaction Lifecycle)

1. **User Action:** User adds "Headphones" (₹2,499) to cart and clicks "Proceed to Checkout".
2. **Identification:** User inputs UPI ID.
3. **Encryption:** API receives UPI ID, encrypts it via AES-256, and stores it in MongoDB as "pending".
4. **Verification:** System generates & issues an OTP. User submits OTP.
5. **Simulated Processing:** Backend decrypts UPI ID and queries the "Simulated Bank" (featuring a 10% random failure rate to mimic real-world network drops or insufficient funds).
6. **Integrity Lock:** The final result is hashed using SHA-256, and the database status updates to "Success/Failed".

---

## 6. Conclusion
This complete system effectively neutralizes a vast array of standard vulnerabilities by implementing Zero-Trust principles regarding sensitive inputs.

By employing AES for data-at-rest encryption, Bcrypt for credential protection, and SHA-256 for non-repudiation of transactions, the application achieves a highly robust, secure stature appropriate for enterprise financial environments.
