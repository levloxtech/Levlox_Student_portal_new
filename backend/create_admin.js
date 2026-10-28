/**
 * Levlox Student Portal - Admin Account Creator & Password Manager
 *
 * Usage:
 *   node create_admin.js --email admin@levlox.com --password <password> --name "Super Admin"
 */

'use strict';

const localDb = require('./localDb');

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};

const email = get('--email') || localDb.DEFAULT_ADMIN_EMAIL;
const password = get('--password') || localDb.DEFAULT_ADMIN_PASSWORD;
const name = get('--name') || 'Super Admin';

console.log('\n========================================');
console.log(' Levlox - Local Admin Account Setup');
console.log('========================================');
console.log(' Email   : ' + email);
console.log(' Password: ' + password);
console.log(' Name    : ' + name);
console.log('========================================\n');

const users = localDb.loadCollection('users');
let user = users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase());

const { salt, hash } = localDb.hashPassword(password);

if (user) {
  user.name = name;
  user.role = 'admin';
  user.status = 'active';
  user.salt = salt;
  user.passwordHash = hash;
  user.updatedAt = new Date().toISOString();
  console.log('Existing account updated successfully!');
} else {
  const adminId = 'admin_' + Date.now();
  user = {
    id: adminId,
    uid: adminId,
    email,
    name,
    role: 'admin',
    status: 'active',
    salt,
    passwordHash: hash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  console.log('New Admin account created successfully!');
}

localDb.saveCollection('users');

localDb.setDocument('admins', user.id, {
  id: user.id,
  uid: user.id,
  name,
  email,
  role: 'admin',
  status: 'active',
}, true);

console.log('\n Admin Superuser is ready:');
console.log(' Login URL : http://localhost:5173/login');
console.log(' Email     : ' + email);
console.log(' Password  : ' + password);
console.log(' Role      : admin\n');
