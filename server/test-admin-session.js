import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/admin';

async function runTests() {
  console.log('--- ADMIN LOGIN VALIDATION TESTS ---');
  let token = '';

  // Test 1: Empty Fields (Handled mainly by frontend, backend should return 400 or invalid)
  console.log('\n[Test Case 1] Empty fields');
  try {
    const res1 = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' })
    });
    const data1 = await res1.json();
    console.log('Result:', data1);
    console.log(data1.success === false ? 'PASS: Empty fields rejected' : 'FAIL: Empty fields allowed');
  } catch(e) { console.error('Error:', e); }

  // Test 2: Invalid Email Format
  console.log('\n[Test Case 2] Invalid Email Format');
  try {
    const res2 = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'wrongemail', password: 'admin123' })
    });
    const data2 = await res2.json();
    console.log('Result:', data2);
    console.log(data2.success === false ? 'PASS: Invalid email rejected' : 'FAIL: Invalid email allowed');
  } catch(e) { console.error('Error:', e); }

  // Test 3: Wrong Credentials
  console.log('\n[Test Case 3] Wrong Password');
  try {
    const res3 = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@wordwise.com', password: 'wrongpassword' })
    });
    const data3 = await res3.json();
    console.log('Result:', data3);
    console.log(data3.success === false ? 'PASS: Wrong password rejected' : 'FAIL: Wrong password allowed');
  } catch(e) { console.error('Error:', e); }

  // Test 4: Valid Credentials (Positive)
  console.log('\n[Test Case 4] Valid Credentials');
  try {
    const res4 = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@wordwise.com', password: 'admin123' })
    });
    const data4 = await res4.json();
    console.log('Result:', { success: data4.success, token: data4.token ? 'Received' : 'None', message: data4.message });
    if (data4.success && data4.token) {
        console.log('PASS: Login successful, token received');
        token = data4.token;
    } else {
        console.log('FAIL: Login failed');
    }
  } catch(e) { console.error('Error:', e); }

  // Test 5: Session Validation (Protected Route)
  console.log('\n[Test Case 5] Session Persistence (Protected Route Access)');
  try {
    const res5 = await fetch(`${BASE_URL}/users`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    const data5 = await res5.json();
    console.log('Status Code:', res5.status);
    console.log(res5.status === 200 && data5.success ? 'PASS: Session maintained, access granted' : 'FAIL: Session invalid');
  } catch(e) { console.error('Error:', e); }

  // Test 6: Access Protected Route Without Token (Logout simulation)
  console.log('\n[Test Case 6] Security / Logout Simulation (No Token)');
  try {
    const res6 = await fetch(`${BASE_URL}/users`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '
        }
    });
    const data6 = await res6.json();
    console.log('Status Code:', res6.status);
    console.log(res6.status === 401 ? 'PASS: Access denied as expected' : 'FAIL: Unauthorized access allowed');
  } catch(e) { console.error('Error:', e); }
}

runTests();
