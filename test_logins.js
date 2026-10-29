const http = require('http');

async function testLogin(emailOrId, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ identifier: emailOrId, password: password });
    const req = http.request({
      hostname: '127.0.0.1',
      port: 20020,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch(e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('Testing Admin login...');
  const adminRes = await testLogin('levloxtech@gmail.com', 'Root@123');
  console.log('Admin:', adminRes.status, adminRes.data?.user?.email, adminRes.data?.user?.role, adminRes.data?.token ? 'TOKEN_OK' : adminRes.data);

  console.log('\nTesting Trainer login...');
  const trainerRes = await testLogin('rhariharasudhan0@gmail.com', 'Trainer@123');
  console.log('Trainer (sudhan):', trainerRes.status, trainerRes.data?.user?.name, trainerRes.data?.user?.role, trainerRes.data?.token ? 'TOKEN_OK' : trainerRes.data);

  const trainer2Res = await testLogin('aakash.trainer@levlox.com', 'Trainer@123');
  console.log('Trainer (Aakash):', trainer2Res.status, trainer2Res.data?.user?.name, trainer2Res.data?.user?.role, trainer2Res.data?.token ? 'TOKEN_OK' : trainer2Res.data);

  console.log('\nTesting Student login by Email...');
  const studentRes = await testLogin('aditya.verma@levlox.student', 'Student@123');
  console.log('Student (email):', studentRes.status, studentRes.data?.user?.name, studentRes.data?.user?.role, studentRes.data?.token ? 'TOKEN_OK' : studentRes.data);

  console.log('\nTesting Student login by Roll Number (LVX070139)...');
  const studentRollRes = await testLogin('LVX070139', 'Student@123');
  console.log('Student (roll):', studentRollRes.status, studentRollRes.data?.user?.name, studentRollRes.data?.user?.role, studentRollRes.data?.token ? 'TOKEN_OK' : studentRollRes.data);

  console.log('\nTesting Student login by Phone (9820101001)...');
  const studentPhoneRes = await testLogin('9820101001', 'Student@123');
  console.log('Student (phone):', studentPhoneRes.status, studentPhoneRes.data?.user?.name, studentPhoneRes.data?.user?.role, studentPhoneRes.data?.token ? 'TOKEN_OK' : studentPhoneRes.data);
}

run();

