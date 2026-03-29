<<<<<<< HEAD
IT342 Phase 1 – User Registration and Login Completed


IT342 Phase 2 – Mobile Development Completed
=======
# Gym Membership Payment System

A full-stack web application for managing gym memberships and payments with user authentication.

## 📋 Project Overview

This system allows users to:
- Register and create an account
- Login securely with encrypted passwords
- View and manage gym memberships
- Process payments
- Track payment history

Admins can:
- View all user memberships
- Monitor payment transactions
- Manage system data

## ✨ Features

### User Authentication
- ✅ User Registration with validation
- ✅ Secure Login/Logout
- ✅ Password encryption using BCrypt
- ✅ Duplicate email prevention
- ✅ Input validation (email format, password length, required fields)

### Membership Management
- View available membership plans (Basic, Premium, Annual)
- Purchase memberships
- Check membership status and expiration

### Payment Processing
- Process payments for memberships
- Multiple payment methods (GCash, Credit Card, Bank Transfer)
- Payment history tracking
- Payment reference generation

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **Sonner** - Toast notifications

### Backend
- **Java 20** - Programming language
- **Spring Boot 3.5** - Framework
- **Spring Security** - Authentication & authorization
- **Spring Data JPA** - Database ORM
- **H2 Database** - In-memory database (development)
- **Maven** - Dependency management
- **Jakarta Validation** - Input validation

## 📦 Prerequisites

Before running this project, make sure you have:

1. **Java Development Kit (JDK) 17 or higher**
   - Download from: https://www.oracle.com/java/technologies/downloads/
   - Verify: `java -version`

2. **IntelliJ IDEA** (recommended) or any Java IDE
   - Download: https://www.jetbrains.com/idea/download/
   - Community Edition is free

3. **Node.js 18 or higher**
   - Download from: https://nodejs.org/
   - Verify: `node -v` and `npm -v`

4. **Git** (optional, for version control)
   - Download from: https://git-scm.com/

## 🚀 Installation & Setup

### Step 1: Clone or Download the Project

```bash
# If using Git
git clone <repository-url>
cd -IT342-Tan-Gym-Membership-System

# Or simply extract the ZIP file
```

### Step 2: Setup Backend

1. **Open the Backend in IntelliJ IDEA:**
   - Launch IntelliJ IDEA
   - Click **File** → **Open**
   - Navigate to the `backend` folder
   - Click **OK**
   - Wait for IntelliJ to download dependencies (this may take a few minutes)

2. **Verify Dependencies:**
   - IntelliJ will automatically detect the Maven project
   - Look for the progress bar at the bottom
   - Wait for "Indexing" to complete

### Step 3: Setup Frontend

1. **Install Node.js Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

   This will download all required packages (~2-5 minutes).

## ▶️ Running the Application

### Start the Backend (Port 8080)

**Option A: Using IntelliJ IDEA** (Recommended)
1. In IntelliJ, locate the file:
   ```
   src/main/java/edu/cit/tan/GymMembershipPaymentSystem/GymMembershipPaymentSystemApplication.java
   ```
2. Right-click on the file
3. Select **Run 'GymMembershipPaymentSystemApplication'**
4. Wait for the console to show: `Started GymMembershipPaymentSystemApplication`

**Option B: Using Command Line** (if Maven is installed)
```bash
cd backend
mvn spring-boot:run
```

**Verify Backend is Running:**
- Open browser to: http://localhost:8080/api/auth/test
- You should see: `Gym Membership Payment System Auth API is working!`

### Start the Frontend (Port 5173 or 5174)

1. **Open a new terminal**
2. **Run the development server:**
   ```bash
   cd frontend
   npm run dev
   ```
3. **Access the application:**
   - Open browser to: http://localhost:5173 (or http://localhost:5174)
   - You should see the login page

## 🧪 Testing the Application

### Test 1: User Registration

1. Open http://localhost:5173 in your browser
2. Click **"Register here"** at the bottom
3. Fill in the registration form:
   - **First Name:** John
   - **Last Name:** Doe
   - **Email:** john.doe@example.com
   - **Password:** password123
   - **Confirm Password:** password123
4. Click **"Register"**
5. ✅ Success: You should see "Registration successful!" and be redirected to the dashboard

### Test 2: User Login

1. Go back to the login page: http://localhost:5173
2. Enter your credentials:
   - **Email:** john.doe@example.com
   - **Password:** password123
3. Click **"Login"**
4. ✅ Success: You should see "Login successful!" and access the dashboard

### Test 3: Validation Testing

**Try these to see validation in action:**

1. **Duplicate Email:**
   - Try registering again with john.doe@example.com
   - ❌ Error: "Email already registered"

