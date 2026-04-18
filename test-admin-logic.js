// test-admin-logic.mjs
const BASE_URL = 'http://localhost:3000';

async function testAdmin() {
  try {
    console.log('Logging in to Admin API...');
    const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@wordwise.com', password: 'admin123' })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.message}`);
    }
    
    console.log('Login successful! Fetching users...');
    const token = loginData.token;
    
    const usersRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const usersData = await usersRes.json();
    if (!usersData.success) {
      throw new Error(`Fetch users failed: ${usersData.message}`);
    }
    
    console.log(`Successfully fetched ${usersData.users.length} users.`);
    
    // Print a sample of an "Inactive" user
    const inactiveUser = usersData.users.find(u => u.status === 'Inactive');
    if (inactiveUser) {
        console.log('\nSample Inactive User Found:');
        console.log(JSON.stringify(inactiveUser, null, 2));
    } else {
        console.log('\nNo inactive users found to test null handling.');
    }

    // Print a sample of an "Active" user
    const activeUser = usersData.users.find(u => u.status === 'Active');
    if (activeUser) {
        console.log('\nSample Active User Found:');
        console.log(JSON.stringify(activeUser, null, 2));
    } else {
        console.log('\nNo active users found.');
    }
    
  } catch (error) {
    console.error('Test execution failed:', error.message);
  }
}

testAdmin();
