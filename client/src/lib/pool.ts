
import { Pool } from "pg";
//Create a new pool instance with your database configuration


const pool = new Pool({
	user: process.env.DB_USER, // Your PostgreSQL username
	host: process.env.DB_HOST, // Your PostgreSQL host (e.g., localhost)
	database: process.env.DB_NAME, // Your database name
	password: process.env.DB_PASSWORD, // Your PostgreSQL password
	port: parseInt(process.env.DB_PORT || "5432", 10), // PostgreSQL port (default is 5432)
	ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false, // Enable SSL in production
});

export { pool };

