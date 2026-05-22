# FitLife Gym — Final Project Presentation Script
**Course:** Systems Integration and Architecture
**Target Duration:** 7–8 minutes (within the 5–10 min requirement)

---

## PART 1 — Self-Introduction (0:00–0:30)
**Screen: Show your face or a title slide**

> "Good day! My name is [Your Full Name], from [Course] — [Section].
> For my final project in Systems Integration and Architecture, I developed
> FitLife Gym — a multi-platform gym membership management system that
> integrates a Spring Boot REST API backend, a React web application, an
> Android mobile app, a MySQL database, Stripe for online payments, Google
> OAuth for social login, and automated email notifications. Let me walk you
> through the system."

---

## PART 2 — System Introduction (0:30–1:30)
**Screen: Open the running web app at localhost:5173**

> "FitLife Gym is a full-stack membership management system built for gyms
> and fitness centers.
>
> The problem it solves is manual, paper-based membership tracking — gym
> staff have no centralized way to manage members, collect payments, and
> monitor active subscriptions. Everything is scattered.
>
> The system has two types of users. Regular members can register, browse
> membership plans, pay online, and track their payment history.
> Administrators have a dedicated panel to manage all users, payments, and
> plans across the entire gym.
>
> The overall goal is to fully automate the membership lifecycle — from
> registration and plan selection, to payment processing and status tracking
> — accessible from both a web browser and an Android device, in real time."

---

## PART 3 — Main Features (1:30–3:00)
**Screen: Navigate through the app as you name each feature**

> "Let me go through the key features that are implemented in the system."

### Feature 1 — User Authentication & Authorization
**Screen: Login page → open DevTools → Application → Local Storage → show token**
> "Users can register and log in using email and password. The backend issues
> a JWT token on successful login, which is sent with every subsequent
> request inside the Authorization header."

### Feature 2 — Google OAuth
**Screen: Click "Sign in with Google" button**
> "Users can also sign in with their Google account using OAuth 2.0. The
> backend verifies the Google ID token and creates or retrieves the user
> automatically."

### Feature 3 — Role-Based Access Control
**Screen: Show Admin Panel tab visible only when logged in as admin**
> "The system has two roles — USER and ADMIN. Regular users see Dashboard,
> Plans, and History. Only admins see the Admin Panel. This is enforced both
> on the frontend and at the backend API level using Spring Security."

### Feature 4 — Membership Plans (CRUD)
**Screen: Admin Panel → Plans tab → Edit a plan**
> "Admins can create, update, and delete membership plans. These changes
> immediately reflect for all users browsing the plans page."

### Feature 5 — Stripe Online Payment
**Screen: Plans → Select Premium → pay with card 4242 4242 4242 4242**
> "Members can pay for a plan directly online using a credit or debit card
> through Stripe. The backend creates a Stripe PaymentIntent, the frontend
> confirms it, and the membership activates immediately."

### Feature 6 — Bank Transfer Payment
**Screen: Payment page → select Bank Transfer option**
> "Members can also choose bank transfer. The payment is saved as Pending
> and an admin manually confirms it in the Admin Panel."

### Feature 7 — Admin Dashboard with Click-Through Filtering
**Screen: Admin Dashboard → click "Completed" stat card → Payments tab filters**
> "The admin dashboard shows live statistics — total users, revenue, and
> payments by status. Clicking a status card like Completed automatically
> filters the Payments tab to show only those records."

### Feature 8 — Profile Management
**Screen: Profile page — show Change Email form or Set Password card**
> "Users can update their name, upload a profile photo, change their email,
> and change their password. Google OAuth users see a Set Password option
> instead, since they have no password initially."

### Feature 9 — Email Notifications
**Screen: Open EmailService.java in VS Code**
> "After every payment, the system automatically sends an HTML receipt email
> to the user and an alert email to all admins. Welcome emails are also sent
> on registration."

### Feature 10 — Android Mobile App
**Screen: Open the Android app**
> "All features are also available on Android. The app uses the exact same
> backend REST API — no duplicate logic."

---

## PART 4 — Architecture, Component Interaction & Proof (3:00–5:30)
**Screen: VS Code with project folder open**

> "Now let me explain the architecture and show how the components actually
> interact."

---

### Overall Architecture
**Screen: Show the root project folder structure**
> "The system follows a Client-Server architecture. There are two clients —
> the React web app and the Android mobile app — and one server, the Spring
> Boot REST API. All communication happens over HTTP using JSON."

```
Tan/
├── backend/     → Spring Boot REST API  (port 8080)
├── web/         → React + TypeScript    (port 5173)
└── mobile/      → Android Kotlin app
```

---

### Backend — Layered + Feature-Based Architecture
**Screen: Open backend/src/main/java/.../  in VS Code**
> "The backend uses a feature-based layered architecture. Each feature —
> auth, membership, payment, profile, admin, dashboard — has its own
> package with a Controller, and uses shared Entities, Repositories, and
> Services."

