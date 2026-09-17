const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dataDirectory = path.join(__dirname, "..", "data");

if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
}

const dbPath = path.join(dataDirectory, "restaurant.db");

const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        recovery_email TEXT,
        reset_token_hash TEXT,
        reset_token_expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,

        category_type TEXT NOT NULL DEFAULT 'restaurant'
            CHECK(category_type IN ('restaurant', 'cafe')),

        display_order INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL DEFAULT 0,
        image TEXT,
        veg INTEGER DEFAULT 1,
        available INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (category_id)
            REFERENCES categories(id)
            ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS restaurant_tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_number TEXT NOT NULL UNIQUE,
        active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT NOT NULL UNIQUE,

        order_type TEXT NOT NULL
            CHECK(order_type IN ('dine_in', 'takeaway')),

        table_number TEXT,

        customer_name TEXT,
        customer_phone TEXT,
        pickup_time TEXT,

        subtotal REAL NOT NULL DEFAULT 0,
        tax REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,

        status TEXT NOT NULL DEFAULT 'new'
            CHECK(status IN (
                'new',
                'accepted',
                'preparing',
                'ready',
                'completed',
                'cancelled'
            )),

        notes TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        order_id INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,

        item_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,

        FOREIGN KEY (order_id)
            REFERENCES orders(id)
            ON DELETE CASCADE,

        FOREIGN KEY (menu_item_id)
            REFERENCES menu_items(id)
    );

    CREATE TABLE IF NOT EXISTS business_settings (
        id INTEGER PRIMARY KEY CHECK(id = 1),

        restaurant_name TEXT NOT NULL DEFAULT 'My Restaurant',

        description TEXT,

        phone TEXT,

        email TEXT,

        address TEXT,

        opening_hours TEXT,

        logo TEXT,

        tax_rate REAL NOT NULL DEFAULT 5,

        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);


/* =====================================================
   CATEGORY TYPE MIGRATION
===================================================== */

function addCategoryTypeColumn() {

    const columns =
        db.prepare(
            "PRAGMA table_info(categories)"
        ).all();

    const exists =
        columns.some(
            column =>
                column.name === "category_type"
        );

    if (!exists) {

        db.exec(`
            ALTER TABLE categories
            ADD COLUMN category_type
            TEXT NOT NULL
            DEFAULT 'restaurant'
        `);

    }
}

addCategoryTypeColumn();


/* =====================================================
   BUSINESS SETTINGS MIGRATION
===================================================== */

function addColumnIfMissing(
    table,
    column,
    definition
) {

    const columns =
        db.prepare(
            `PRAGMA table_info(${table})`
        ).all();

    const exists =
        columns.some(
            item =>
                item.name === column
        );

    if (!exists) {

        db.exec(
            `ALTER TABLE ${table}
             ADD COLUMN ${column}
             ${definition}`
        );

    }
}


addColumnIfMissing(
    "business_settings",
    "description",
    "TEXT"
);


addColumnIfMissing(
    "business_settings",
    "email",
    "TEXT"
);


addColumnIfMissing(
    "business_settings",
    "opening_hours",
    "TEXT"
);


/* =====================================================
   ADMIN ACCOUNT / PASSWORD RECOVERY MIGRATION
===================================================== */

addColumnIfMissing(
    "admins",
    "recovery_email",
    "TEXT"
);


addColumnIfMissing(
    "admins",
    "reset_token_hash",
    "TEXT"
);


addColumnIfMissing(
    "admins",
    "reset_token_expires_at",
    "DATETIME"
);


/* =====================================================
   DEFAULT CATEGORIES
===================================================== */

const categoryCount = db
    .prepare(
        "SELECT COUNT(*) AS count FROM categories"
    )
    .get();


if (categoryCount.count === 0) {

    const insertCategory = db.prepare(`
        INSERT INTO categories
        (name, category_type, display_order)
        VALUES (?, ?, ?)
    `);

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

    const transaction = db.transaction(() => {

        for (const category of categories) {

            insertCategory.run(
                category[0],
                category[1],
                category[2]
            );

        }

    });

    transaction();
}


/* =====================================================
   DEFAULT RESTAURANT TABLES
===================================================== */

const tableCount = db
    .prepare(
        "SELECT COUNT(*) AS count FROM restaurant_tables"
    )
    .get();


if (tableCount.count === 0) {

    const insertTable = db.prepare(`
        INSERT INTO restaurant_tables (table_number)
        VALUES (?)
    `);

    const transaction = db.transaction(() => {

        for (let i = 1; i <= 20; i++) {

            insertTable.run(
                String(i)
            );

        }

    });

    transaction();
}


/* =====================================================
   DEFAULT BUSINESS SETTINGS
===================================================== */

const settingsCount = db
    .prepare(
        "SELECT COUNT(*) AS count FROM business_settings"
    )
    .get();


if (settingsCount.count === 0) {

    db.prepare(`
        INSERT INTO business_settings
        (id, restaurant_name, tax_rate)
        VALUES (1, 'My Restaurant', 5)
    `).run();

}


/* =====================================================
   DEMO MENU ITEMS
===================================================== */

