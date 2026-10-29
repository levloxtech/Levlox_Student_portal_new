# Levlox Portal — Data Protection & Zero-Data-Loss Safety Policy

> **CRITICAL DIRECTIVE FOR ALL DEVELOPERS & AI ASSISTANTS**
>
> Live real users, students, trainers, and administrators are actively using this system.
> The data stored in `/var/www/levlox-portal/storage/data/` (and local `storage/data/`) is **PRODUCTION MISSION-CRITICAL**.

---

### 1. Mandatory Data Preservation Rules
1. **NEVER Wipe, Flush, or Truncate Database Files**:
   - Never run scripts that overwrite `users.json`, `students.json`, `trainers.json`, `batches.json`, `courses.json`, `attendance.json`, `fees`, or `submissions.json` with empty arrays `[]` or dummy seed data without **explicit, unambiguous, written authorization** from the project owner.
2. **NEVER Overwrite Real Accounts**:
   - Existing student accounts, trainer credentials, fee transactions, and study submissions must NEVER be reset, overwritten, or deleted during bug fixes or feature additions.
3. **Mandatory Automated Backups**:
   - Before executing ANY data modification, migration, or cleanup script, a full timestamped backup MUST be created in `/var/www/levlox-portal/storage/backups/backup_YYYY_MM_DD_HH_mm_ss/`.
4. **Preserve User Passwords & Hashes**:
   - User salt and PBKDF2 password hashes must NEVER be altered during routine updates.
5. **Session Safety**:
   - Always verify that active admin and student login sessions remain intact after server or package restarts.

---

### 2. Backup & Restore Procedures
* **Automated Daily/Pre-deployment Backup Command**:
  ```bash
  mkdir -p /var/www/levlox-portal/storage/backups/$(date +%Y%m%d_%H%M%S)
  cp -r /var/www/levlox-portal/storage/data/* /var/www/levlox-portal/storage/backups/$(date +%Y%m%d_%H%M%S)/
  ```
* **Restore Location**:
  All historical snapshots are preserved in `/var/www/levlox-portal/storage/backups/`.

---

**This policy must be checked and adhered to during every development turn.**