```
backend/
  feature/
    auth/         → AuthController, AuthService (login, register, Google OAuth)
    membership/   → MembershipController (CRUD for plans)
    payment/      → PaymentController, StripeController
    profile/      → ProfileController (name, email, password)
    admin/        → AdminController (user and payment management)
    dashboard/    → DashboardController (stats)
  shared/
    entity/       → User, Membership, Payment, UserMembership (JPA → MySQL)
    repository/   → Spring Data JPA repositories
    service/      → EmailService, CustomUserDetailsService
    config/       → SecurityConfig, JwtUtils, TokenAuthFilter
```

**Show SecurityConfig.java:**
> "This is the security configuration. It defines which endpoints are
> public, which require authentication, and which require ADMIN role. JWT
> validation happens through a custom filter called TokenAuthFilter that
> runs before every request. Sessions are completely stateless — the backend
> never stores session data."

**Show PaymentController.java:**
> "This is the payment controller. It handles POST requests to create
> payments, integrates with Stripe, saves the payment to MySQL, activates
> the membership, and triggers the email service — all inside one
> database transaction."

**Show EmailService.java:**
> "The email service is called automatically after a payment. It checks if
> the user has email notifications enabled, then sends an HTML receipt using
> JavaMailSender connected to Gmail SMTP."

---

### Frontend — Feature Modules + Axios API Client
**Screen: Open web/src/features/ in VS Code**
> "The React frontend mirrors the same feature structure. Each feature has
> its own API service file that calls the backend using Axios. The base URL
> points to localhost:8080 and the JWT token is attached to every request
> automatically via an Axios interceptor."

```
web/src/
  features/
    auth/        → AuthContext, loginApi, registerApi, googleLoginApi
    dashboard/   → dashboardApi, DashboardPage
    membership/  → membershipApi, MembershipPlansPage
    payment/     → paymentApi, PaymentPage, PaymentHistoryPage
    profile/     → profileApi, ProfilePage
    admin/       → adminApi, AdminPanelPage
  shared/
    api/client.ts → Axios instance with JWT interceptor
```

---

### Mobile — MVVM Pattern
**Screen: Open mobile/app/src/main/java/.../  in VS Code**
> "The Android app uses the MVVM design pattern. The Fragment handles only
> UI rendering. The ViewModel contains all business logic and calls the
> ApiService through Retrofit. The Fragment observes StateFlow — when data
> changes, the UI updates automatically."

```
mobile/
  ui/
    activities/  → MainActivity (hosts fragments)
    fragments/   → DashboardFragment, ProfileFragment, PaymentFragment
  viewmodel/
    AdminViewModel.kt  → all API calls, StateFlow for UI state
  network/
    ApiService.kt      → Retrofit interface (mirrors backend endpoints)
    TokenManager.kt    → stores JWT in SharedPreferences
  data/
    AdminData.kt       → DTOs matching backend JSON responses
```

---

### Data Flow — End to End (Payment Example)
**Screen: Talk through while pointing to each file in VS Code**

> "Let me trace one complete data flow — a user making a payment:"

```
1. User taps "Pay Now" on web or mobile
       │
       ▼
2. Frontend calls  POST /api/v1/payments
   with { planId, paymentMethodId }          ← PaymentController.java
       │
       ▼
3. Backend calls Stripe API                  ← StripeController.java
   to create and confirm a PaymentIntent
       │
       ▼
4. Payment record saved to MySQL             ← PaymentRepository.java
   (reference number, amount, status)           (Spring Data JPA)
       │
       ▼
5. UserMembership activated                  ← UserMembership entity updated
   (startDate, endDate set)
       │
       ▼
6. Receipt email sent automatically          ← EmailService.sendPaymentReceipt()
   to user + admin alert to all admins
       │
       ▼
7. JSON response returned to frontend
       │
       ▼
8. UI updates — Dashboard shows
   active membership, stats refresh
```

---

### Security Architecture Proof
**Screen: SecurityConfig.java open in VS Code**

> "As proof of security implementation — every incoming request passes
> through TokenAuthFilter first. The filter reads the Authorization header,
> validates the JWT signature and expiry, and populates the SecurityContext.
> Only then do the authorization rules run. Public endpoints like login and
> register are explicitly whitelisted. Admin endpoints require ROLE_ADMIN.
> Everything else requires authentication. No sessions are ever created."

---

## PART 5 — System Demonstration (5:30–7:30)
**Screen: Full-screen recording of the running app with voice-over**

### Step 1 — Register a New Account
**Screen: Registration page**
> "I will register a new user. The frontend sends the name, email, and
> password to POST /api/v1/auth/register. The backend validates the input,
> hashes the password with BCrypt, saves the user to MySQL, and sends a
> welcome email automatically."

### Step 2 — Login and View Dashboard
**Screen: Login → Dashboard**
> "After login, the backend generates a JWT token. The frontend stores it
> in localStorage and attaches it to every future request. The dashboard
> loads stats from the backend — total payments, amount spent, and
> membership status."

### Step 3 — Browse Plans and Make a Payment
**Screen: Plans page → Payment page → success screen**
> "I will select the Premium plan. On the payment page, I enter a test card
> number. The card details go directly to Stripe — they never touch our
> server. Stripe returns a PaymentMethod ID, which our backend uses to
> confirm the payment and activate the membership immediately."
- Card: `4242 4242 4242 4242`
- Expiry: `12/34`
- CVC: `123`