2. **Invalid Email Format:**
   - Try registering with email: "notanemail"
   - ❌ Error: "Invalid email format"

3. **Password Too Short:**
   - Try registering with password: "123"
   - ❌ Error: "Password must be at least 6 characters"

4. **Wrong Password:**
   - Try logging in with wrong password
   - ❌ Error: "Invalid email or password"

## 📁 Project Structure

```
-IT342-Tan-Gym-Membership-System/
├── backend/                          # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── edu/cit/tan/GymMembershipPaymentSystem/
│   │   │   │       ├── config/       # Security & CORS configuration
│   │   │   │       ├── controller/   # REST API endpoints
│   │   │   │       ├── dto/          # Data transfer objects
│   │   │   │       ├── entity/       # Database models
│   │   │   │       ├── exception/    # Custom exceptions
│   │   │   │       ├── repository/   # Database repositories
│   │   │   │       └── service/      # Business logic
│   │   │   └── resources/
│   │   │       └── application.properties  # Database & server config
│   │   └── test/                     # Unit tests
│   └── pom.xml                       # Maven dependencies
│
└── frontend/                         # React frontend
    ├── src/
    │   └── app/
    │       ├── components/           # React components
    │       │   ├── Login.tsx         # Login page
    │       │   ├── Register.tsx      # Registration page
    │       │   ├── Dashboard.tsx     # User dashboard
    │       │   ├── Memberships.tsx   # Membership plans
    │       │   ├── Payment.tsx       # Payment processing
    │       │   └── PaymentHistory.tsx # Payment history
    │       ├── context/
    │       │   └── AuthContext.tsx   # Authentication state
    │       ├── services/
    │       │   └── api.ts            # Backend API calls
    │       └── types.ts              # TypeScript types
    ├── package.json                  # NPM dependencies
    └── vite.config.ts                # Vite configuration
```

## 🔌 API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "message": "User registered successfully"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "token": "dummy-jwt-token"
}
```

#### Test Endpoint
```http
GET /api/auth/test
```

**Response:** `Gym Membership Payment System Auth API is working!`

## 🗄️ Database

The application currently uses **H2 in-memory database** for development:
- Database resets when you stop the backend
- Perfect for testing and development
- No setup required

**View the Database:**
1. Start the backend
2. Open: http://localhost:8080/h2-console
3. Enter connection details:
   - **JDBC URL:** `jdbc:h2:mem:gymdb`
   - **Username:** `sa`
   - **Password:** (leave blank)
4. Click **Connect**

### Database Schema

#### Users Table

The `users` table stores all user account information:

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `name` | VARCHAR(100) | NOT NULL | User's full name |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | User's email address (used for login) |
| `password` | VARCHAR(255) | NOT NULL | Encrypted password (BCrypt hashed) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation date |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update date |

**Example Data:**
```sql
INSERT INTO users (name, email, password, created_at, updated_at) 
VALUES ('John Doe', 'john.doe@example.com', '$2a$10$...hashed...', NOW(), NOW());
```

**Important Notes:**
- ✅ Passwords are **never** stored in plain text
- ✅ Email must be unique (no duplicate accounts)
- ✅ Email format is validated before saving
- ✅ Tables are created automatically by Hibernate on first run

### Required User Inputs

When a user registers, they must provide:

1. **Name** (Required)
   - Minimum: 2 characters
   - Maximum: 100 characters
   - Example: "Juan Dela Cruz"

2. **Email** (Required)
   - Must be valid email format
   - Must be unique (not already registered)
   - Example: "juan.delacruz@email.com"

3. **Password** (Required)
   - Minimum: 6 characters
   - Automatically encrypted before storage
   - Example: "mySecurePassword123"

### Switching to PostgreSQL/Supabase

To use a permanent PostgreSQL database (like Supabase):

**Step 1: Update `backend/src/main/resources/application.properties`**

Replace the entire H2 configuration with this PostgreSQL configuration:

```properties
# Server Configuration
server.port=8080

# Supabase PostgreSQL Configuration
spring.datasource.url=jdbc:postgresql://YOUR-PROJECT-REF.supabase.co:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=YOUR-DATABASE-PASSWORD
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# Connection Pool
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2

