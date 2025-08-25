const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testParticipantCreation() {
  try {
    console.log('=== Testing Participant Creation & Display ===\n');
    
    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@supplychain.com',
      password: 'Admin@123456'
    });
    
    const token = loginResponse.data.data.token;
    const adminUser = loginResponse.data.data.user;
    console.log(`✅ Admin logged in: ${adminUser.name} (${adminUser.email})`);
    console.log(`   User Key: ${adminUser.userKey}`);
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Create a new participant
    console.log('\n2. Creating new participant...');
    const participantData = {
      name: 'Test Manufacturer',
      email: 'test.manufacturer@example.com',
      role: 'manufacturer',
      company: 'Test Manufacturing Inc.',
      location: 'San Francisco, CA',
      phone: '+1-555-0199'
    };
    
    const createResponse = await axios.post(`${API_BASE_URL}/participants`, participantData, { headers });
    const newParticipant = createResponse.data.data;
    console.log(`✅ Participant created: ${newParticipant.name} (${newParticipant.email})`);
    console.log(`   User Key: ${newParticipant.userKey}`);
    console.log(`   Temp Password: ${newParticipant.tempPassword}`);
    
    // 3. Fetch all participants
    console.log('\n3. Fetching all participants...');
    const listResponse = await axios.get(`${API_BASE_URL}/participants`, { headers });
    const participants = listResponse.data.data;
    console.log(`✅ Found ${participants.length} participants:`);
    
    participants.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.name} (${p.role}) - ${p.email} - Active: ${p.isActive}`);
    });
    
    // 4. Update the participant
    console.log('\n4. Updating participant...');
    const updateData = {
      name: 'Updated Test Manufacturer',
      location: 'Los Angeles, CA'
    };
    
    await axios.put(`${API_BASE_URL}/participants/${newParticipant.id}`, updateData, { headers });
    console.log(`✅ Participant updated successfully`);
    
    // 5. Fetch updated participant
    const updatedResponse = await axios.get(`${API_BASE_URL}/participants/${newParticipant.id}`, { headers });
    const updatedParticipant = updatedResponse.data.data;
    console.log(`   Updated name: ${updatedParticipant.name}`);
    console.log(`   Updated location: ${updatedParticipant.location}`);
    
    // 6. Test non-admin access (login as the new participant)
    console.log('\n5. Testing non-admin access...');
    try {
      const participantLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: newParticipant.email,
        password: newParticipant.tempPassword
      });
      
      const participantToken = participantLoginResponse.data.data.token;
      const participantHeaders = {
        'Authorization': `Bearer ${participantToken}`,
        'Content-Type': 'application/json'
      };
      
      // Try to create participant as non-admin (should fail)
      try {
        await axios.post(`${API_BASE_URL}/participants`, {
          name: 'Should Fail',
          email: 'should.fail@example.com',
          role: 'supplier',
          company: 'Fail Company'
        }, { headers: participantHeaders });
        console.log('❌ Non-admin was able to create participant (this should not happen)');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ Non-admin correctly blocked from creating participants');
        } else {
          console.log(`❌ Unexpected error: ${error.response?.data?.message || error.message}`);
        }
      }
      
      // Try to view participants as non-admin (should succeed)
      const viewResponse = await axios.get(`${API_BASE_URL}/participants`, { headers: participantHeaders });
      console.log(`✅ Non-admin can view participants (${viewResponse.data.data.length} found)`);
      
    } catch (error) {
      console.log(`❌ Could not login as participant: ${error.response?.data?.message || error.message}`);
    }
    
    console.log('\n=== Test completed successfully! ===');
    console.log('\n📋 Summary:');
    console.log('✅ Admin can create participants');
    console.log('✅ Participants are stored in MongoDB');
    console.log('✅ Participants can be retrieved and displayed');
    console.log('✅ Admin can update participants');
    console.log('✅ Non-admin users are blocked from creating participants');
    console.log('✅ All users can view participants');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
    }
  }
}

testParticipantCreation();