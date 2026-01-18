const { pool } = require('../config/database');

async function checkTable() {
  try {
    // Check if table exists
    const [tables] = await pool.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_records'"
    );
    
    if (tables.length === 0) {
      console.log('❌ Table "inventory_records" does NOT exist');
      console.log('\nRun the migration to create it:');
      console.log('mysql -u root -p cashless_canteen < backend/migrations/add_inventory_records_table.sql');
      process.exit(1);
    } else {
      console.log('✅ Table "inventory_records" exists');
      
      // Check table structure
      const [columns] = await pool.execute(
        "SHOW COLUMNS FROM inventory_records"
      );
      console.log('\nTable columns:');
      columns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type})`);
      });
      
      process.exit(0);
    }
  } catch (error) {
    console.error('Error checking table:', error.message);
    process.exit(1);
  }
}

checkTable();

