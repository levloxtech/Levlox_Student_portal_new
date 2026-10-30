const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log('1. Git commit and push...');
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "fix(trainer-onboarding): fix React hook order violation and email db reference error on onboarding completion"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });

  console.log('2. Git pull on remote server...');
  execSync('ssh -p 20027 -o StrictHostKeyChecking=no root@148.113.17.68 "cd /var/www/levlox-portal && git pull origin main"', { stdio: 'inherit' });

  console.log('3. Building frontend locally...');
  execSync('npm run build --prefix frontend', { stdio: 'inherit' });

  console.log('4. Uploading frontend/dist to remote server...');
  execSync('scp -P 20027 -r -o StrictHostKeyChecking=no frontend/dist/* root@148.113.17.68:/var/www/levlox-portal/frontend/dist/', { stdio: 'inherit' });

  console.log('5. Restarting backend PM2 on remote server...');
  execSync('ssh -p 20027 -o StrictHostKeyChecking=no root@148.113.17.68 "pm2 restart levlox-backend"', { stdio: 'inherit' });

  console.log('6. Verifying PM2 process...');
  execSync('ssh -p 20027 -o StrictHostKeyChecking=no root@148.113.17.68 "pm2 status"', { stdio: 'inherit' });

  console.log('=== DEPLOYMENT COMPLETED SUCCESSFULLY ===');
} catch (e) {
  console.error('Deployment error:', e.message);
  process.exit(1);
}
