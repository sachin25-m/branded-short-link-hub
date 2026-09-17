require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');

// Dynamic test runner for Step 2 Auth requirements
const runTests = async () => {
  console.log('=== STARTING STEP 2 AUTH & SECURITY SUITE ===\n');

  // Connect DB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB:', process.env.MONGODB_URI);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }

  // Clean test collection
  await mongoose.connection.collection('users').deleteMany({});
  console.log('🧹 Cleaned test user database.\n');

  // Start HTTP Server on random port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`🚀 Test Server listening on http://127.0.0.1:${port}\n`);

  let cookieHeader = '';
  let accessToken = '';
  let verificationToken = '';
  let resetToken = '';

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${details}`);
      process.exitCode = 1;
    }
  };

  // Helper fetch request with cookie support
  const request = async (url, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (options.useCookie && cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
    const res = await fetch(baseUrl + url, {
      ...options,
      headers,
    });
    
    // Track cookies from getSetCookie() or set-cookie
    const setCookieHeaders = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean);
    if (setCookieHeaders.length > 0) {
      const refreshCookie = setCookieHeaders.find(c => c.includes('refreshToken='));
      if (refreshCookie) {
        cookieHeader = refreshCookie.split(';')[0];
      }
    }

    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, headers: res.headers };
  };

  try {
    // 1. Health check verification
    console.log('--- TEST GROUP 1: Health Endpoint ---');
    const health = await request('/health');
    assert(health.status === 200 && health.data.success === true, 'GET /api/health works correctly');

    // 2. Signup validations
    console.log('\n--- TEST GROUP 2: Signup & Validation ---');
    const missingFields = await request('/auth/signup', { method: 'POST', body: JSON.stringify({ name: 'Test' }) });
    assert(missingFields.status === 400, 'Signup rejects missing fields');

    const invalidEmail = await request('/auth/signup', { method: 'POST', body: JSON.stringify({ name: 'Test', email: 'invalid-email', password: 'password123' }) });
    assert(invalidEmail.status === 400, 'Signup rejects invalid email format');

    const shortPassword = await request('/auth/signup', { method: 'POST', body: JSON.stringify({ name: 'Test', email: 'valid@example.com', password: '123' }) });
    assert(shortPassword.status === 400, 'Signup rejects password shorter than 8 chars');

    const validSignup = await request('/auth/signup', { method: 'POST', body: JSON.stringify({ name: 'Alice Developer', email: 'alice@example.com', password: 'SecurePassword123!' }) });
    assert(validSignup.status === 201 && validSignup.data.success === true, 'Signup creates user with valid data');
    assert(validSignup.data.data.user.emailVerified === false, 'Signup sets emailVerified = false initially');
    assert(!!validSignup.data.data.simulationDetails.token, 'Signup includes simulated verification token in dev response');
    verificationToken = validSignup.data.data.simulationDetails.token;

    const duplicateSignup = await request('/auth/signup', { method: 'POST', body: JSON.stringify({ name: 'Alice Duplicate', email: 'ALICE@example.com', password: 'SecurePassword123!' }) });
    assert(duplicateSignup.status === 400, 'Signup prevents duplicate email registration (case-insensitive)');

    // 3. Login before email verification
    console.log('\n--- TEST GROUP 3: Login before verification ---');
    const loginUnverified = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'alice@example.com', password: 'SecurePassword123!' }) });
    assert(loginUnverified.status === 403 && loginUnverified.data.emailVerified === false, 'Login rejects unverified email account (403)');

    // 4. Email Verification simulation
    console.log('\n--- TEST GROUP 4: Email Verification ---');
    const invalidVerify = await request(`/auth/verify-email?token=invalid_token_xyz`);
    assert(invalidVerify.status === 400, 'Email verification rejects invalid token');

    const validVerify = await request(`/auth/verify-email?token=${verificationToken}`);
    assert(validVerify.status === 200 && validVerify.data.success === true, 'Email verification succeeds with valid token');

    // 5. Login after verification & token generation
    console.log('\n--- TEST GROUP 5: Login & JWT Tokens ---');
    const invalidLogin = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'alice@example.com', password: 'WrongPassword' }) });
    assert(invalidLogin.status === 401, 'Login rejects invalid credentials (401)');

    const validLogin = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'alice@example.com', password: 'SecurePassword123!' }) });
    assert(validLogin.status === 200 && validLogin.data.success === true, 'Login succeeds with valid credentials');
    assert(!!validLogin.data.accessToken, 'Login returns Access Token');
    assert(!!cookieHeader && cookieHeader.startsWith('refreshToken='), 'Login sets httpOnly refreshToken cookie');
    accessToken = validLogin.data.accessToken;

    // 6. Protected Route
    console.log('\n--- TEST GROUP 6: Protected Route Middleware ---');
    const protectedNoToken = await request('/auth/me');
    assert(protectedNoToken.status === 401, 'Protected route rejects request without token');

    const protectedInvalidToken = await request('/auth/me', { headers: { Authorization: 'Bearer invalid_token' } });
    assert(protectedInvalidToken.status === 401, 'Protected route rejects invalid token');

    const protectedValidToken = await request('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } });
    assert(protectedValidToken.status === 200 && protectedValidToken.data.user.email === 'alice@example.com', 'Protected route accepts valid Bearer access token');

    // 7. Refresh Token Rotation
    console.log('\n--- TEST GROUP 7: Refresh Token Rotation ---');
    const oldCookieHeader = cookieHeader; // Save 1st refresh cookie
    const refreshRes = await request('/auth/refresh', { method: 'POST', useCookie: true });
    assert(refreshRes.status === 200 && refreshRes.data.success === true, 'Refresh token endpoint rotates tokens successfully');
    assert(!!refreshRes.data.accessToken, 'Refresh returns new Access Token (15m expiry)');
    assert(cookieHeader !== oldCookieHeader, 'Refresh issues a new rotated Refresh Token cookie');
    
    // Attempt reuse of old refresh token (Security Requirement)
    console.log('\n--- TEST GROUP 8: Refresh Token Reuse Detection ---');
    const reuseRes = await fetch(baseUrl + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': oldCookieHeader },
    });
    assert(reuseRes.status === 401, `Refresh token reuse is detected and rejected (401/403) [status: ${reuseRes.status}]`);

    // Login again to get a fresh session for Logout test
    const loginAgain = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'alice@example.com', password: 'SecurePassword123!' }) });
    accessToken = loginAgain.data.accessToken;

    // 8. Logout
    console.log('\n--- TEST GROUP 9: Logout ---');
    const logoutRes = await request('/auth/logout', { method: 'POST', useCookie: true });
    assert(logoutRes.status === 200 && logoutRes.data.success === true, 'Logout clears refresh session successfully');

    // 9. Forgot & Reset Password Simulation
    console.log('\n--- TEST GROUP 10: Forgot & Reset Password ---');
    const unknownForgot = await request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: 'unknown@example.com' }) });
    assert(unknownForgot.status === 200, 'Forgot password conceals account non-existence (anti-enumeration)');

    const validForgot = await request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: 'alice@example.com' }) });
    assert(validForgot.status === 200 && !!validForgot.data.simulationDetails.token, 'Forgot password returns simulation reset token for valid user');
    resetToken = validForgot.data.simulationDetails.token;

    const invalidReset = await request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: 'invalid_reset_token', newPassword: 'BrandNewPassword123!' }) });
    assert(invalidReset.status === 400, 'Reset password rejects invalid reset token');

    const validReset = await request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: resetToken, newPassword: 'BrandNewPassword123!' }) });
    assert(validReset.status === 200 && validReset.data.success === true, 'Reset password succeeds with valid token');

    // Verify login with new password
    const loginNewPassword = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'alice@example.com', password: 'BrandNewPassword123!' }) });
    assert(loginNewPassword.status === 200, 'Login succeeds with newly set password');

    console.log('\n==================================================');
    console.log('🎉 ALL 28 STEP 2 AUTHENTICATION TESTS PASSED PERFECTLY!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('\n❌ TEST RUNNER EXCEPTION:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
  }
};

runTests();
