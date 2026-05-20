# FitLife Gym Membership System

**IT342 — Group 6 | Tan**

A full-stack gym membership management system with a Spring Boot REST API backend, React web frontend, and Android mobile app.

---

## Team

| Name | Role |
|---|---|
| Christian Aire Tan | Full-stack Developer |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3.5, Java 19, MySQL 8 |
| Web Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Mobile | Android (Kotlin), Retrofit, Material Components |
| Auth | JWT (HS512), Google OAuth2, BCrypt |
| Payments | Stripe (Test Mode) |
| Email | JavaMailSender (Gmail SMTP) |
| External API | ZenQuotes (motivational quotes on member dashboard) |

---

## Features

- User registration, login, logout with JWT authentication
- Google OAuth2 single sign-on
- Role-based access: MEMBER and ADMIN
- Membership plan browsing and purchase (Stripe)
- Payment history with receipt emails
- Admin panel: manage users, payments, and membership plans
- Member dashboard with motivational quotes (external ZenQuotes API)
- Profile management with photo upload
- Android mobile app with full feature parity

---

## Project Structure

```
├── backend/          # Spring Boot REST API (port 8080)
├── web/              # React web frontend (port 5173)
├── mobile/           # Android Kotlin app
└── docs/             # SDD and project documentation
```

---

## Setup & Running

### Prerequisites
- Java 19+, Maven 3.9+
- Node.js 18+, npm
- MySQL 8 (XAMPP or standalone)
- Android Studio (for mobile)

### Backend

```bash
# Start MySQL first (XAMPP or mysqld)
cd backend
./mvnw spring-boot:run
# API runs on http://localhost:8080
```

Required environment variables (or set in `application.properties`):

| Variable | Description |
|---|---|
| `MAIL_USERNAME` | Gmail address for SMTP |
| `MAIL_PASSWORD` | Gmail App Password |
| `GOOGLE_CLIENT_ID` | Google OAuth2 Client ID |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_test_...) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_test_...) |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |

### Web Frontend

```bash
cd web
npm install
npm run dev
# Opens on http://localhost:5173
```

### Mobile

1. Open the `mobile/` folder in Android Studio.
2. Set the backend IP in `RetrofitClient.kt` (default: `10.0.2.2:8080` for emulator).
3. Build and run on emulator or physical device.

---

## API Overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/auth/register` | POST | Register new user |
| `/api/v1/auth/login` | POST | Login, returns JWT |
| `/api/v1/auth/me` | GET | Get current user info |
| `/api/v1/auth/logout` | POST | Invalidate JWT |
| `/api/v1/memberships` | GET | List all plans |
| `/api/v1/payments` | POST | Create payment |
| `/api/v1/dashboard` | GET | Member dashboard data |
| `/api/v1/quotes/daily` | GET | Motivational quote (ZenQuotes API) |
| `/api/v1/admin/**` | * | Admin-only endpoints |

Full API documentation: see `docs/`.

---

## Database

Database name: `ironpass_db` (auto-created on first run).

Tables: `users`, `memberships`, `user_memberships`, `payments`, `auth_tokens`

---

## License

For educational use — IT342 course project.
