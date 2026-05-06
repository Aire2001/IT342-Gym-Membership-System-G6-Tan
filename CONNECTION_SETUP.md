# Backend-Frontend Connection Setup Guide

## ✅ What Has Been Implemented

### Backend (Spring Boot - Port 8080)
- ✅ User entity with name, email, password (hashed)
- ✅ UserRepository with duplicate email check
- ✅ AuthService with register and login methods
- ✅ AuthController with REST endpoints:
  - POST `/api/auth/register` - User registration
  - POST `/api/auth/login` - User login
  - GET `/api/auth/test` - Test endpoint
- ✅ Security configuration with CORS enabled for localhost:5173
- ✅ Password encryption using BCrypt
- ✅ Input validation
- ✅ Exception handling for duplicate emails and validation errors
- ✅ PostgreSQL database integration (Supabase)

### Frontend (React + TypeScript - Port 5173)
- ✅ API service file (`src/app/services/api.ts`) to communicate with backend
- ✅ Updated AuthContext to use real backend APIs
- ✅ Login component connected to backend
- ✅ Register component connected to backend
- ✅ Proper error handling with toast notifications

## 🚀 How to Run

### Prerequisites
- Java 17 or higher
- Maven (or use your IDE's built-in Maven)
- Node.js 18+
- PostgreSQL database (already configured with Supabase)

### Step 1: Start the Backend

**Option A: Using IDE (Recommended)**
1. Open the `backend` folder in IntelliJ IDEA or Eclipse
2. Right-click on `GymMembershipPaymentSystemApplication.java`
3. Select "Run" or "Debug"
4. Wait for the server to start on http://localhost:8080

**Option B: Using Maven Command Line**
```bash
cd backend
mvn spring-boot:run
```

**Option C: Using Maven Wrapper (if configured)**
```bash
cd backend
./mvnw spring-boot:run    # Linux/Mac
.\mvnw.cmd spring-boot:run # Windows
```

### Step 2: Verify Backend is Running
Open your browser to http://localhost:8080/api/auth/test

You should see: "Gym Membership Payment System Auth API is working!"

### Step 3: Start the Frontend
```bash
cd frontend
npm install  # Only needed first time
npm run dev
```

The frontend will start on http://localhost:5173

### Step 4: Test the Connection

#### Test 1: User Registration
1. Open http://localhost:5173
2. Click "Register here"
3. Fill in the form:
   - First Name: Juan
   - Last Name: Dela Cruz
   - Email: juan@test.com
   - Password: password123
   - Confirm Password: password123
4. Click "Register"
5. ✅ You should see "Registration successful!" and be redirected to the dashboard

#### Test 2: User Login
1. Go back to login page (http://localhost:5173)
2. Enter credentials:
   - Email: juan@test.com
   - Password: password123
3. Click "Login"
4. ✅ You should see "Login successful!" and be redirected to the dashboard

#### Test 3: Duplicate Email Prevention
1. Try to register again with juan@test.com
2. ✅ You should see an error: "Email already registered"

#### Test 4: Invalid Login
1. Try to login with wrong password
2. ✅ You should see "Invalid email or password"

## 📋 API Documentation

### Register User
**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "Juan Dela Cruz",
  "email": "juan@test.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "id": 1,
  "name": "Juan Dela Cruz",
  "email": "juan@test.com",
  "message": "User registered successfully"
}
```

**Error Response (409 - Duplicate Email):**
```json
{
  "error": "Email already registered: juan@test.com"
}
```

**Error Response (400 - Validation Error):**
```json
{
  "name": "Name is required",
  "email": "Invalid email format",
  "password": "Password must be at least 6 characters"
}
```

### Login User
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "juan@test.com",
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
    "name": "Juan Dela Cruz",
    "email": "juan@test.com",
    "message": "Login successful"
  },
  "token": "dummy-jwt-token"
}
```

**Error Response (400 - Invalid Credentials):**
```json
{
  "message": "Invalid email or password",
  "success": false,
  "user": null,
  "token": null
}
```

## 🔒 Security Features Implemented

✅ **Password Security**
- Passwords are hashed using BCrypt before storing in database
- Passwords are never returned in API responses
- Minimum password length: 6 characters

✅ **Email Validation**
- Email format validation
- Duplicate email prevention with database constraint
- Case-sensitive email storage

✅ **Input Validation**
- All required fields validated
- Name: 2-100 characters
- Email: Valid email format
- Password: Minimum 6 characters

✅ **CORS Configuration**
- Configured to allow requests from http://localhost:5173
- Supports all necessary HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
- Credentials support enabled

✅ **Database Security**
- SSL connection to Supabase PostgreSQL
- Connection pooling with HikariCP
- Prepared statements to prevent SQL injection

## 🗄️ Database Schema

### users table
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🛠️ Troubleshooting

### Backend Issues

**Port 8080 already in use:**
```bash
# Change port in backend/src/main/resources/application.properties
server.port=8081
```
Then update the frontend API URL in `frontend/src/app/services/api.ts`:
```typescript
const API_BASE_URL = 'http://localhost:8081/api';
```

**Database connection error:**
- Check that the Supabase database credentials in `application.properties` are correct
- Verify internet connection (Supabase is cloud-hosted)

### Frontend Issues

**CORS errors:**
- Verify backend is running on port 8080
- Check WebConfig.java includes "http://localhost:5173" in allowed origins

**Port 5173 already in use:**
- Vite will automatically use the next available port (5174, 5175, etc.)
- Update CORS configuration in backend if needed

## 📝 Next Steps

The basic user registration and login are now working! Here's what you can add next:

1. **JWT Token Implementation** - Replace dummy token with real JWT
2. **Protected Routes** - Add authentication guards to frontend routes
3. **User Profile** - Add endpoint to get/update user profile
4. **Password Reset** - Add forgot password functionality
5. **Admin Features** - Add admin-only endpoints with role-based access
6. **Membership Management** - Connect membership and payment features to backend

## 📞 Support

If you encounter any issues:
1. Check that both servers are running (backend on 8080, frontend on 5173)
2. Check browser console for errors (F12)
3. Check backend logs for error messages
4. Verify database connection in backend logs
