import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp-up: 100 users in 2 minutes
    { duration: '5m', target: 500 },  // Ramp-up: 500 users in 5 minutes
    { duration: '10m', target: 1000 }, // Ramp-up: 1000 users in 10 minutes
    { duration: '5m', target: 1000 },  // Stay at 1000 users for 5 minutes
    { duration: '2m', target: 0 },     // Ramp-down: 0 users in 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.05'],    // Error rate should be less than 5%
    errors: ['rate<0.1'],
  },
};

// Supabase configuration
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://koymmvuhcxlvcuoyjnvv.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

// Generate random email
function generateEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `test-${timestamp}-${random}@stress-test.com`;
}

// Generate random password
function generatePassword() {
  return `Test123!${Math.random().toString(36).slice(-8)}`;
}

export default function () {
  const email = generateEmail();
  const password = generatePassword();

  // Step 1: Sign up
  const signupPayload = JSON.stringify({
    email: email,
    password: password,
  });

  const signupHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };

  const signupRes = http.post(
    `${SUPABASE_URL}/auth/v1/signup`,
    signupPayload,
    { headers: signupHeaders }
  );

  const signupSuccess = check(signupRes, {
    'signup status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'signup has user': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.user !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!signupSuccess);

  if (!signupSuccess) {
    console.error(`Signup failed: ${signupRes.status} - ${signupRes.body}`);
    return;
  }

  // Extract session token
  let sessionToken = null;
  try {
    const body = JSON.parse(signupRes.body);
    sessionToken = body.session?.access_token || body.access_token;
  } catch (e) {
    console.error('Failed to parse signup response');
    return;
  }

  if (!sessionToken) {
    console.error('No session token received');
    return;
  }

  // Step 2: Create profile (if signup successful)
  const profilePayload = JSON.stringify({
    vorname: `Test-${Math.random().toString(36).slice(-6)}`,
    nachname: `User-${Math.random().toString(36).slice(-6)}`,
    email: email,
    status: 'schueler',
    branche: 'gesundheit',
    profile_complete: false,
  });

  const profileHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${sessionToken}`,
  };

  const profileRes = http.post(
    `${SUPABASE_URL}/rest/v1/profiles`,
    profilePayload,
    { headers: profileHeaders }
  );

  const profileSuccess = check(profileRes, {
    'profile creation status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  errorRate.add(!profileSuccess);

  if (!profileSuccess) {
    console.error(`Profile creation failed: ${profileRes.status} - ${profileRes.body}`);
  }

  // Step 3: Test feed loading
  const feedHeaders = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${sessionToken}`,
  };

  const feedRes = http.get(
    `${SUPABASE_URL}/rest/v1/posts_with_engagement?limit=10`,
    { headers: feedHeaders }
  );

  check(feedRes, {
    'feed loading status is 200': (r) => r.status === 200,
  });

  sleep(1); // Wait 1 second between iterations
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data, null, 2),
    'stress-test-results.json': JSON.stringify(data, null, 2),
  };
}

