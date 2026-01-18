const { pool } = require('../config/database');

async function createTable() {
  try {
    console.log('Checking if inventory_records table exists...');
    
    // Check if table exists
    const [tables] = await pool.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_records'"
    );
    
    if (tables.length > 0) {
      console.log('✅ Table "inventory_records" already exists');
      process.exit(0);
    }
    
    console.log('❌ Table does not exist. Creating it now...');
    
    // Create the table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS inventory_records (
        record_id INT PRIMARY KEY AUTO_INCREMENT,
        product_id INT NOT NULL,
        change_type ENUM('add', 'adjust', 'deduct') NOT NULL,
        quantity_change INT NOT NULL,
        previous_stock INT NOT NULL,
        new_stock INT NOT NULL,
        notes TEXT,
        user_id INT NULL,
        personnel_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_product_id (product_id),
        INDEX idx_created_at (created_at),
        INDEX idx_user_id (user_id),
        INDEX idx_personnel_id (personnel_id)
      )
    `);
    
    console.log('✅ Table structure created successfully');
    
    // Add foreign key constraints
    console.log('Adding foreign key constraints...');
    
    try {
      await pool.execute(`
        ALTER TABLE inventory_records 
        ADD CONSTRAINT fk_inventory_records_product_id 
        FOREIGN KEY (product_id) REFERENCES PRODUCT(product_id) ON DELETE CASCADE
      `);
      console.log('✅ Foreign key to PRODUCT added');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('Duplicate key name')) {
        console.log('⚠️  Foreign key to PRODUCT already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await pool.execute(`
        ALTER TABLE inventory_records 
        ADD CONSTRAINT fk_inventory_records_user_id 
        FOREIGN KEY (user_id) REFERENCES students(user_id) ON DELETE SET NULL
      `);
      console.log('✅ Foreign key to students added');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('Duplicate key name')) {
        console.log('⚠️  Foreign key to students already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await pool.execute(`
        ALTER TABLE inventory_records 
        ADD CONSTRAINT fk_inventory_records_personnel_id 
        FOREIGN KEY (personnel_id) REFERENCES personnel(personnel_id) ON DELETE SET NULL
      `);
      console.log('✅ Foreign key to personnel added');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('Duplicate key name')) {
        console.log('⚠️  Foreign key to personnel already exists');
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('The inventory_records table is now ready to use.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

createTable();

