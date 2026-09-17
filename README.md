# 🍽️ QR Restaurant Ordering System

A full-stack restaurant ordering system that allows customers to scan a QR code, browse the restaurant menu, place orders, and track order status in real time. Restaurant administrators can manage menu items, categories, tables, settings, and customer orders through an admin dashboard.

## 🌐 Live Demo

**Live Website:**
https://qr-restaurant-ordering-owf7.onrender.com

> The application is deployed using Render Web Services and PostgreSQL.

---

## 📌 Project Overview

The QR Restaurant Ordering System is designed to simplify the restaurant ordering process.

Instead of waiting for a waiter or using a paper menu, customers can:

1. Scan a restaurant table QR code.
2. Open the digital menu.
3. Browse food categories.
4. Select food items.
5. Add items to their cart.
6. Submit an order.
7. Track the order status.

Restaurant administrators can manage the restaurant through a separate admin dashboard.

The project uses a Node.js backend, Express.js server, PostgreSQL database, HTML, CSS, JavaScript, and Socket.IO for real-time communication.

---

## ✨ Main Features

### 👨‍🍳 Customer Features

* Digital restaurant menu.
* QR-based restaurant ordering.
* Food categories.
* Food item names and prices.
* Food availability management.
* Add food items to cart.
* Update item quantities.
* Remove items from cart.
* Customer name and contact details.
* Table-based ordering.
* Pickup or dine-in order support.
* Order notes.
* Order confirmation.
* Order status tracking.
* Mobile-friendly customer interface.
* Real-time order status updates.

### 🔐 Admin Features

* Admin login.
* Admin authentication.
* Admin dashboard.
* Restaurant settings management.
* Restaurant name management.
* Tax configuration.
* Category management.
* Add new food categories.
* Delete food categories.
* Add menu items.
* Edit menu items.
* Delete menu items.
* Change food availability.
* Manage restaurant tables.
* View customer orders.
* View order details.
* Update order status.
* Real-time order notifications.
* Admin account management.
* Password recovery functionality.

### ⚡ Real-Time Features

The system uses Socket.IO to update order information without requiring constant page refreshes.

```text
Customer places an order
        ↓
Order is saved in PostgreSQL
        ↓
Admin dashboard receives the order
        ↓
Admin changes order status
        ↓
Customer receives the updated status
```

---

## 🛠️ Technologies Used

### Frontend

* HTML5
* CSS3
* JavaScript
* Responsive web design
* Fetch API
* Socket.IO Client

### Backend

* Node.js
* Express.js
* Socket.IO
* REST API
* Express Session
* Bcrypt password hashing
* Multer file upload handling
* Nodemailer/password recovery functionality

### Database

* PostgreSQL
* `pg` Node.js PostgreSQL client

### Deployment

* Render Web Service
* Render PostgreSQL
* Git
* GitHub

### Previous Database

The project was originally developed using SQLite and was later migrated to PostgreSQL.

---

## 🏗️ Project Architecture

```text
QR RESTAURANT ORDERING SYSTEM
│
├── public/
│   ├── index.html
│   ├── order.html
│   ├── order.js
│   ├── order.css
│   │
│   ├── admin/
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   └── ...
│   │
│   ├── css/
│   ├── js/
│   └── uploads/
│
├── server/
│   ├── server.js
│   ├── database-postgres.js
│   ├── package.json
│   ├── package-lock.json
│   ├── .env
│   ├── .env.example
│   │
│   └── archive/
│       ├── Old SQLite files
│       ├── Migration scripts
│       └── Backup files
│
├── data/
│   └── restaurant.db
│
├── .gitignore
└── README.md
```

> The `archive` folder contains old SQLite files, migration scripts, testing scripts, and backup versions. These files are not required for normal production execution.

---

## 📂 Important Files

### `server/server.js`

The main backend file.

It handles:

* Express server setup.
* API routes.
* Admin authentication.
* Customer orders.
* Menu operations.
* Category operations.
* Restaurant settings.
* Order status updates.
* Socket.IO events.
* Session handling.
* File uploads.

### `server/database-postgres.js`

Responsible for:

* PostgreSQL connection.
* Database initialization.
* Table creation.
* Initial seed data.
* PostgreSQL connection pool.

### `server/package.json`

Contains:

* Project metadata.
* Required dependencies.
* Application scripts.

### `public/`

Contains the frontend files used by customers and administrators.

### `public/admin/`

Contains the admin login page and admin dashboard pages.

### `public/uploads/`

Contains uploaded restaurant logos and images.

---

## 🗃️ Database Structure

The PostgreSQL database contains the following main tables.

### `admins`

Stores administrator account information.

```text
id
username
password
email
reset_token_hash
reset_token_expires_at
created_at
updated_at
```

Passwords are stored using hashing instead of plain text.

### `categories`

Stores food categories.

```text
id
name
created_at
```

### `menu_items`

Stores restaurant menu items.

```text
id
category_id
name
description
price
image
available
created_at
updated_at
```

### `restaurant_tables`

Stores restaurant table information.

```text
id
table_number
qr_code
created_at
```

### `orders`

Stores customer order information.

```text
id
order_type
table_number
customer_name
customer_phone
pickup_time
notes
status
total
created_at
updated_at
```

