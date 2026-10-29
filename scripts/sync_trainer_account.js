const path = require('path');
const fs = require('fs');
const localDb = require('../backend/localDb');

const email = 'abdulkalamazad09092002@gmail.com';
const password = 'Zz8jcySmW';

const trainers = localDb.loadCollection('trainers');
const users = localDb.loadCollection('users');

const trainer = trainers.find(t => t.email?.toLowerCase() === email.toLowerCase());
if (trainer) {
  trainer.tempPassword = password;
  trainer.rawPassword = password;
  trainer.password = password;
  localDb.saveCollection('trainers');
  console.log('Updated trainers.json with temp password.');
}

const { salt, hash } = localDb.hashPassword(password);
let user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

if (!user) {
  user = {
    id: trainer ? trainer.id : `trainer_${Date.now()}`,
    uid: trainer ? trainer.id : `trainer_${Date.now()}`,
    email: email.toLowerCase(),
    name: trainer ? trainer.name : 'Abdul kalam Azad',
    role: 'trainer',
    phone: trainer ? trainer.phone : '9489607785',
    status: 'Active',
    salt,
    passwordHash: hash,
    tempPassword: password,
    rawPassword: password,
    customPasswordSet: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  users.push(user);
} else {
  user.salt = salt;
  user.passwordHash = hash;
  user.tempPassword = password;
  user.rawPassword = password;
  user.role = 'trainer';
  user.status = 'Active';
  user.updatedAt = new Date().toISOString();
}

localDb.saveCollection('users');
console.log('Successfully provisioned trainer user in users.json:', email);
