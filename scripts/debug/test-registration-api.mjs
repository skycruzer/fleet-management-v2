/**
 * Test registration API with the exact data from the form
 */

const registrationData = {
  first_name: 'Maurice',
  last_name: 'Rondeau',
  rank: 'Captain',
  employee_id: '2393',
  date_of_birth: '1972-10-06', // Converted from 10/06/1972
  phone_number: '+675 1234 5678',
  address: 'PO BOX 8478 BOROKO, NCD 111',
  email: 'mrondeau@airniugini.com.pg',
  password: 'Lemakot@1972',
  confirmPassword: 'Lemakot@1972', // Fixed: should be camelCase
}

async function testRegistration() {
  try {
    console.log('Testing registration API with data:', {
      ...registrationData,
      password: '********',
      confirmPassword: '********',
    })

    const response = await fetch('http://localhost:3000/api/portal/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData),
    })

    const data = await response.json()

    console.log('\nResponse Status:', response.status)
    console.log('Response Data:', JSON.stringify(data, null, 2))

    if (response.ok) {
      console.log('\n✅ Registration successful!')
    } else {
      console.log('\n❌ Registration failed!')
    }
  } catch (error) {
    console.error('\n❌ Error testing registration:', error.message)
  }
}

testRegistration()
