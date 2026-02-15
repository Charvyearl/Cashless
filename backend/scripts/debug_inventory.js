const mysql = require('mysql2/promise');
const path = require('path');
// Try to load .env from standard locations
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = require('../config/config');

async function debugInventory() {
    console.log('--- Debugging Inventory Records (Robust) ---');

    // Print config (redacted)
    console.log('DB Config:', {
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        database: config.database.name,
        password: config.database.password ? '******' : '(empty)'
    });

    try {
        // 1. Create a direct connection to test
        const conn = await mysql.createConnection({
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.name
        });
        console.log('✅ Connection successful');

        // 2. Test the query logic from InventoryRecord.findAll
        // We replicate the exact query structure to see if SQL fails
        const query = `
      SELECT ir.*, p.product_name,
      COALESCE(CONCAT(s.first_name, ' ', s.last_name), CONCAT(per.first_name, ' ', per.last_name)) as user_name
      FROM inventory_records ir
      LEFT JOIN PRODUCT p ON ir.product_id = p.product_id
      LEFT JOIN students s ON ir.user_id = s.user_id
      LEFT JOIN personnel per ON ir.personnel_id = per.personnel_id
      ORDER BY ir.created_at DESC
      LIMIT 5
    `;

        console.log('\nExecuting query directly...');
        const [rows] = await conn.execute(query);
        console.log(`Query returned ${rows.length} rows`);
        if (rows.length > 0) {
            console.log('First row sample:', rows[0]);
        }

        await conn.end();
    } catch (error) {
        console.error('\n❌ ERROR OCCURRED:');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        console.error('SQL State:', error.sqlState);
        if (error.sql) console.error('SQL:', error.sql);
    }
}

debugInventory();