# Logging
logging.level.edu.cit.tan.GymMembershipPaymentSystem=DEBUG
logging.level.org.springframework.security=DEBUG
logging.level.org.hibernate.SQL=DEBUG
```

**Replace these placeholders:**
- `YOUR-PROJECT-REF` - Your Supabase project reference (e.g., `db.abcdefghijk`)
- `YOUR-DATABASE-PASSWORD` - Your database password from Supabase

**Step 2: Update `backend/pom.xml`**

In the dependencies section, replace the H2 dependency with PostgreSQL:

```xml
<!-- PostgreSQL Driver for Supabase -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- Remove or comment out H2 -->
<!--
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>runtime</scope>
</dependency>
-->
```

**Step 3: Get Supabase Credentials**

1. Go to https://supabase.com/dashboard
2. Select your project (or create a new one)
3. Click **Settings** → **Database**
4. Under "Connection string", select **URI** or **Connection parameters**
5. Copy your connection details:
   - **Host:** `db.xxxxxxxxxxxxx.supabase.co`
   - **Port:** `5432`
   - **Database:** `postgres`
   - **Username:** `postgres`
   - **Password:** (use the password you set when creating the project)

**Step 4: Restart Backend**

1. In IntelliJ, right-click `pom.xml` → **Maven** → **Reload Project**
2. Stop the running application (click the red stop button)
3. Right-click `GymMembershipPaymentSystemApplication.java` → **Run**
4. The `users` table will be created automatically on first run
5. Your data will now persist even after restarting!

**Verification:**
- Check the IntelliJ console for: `HHH000412: Hibernate ORM core version...`
- You should see SQL statements creating the `users` table
- No errors should appear about database connection

**Benefits of PostgreSQL/Supabase:**
- ✅ Data persists between restarts
- ✅ Can access data from anywhere
- ✅ Production-ready database
- ✅ Free tier available on Supabase

## 🔒 Security Features

- ✅ **Password Hashing:** BCrypt encryption (not stored as plain text)
- ✅ **Input Validation:** Email format, password length, required fields
- ✅ **CORS Protection:** Only allows requests from localhost frontend
- ✅ **SQL Injection Prevention:** Uses JPA prepared statements
- ✅ **Duplicate Prevention:** Unique email constraint in database
- ✅ **CSRF Protection:** Disabled for REST API (stateless)

## 🐛 Troubleshooting

### Backend Won't Start

**Problem:** Port 8080 already in use
```
Solution: Stop any application using port 8080, or change the port in:
backend/src/main/resources/application.properties
server.port=8081
```

**Problem:** Java version mismatch
```
Solution: Ensure you have JDK 17 or higher installed
java -version
```

**Problem:** Dependencies not downloading
```
Solution: In IntelliJ, right-click pom.xml → Maven → Reload Project
```

### Frontend Won't Start

**Problem:** Dependencies missing
```bash
cd frontend
npm install
```

**Problem:** Port already in use
```
Solution: Vite will automatically use the next available port (5174, 5175, etc.)
```

### CORS Errors

**Problem:** CORS policy blocking requests
```
Solution:
1. Verify backend is running on port 8080
2. Check WebConfig.java includes your frontend port (5173, 5174)
3. Restart the backend after any config changes
```

### Database Connection Issues

**Problem:** Cannot connect to database
```
Solution: If using H2 (default), no connection needed.
If using PostgreSQL/Supabase, verify credentials in application.properties
```

## 📚 Additional Documentation

- [CONNECTION_SETUP.md](CONNECTION_SETUP.md) - Detailed setup guide with database options
- [API_TESTING.md](API_TESTING.md) - Testing API endpoints with curl/Postman

## 👨‍💻 Development

### Adding New Features

1. **Backend:** Add controller methods in `controller/` package
2. **Frontend:** Create new components in `components/` folder
3. **API calls:** Add functions to `services/api.ts`
4. **State management:** Update `context/AuthContext.tsx`

### Code Style

- **Backend:** Follow Java naming conventions (PascalCase for classes, camelCase for methods)
- **Frontend:** Use functional components with TypeScript
- **Comments:** Add comments for complex logic

## 📝 Requirements Met

### User Registration ✅
- ✅ Name field
- ✅ Email field with validation
- ✅ Password field with encryption
- ✅ Required field validation
- ✅ Duplicate email prevention
- ✅ Database storage
- ✅ Password security (BCrypt hashing)

### User Login ✅
- ✅ Email and password input
- ✅ Credential validation against database
- ✅ Invalid credential handling
- ✅ Successful login grants access to dashboard
- ✅ Secure authentication

## 🎓 Learning Resources

- **Spring Boot:** https://spring.io/guides
- **React:** https://react.dev/learn
- **TypeScript:** https://www.typescriptlang.org/docs/
- **Spring Security:** https://spring.io/projects/spring-security

## 📧 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify both servers are running (backend on 8080, frontend on 5173/5174)
3. Check browser console (F12) for frontend errors
4. Check IntelliJ console for backend errors

## 📄 License

This project is for educational purposes.

---

**Project By:** Tan  
**Course:** IT342  
**Date:** March 2026
>>>>>>> 786762c6e (Final clean structure (backend, web, mobile, docs))
