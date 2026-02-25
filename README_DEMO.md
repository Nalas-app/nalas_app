# Nala's Restaurant App - Order Flow Demo

This project demonstrates the full lifecycle of a catering order, from initial draft to completion.

## How to Run the Demo

### 1. Prerequisites
- PostgreSQL running with a database named `magilam_foods`.
- Node.js (v18+)

### 2. Setup Backend
```bash
cd backend
npm install
# Configure .env with your DB credentials
# Run migrations (ensure 001, 002, and 003 are applied)
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Explore the Flow
1. **Create Order**: Fill the form on the left. Note: Event date must be > 7 days from now.
2. **Generate Quotation**: Click the button in the details view. This triggers the **ML Prediction** logic (with fallbacks) and **Billing API** integration.
3. **Confirm Order**: Reserve ingredients via the **Stock Service** and generate a final invoice.
4. **Lifecycle Management**: Administrative status updates (Preparing -> Completed) and Cancellation logic are all handled with optimistic locking.

### Monitoring Data Flow
The **"Backend Data Flow"** console at the bottom-right of the UI shows real-time API requests, status codes, and latency, allowing you to observe the interactions between the services.
