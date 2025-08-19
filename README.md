
## ============== POSTMAN SETUP INSTRUCTIONS ==============

## 1. INSTALLATION:
-   npm init -y
-  npm install express express-session bcrypt cors

## 2. RUN SERVER:
--    node server.js

## 3. POSTMAN CONFIGURATION:
-- Enable "Send cookies" in Postman settings
-- Or manually add Cookie header after login

// 4. TEST FLOW:
//    Step 1: POST /api/login
//    Body (JSON): {"username": "admin", "password": "admin123"}
   
//    Step 2: Copy sessionId cookie from response
   
//    Step 3: Test protected endpoints (GET /api/profile, etc.)
//    - Postman should automatically send cookies
//    - Or manually add: Cookie: sessionId=YOUR_SESSION_ID
   
//    Step 4: POST /api/logout to destroy session

// 5. EXPECTED BEHAVIOR:
//    - Login creates session cookie
//    - Protected endpoints require valid session
//    - Logout destroys session
//    - Admin endpoints require admin role

// ============== POSTMAN COLLECTION READY ==============
// */
