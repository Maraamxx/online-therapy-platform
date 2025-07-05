const mysql = require('mysql2/promise');

const { Pool } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const db_config = {
    connectionString: process.env.database_url,
    connectionTimeoutMillis: 5000, // 5 seconds to establish a connection
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    max: 20,
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync('./certificates/ca.pem').toString(), // Load the CA certificate
    },
};

const pool = new Pool(db_config);

pool.on('connect', () => {
    console.log("Database is connected");
});

pool.on('remove', () => {
    console.log("Database connection removed");
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client:', err.message, err.stack);
});

module.exports = pool;