require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error("❌ Database connection error:", err));

app.use(cors());
app.use(express.json());

// ✅ Improved Sign-In (Avoids Duplicate Entries)
app.post('/sign-in', async (req, res) => {
    let { employee_id, employee_name, latitude, longitude, address } = req.body;

    if (!employee_id) employee_id = null;

    try {
        // 🔥 Check if an open session exists
        const existingSession = await pool.query(
            `SELECT * FROM attendance 
             WHERE (employee_id = $1 OR employee_name = $2) AND sign_out_time IS NULL 
             ORDER BY sign_in_time DESC LIMIT 1`,
            [employee_id, employee_name]
        );

        if (existingSession.rows.length > 0) {
            return res.status(400).json({ error: "You must sign out before signing in again." });
        }

        // ✅ Insert a new attendance record
        const result = await pool.query(
            `INSERT INTO attendance (employee_id, employee_name, latitude, longitude, address, sign_in_time) 
             VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
            [employee_id, employee_name, latitude, longitude, address]
        );

        res.status(201).json({ message: "Sign-in recorded", data: result.rows[0] });
    } catch (error) {
        console.error("❌ Error during sign-in:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Improved Sign-Out (Updates the Latest Entry Only)
app.post('/sign-out', async (req, res) => {
    let { employee_id, employee_name, latitude, longitude, address } = req.body;

    try {
        let result;
        if (employee_id) {
            // 🔥 Sign out the most recent sign-in for this employee_id
            result = await pool.query(
                `UPDATE attendance 
                 SET sign_out_time = NOW(), latitude = $2, longitude = $3, address = $4 
                 WHERE employee_id = $1 AND sign_out_time IS NULL 
                 ORDER BY sign_in_time DESC LIMIT 1 
                 RETURNING *`,
                [employee_id, latitude, longitude, address]
            );
        } else {
            // 🔥 Sign out by employee_name (less reliable but works)
            result = await pool.query(
                `UPDATE attendance 
                 SET sign_out_time = NOW(), latitude = $2, longitude = $3, address = $4 
                 WHERE employee_name = $1 AND sign_out_time IS NULL 
                 ORDER BY sign_in_time DESC LIMIT 1 
                 RETURNING *`,
                [employee_name, latitude, longitude, address]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No active sign-in found for this employee" });
        }

        res.status(200).json({ message: "Sign-out recorded", data: result.rows[0] });
    } catch (error) {
        console.error("❌ Error during sign-out:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
