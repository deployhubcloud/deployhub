# Project Setup Guide

> Make sure you have a `.env` file configured and **Redis** & **RabbitMQ** running on your system before proceeding.

---

## 📋 Prerequisites

- **Node.js** (v18+ recommended)
- **Redis** — must be running locally
- **RabbitMQ** — must be running locally
- A `.env` file in the appropriate service directories

---

## Starting the Services

Start each service **in order**, in separate terminal windows.

---

### 1. Secrets Manager

```bash
cd backend/services/secrets-manager
npm ci
npm run start
```

---

### 2. API Gateway

```bash
cd backend/api-gateway
npm ci
npm run start
```

---

### 3. Identity Service

```bash
cd backend/services/identity-service
npm ci
npm run start
```

---

### 4. Project Service

```bash
cd backend/services/project-service
npm ci
npm run start
```

---

### 5. build Service

```bash
cd backend/services/build-service
npm ci
npm run start
```

---

### 6. deploy Service

```bash
cd backend/services/deploy-service
npm ci
npm run start
```

---

### 7. notification Service

```bash
cd backend/services/notification-service
npm ci
npm run start
```

---

### 8. Frontend (Dashboard)

```bash
cd frontend/Dashboard-Frontend
npm ci
npm run dev
```

---

### 9. Frontend (Landing-Page)

```bash
cd frontend/frontend
npm ci
npm run dev
```

---

## ⚠️ Common Issues

- **Redis not connected** — Ensure Redis is running: `redis-server`
- **RabbitMQ not connected** — Ensure RabbitMQ is running: `rabbitmq-server`
- **Missing `.env`** — Each service may require its own `.env` file with the correct environment variables
