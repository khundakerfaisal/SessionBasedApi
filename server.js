
// Session-Based API for Postman Testing
// Node.js + Express with express-session

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true // Important for session cookies
}));

app.use(express.json());

// Session configuration
app.use(session({
  secret: 'my-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // Custom session cookie name
  cookie: { 
    secure: false, // Set false for HTTP (Postman testing)
    httpOnly: false, // Set false to see cookie in Postman
    maxAge: 30 * 60 * 1000, // 30 minutes
    sameSite: 'lax'
  }
}));

// Mock Users Database
const users = [
  { 
    id: 1, 
    username: 'admin', 
    email: 'admin@test.com',
    password: '$2b$10$5wOjXWR.Zp8GxGkm9x/JJe9ZpXf7MqU.rOGN7wQF.PpN4wGX5.ZLy', // password: admin123
    role: 'admin'
  },
  { 
    id: 2, 
    username: 'user1', 
    email: 'user1@test.com',
    password: '$2b$10$5wOjXWR.Zp8GxGkm9x/JJe9ZpXf7MqU.rOGN7wQF.PpN4wGX5.ZLy', // password: user123
    role: 'user'
  }
];

// Auth middleware
const requireAuth = (req, res, next) => {
  console.log('Session check:', req.session);
  
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please login first',
      sessionExists: !!req.session,
      sessionData: req.session
    });
  }
};

// ============ POSTMAN TEST ENDPOINTS ============

// 1. POST /api/login - Login and create session
app.post('/api/login', async (req, res) => {
  console.log('Login attempt:', req.body);
  console.log('Session before login:', req.session);
  
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      error: 'Username and password required' 
    });
  }
  
  try {
    // Find user
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // For demo purposes, simple password check (in real app use bcrypt)
    const validPassword = password === 'admin123' || password === 'user123';
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    req.session.loginTime = new Date().toISOString();
    
    console.log('Session after login:', req.session);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      session: {
        sessionId: req.session.id,
        expires: req.session.cookie.maxAge,
        loginTime: req.session.loginTime
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. GET /api/session - Check session status
app.get('/api/session', (req, res) => {
  console.log('Session check request:', req.session);
  
  if (req.session && req.session.userId) {
    res.json({
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role
      },
      session: {
        sessionId: req.session.id,
        loginTime: req.session.loginTime,
        cookie: req.session.cookie
      }
    });
  } else {
    res.json({
      authenticated: false,
      message: 'No active session',
      sessionId: req.session ? req.session.id : null
    });
  }
});

// 3. GET /api/profile - Protected endpoint
app.get('/api/profile', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.session.userId);
  
  res.json({
    success: true,
    profile: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    sessionInfo: {
      sessionId: req.session.id,
      loginTime: req.session.loginTime,
      username: req.session.username
    }
  });
});

// 4. PUT /api/profile - Update profile (protected)
app.put('/api/profile', requireAuth, (req, res) => {
  const { email, fullName } = req.body;
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    updatedData: { email, fullName },
    updatedBy: req.session.username,
    updateTime: new Date().toISOString(),
    sessionId: req.session.id
  });
});

// 5. GET /api/dashboard - Dashboard data (protected)
app.get('/api/dashboard', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: `Welcome to dashboard, ${req.session.username}!`,
    dashboard: {
      widgets: ['Analytics', 'Sales', 'Reports', 'Users'],
      notifications: 3,
      lastLogin: req.session.loginTime,
      userRole: req.session.role
    },
    sessionInfo: {
      sessionId: req.session.id,
      username: req.session.username
    }
  });
});

// 6. POST /api/data - Create data (protected)
app.post('/api/data', requireAuth, (req, res) => {
  const { title, content } = req.body;
  
  res.json({
    success: true,
    message: 'Data created successfully',
    data: {
      id: Math.floor(Math.random() * 1000),
      title,
      content,
      createdBy: req.session.username,
      createdAt: new Date().toISOString()
    },
    sessionId: req.session.id
  });
});

// 7. DELETE /api/data/:id - Delete data (protected)
app.delete('/api/data/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: `Data with ID ${id} deleted successfully`,
    deletedBy: req.session.username,
    deletedAt: new Date().toISOString(),
    sessionId: req.session.id
  });
});

// 8. POST /api/logout - Logout and destroy session
app.post('/api/logout', (req, res) => {
  const sessionId = req.session ? req.session.id : null;
  const username = req.session ? req.session.username : null;
  
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Could not logout' });
    }
    
    res.clearCookie('sessionId'); // Clear the session cookie
    res.json({ 
      success: true, 
      message: 'Logout successful',
      loggedOutUser: username,
      sessionId: sessionId
    });
  });
});

// 9. GET /api/admin/users - Admin only endpoint
app.get('/api/admin/users', requireAuth, (req, res) => {
  if (req.session.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied', 
      message: 'Admin role required',
      yourRole: req.session.role 
    });
  }
  
  res.json({
    success: true,
    users: users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role
    })),
    requestedBy: req.session.username,
    sessionId: req.session.id
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    hasSession: !!req.session,
    sessionId: req.session ? req.session.id : null
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Session API Server running on http://localhost:${PORT}`);
  console.log('\n📋 POSTMAN TEST CREDENTIALS:');
  console.log('Username: admin, Password: admin123 (Admin user)');
  console.log('Username: user1, Password: user123 (Regular user)');
  console.log('\n🔗 Test these endpoints in Postman:\n');
  
  const endpoints = [
    'POST http://localhost:3000/api/login',
    'GET  http://localhost:3000/api/session',
    'GET  http://localhost:3000/api/profile',
    'PUT  http://localhost:3000/api/profile', 
    'GET  http://localhost:3000/api/dashboard',
    'POST http://localhost:3000/api/data',
    'DELETE http://localhost:3000/api/data/123',
    'GET  http://localhost:3000/api/admin/users',
    'POST http://localhost:3000/api/logout',
    'GET  http://localhost:3000/api/health'
  ];
  
  endpoints.forEach(endpoint => console.log(`  ${endpoint}`));
  console.log('\n📝 Remember to enable "Send cookies" in Postman!\n');
});


// ============== POSTMAN SETUP INSTRUCTIONS ==============

// 1. INSTALLATION:
//    npm init -y
//    npm install express express-session bcrypt cors

// 2. RUN SERVER:
//    node server.js

// 3. POSTMAN CONFIGURATION:
//    - Enable "Send cookies" in Postman settings
//    - Or manually add Cookie header after login

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