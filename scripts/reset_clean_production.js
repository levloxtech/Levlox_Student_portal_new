const fs = require('fs');
const path = require('path');

function runCleanReset() {
  const dataDir = process.env.DATA_DIR || path.resolve(__dirname, '../storage/data');
  const backupsDir = path.resolve(dataDir, '../backups');

  if (!fs.existsSync(dataDir)) {
    console.error(`Data directory not found at: ${dataDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // 1. Mandatory Pre-Reset Backup
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const backupTarget = path.join(backupsDir, `backup_before_production_reset_${timestamp}`);
  fs.mkdirSync(backupTarget, { recursive: true });

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    fs.copyFileSync(path.join(dataDir, file), path.join(backupTarget, file));
  }
  console.log(`[SAFETY BACKUP] Successfully created safety backup in:\n  ${backupTarget}`);

  // 2. Filter users.json (Retain ONLY admin: levloxtech@gmail.com)
  const usersPath = path.join(dataDir, 'users.json');
  let admins = [];
  if (fs.existsSync(usersPath)) {
    try {
      const allUsers = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      const adminUsers = allUsers.filter(u => u.role === 'admin' || u.email === 'levloxtech@gmail.com');
      fs.writeFileSync(usersPath, JSON.stringify(adminUsers, null, 2), 'utf8');
      console.log(`[USERS] Retained ${adminUsers.length} admin user(s) in users.json: ${adminUsers.map(a => a.email).join(', ')}`);
    } catch (e) {
      console.error('Error updating users.json:', e);
    }
  }

  // 3. Filter admins.json
  const adminsPath = path.join(dataDir, 'admins.json');
  if (fs.existsSync(adminsPath)) {
    try {
      const allAdmins = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
      const keptAdmins = allAdmins.filter(a => a.email === 'levloxtech@gmail.com' || a.id === 'super_admin_001');
      fs.writeFileSync(adminsPath, JSON.stringify(keptAdmins, null, 2), 'utf8');
      console.log(`[ADMINS] Retained ${keptAdmins.length} admin(s) in admins.json: ${keptAdmins.map(a => a.email).join(', ')}`);
    } catch (e) {
      console.error('Error updating admins.json:', e);
    }
  }

  // 4. Empty all demo collections
  const collectionsToClear = [
    'students.json',
    'trainers.json',
    'courses.json',
    'batches.json',
    'liveClasses.json',
    'recordedClasses.json',
    'playlists.json',
    'announcements.json',
    'assignments.json',
    'submissions.json',
    'attendance.json',
    'attendanceSheets.json',
    'messages.json',
    'notifications.json',
    'deletedUsers.json',
    'emailLogs.json',
    'sessions.json'
  ];

  for (const coll of collectionsToClear) {
    const collPath = path.join(dataDir, coll);
    fs.writeFileSync(collPath, JSON.stringify([], null, 2), 'utf8');
    console.log(`[CLEARED] ${coll} reset to empty array []`);
  }

  console.log('\n--- PRODUCTION RESET COMPLETE ---');
  console.log('Only Super Admin (levloxtech@gmail.com) is retained.');
  console.log('All other entities wiped clean ready for live production users.');
}

runCleanReset();
