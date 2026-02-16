const mysql = require('mysql2/promise');
const path = require('path');
// Try to load .env from standard locations
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cashless_canteen'
};

async function debugInventory() {
    console.log('--- Debugging Inventory Records (Robust) ---');
    console.log('DB Config:', { ...config, password: config.password ? '******' : '(empty)' });

    let conn;
    try {
        conn = await mysql.createConnection(config);
        console.log('✅ Connection successful');

        // 1. List tables
        console.log('\n--- Tables ---');
        const [tables] = await conn.execute('SHOW TABLES');
        console.log(tables.map(t => Object.values(t)[0]));

        // 2. Describe inventory_records
        console.log('\n--- Describe inventory_records ---');
        try {
            const [desc] = await conn.execute('DESCRIBE inventory_records');
            console.log(desc.map(c => c.Field).join(', '));
        } catch (e) {
            console.error('Failed to describe inventory_records:', e.message);
        }

        // 3. Simple Select
        console.log('\n--- Simple Select ---');
        try {
            const [rows] = await conn.execute('SELECT * FROM inventory_records LIMIT 1');
            console.log('Rows found:', rows.length);
        } catch (e) {
            console.error('Simple select failed:', e.message);
        }

        // 4. Test the complex query
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

        console.log('\n--- Complex Query ---');
        const [rows] = await conn.execute(query);
        console.log(`Query returned ${rows.length} rows`);
        if (rows.length > 0) {
            console.log('First row sample:', rows[0]);
        }

    } catch (error) {
        console.error('\n❌ ERROR OCCURRED:');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        if (error.sqlMessage) console.error('SQL Message:', error.sqlMessage);
    } finally {
        if (conn) await conn.end();
    }
}

debugInventory();
