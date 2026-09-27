const bcrypt = require("bcryptjs");
const pool = require("./src/config/db");
require("dotenv").config();

const seedUsers = async () => {
    try {
        const adminPassword = await bcrypt.hash("Admin@123", 10);
        const salesPassword = await bcrypt.hash("Sales@123", 10);

        await pool.query(
            `INSERT INTO users
            (full_name, email, password_hash, role)
            VALUES
            ($1, $2, $3, $4)
            ON CONFLICT (email) DO NOTHING`,
            [
                "ERP Administrator",
                "admin@erp.com",
                adminPassword,
                "ADMIN"
            ]
        );

        await pool.query(
            `INSERT INTO users
            (full_name, email, password_hash, role)
            VALUES
            ($1, $2, $3, $4)
            ON CONFLICT (email) DO NOTHING`,
            [
                "Sales User",
                "sales@erp.com",
                salesPassword,
                "SALES_USER"
            ]
        );

        console.log("Users seeded successfully");

        console.log("\nAdmin login:");
        console.log("Email: admin@erp.com");
        console.log("Password: Admin@123");

        console.log("\nSales login:");
        console.log("Email: sales@erp.com");
        console.log("Password: Sales@123");
    } catch (error) {
        console.error("User seeding failed:", error);
    } finally {
        await pool.end();
    }
};

seedUsers();