# Environment Variables

## Frontend (Vite)

| Variable | Description | Default |
|---|---|---|
| `VITE_BACKEND_URL` | Backend API URL | `http://localhost:5000` |
| `VITE_PAYPAL_CLIENT_ID` | PayPal client ID for SDK | (sandbox fallback) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (legacy) | `pk_test_...` |

## Backend (Node)

| Variable | Description |
|---|---|
| `PORT` | Server port (Render default: 10000) |
| `PAYPAL_CLIENT_ID` | PayPal REST API client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal REST API secret |
| `PAYPAL_API_URL` | PayPal API base URL (`https://api-m.paypal.com` live, `https://api-m.sandbox.paypal.com` sandbox) |
| `CORS_ORIGIN` | Allowed CORS origin (e.g., frontend URL) |
| `EMAIL_HOST` | SMTP host for order emails |
| `EMAIL_PORT` | SMTP port |
| `EMAIL_USER` | SMTP user |
| `EMAIL_PASS` | SMTP password |
| `EMAIL_TO` | Store owner email for order notifications |
