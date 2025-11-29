const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api/auth/register';

const testUser = {
  email: 'test@example.com',
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1234567890',
  type: 'rider'
};

async function registerUser() {
  try {
    console.log('Registering test user...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Test user registered successfully!');
      console.log('Credentials:');
      console.log(`Email: ${testUser.email}`);
      console.log(`Password: ${testUser.password}`);
    } else {
      if (data.code === 'USER_EXISTS') {
        console.log('Test user already exists.');
      } else {
        console.error('Registration failed:', data);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

registerUser();
