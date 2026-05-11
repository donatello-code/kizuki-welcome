# API Endpoints

## `GET /health`

Health check endpoint.

**Response:**
```json
{ "status": "ok", "timestamp": "..." }
```

---

## `POST /api/orders`

Submit an order with payment details.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+15551234567",
  "address": "123 Main St",
  "apt": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "zip": "10001",
  "paymentMethod": "card",
  "cardNumber": "4111111111111111",
  "cardExpiry": "1228",
  "cardCvv": "123",
  "cardName": "John Doe",
  "applePayToken": {},
  "items": [
    { "id": "p_1", "name": "Symbolic Chessboard", "price": 99, "quantity": 1, "selectedSize": null }
  ],
  "total": 9900
}
```

**Response:**
```json
{ "success": true, "orderId": "..." }
```

---

## `POST /api/apple-pay/validate-merchant`

Validate Apple Pay merchant session.

**Request Body:**
```json
{
  "validationUrl": "https://apple-pay-gateway.apple.com/...",
  "merchantIdentifier": "merchant.com.kizuki.store",
  "domainName": "kizuki-frontend.onrender.com"
}
```

**Response:** Apple Pay merchant session object
