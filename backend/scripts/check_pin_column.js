const { pool } = require('../config/database');

async function checkPinColumn() {
  try {
    console.log('Checking for PIN column in students and personnel tables...\n');

    // Check students table
    const [studentColumns] = await pool.execute(
      "SHOW COLUMNS FROM students LIKE 'pin'"
    );
    
    if (studentColumns.length === 0) {
      console.log('❌ PIN column does NOT exist in "students" table');
    } else {
      console.log('✅ PIN column exists in "students" table');
      console.log(`   Type: ${studentColumns[0].Type}, Null: ${studentColumns[0].Null}`);
    }

    // Check personnel table
    const [personnelColumns] = await pool.execute(
      "SHOW COLUMNS FROM personnel LIKE 'pin'"
    );
    
    if (personnelColumns.length === 0) {
      console.log('❌ PIN column does NOT exist in "personnel" table');
    } else {
      console.log('✅ PIN column exists in "personnel" table');
      console.log(`   Type: ${personnelColumns[0].Type}, Null: ${personnelColumns[0].Null}`);
    }

    // Summary
    if (studentColumns.length === 0 || personnelColumns.length === 0) {
      console.log('\n⚠️  PIN columns are missing. Run the migration:');
      console.log('   mysql -u root -p cashless_canteen < backend/migrations/add_pin_to_students_personnel.sql');
      console.log('\n   Or using MySQL Workbench/phpMyAdmin, execute the SQL from:');
      console.log('   backend/migrations/add_pin_to_students_personnel.sql');
      process.exit(1);
    } else {
      console.log('\n✅ All PIN columns are present in the database!');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error checking PIN columns:', error.message);
    process.exit(1);
  }
}

checkPinColumn();
