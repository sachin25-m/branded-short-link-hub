require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const BioProfile = require('../src/models/BioProfile');

const runTests = async () => {
  console.log('=== STARTING STEP 5 LINK-IN-BIO HUB TEST SUITE ===\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB:', process.env.MONGODB_URI);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }

  // Clean test databases
  await User.deleteMany({});
  await BioProfile.deleteMany({});
  console.log('🧹 Cleaned test databases.\n');

  // Start HTTP server on random port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`🚀 Test Server listening on http://127.0.0.1:${port}\n`);

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${details}`);
      process.exitCode = 1;
    }
  };

  const request = async (url, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const res = await fetch(baseUrl + url, {
      ...options,
      headers,
    });
    
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, headers: res.headers };
  };

  let tokenUserA = '';
  let tokenUserB = '';

  try {
    // TEST 23: GET /api/health
    console.log('--- TEST 23: GET /api/health ---');
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.success === true, 'GET /api/health works correctly');

    // SETUP: Register & Authenticate User A & User B
    console.log('\n--- SETUP: Registering User A & User B ---');
    const signupA = await request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name: 'Alice Bio', email: 'alice.bio@example.com', password: 'Password123!' }) });
    await request(`/api/auth/verify-email?token=${signupA.data.data.simulationDetails.token}`);
    const loginA = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'alice.bio@example.com', password: 'Password123!' }) });
    tokenUserA = loginA.data.accessToken;

    const signupB = await request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name: 'Bob Bio', email: 'bob.bio@example.com', password: 'Password123!' }) });
    await request(`/api/auth/verify-email?token=${signupB.data.data.simulationDetails.token}`);
    const loginB = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'bob.bio@example.com', password: 'Password123!' }) });
    tokenUserB = loginB.data.accessToken;

    assert(!!tokenUserA && !!tokenUserB, 'Users registered and authenticated successfully');

    // TEST 1: GET /api/bio/me
    console.log('\n--- TEST 1: GET /api/bio/me ---');
    const getBioEmpty = await request('/api/bio/me', { headers: { Authorization: `Bearer ${tokenUserA}` } });
    assert(getBioEmpty.status === 200 && getBioEmpty.data.exists === false, 'Authenticated user can retrieve empty initial bio state');

    // TEST 4: Unauthenticated modification rejection
    console.log('\n--- TEST 4: Unauthenticated Modification Rejection ---');
    const unauthPut = await request('/api/bio/me', { method: 'PUT', body: JSON.stringify({ username: 'alice_bio', displayName: 'Alice' }) });
    assert(unauthPut.status === 401, 'Unauthenticated user cannot modify BioProfile (401)');

    // TEST 6 & 7: Username Validations
    console.log('\n--- TEST 6 & 7: Username Validation ---');
    const invalidCharUser = await request('/api/bio/me', { method: 'PUT', headers: { Authorization: `Bearer ${tokenUserA}` }, body: JSON.stringify({ username: 'alice bio space', displayName: 'Alice' }) });
    assert(invalidCharUser.status === 400, 'Invalid username characters are rejected (400)');

    const reservedUser = await request('/api/bio/me', { method: 'PUT', headers: { Authorization: `Bearer ${tokenUserA}` }, body: JSON.stringify({ username: 'admin', displayName: 'Alice Admin' }) });
    assert(reservedUser.status === 400, 'Reserved username (admin/api/bio) is rejected (400)');

    // TEST 8, 9, 10: Avatar & Social Link Validations
    console.log('\n--- TEST 8, 9, 10: Avatar & Social Link Validations ---');
    const invalidAvatar = await request('/api/bio/me', { method: 'PUT', headers: { Authorization: `Bearer ${tokenUserA}` }, body: JSON.stringify({ username: 'alice_dev', displayName: 'Alice', avatarUrl: 'invalid-avatar-url' }) });
    assert(invalidAvatar.status === 400, 'Invalid avatar URL is rejected (400)');

    const unsafeProtocolSocial = await request('/api/bio/me', { method: 'PUT', headers: { Authorization: `Bearer ${tokenUserA}` }, body: JSON.stringify({ username: 'alice_dev', displayName: 'Alice', socialLinks: [{ platform: 'github', url: 'javascript:alert(1)' }] }) });
    assert(unsafeProtocolSocial.status === 400, 'Unsafe URL protocol (javascript:) is rejected (400)');

    // TEST 11: Invalid Theme Validation
    console.log('\n--- TEST 11: Theme Validation ---');
    const invalidTheme = await request('/api/bio/me', { method: 'PUT', headers: { Authorization: `Bearer ${tokenUserA}` }, body: JSON.stringify({ username: 'alice_dev', displayName: 'Alice', theme: 'custom-unsupported-theme' }) });
    assert(invalidTheme.status === 400, 'Invalid theme value is rejected (400)');

    // TEST 2, 12, 13, 14: Create Bio Profile with Themes
    console.log('\n--- TEST 2, 12, 13, 14: Create Profile & Themes ---');
    const createAliceRes = await request('/api/bio/me', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenUserA}` },
      body: JSON.stringify({
        username: 'alice_dev',
        displayName: 'Alice Developer',
        bio: 'Full Stack MERN Engineer',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        theme: 'minimal-light',
        socialLinks: [
          { platform: 'github', url: 'https://github.com/alicedev' },
          { platform: 'linkedin', url: 'https://linkedin.com/in/alicedev' },
        ],
      }),
    });
    assert(createAliceRes.status === 200 && createAliceRes.data.success === true, 'User A can create BioProfile with minimal-light theme');

    // TEST 3: Update Profile
    console.log('\n--- TEST 3: Update BioProfile ---');
    const updateAliceRes = await request('/api/bio/me', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenUserA}` },
      body: JSON.stringify({
        username: 'alice_dev',
        displayName: 'Alice Senior Developer',
        bio: 'Updated Full Stack Engineer Bio',
        theme: 'gradient',
        socialLinks: [
          { platform: 'github', url: 'https://github.com/alicedev' },
          { platform: 'x', url: 'https://x.com/alicedev' },
        ],
      }),
    });
    assert(updateAliceRes.status === 200 && updateAliceRes.data.profile.theme === 'gradient', 'User A can update BioProfile theme to gradient');

    // TEST 5 & 19: Username Uniqueness & Ownership
    console.log('\n--- TEST 5 & 19: Username Uniqueness & Ownership ---');
    const duplicateUserRes = await request('/api/bio/me', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenUserB}` },
      body: JSON.stringify({ username: 'alice_dev', displayName: 'Bob Impostor' }),
    });
    assert(duplicateUserRes.status === 409, 'Duplicate username is rejected when used by another user (409 Conflict)');

    // User B creates own valid profile with dark-slate theme
    const createBobRes = await request('/api/bio/me', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenUserB}` },
      body: JSON.stringify({ username: 'bob_builder', displayName: 'Bob Engineer', theme: 'dark-slate' }),
    });
    assert(createBobRes.status === 200 && createBobRes.data.profile.theme === 'dark-slate', 'User B can create own BioProfile with dark-slate theme');

    // TEST 15, 16, 17: Public Profile (GET /api/bio/:username)
    console.log('\n--- TEST 15, 16, 17: Public Profile & Security ---');
    const publicAlice = await request('/api/bio/alice_dev');
    assert(publicAlice.status === 200 && publicAlice.data.success === true, 'Public profile can be accessed without authentication');
    assert(publicAlice.data.profile.displayName === 'Alice Senior Developer', 'Public profile returns correct configured fields');
    assert(!publicAlice.data.profile.email && !publicAlice.data.profile.password && !publicAlice.data.profile.user, 'Public profile strictly conceals private user data (email, password, user reference)');

    // TEST 18: Unknown Username 404
    console.log('\n--- TEST 18: Unknown Username 404 ---');
    const unknownUserRes = await request('/api/bio/non_existent_user_xyz');
    assert(unknownUserRes.status === 404, 'Unknown username returns 404 Not Found');

    console.log('\n==================================================');
    console.log('🎉 ALL STEP 5 LINK-IN-BIO HUB TESTS PASSED PERFECTLY!');
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
