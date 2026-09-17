require("dotenv").config();

const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing from .env");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initializeDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS admins (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            recovery_email TEXT,
            reset_token_hash TEXT,
            reset_token_expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            category_type TEXT NOT NULL DEFAULT 'restaurant'
                CHECK (category_type IN ('restaurant', 'cafe')),
            display_order INTEGER DEFAULT 0,
            active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS menu_items (
            id SERIAL PRIMARY KEY,
            category_id INTEGER NOT NULL
                REFERENCES categories(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            price NUMERIC(10,2) NOT NULL DEFAULT 0,
            image TEXT,
            veg INTEGER DEFAULT 1,
            available INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS restaurant_tables (
            id SERIAL PRIMARY KEY,
            table_number TEXT NOT NULL UNIQUE,
            active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            order_number TEXT NOT NULL UNIQUE,
            order_type TEXT NOT NULL
                CHECK (order_type IN ('dine_in', 'takeaway')),
            table_number TEXT,
            customer_name TEXT,
            customer_phone TEXT,
            pickup_time TEXT,
            subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
            tax NUMERIC(10,2) NOT NULL DEFAULT 0,
            total NUMERIC(10,2) NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN (
                    'new',
                    'accepted',
                    'preparing',
                    'ready',
                    'completed',
                    'cancelled'
                )),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            order_id INTEGER NOT NULL
                REFERENCES orders(id) ON DELETE CASCADE,
            menu_item_id INTEGER NOT NULL
                REFERENCES menu_items(id),
            item_name TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            price NUMERIC(10,2) NOT NULL DEFAULT 0,
            total NUMERIC(10,2) NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS business_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            restaurant_name TEXT NOT NULL DEFAULT 'My Restaurant',
            description TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            opening_hours TEXT,
            logo TEXT,
            tax_rate NUMERIC(5,2) NOT NULL DEFAULT 5,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await seedCategories();
    await seedTables();
    await seedSettings();
    await seedDemoMenu();

    console.log("PostgreSQL database initialized successfully.");
}

async function seedCategories() {
    const result = await pool.query(
        "SELECT COUNT(*)::int AS count FROM categories"
    );

    if (result.rows[0].count > 0) return;

    const categories = [
        ["Starters", "restaurant", 1],
        ["Main Course", "restaurant", 2],
        ["Biryani", "restaurant", 3],
        ["Desserts", "restaurant", 4],
        ["Beverages", "restaurant", 5],
        ["Coffee", "cafe", 6],
        ["Tea", "cafe", 7],
        ["Milkshakes", "cafe", 8],
        ["Fresh Juices", "cafe", 9],
        ["Cakes", "cafe", 10],
        ["Pastries", "cafe", 11],
        ["Sandwiches", "cafe", 12],
        ["Burgers", "cafe", 13],
        ["Pizza", "cafe", 14],
        ["Snacks", "cafe", 15]
    ];

    for (const category of categories) {
        await pool.query(
            `INSERT INTO categories
             (name, category_type, display_order)
             VALUES ($1, $2, $3)
             ON CONFLICT (name) DO NOTHING`,
            category
        );
    }
}

async function seedTables() {
    const result = await pool.query(
        "SELECT COUNT(*)::int AS count FROM restaurant_tables"
    );

    if (result.rows[0].count > 0) return;

    for (let i = 1; i <= 20; i++) {
        await pool.query(
            `INSERT INTO restaurant_tables (table_number)
             VALUES ($1)
             ON CONFLICT (table_number) DO NOTHING`,
            [String(i)]
        );
    }
}

async function seedSettings() {
    await pool.query(`
        INSERT INTO business_settings
            (id, restaurant_name, tax_rate)
        VALUES
            (1, 'My Restaurant', 5)
        ON CONFLICT (id) DO NOTHING
    `);
}

async function seedDemoMenu() {
    const result = await pool.query(
        "SELECT COUNT(*)::int AS count FROM menu_items"
    );

    if (result.rows[0].count > 0) return;

    const demoMenu = [
        ["Starters", "Paneer Tikka", "Grilled cottage cheese with aromatic spices.", 220, 1],
        ["Starters", "Chicken 65", "Crispy spicy fried chicken with South Indian flavours.", 260, 0],
        ["Main Course", "Butter Chicken", "Tender chicken cooked in a rich creamy tomato gravy.", 320, 0],
        ["Main Course", "Paneer Butter Masala", "Soft paneer cooked in a creamy tomato-based gravy.", 280, 1],
        ["Biryani", "Chicken Biryani", "Fragrant basmati rice layered with flavorful chicken and spices.", 290, 0],
        ["Biryani", "Veg Biryani", "Aromatic basmati rice cooked with fresh vegetables and spices.", 240, 1],
        ["Desserts", "Gulab Jamun", "Soft milk dumplings served in sweet sugar syrup.", 120, 1],
        ["Beverages", "Fresh Lime Soda", "Refreshing lime soda served chilled.", 90, 1],
        ["Coffee", "Cappuccino", "Smooth espresso with steamed milk and creamy foam.", 150, 1],
        ["Coffee", "Cold Coffee", "Chilled creamy coffee served with a refreshing finish.", 180, 1],
        ["Tea", "Masala Tea", "Classic Indian tea infused with aromatic spices.", 80, 1],
        ["Milkshakes", "Chocolate Milkshake", "Rich and creamy chocolate milkshake.", 200, 1],
        ["Fresh Juices", "Fresh Orange Juice", "Freshly prepared chilled orange juice.", 140, 1],
        ["Cakes", "Chocolate Cake", "Moist chocolate cake with a rich chocolate topping.", 180, 1],
        ["Sandwiches", "Grilled Veg Sandwich", "Grilled sandwich filled with fresh vegetables and cheese.", 170, 1],
        ["Burgers", "Classic Chicken Burger", "Juicy chicken patty with fresh vegetables and sauce.", 240, 0],
        ["Pizza", "Margherita Pizza", "Classic pizza with tomato sauce, mozzarella and herbs.", 280, 1],
        ["Snacks", "French Fries", "Crispy golden fries served hot.", 130, 1]
    ];

    for (const item of demoMenu) {
        const categoryResult = await pool.query(
            "SELECT id FROM categories WHERE name = $1 LIMIT 1",
            [item[0]]
        );

        if (categoryResult.rows.length === 0) continue;

        await pool.query(
            `INSERT INTO menu_items
                (category_id, name, description, price, image, veg, available)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                categoryResult.rows[0].id,
                item[1],
                item[2],
                item[3],
                "",
                item[4],
                1
            ]
        );
    }
}

module.exports = {
    pool,
    initializeDatabase
};