### `order_items`

Stores individual items belonging to an order.

```text
id
order_id
menu_item_id
item_name
quantity
price
total
```

### `business_settings`

Stores restaurant configuration.

```text
id
restaurant_name
tax_percentage
logo
created_at
updated_at
```

---

## 🔄 Order Status Flow

Orders follow a simple status workflow:

```text
Received
   ↓
Confirmed
   ↓
Preparing
   ↓
Ready
   ↓
Completed
```

An order may also be marked as:

```text
Cancelled
```

The admin can update the order status from the dashboard.

---

## 🚀 Local Installation

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Move into the project directory:

```bash
cd QR-RESTAURANT-ORDERING
```

### 2. Install Backend Dependencies

Move into the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the `server` directory:

```env
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_long_random_session_secret
NODE_ENV=development
PORT=3000
```

Example:

```env
DATABASE_URL=postgresql://username:password@hostname/database
SESSION_SECRET=replace_with_a_secure_random_secret
NODE_ENV=development
PORT=3000
```

> Never upload the `.env` file to GitHub.

### 4. Start the Application

From the `server` folder:

```bash
node server.js
```

The application should start on:

```text
http://localhost:3000
```

### 5. Open the Website

Customer website:

```text
http://localhost:3000
```

Admin login:

```text
http://localhost:3000/admin/login.html
```

Admin dashboard:

```text
http://localhost:3000/admin/dashboard.html
```

---

## 🔑 Environment Variables

The application uses environment variables for configuration.

| Variable         | Description                    |
| ---------------- | ------------------------------ |
| `DATABASE_URL`   | PostgreSQL connection URL      |
| `SESSION_SECRET` | Secret used to secure sessions |
| `NODE_ENV`       | Application environment        |
| `PORT`           | Server port                    |

### Local Development

Use the PostgreSQL External Database URL in your local `.env` file.

### Render Deployment

Use the PostgreSQL Internal Database URL in Render Environment Variables when the web service and database are hosted on Render.

---

## ☁️ Deployment on Render

### 1. Push the Project to GitHub

```bash
git add .
git commit -m "Deploy PostgreSQL restaurant ordering system"
git push origin main
```

Or push the deployment branch:

```bash
git push origin postgres-migration
```

### 2. Create a Render Web Service

In Render:

1. Create a new Web Service.
2. Connect the GitHub repository.
3. Select the deployment branch.
4. Configure the build command.
5. Configure the start command.

### 3. Build Command

If the project root contains the `server` folder:

```bash
npm install
```

### 4. Start Command

If the Render Root Directory is the project root:

```bash
node server/server.js
```

If the Render Root Directory is set to `server`:

```bash
node server.js
```

### 5. Add Render Environment Variables

Add the following environment variables in Render:

```env
DATABASE_URL=your_render_postgresql_internal_database_url
SESSION_SECRET=your_secure_random_secret
NODE_ENV=production
```

### 6. Deploy the Application

After saving the environment variables:

1. Deploy the latest commit.
2. Wait for the build to complete.
3. Open the Render deployment URL.
4. Test the customer website.
5. Test the admin login.
6. Test placing and managing orders.

The application is successfully deployed using Render Web Services and PostgreSQL.

---

## 📈 Future Enhancements

Possible future improvements include:

* Online payment integration.
* UPI payment support.
* Order invoice generation.
* Kitchen display system.
* Waiter dashboard.
* Restaurant staff accounts.
* Multiple restaurant support.
* Delivery order support.
* Customer order history.
* Customer feedback and ratings.
* Discount coupons.
* Offers and promotions.
* Inventory management.
* Sales reports.
* Daily revenue reports.
* Monthly analytics.
* WhatsApp order notifications.
* Email order notifications.
* Push notifications.
* Custom domain support.
* Cloud image storage.
* Automatic database backups.
* Advanced restaurant analytics.
* Multi-language menu support.
* AI-based food recommendations.

---

## 👨‍💻 Author

**Developed by:** Yaswanth Adari

### Project Type

Full-stack restaurant ordering application.

### Project Category

* Web Application
* Restaurant Technology
* QR Ordering System
* Real-Time Order Management
* PostgreSQL-Based Application

---

## ⭐ Project Highlights

This project demonstrates practical experience with:

* Full-stack web development.
* Frontend and backend integration.
* REST API development.
* PostgreSQL database design.
* SQLite to PostgreSQL migration.
* Admin authentication.
* Secure password hashing.
* Admin dashboard development.
* QR-based restaurant ordering.
* Real-time communication using Socket.IO.
* Customer order management.
* Menu and category management.
* Restaurant settings management.
* Git and GitHub workflow.
* Cloud deployment using Render.
* PostgreSQL hosting.
* Production debugging and deployment configuration.
* Responsive website development.
* Real-time order status tracking.

---

## 🎯 Project Summary

The QR Restaurant Ordering System provides a digital solution for restaurants to manage menus and receive customer orders through QR codes.

The system combines:

```text
QR Ordering
+
Digital Menu
+
Admin Dashboard
+
PostgreSQL Database
+
Real-Time Order Updates
+
Cloud Deployment
```

The application is deployed on Render and provides a strong full-stack restaurant ordering solution that can be further enhanced for large-scale commercial use.
