const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log('Starting password hashing migration...');

    // Students
    const [students] = await pool.execute(
      'SELECT user_id, password FROM students WHERE password IS NOT NULL'
    );
    for (const s of students) {
      const pwd = String(s.password || '');
      if (!pwd.startsWith('$2a$') && !pwd.startsWith('$2b$') && !pwd.startsWith('$2y$')) {
        const hash = await bcrypt.hash(pwd, 10);
        await pool.execute('UPDATE students SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', [hash, s.user_id]);
        console.log(`Students: hashed user_id=${s.user_id}`);
      }
    }

    // Personnel
    const [personnel] = await pool.execute(
      'SELECT personnel_id, password FROM personnel WHERE password IS NOT NULL'
    );
    for (const p of personnel) {
      const pwd = String(p.password || '');
      if (!pwd.startsWith('$2a$') && !pwd.startsWith('$2b$') && !pwd.startsWith('$2y$')) {
        const hash = await bcrypt.hash(pwd, 10);
        await pool.execute('UPDATE personnel SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE personnel_id = ?', [hash, p.personnel_id]);
        console.log(`Personnel: hashed personnel_id=${p.personnel_id}`);
      }
    }

    console.log('Password hashing migration completed.');
    process.exit(0);
  } catch (e) {
    console.error('Hashing migration failed:', e);
    process.exit(1);
  }
})();


