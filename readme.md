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
cd backend/secrets-manager
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
cd backend/identity-service
npm ci
npm run start
```

---

### 4. Frontend (Dashboard)

```bash
cd frontend/Dashboard-Frontend
npm ci
npm run dev
```

---

## Startup Order Summary

| Step | Service           | Command         |
|------|-------------------|-----------------|
| 1    | Secrets Manager   | `npm run start` |
| 2    | API Gateway       | `npm run start` |
| 3    | Identity Service  | `npm run start` |
| 4    | Dashboard Frontend| `npm run dev`   |

---

## ⚠️ Common Issues

- **Redis not connected** — Ensure Redis is running: `redis-server`
- **RabbitMQ not connected** — Ensure RabbitMQ is running: `rabbitmq-server`
- **Missing `.env`** — Each service may require its own `.env` file with the correct environment variables
