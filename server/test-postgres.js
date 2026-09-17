const { pool, initializeDatabase } = require("./database-postgres");

(async () => {
    try {
        await initializeDatabase();

        const result = await pool.query(
            "SELECT NOW() AS current_time"
        );

        console.log("PostgreSQL connection successful:");
        console.log(result.rows[0]);

        await pool.end();
    } catch (error) {
        console.error("PostgreSQL test failed:");
        console.error(error.message);
        process.exit(1);
    }
})();