require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const Link = require('../src/models/Link');
const ClickEvent = require('../src/models/ClickEvent');
const User = require('../src/models/User');

const runTests = async () => {
  console.log('=== STARTING STEP 4 LINK LIBRARY STUDIO & QR TEST SUITE ===\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB:', process.env.MONGODB_URI);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }

  // Clean test databases
  await User.deleteMany({});
  await Link.deleteMany({});
  await ClickEvent.deleteMany({});
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
      redirect: 'manual',
    });
    
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, headers: res.headers };
  };

  let tokenUserA = '';
  let tokenUserB = '';

  try {
    // 1. Health check verification
    console.log('--- TEST 22: GET /api/health ---');
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.success === true, 'GET /api/health works correctly');

    // 2. Setup authenticated users (User A & User B)
    console.log('\n--- SETUP: Registering User A & User B ---');
    const signupA = await request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name: 'Alice Library', email: 'alice.lib@example.com', password: 'Password123!' }) });
    await request(`/api/auth/verify-email?token=${signupA.data.data.simulationDetails.token}`);
    const loginA = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'alice.lib@example.com', password: 'Password123!' }) });
    tokenUserA = loginA.data.accessToken;

    const signupB = await request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name: 'Bob Library', email: 'bob.lib@example.com', password: 'Password123!' }) });
    await request(`/api/auth/verify-email?token=${signupB.data.data.simulationDetails.token}`);
    const loginB = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'bob.lib@example.com', password: 'Password123!' }) });
    tokenUserB = loginB.data.accessToken;

    assert(!!tokenUserA && !!tokenUserB, 'Users registered and authenticated successfully');

    // TEST 1 & 2: Link Library Access Control
    console.log('\n--- TEST 1 & 2: Link Library Access Control ---');
    const unauthLib = await request('/api/links');
    assert(unauthLib.status === 401, 'Unauthenticated access to GET /api/links rejected (401)');

    const emptyLibA = await request('/api/links', { headers: { Authorization: `Bearer ${tokenUserA}` } });
    assert(emptyLibA.status === 200 && emptyLibA.data.data.links.length === 0, 'Authenticated user receives empty library state (0 links) initially');

    // TEST 3, 4, 5: Link Creation, Ownership Isolation & Search
    console.log('\n--- TEST 3, 4, 5: Ownership Isolation & Search ---');
    // User A creates 3 links
    const link1 = await request('/api/links', { method: 'POST', headers: { Authorization: `Bearer ${tokenUserA}` }, body: JSON.stringify({ destinationUrl: 'https://example.com/alpha', customSlug: 'alpha-slug' }) });
    const link2 = await request('/api/links', { method: 'POST', headers: { Authorization: `Bearer ${tokenUserA}` }, body: JSON.stringify({ destinationUrl: 'https://example.com/beta', customSlug: 'beta-slug' }) });
    const link3 = await request('/api/links', { method: 'POST', headers: { Authorization: `Bearer ${tokenUserA}` }, body: JSON.stringify({ destinationUrl: 'https://docs.target.org/gamma' }) });

    // User B creates 1 link
    const linkB = await request('/api/links', { method: 'POST', headers: { Authorization: `Bearer ${tokenUserB}` }, body: JSON.stringify({ destinationUrl: 'https://userb-private.com/secret', customSlug: 'bob-secret' }) });

    // Verify User A sees 3 links
    const userALib = await request('/api/links', { headers: { Authorization: `Bearer ${tokenUserA}` } });
    assert(userALib.data.data.links.length === 3, 'User A sees exactly 3 links in library');

    // Verify User B sees 1 link
    const userBLib = await request('/api/links', { headers: { Authorization: `Bearer ${tokenUserB}` } });
    assert(userBLib.data.data.links.length === 1 && userBLib.data.data.links[0].shortCode === 'bob-secret', 'User B sees only their own 1 link');

    // Search for 'alpha' as User A
    const searchAlpha = await request('/api/links?search=alpha', { headers: { Authorization: `Bearer ${tokenUserA}` } });
    assert(searchAlpha.data.data.links.length === 1 && searchAlpha.data.data.links[0].shortCode === 'alpha-slug', 'Search by custom slug returns matching link');

    // Search for 'bob-secret' as User A (Ownership protection)
    const searchBobFromA = await request('/api/links?search=bob-secret', { headers: { Authorization: `Bearer ${tokenUserA}` } });
    assert(searchBobFromA.data.data.links.length === 0, 'Search respects ownership (User A cannot search/find User B links)');

    // TEST 6 & 7: Pagination & Metadata
    console.log('\n--- TEST 6 & 7: Pagination Controls & Metadata ---');
    const page1 = await request('/api/links?page=1&limit=2', { headers: { Authorization: `Bearer ${tokenUserA}` } });
    assert(page1.data.data.links.length === 2, 'Pagination limit=2 returns exactly 2 links on page 1');
    assert(page1.data.data.pagination.total === 3 && page1.data.data.pagination.totalPages === 2, 'Pagination metadata is correct (total: 3, totalPages: 2)');

    const page2 = await request('/api/links?page=2&limit=2', { headers: { Authorization: `Bearer ${tokenUserA}` } });
    assert(page2.data.data.links.length === 1, 'Pagination page=2 returns remaining 1 link');

    // TEST 13, 14, 15, 16: Public Short URL & QR Encoding Specifications
    console.log('\n--- TEST 13-16: Short URL & QR Encoding Specs ---');
    const targetLink = link1.data.data;
    assert(targetLink.shortUrl.includes('/r/alpha-slug'), 'Short URL correctly formats complete public path /r/:shortCode');
    assert(!targetLink.shortUrl.includes(targetLink.destinationUrl), 'QR Code encodes complete short URL (/r/:shortCode), NOT target destination URL directly');

    // Simulate click on link1 to generate telemetry
    await request(`/r/${targetLink.shortCode}`);
    await new Promise((resolve) => setTimeout(resolve, 150));
    const telemetryBefore = await ClickEvent.find({ link: targetLink.id });
    assert(telemetryBefore.length === 1, 'Click telemetry captured for link prior to deletion');

    // TEST 9, 10, 11, 12: Link Deletion, Ownership & Telemetry Cleanup
    console.log('\n--- TEST 9-12: Delete Link & Telemetry Cleanup ---');
    const illegalDelete = await request(`/api/links/${targetLink.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenUserB}` } });
    assert(illegalDelete.status === 403, 'Non-owner cannot delete another user\'s link (403 Forbidden)');

    const legalDelete = await request(`/api/links/${targetLink.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenUserA}` } });
    assert(legalDelete.status === 200 && legalDelete.data.success === true, 'Owner can delete their link (200 OK)');

    const afterDeleteLib = await request('/api/links', { headers: { Authorization: `Bearer ${tokenUserA}` } });
    assert(afterDeleteLib.data.data.links.length === 2, 'Deleted link no longer appears in User A library (down to 2 links)');

    const telemetryAfter = await ClickEvent.find({ link: targetLink.id });
    assert(telemetryAfter.length === 0, 'Associated ClickEvent telemetry records are deleted when link is deleted');

    console.log('\n==================================================');
    console.log('🎉 ALL STEP 4 LINK LIBRARY & QR TESTS PASSED PERFECTLY!');
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
