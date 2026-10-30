const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log('1. Git commit and push...');
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat: complete study materials manager, player UI overhaul, and blue tick read receipts"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });

  console.log('2. Git pull on remote server...');
  execSync('ssh -p 20027 -o StrictHostKeyChecking=no root@148.113.17.68 "cd /var/www/levlox-portal && git pull origin main"', { stdio: 'inherit' });

  console.log('3. Building frontend locally...');
  execSync('npm run build --prefix frontend', { stdio: 'inherit' });

  console.log('4. Uploading frontend/dist to remote server...');
  execSync('scp -P 20027 -r -o StrictHostKeyChecking=no frontend/dist/* root@148.113.17.68:/var/www/levlox-portal/frontend/dist/', { stdio: 'inherit' });

  console.log('5. Updating existing recorded class with notes & materials on server...');
  const patchScript = `
const fs = require('fs');
const p = '/var/www/levlox-portal/storage/data/recordedClasses.json';
try {
  const list = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (list.length > 0) {
    list[0].notes_url = 'https://docs.python.org/3/tutorial/';
    list[0].description = 'Comprehensive hands-on breakdown of Python programming, basic syntax, data types, and setting up the local environment.';
    list[0].study_materials = [
      { name: 'Python Basics Reference Guide.pdf', url: 'https://docs.python.org/3/tutorial/', type: 'pdf' },
      { name: 'Lecture 1 Sample Source Code.zip', url: 'https://github.com/python/cpython', type: 'zip' }
    ];
    fs.writeFileSync(p, JSON.stringify(list, null, 2));
    console.log('Patched recorded class successfully!');
  }
} catch (e) {
  console.error('Patch error:', e.message);
}
`;
  fs.writeFileSync('server_patch.cjs', patchScript);
  execSync('scp -P 20027 -o StrictHostKeyChecking=no server_patch.cjs root@148.113.17.68:/tmp/server_patch.cjs', { stdio: 'inherit' });
  execSync('ssh -p 20027 -o StrictHostKeyChecking=no root@148.113.17.68 "node /tmp/server_patch.cjs && rm /tmp/server_patch.cjs"', { stdio: 'inherit' });
  fs.unlinkSync('server_patch.cjs');

  console.log('6. Restarting backend PM2 on remote server...');
  execSync('ssh -p 20027 -o StrictHostKeyChecking=no root@148.113.17.68 "pm2 restart levlox-backend"', { stdio: 'inherit' });

  console.log('7. Verifying PM2 process...');
  execSync('ssh -p 20027 -o StrictHostKeyChecking=no root@148.113.17.68 "pm2 status"', { stdio: 'inherit' });

  console.log('=== DEPLOYMENT COMPLETED SUCCESSFULLY ===');
} catch (e) {
  console.error('Deployment error:', e.message);
  process.exit(1);
}
