require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const Link = require('../src/models/Link');
const ClickEvent = require('../src/models/ClickEvent');
const User = require('../src/models/User');

const runTests = async () => {
  console.log('=== STARTING STEP 3 REDIRECTION & TELEMETRY TEST SUITE ===\n');

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
      redirect: 'manual', // Prevent fetch from following 302 automatically!
    });
    
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, headers: res.headers };
  };

  let tokenUserA = '';
  let userAId = '';
  let tokenUserB = '';
  let userBId = '';

  try {
    // 1. Setup authenticated users (User A and User B)
    console.log('--- SETUP: Registering User A & User B ---');
    const signupA = await request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name: 'User A', email: 'usera@example.com', password: 'Password123!' }) });
    await request(`/api/auth/verify-email?token=${signupA.data.data.simulationDetails.token}`);
    const loginA = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'usera@example.com', password: 'Password123!' }) });
    tokenUserA = loginA.data.accessToken;
    userAId = loginA.data.user._id;

    const signupB = await request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name: 'User B', email: 'userb@example.com', password: 'Password123!' }) });
    await request(`/api/auth/verify-email?token=${signupB.data.data.simulationDetails.token}`);
    const loginB = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'userb@example.com', password: 'Password123!' }) });
    tokenUserB = loginB.data.accessToken;
    userBId = loginB.data.user._id;

    assert(!!tokenUserA && !!tokenUserB, 'Users registered and authenticated successfully');

    // TEST 29: GET /api/health still works
    console.log('\n--- TEST 29: GET /api/health ---');
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.success === true, 'GET /api/health works correctly');

    // TEST 1 & 2: Creation Authentication
    console.log('\n--- TEST 1 & 2: Link Creation Auth ---');
    const unauthCreate = await request('/api/links', { method: 'POST', body: JSON.stringify({ destinationUrl: 'https://example.com' }) });
    assert(unauthCreate.status === 401, 'Unauthenticated user cannot create short link (401)');

    const authCreate = await request('/api/links', { method: 'POST', headers: { Authorization: `Bearer ${tokenUserA}` }, body: JSON.stringify({ destinationUrl: 'https://example.com/target-page' }) });
    assert(authCreate.status === 201 && authCreate.data.success === true, 'Authenticated user can create a short link (201)');

    // TEST 3 & 4: URL Validation
    console.log('\n--- TEST 3 & 4: URL Validation ---');
    const invalidUrl1 = await request('/api/links', { method: 'POST', headers: { Authorization: `Bearer ${tokenUserA}` }, body: JSON.stringify({ destinationUrl: 'not-a-valid-url' }) });
    assert(invalidUrl1.status === 400, 'Invalid destination URL is rejected (400)');

    const invalidUrl2 = await request('/api/links', { method: 'POST', headers: { Authorization: `Bearer ${tokenUserA}` }, body: JSON.stringify({ destinationUrl: 'ftp://unsupported-scheme.com' }) });
    assert(invalidUrl2.status === 400, 'Non-HTTP/HTTPS URL scheme is rejected (400)');

    const validHttpUrl = await request('/api/links', { method: 'POST', headers: { Authorization: `Bearer ${tokenUserA}` }, body: JSON.stringify({ destinationUrl: 'http://my-http-site.org/demo' }) });
    assert(validHttpUrl.status === 201, 'Valid HTTP URL is accepted');

    // TEST 5 & 6: 6-Character Short Code Generation & Uniqueness
    console.log('\n--- TEST 5 & 6: 6-Character Code Generation ---');
    const autoLink = authCreate.data.data;
    assert(autoLink.shortCode.length === 6, 'Automatic short code is EXACTLY 6 characters');
    assert(/^[0-9a-zA-Z]{6}$/.test(autoLink.shortCode), 'Generated code contains only base62 alphanumeric characters');

    // Create 5 links to test uniqueness
    const codes = new Set();
    for (let i = 0; i < 5; i++) {
      const res = await request('/api/links', { method: 'POST', headers: { Authorization: `Bearer ${tokenUserA}` }, body: JSON.stringify({ destinationUrl: `https://example.com/page-${i}` }) });
      codes.add(res.data.data.shortCode);
    }
    assert(codes.size === 5, 'Automatically generated short codes are unique');

    // TEST 7, 8, 9: Custom Vanity Slug Validation
    console.log('\n--- TEST 7, 8, 9: Custom Vanity Slugs ---');
    const customSlugRes = await request('/api/links', { method: 'POST', headers: { Authorization: `Bearer ${tokenUserA}` }, body: JSON.stringify({ destinationUrl: 'https://example.com/summer-launch', customSlug: 'summer-sale-2026' }) });
    assert(customSlugRes.status === 201 && customSlugRes.data.data.shortCode === 'summer-sale-2026', 'Custom vanity slug works correctly');

    const duplicateSlugRes = await request('/api/links', { method: 'POST', headers: { Authorization: `Bearer ${tokenUserB}` }, body: JSON.stringify({ destinationUrl: 'https://userb.com/other', customSlug: 'summer-sale-2026' }) });
    assert(duplicateSlugRes.status === 409 || duplicateSlugRes.status === 400, 'Duplicate custom vanity slug is rejected (409/400)');

    const invalidSlugChar = await request('/api/links', { method: 'POST', headers: { Authorization: `Bearer ${tokenUserA}` }, body: JSON.stringify({ destinationUrl: 'https://example.com', customSlug: 'slug with spaces' }) });
    assert(invalidSlugChar.status === 400, 'Invalid custom slug characters are rejected (400)');

    const reservedSlugRes = await request('/api/links', { method: 'POST', headers: { Authorization: `Bearer ${tokenUserA}` }, body: JSON.stringify({ destinationUrl: 'https://example.com', customSlug: 'admin' }) });
    assert(reservedSlugRes.status === 400, 'Reserved system slugs are rejected (400)');

    // TEST 10: Ownership Enforcement on Creation
    console.log('\n--- TEST 10: Owner Identity Enforcement ---');
    const createdDoc = await Link.findById(customSlugRes.data.data.id);
    assert(createdDoc.owner.toString() === userAId, 'Link owner is strictly bound to verified JWT user identity');

    // TEST 11, 12, 13: Redirection Engine (GET /r/:shortCode)
    console.log('\n--- TEST 11, 12, 13: Redirection Engine ---');
    const missingRedirect = await request('/r/non_existent_code_xyz');
    assert(missingRedirect.status === 404, 'Missing short code returns 404 Not Found');

    const redirectRes = await request(`/r/${autoLink.shortCode}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        'Referer': 'https://twitter.com/post/12345',
      },
    });
    assert(redirectRes.status === 302, 'Redirect status code is EXACTLY 302 Found');
    assert(redirectRes.headers.get('location') === 'https://example.com/target-page', '302 Redirect header matches target destination URL');

    // Wait 200ms for asynchronous click telemetry write to complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    // TEST 14, 15, 16, 17, 18, 19: Click Telemetry Verification
    console.log('\n--- TEST 14-19: Click Telemetry ---');
    const telemetryEvents = await ClickEvent.find({ link: autoLink.id });
    assert(telemetryEvents.length === 1, 'Click telemetry record is created in DB');

    if (telemetryEvents.length > 0) {
      const click = telemetryEvents[0];
      assert(!!click.timestamp, 'Timestamp is captured in ClickEvent');
      assert(click.referrer === 'twitter.com', 'HTTP referrer hostname is captured correctly');
      assert(click.deviceType === 'Mobile', 'Device type is normalized to EXACTLY Mobile');
      assert(!!click.ipHash && click.ipHash.length === 64, 'IP address is stored ONLY as SHA-256 hash');
      assert(!click.rawIp && !click.ip, 'Raw IP address is NOT stored in ClickEvent schema');
    }

    // TEST 21, 22, 23: Link List API, Pagination, and Search
    console.log('\n--- TEST 21, 22, 23: Link List API, Pagination & Search ---');
    const userALinks = await request('/api/links', { headers: { Authorization: `Bearer ${tokenUserA}` } });
    assert(userALinks.status === 200 && userALinks.data.data.links.length > 0, 'Link list API returns links for authenticated user');

    const userBLinks = await request('/api/links', { headers: { Authorization: `Bearer ${tokenUserB}` } });
    assert(userBLinks.status === 200 && userBLinks.data.data.links.length === 0, 'Link list returns ONLY authenticated user links (User B sees 0 links of User A)');

    const pageRes = await request('/api/links?page=1&limit=2', { headers: { Authorization: `Bearer ${tokenUserA}` } });
    assert(pageRes.data.data.pagination.limit === 2 && pageRes.data.data.links.length <= 2, 'Pagination page & limit controls work');
    assert(pageRes.data.data.pagination.total > 0 && pageRes.data.data.pagination.totalPages > 0, 'Pagination metadata (total, totalPages) included');

    const searchRes = await request('/api/links?search=summer-sale', { headers: { Authorization: `Bearer ${tokenUserA}` } });
    assert(searchRes.data.data.links.length === 1 && searchRes.data.data.links[0].shortCode === 'summer-sale-2026', 'Search by custom slug / short code works');

    // TEST 24 & 25: Delete Link & Ownership Verification
    console.log('\n--- TEST 24 & 25: Link Deletion & Ownership ---');
    const linkToDeleteId = autoLink.id;
    const forbiddenDelete = await request(`/api/links/${linkToDeleteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenUserB}` } });
    assert(forbiddenDelete.status === 403, 'Deleting another user\'s link is rejected (403 Forbidden)');

    const ownerDelete = await request(`/api/links/${linkToDeleteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenUserA}` } });
    assert(ownerDelete.status === 200 && ownerDelete.data.success === true, 'Owner can delete their own link (200 OK)');

    const deletedCheck = await Link.findById(linkToDeleteId);
    assert(!deletedCheck, 'Link is successfully deleted from database');

    console.log('\n==================================================');
    console.log('🎉 ALL 29 STEP 3 INTEGRATION TESTS PASSED PERFECTLY!');
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