/*
   IMPORTANT:

   Demo menu items are inserted ONLY when
   the database currently has no menu items.

   This means:

   - Fresh Render database
       -> Demo menu is created.

   - Existing restaurant database
       -> Existing menu is NOT modified.

   - Admin deletes demo items
       -> They stay deleted until the database
          itself is recreated.

   - Admin adds real menu items
       -> They are not overwritten.
*/

const menuItemCount = db
    .prepare(
        "SELECT COUNT(*) AS count FROM menu_items"
    )
    .get();


if (menuItemCount.count === 0) {

    const getCategoryId = db.prepare(`
        SELECT id
        FROM categories
        WHERE name = ?
        LIMIT 1
    `);

    const insertMenuItem = db.prepare(`
        INSERT INTO menu_items
        (
            category_id,
            name,
            description,
            price,
            image,
            veg,
            available
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);


    const demoMenu = [

        /* =========================
           RESTAURANT
        ========================= */

        {
            category: "Starters",
            name: "Paneer Tikka",
            description: "Grilled cottage cheese with aromatic spices.",
            price: 220,
            image: "",
            veg: 1
        },

        {
            category: "Starters",
            name: "Chicken 65",
            description: "Crispy spicy fried chicken with South Indian flavours.",
            price: 260,
            image: "",
            veg: 0
        },

        {
            category: "Main Course",
            name: "Butter Chicken",
            description: "Tender chicken cooked in a rich creamy tomato gravy.",
            price: 320,
            image: "",
            veg: 0
        },

        {
            category: "Main Course",
            name: "Paneer Butter Masala",
            description: "Soft paneer cooked in a creamy tomato-based gravy.",
            price: 280,
            image: "",
            veg: 1
        },

        {
            category: "Biryani",
            name: "Chicken Biryani",
            description: "Fragrant basmati rice layered with flavorful chicken and spices.",
            price: 290,
            image: "",
            veg: 0
        },

        {
            category: "Biryani",
            name: "Veg Biryani",
            description: "Aromatic basmati rice cooked with fresh vegetables and spices.",
            price: 240,
            image: "",
            veg: 1
        },

        {
            category: "Desserts",
            name: "Gulab Jamun",
            description: "Soft milk dumplings served in sweet sugar syrup.",
            price: 120,
            image: "",
            veg: 1
        },

        {
            category: "Beverages",
            name: "Fresh Lime Soda",
            description: "Refreshing lime soda served chilled.",
            price: 90,
            image: "",
            veg: 1
        },


        /* =========================
           CAFE
        ========================= */

        {
            category: "Coffee",
            name: "Cappuccino",
            description: "Smooth espresso with steamed milk and creamy foam.",
            price: 150,
            image: "",
            veg: 1
        },

        {
            category: "Coffee",
            name: "Cold Coffee",
            description: "Chilled creamy coffee served with a refreshing finish.",
            price: 180,
            image: "",
            veg: 1
        },

        {
            category: "Tea",
            name: "Masala Tea",
            description: "Classic Indian tea infused with aromatic spices.",
            price: 80,
            image: "",
            veg: 1
        },

        {
            category: "Milkshakes",
            name: "Chocolate Milkshake",
            description: "Rich and creamy chocolate milkshake.",
            price: 200,
            image: "",
            veg: 1
        },

        {
            category: "Fresh Juices",
            name: "Fresh Orange Juice",
            description: "Freshly prepared chilled orange juice.",
            price: 140,
            image: "",
            veg: 1
        },

        {
            category: "Cakes",
            name: "Chocolate Cake",
            description: "Moist chocolate cake with a rich chocolate topping.",
            price: 180,
            image: "",
            veg: 1
        },

        {
            category: "Sandwiches",
            name: "Grilled Veg Sandwich",
            description: "Grilled sandwich filled with fresh vegetables and cheese.",
            price: 170,
            image: "",
            veg: 1
        },

        {
            category: "Burgers",
            name: "Classic Chicken Burger",
            description: "Juicy chicken patty with fresh vegetables and sauce.",
            price: 240,
            image: "",
            veg: 0
        },

        {
            category: "Pizza",
            name: "Margherita Pizza",
            description: "Classic pizza with tomato sauce, mozzarella and herbs.",
            price: 280,
            image: "",
            veg: 1
        },

        {
            category: "Snacks",
            name: "French Fries",
            description: "Crispy golden fries served hot.",
            price: 130,
            image: "",
            veg: 1
        }

    ];


    const transaction = db.transaction(() => {

        for (const item of demoMenu) {

            const category =
                getCategoryId.get(
                    item.category
                );

            if (!category) {
                console.warn(
                    `Skipping demo item "${item.name}" because category "${item.category}" was not found.`
                );

                continue;
            }


            insertMenuItem.run(
                category.id,
                item.name,
                item.description,
                item.price,
                item.image,
                item.veg,
                1
            );

        }

    });


    transaction();

    console.log(
        `Demo menu initialized: ${demoMenu.length} items.`
    );
}


/* =====================================================
   DATABASE READY
===================================================== */

console.log(
    "Database initialized successfully."
);

module.exports = db;