### Step 4 — Payment History
**Screen: History page**
> "The payment is now recorded with a unique reference number and a
> Completed status. Users can see their full payment history here."

### Step 5 — Profile Management
**Screen: Profile page**
> "Users can update their name, upload a profile photo, change their
> password, and change their email. After changing email, the system logs
> them out for security. Google users see the Set Password card instead."

### Step 6 — Admin Panel
**Screen: Login as admin → Admin Panel**
> "Logging in as admin, I can see all registered users, manage all
> payments, and update payment statuses. Clicking the Completed stat card
> instantly filters the payments list. In the Plans tab I can create,
> edit, and delete membership plans."

### Step 7 — Android App
**Screen: Android emulator or phone**
> "The same features are fully available on Android. The app connects to
> the same Spring Boot backend using Retrofit. Here is the dashboard, the
> plans page, and the profile screen with the Set Password and Change Email
> cards — identical behavior to the web app."

---

## Closing (7:30–8:00)

> "That concludes my presentation of FitLife Gym. The system successfully
> integrates all the core concepts from Systems Integration and Architecture:
>
> - A layered Spring Boot REST API backend
> - A React TypeScript web frontend
> - An Android Kotlin MVVM mobile app
> - MySQL for data persistence via Spring Data JPA
> - Stripe for secure online payment processing
> - Google OAuth 2.0 for social login
> - JWT for stateless authentication and authorization
> - Automated HTML email notifications via Gmail SMTP
>
> All components communicate through a unified REST API with clear
> separation of concerns and no tight coupling between layers.
>
> Thank you!"

---

## Pre-Recording Checklist

- [ ] Backend running on port 8080
- [ ] Web app running on port 5173 (npm run dev)
- [ ] Android emulator or phone with app installed
- [ ] Test Stripe card ready: 4242 4242 4242 4242 / 12/34 / 123
- [ ] Admin account credentials ready
- [ ] Regular user account ready (or register live during demo)
- [ ] VS Code open with project folder visible
- [ ] Screen recorder ready (OBS or Windows Win+G)
- [ ] Headset plugged in, microphone tested
- [ ] Browser zoom at 110% so text is readable in recording
- [ ] Close all unrelated tabs and notifications

---

## Architecture Diagram (Text Version)

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│                                                             │
│   ┌─────────────────┐         ┌─────────────────────┐      │
│   │  React Web App  │         │  Android Mobile App │      │
│   │  (TypeScript)   │         │  (Kotlin + MVVM)    │      │
│   │  localhost:5173 │         │  Retrofit + OkHttp  │      │
│   └────────┬────────┘         └──────────┬──────────┘      │
└────────────┼──────────────────────────────┼─────────────────┘
             │   HTTP + JSON (REST API)      │
             └───────────────┬───────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                   SPRING BOOT BACKEND                       │
│                      (port 8080)                            │
│                                                             │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │ AuthController│  │PaymentController│  │ProfileController│ │
│  │ /auth/**     │  │ /payments/**   │  │ /profile/**    │  │
│  └──────┬───────┘  └───────┬────────┘  └───────┬────────┘  │
│         │                  │                    │           │
│  ┌──────▼──────────────────▼────────────────────▼────────┐ │
│  │              Shared Layer                              │ │
│  │  SecurityConfig · JwtUtils · TokenAuthFilter           │ │
│  │  UserRepository · PaymentRepository (Spring Data JPA) │ │
│  │  EmailService (JavaMailSender)                        │ │
│  └──────────────────────────┬────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼──────┐    ┌───────▼──────┐    ┌───────▼──────┐
    │   MySQL    │    │ Stripe API   │    │ Google OAuth │
    │  Database  │    │ (Payments)   │    │  (Login)     │
    │ironpass_db │    │              │    │              │
    └────────────┘    └──────────────┘    └──────────────┘
                              │
                    ┌─────────▼────────┐
                    │  Gmail SMTP      │
                    │ (Email Notif)    │
                    └──────────────────┘
```

---

## Files to Show During Architecture Section

| File | What to highlight |
|---|---|
| `backend/.../config/SecurityConfig.java` | JWT filter, public vs protected endpoints, ROLE_ADMIN rule |
| `backend/.../feature/payment/PaymentController.java` | @Transactional, Stripe call, email trigger |
| `backend/.../shared/service/EmailService.java` | sendPaymentReceipt, sendWelcomeEmail |
| `backend/.../shared/entity/User.java` | JPA entity, notifEmail flags |
| `web/src/shared/api/client.ts` | Axios instance, JWT interceptor |
| `web/src/features/payment/` | paymentApi.ts calling the backend |
| `mobile/.../network/ApiService.kt` | Retrofit interface matching backend endpoints |
| `mobile/.../viewmodel/AdminViewModel.kt` | StateFlow, coroutines, ViewModel pattern |
| `backend/src/main/resources/application.properties` | DB config, Stripe keys, mail config, JWT secret |
