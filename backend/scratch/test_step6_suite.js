require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Link = require('../src/models/Link');
const ClickEvent = require('../src/models/ClickEvent');

const runTests = async () => {
  console.log('=== STARTING STEP 6 ANALYTICS DASHBOARD TEST SUITE ===\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB:', process.env.MONGODB_URI);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }

  // Clean test collections
  await User.deleteMany({});
  await Link.deleteMany({});
  await ClickEvent.deleteMany({});
  console.log('🧹 Cleaned test collections.\n');

  // Start HTTP server on random port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`🚀 Test Server listening on http://127.0.0.1:${port}\n`);

  let testCount = 0;
  let passCount = 0;

  const assert = (condition, testName, details = '') => {
    testCount++;
    if (condition) {
      passCount++;
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

  try {
    // 1. Unauthenticated Request
    console.log('--- 1. Testing Unauthenticated Route Protection ---');
    const unauthRes = await request('/api/analytics');
    assert(unauthRes.status === 401, 'GET /api/analytics returns 401 without JWT token');

    // 2. User A Registration & Login
    console.log('\n--- 2. Register User A and Login ---');
    const userASignup = await request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'User A Analytics',
        email: 'usera@analytics.com',
        password: 'Password123!',
      }),
    });
    assert(userASignup.status === 201, 'User A registered successfully');
    const verificationTokenA = userASignup.data.data.simulationDetails.token;

    await request(`/api/auth/verify-email?token=${verificationTokenA}`);

    const userALogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'usera@analytics.com',
        password: 'Password123!',
      }),
    });
    assert(userALogin.status === 200, 'User A logged in successfully');
    const tokenA = userALogin.data.accessToken;

    // 3. User A Initial Analytics (Zero State)
    console.log('\n--- 3. Testing Zero State Analytics ---');
    const zeroStateRes = await request('/api/analytics', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(zeroStateRes.status === 200, 'GET /api/analytics returns HTTP 200');
    assert(zeroStateRes.data.success === true, 'Response success is true');
    assert(zeroStateRes.data.data.totalClicks === 0, 'Initial totalClicks is 0');
    assert(
      Array.isArray(zeroStateRes.data.data.clicksOverTime) &&
        zeroStateRes.data.data.clicksOverTime.length === 0,
      'Initial clicksOverTime is empty array'
    );
    assert(
      Array.isArray(zeroStateRes.data.data.topReferrers) &&
        zeroStateRes.data.data.topReferrers.length === 0,
      'Initial topReferrers is empty array'
    );
    assert(
      Array.isArray(zeroStateRes.data.data.deviceDistribution) &&
        zeroStateRes.data.data.deviceDistribution.length === 0,
      'Initial deviceDistribution is empty array'
    );

    // 4. User A Creates Short Links
    console.log('\n--- 4. User A Creates Short Links ---');
    const createLink1 = await request('/api/links', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        destinationUrl: 'https://example.com/analytics-test-1',
        customSlug: 'analytic1',
      }),
    });
    assert(createLink1.status === 201, 'Link 1 created (/analytic1)');

    const createLink2 = await request('/api/links', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        destinationUrl: 'https://example.com/analytics-test-2',
        customSlug: 'analytic2',
      }),
    });
    assert(createLink2.status === 201, 'Link 2 created (/analytic2)');

    // 5. Generate Click Telemetry for User A Links
    console.log('\n--- 5. Generating Click Telemetry Events ---');
    // Click 1: Desktop Chrome from google.com
    await fetch(`${baseUrl}/r/analytic1`, {
      redirect: 'manual',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0',
        Referer: 'https://google.com/search?q=test',
      },
    });

    // Click 2: Mobile iPhone from twitter.com
    await fetch(`${baseUrl}/r/analytic1`, {
      redirect: 'manual',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
        Referer: 'https://twitter.com/post/123',
      },
    });

    // Click 3: Tablet iPad from google.com
    await fetch(`${baseUrl}/r/analytic2`, {
      redirect: 'manual',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPad; CPU OS 15_4 like Mac OS X) AppleWebKit/605.1.15',
        Referer: 'https://google.com/referral',
      },
    });

    // Click 4: Direct Desktop click
    await fetch(`${baseUrl}/r/analytic2`, {
      redirect: 'manual',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/114.0.0.0',
      },
    });

    // Small delay to ensure async telemetry writing finishes
    await new Promise((r) => setTimeout(r, 600));

    // 6. User A Analytics Retrieval & Metric Assertions
    console.log('\n--- 6. User A Analytics Metrics Verification ---');
    const analyticsResA = await request('/api/analytics', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert(analyticsResA.status === 200, 'Analytics endpoint returned 200 OK');
    const telemetryData = analyticsResA.data.data;
    assert(
      telemetryData.totalClicks === 4,
      `totalClicks is 4 (actual: ${telemetryData.totalClicks})`
    );

    // Clicks over time check
    assert(
      telemetryData.clicksOverTime.length >= 1,
      'clicksOverTime contains today date aggregation'
    );
    assert(
      telemetryData.clicksOverTime[0]?.clicks === 4,
      'Today clicks sum equals 4'
    );

    // Referrers check
    const googleRef = telemetryData.topReferrers.find(
      (r) => r.referrer === 'google.com'
    );
    assert(
      googleRef && googleRef.clicks === 2,
      'google.com referrer has 2 aggregated clicks'
    );

    const twitterRef = telemetryData.topReferrers.find(
      (r) => r.referrer === 'twitter.com'
    );
    assert(
      twitterRef && twitterRef.clicks === 1,
      'twitter.com referrer has 1 aggregated click'
    );

    const directRef = telemetryData.topReferrers.find(
      (r) => r.referrer === 'Direct'
    );
    assert(
      directRef && directRef.clicks === 1,
      'Direct referrer has 1 aggregated click'
    );

    // Device distribution check
    const desktopDev = telemetryData.deviceDistribution.find(
      (d) => d.deviceType === 'Desktop'
    );
    assert(
      desktopDev && desktopDev.clicks === 2,
      'Desktop device count is 2'
    );

    const mobileDev = telemetryData.deviceDistribution.find(
      (d) => d.deviceType === 'Mobile'
    );
    assert(mobileDev && mobileDev.clicks === 1, 'Mobile device count is 1');

    const tabletDev = telemetryData.deviceDistribution.find(
      (d) => d.deviceType === 'Tablet'
    );
    assert(tabletDev && tabletDev.clicks === 1, 'Tablet device count is 1');

    // 7. User Isolation Verification (User B)
    console.log('\n--- 7. Testing User Ownership Isolation ---');
    const userBSignup = await request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'User B Analytics',
        email: 'userb@analytics.com',
        password: 'Password123!',
      }),
    });
    const verificationTokenB = userBSignup.data.data.simulationDetails.token;

    await request(`/api/auth/verify-email?token=${verificationTokenB}`);

    const userBLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'userb@analytics.com',
        password: 'Password123!',
      }),
    });
    const tokenB = userBLogin.data.accessToken;

    const analyticsResB = await request('/api/analytics', {
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    assert(analyticsResB.status === 200, 'User B analytics request succeeds');
    assert(
      analyticsResB.data.data.totalClicks === 0,
      'User B sees 0 totalClicks (cannot see User A telemetry)'
    );

  } catch (err) {
    console.error('\n❌ Unexpected error in test execution:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log(
      `\n=== STEP 6 TEST SUITE COMPLETED: ${passCount}/${testCount} PASSED ===`
    );
  }
};

runTests();
