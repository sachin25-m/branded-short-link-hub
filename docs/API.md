# Branded Short-Link & Bio-Link Hub — API Documentation

Comprehensive REST API reference for the Branded Short-Link & Bio-Link Hub platform.

---

## Base URLs
- **Development API**: `http://localhost:5000`
- **Short-Link Redirection Base**: `http://localhost:5000/r` (or via Vite proxy at `http://localhost:5173/r`)

---

## Authentication & Security Model
- **Access Token**: Short-lived JWT Access Token passed via `Authorization: Bearer <token>` header. Expiration: **15 minutes**.
- **Refresh Token**: Long-lived JWT Refresh Token stored in `httpOnly` cookie (`refreshToken`). Expiration: **7 days**. Token rotation & reuse detection enabled.

---

## Endpoints Summary

| Category | Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Health** | `GET` | `/api/health` | No | System health & status check |
| **Auth** | `POST` | `/api/auth/signup` | No | Register new user account |
| **Auth** | `GET` | `/api/auth/verify-email` | No | Verify user email with token |
| **Auth** | `POST` | `/api/auth/login` | No | Authenticate user & receive pair tokens |
| **Auth** | `POST` | `/api/auth/refresh` | Cookie | Rotate refresh token & issue new access token |
| **Auth** | `POST` | `/api/auth/logout` | Cookie/Bearer | Revoke refresh token & clear cookie |
| **Auth** | `POST` | `/api/auth/forgot-password` | No | Request password reset email simulation |
| **Auth** | `POST` | `/api/auth/reset-password` | No | Reset user password with token |
| **Auth** | `GET` | `/api/auth/me` | Bearer | Retrieve authenticated user profile |
| **Links** | `POST` | `/api/links` | Bearer | Create shortened URL with optional vanity slug |
| **Links** | `GET` | `/api/links` | Bearer | List user links with search & pagination |
| **Links** | `DELETE` | `/api/links/:id` | Bearer | Delete short link & clean click telemetry |
| **Redirect** | `GET` | `/r/:shortCode` | No | High-speed 302 redirect & click telemetry |
| **Bio** | `GET` | `/api/bio/me` | Bearer | Get authenticated user bio profile |
| **Bio** | `PUT` | `/api/bio/me` | Bearer | Create or update user bio profile |
| **Bio** | `GET` | `/api/bio/:username` | No | Public bio page data endpoint |
| **Analytics**| `GET` | `/api/analytics` | Bearer | Aggregated click telemetry metrics |

---

## 1. System Health

### GET `/api/health`
- **Auth**: None
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Branded Short-Link & Bio-Link Hub API is healthy",
  "environment": "development",
  "timestamp": "2026-09-18T01:40:00.000Z"
}
```

---

## 2. Authentication Endpoints

### POST `/api/auth/signup`
- **Auth**: None
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Registration successful! Please verify your email to log in.",
  "data": {
    "user": {
      "id": "650c...123",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "emailVerified": false
    },
    "simulationDetails": {
      "token": "3aef9...",
      "verificationUrl": "http://localhost:5173/verify-email?token=3aef9...",
      "expiresAt": "2026-09-19T01:40:00.000Z"
    }
  }
}
```

### GET `/api/auth/verify-email`
- **Auth**: None
- **Query Params**: `token`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Email verified successfully! You may now log in."
}
```

### POST `/api/auth/login`
- **Auth**: None
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```
- **Response `200 OK`** (Sets `httpOnly` `refreshToken` cookie):
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "650c...123",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "emailVerified": true
    },
    "accessToken": "eyJhbGciOi..."
  }
}
```

### POST `/api/auth/refresh`
- **Auth**: Requires valid `refreshToken` cookie
- **Response `200 OK`** (Rotates `refreshToken` cookie):
```json
{
  "success": true,
  "accessToken": "eyJhbGciOi..."
}
```

### POST `/api/auth/logout`
- **Auth**: Bearer Token / Refresh Cookie
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

## 3. Short-Link Engine & Link Library

### POST `/api/links`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "destinationUrl": "https://example.com/long-page-url",
  "customSlug": "my-vanity-slug"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Short link created successfully.",
  "data": {
    "id": "650c...456",
    "destinationUrl": "https://example.com/long-page-url",
    "shortCode": "my-vanity-slug",
    "shortUrl": "http://localhost:5173/r/my-vanity-slug",
    "clickCount": 0,
    "createdAt": "2026-09-18T01:40:00.000Z"
  }
}
```

### GET `/api/links`
- **Auth**: Bearer Token
- **Query Params**: `page` (default: 1), `limit` (default: 10), `search` (optional)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "links": [
      {
        "id": "650c...456",
        "destinationUrl": "https://example.com/long-page-url",
        "shortCode": "my-vanity-slug",
        "shortUrl": "http://localhost:5173/r/my-vanity-slug",
        "clickCount": 12,
        "createdAt": "2026-09-18T01:40:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### DELETE `/api/links/:id`
- **Auth**: Bearer Token (Owner restricted)
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Short link and associated telemetry deleted successfully."
}
```

### GET `/r/:shortCode`
- **Auth**: None
- **Response `302 Found`**: Redirects browser to `destinationUrl` while asynchronously logging click telemetry.

---

## 4. Link-in-Bio Hub

### GET `/api/bio/me`
- **Auth**: Bearer Token
- **Response `200 OK`**:
```json
{
  "success": true,
  "exists": true,
  "profile": {
    "username": "janedoe",
    "displayName": "Jane Doe",
    "bio": "Digital Creator & Developer",
    "avatarUrl": "https://example.com/avatar.jpg",
    "theme": "gradient",
    "socialLinks": [
      { "platform": "github", "url": "https://github.com/janedoe" }
    ]
  }
}
```

### PUT `/api/bio/me`
- **Auth**: Bearer Token
- **Request Body**:
```json
{
  "username": "janedoe",
  "displayName": "Jane Doe",
  "bio": "Digital Creator & Developer",
  "avatarUrl": "https://example.com/avatar.jpg",
  "theme": "gradient",
  "socialLinks": [
    { "platform": "github", "url": "https://github.com/janedoe" }
  ]
}
```
- **Response `200 OK`**: Returns saved profile data.

### GET `/api/bio/:username`
- **Auth**: None (Public)
- **Response `200 OK`**:
```json
{
  "success": true,
  "profile": {
    "username": "janedoe",
    "displayName": "Jane Doe",
    "bio": "Digital Creator & Developer",
    "avatarUrl": "https://example.com/avatar.jpg",
    "theme": "gradient",
    "socialLinks": [
      { "platform": "github", "url": "https://github.com/janedoe" }
    ]
  }
}
```

---

## 5. Analytics Dashboard

### GET `/api/analytics`
- **Auth**: Bearer Token (User isolated)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "totalClicks": 42,
    "clicksOverTime": [
      { "date": "2026-09-18", "clicks": 42 }
    ],
    "topReferrers": [
      { "referrer": "google.com", "clicks": 28 },
      { "referrer": "Direct", "clicks": 14 }
    ],
    "deviceDistribution": [
      { "deviceType": "Desktop", "clicks": 24 },
      { "deviceType": "Mobile", "clicks": 18 }
    ]
  }
}
```
