# API Testing Guide

You can test the backend API using curl, Postman, or the built-in frontend.

## Using curl (Command Line)

### 1. Test API Health
```bash
curl http://localhost:8080/api/auth/test
```

Expected response:
```
Gym Membership Payment System Auth API is working!
```

### 2. Test User Registration
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Juan Dela Cruz\",\"email\":\"juan@test.com\",\"password\":\"password123\"}"
```

Expected response:
```json
{
  "id": 1,
  "name": "Juan Dela Cruz",
  "email": "juan@test.com",
  "message": "User registered successfully"
}
```

### 3. Test Duplicate Email (Should Fail)
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Another User\",\"email\":\"juan@test.com\",\"password\":\"password123\"}"
```

Expected response (409 Conflict):
```json
{
  "error": "Email already registered: juan@test.com"
}
```

### 4. Test User Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"juan@test.com\",\"password\":\"password123\"}"
```

Expected response:
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

### 5. Test Invalid Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"juan@test.com\",\"password\":\"wrongpassword\"}"
```

Expected response:
```json
{
  "message": "Invalid email or password",
  "success": false,
  "user": null,
  "token": null
}
```

## Using PowerShell (Windows)

### Test API Health
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/test" -Method GET
```

### Test User Registration
```powershell
$body = @{
    name = "Juan Dela Cruz"
    email = "juan@test.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

### Test User Login
```powershell
$body = @{
    email = "juan@test.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

## Using Postman

1. Download and install Postman from https://www.postman.com/downloads/
2. Create a new request
3. Set the method to POST
4. Set the URL to `http://localhost:8080/api/auth/register`
5. Go to Body tab → Select "raw" → Select "JSON"
6. Enter the request body:
```json
{
  "name": "Juan Dela Cruz",
  "email": "juan@test.com",
  "password": "password123"
}
```
7. Click "Send"

## Testing Validation

### Missing Required Fields
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\"}"
```

Expected response (400 Bad Request):
```json
{
  "name": "Name is required",
  "password": "Password is required"
}
```

### Invalid Email Format
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"notanemail\",\"password\":\"password123\"}"
```

Expected response (400 Bad Request):
```json
{
  "email": "Invalid email format"
}
```

### Password Too Short
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"test@test.com\",\"password\":\"12345\"}"
```

Expected response (400 Bad Request):
```json
{
  "password": "Password must be at least 6 characters"
}
```
