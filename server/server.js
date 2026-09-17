require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");

const multer = require("multer");
const fs = require("fs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcrypt");
const { Server } = require("socket.io");
const { pool } = require("./database-postgres");


const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;


/* =====================================================
   RESTAURANT LOGO UPLOAD
===================================================== */

const logoDirectory =
    path.join(
        __dirname,
        "..",
        "public",
        "uploads",
        "logos"
    );


if (
    !fs.existsSync(
        logoDirectory
    )
) {

    fs.mkdirSync(
        logoDirectory,
        {
            recursive: true
        }
    );

}


const logoStorage =
    multer.diskStorage({

        destination:
            (req, file, callback) => {

                callback(
                    null,
                    logoDirectory
                );

            },


        filename:
            (req, file, callback) => {

                const extension =
                    path.extname(
                        file.originalname
                    ).toLowerCase();


                const filename =
                    `restaurant-logo-${Date.now()}${extension}`;


                callback(
                    null,
                    filename
                );

            }

    });


const logoUpload =
    multer({

        storage:
            logoStorage,

        limits: {
            fileSize:
                5 * 1024 * 1024
        },

        fileFilter:
            (req, file, callback) => {

                const allowed =
                    [
                        "image/png",
                        "image/jpeg",
                        "image/jpg",
                        "image/webp"
                    ];


                if (
                    allowed.includes(
                        file.mimetype
                    )
                ) {

                    callback(
                        null,
                        true
                    );

                } else {

                    callback(
                        new Error(
                            "Only PNG, JPG, JPEG and WEBP images are allowed."
                        )
                    );

                }

            }

    });


app.use(
    helmet({
        contentSecurityPolicy: false
    })
);

app.set("trust proxy", 1);

app.use(
    "/api",
    rateLimit({
        windowMs: 60 * 1000,
        max: 300,
        standardHeaders: true,
        legacyHeaders: false
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "..", "public")));


/* =====================================================
   ADMIN AUTH + SECURE SESSIONS
===================================================== */

const SESSION_TTL_MS =
    8 * 60 * 60 * 1000;

const adminSessions = new Map();

function createAdminSession(admin) {

    const token =
        crypto.randomBytes(32).toString("hex");

    adminSessions.set(
        token,
        {
            adminId: admin.id,
            username: admin.username,
            expiresAt:
                Date.now() + SESSION_TTL_MS
        }
    );

    return token;
}


function destroyAdminSession(token) {
    if (token) {
        adminSessions.delete(token);
    }
}


function requireAdmin(req, res, next) {

    const token =
        req.headers["x-admin-token"];

    const session =
        token
            ? adminSessions.get(token)
            : null;

    if (!session) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    if (session.expiresAt <= Date.now()) {
        destroyAdminSession(token);

        return res.status(401).json({
            success: false,
            message: "Session expired. Please login again."
        });
    }

    req.admin = session;

    next();
}


/* Remove expired sessions periodically. */
setInterval(
    () => {
        const now = Date.now();

        for (const [token, session] of adminSessions) {
            if (session.expiresAt <= now) {
                adminSessions.delete(token);
            }
        }
    },
    30 * 60 * 1000
).unref();


/* =====================================================
   EMAIL / PASSWORD RECOVERY
===================================================== */

const SMTP_CONFIGURED = Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.MAIL_FROM
);

const mailTransporter =
    SMTP_CONFIGURED
        ? nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port:
                Number(
                    process.env.SMTP_PORT || 587
                ),
            secure:
                String(
                    process.env.SMTP_SECURE || "false"
                ).toLowerCase() === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })
        : null;


const APP_BASE_URL =
    String(
        process.env.APP_BASE_URL ||
        `http://localhost:${PORT}`
    ).replace(/\/$/, "");


function normalizeEmail(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}


function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
}


function isValidUsername(username) {
    return /^[A-Za-z0-9._-]{3,40}$/.test(
        username
    );
}


async function sendPasswordResetEmail(
    recoveryEmail,
    resetUrl
) {

    if (!mailTransporter) {
        throw new Error(
            "Password recovery email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM in .env."
        );
    }

    await mailTransporter.sendMail({
        from: process.env.MAIL_FROM,
        to: recoveryEmail,
        subject:
            "Restaurant Admin Password Reset",
        text:
            `A password reset was requested for your restaurant admin account.\n\nUse this link to set a new password:\n${resetUrl}\n\nThis link expires in 15 minutes and can only be used once. If you did not request this, you can ignore this email.`,
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:600px;margin:auto">
                <h2>Restaurant Admin Password Reset</h2>
                <p>A password reset was requested for your restaurant admin account.</p>
                <p>
                    <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#ff8a3d;color:#fff;text-decoration:none;border-radius:8px">
                        Reset Password
                    </a>
                </p>
                <p>This link expires in <strong>15 minutes</strong> and can only be used once.</p>
                <p>If you did not request this, you can ignore this email.</p>
            </div>
        `
    });
}


function hashResetToken(token) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}


/* =====================================================
   ADMIN STATUS
===================================================== */

/* =====================================================
   ADMIN STATUS
===================================================== */

app.get(
    "/api/admin/status",
    async (req, res) => {

        try {

            const result = await pool.query(`
                SELECT
                    id,
                    recovery_email
                FROM admins
                ORDER BY id ASC
            `);

            const admins = result.rows;

            /*
             * A fresh installation needs setup.
             * Existing projects created before recovery-email support may
             * already contain the original single admin account without
             * a recovery email.
             */

            const legacyAdminNeedsSetup =
                admins.length === 1 &&
                !admins[0].recovery_email;

            res.json({
                success: true,
                setupRequired:
                    admins.length === 0 ||
                    legacyAdminNeedsSetup
            });

        } catch (error) {

            console.error(
                "ADMIN STATUS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Unable to check admin status."
            });

        }
    }
);

/* =====================================================
   ADMIN LOGOUT
===================================================== */

app.post(
    "/api/admin/logout",
    requireAdmin,
    (req, res) => {
        destroyAdminSession(
            req.headers["x-admin-token"]
        );

        res.json({
            success: true
        });
    }
);


/* =====================================================
   HEALTH
===================================================== */

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "QR Restaurant Ordering System is running."
    });
});


/* =====================================================
   SETTINGS
===================================================== */

app.get("/api/settings", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                restaurant_name,
                description,
                phone,
                email,
                address,
                opening_hours,
                logo,
                tax_rate
            FROM business_settings
            WHERE id = 1
        `);

        res.json({
            success: true,
            settings: result.rows[0] || null
        });

    } catch (error) {
        console.error("LOAD SETTINGS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load settings."
        });
    }
});

/* =====================================================
   ADMIN RESTAURANT LOGO UPLOAD
===================================================== */

app.post(
    "/api/admin/upload-logo",
    requireAdmin,
    (req, res) => {

        logoUpload.single("logo")(
            req,
            res,
            error => {

                if (error) {

                    console.error(
                        "LOGO UPLOAD ERROR:",
                        error
                    );


                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                error.message ||
                                "Unable to upload logo."
                        });

                }


                if (!req.file) {

                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                "Please select a logo image."
                        });

                }


                const logoPath =
                    `/uploads/logos/${req.file.filename}`;


                res.json({
                    success: true,
                    message:
                        "Logo uploaded successfully.",
                    logo:
                        logoPath
                });

            }
        );

    }
);



/* =====================================================
   ADMIN SETTINGS
===================================================== */

app.put(
    "/api/admin/settings",
    requireAdmin,
    async (req, res) => {

        try {

            const {
                restaurant_name,
                description,
                phone,
                email,
                address,
                opening_hours,
                tax_rate,
                logo
            } = req.body;


            const restaurantName =
                String(restaurant_name || "").trim();

            const descriptionValue =
                String(description || "").trim();

            const phoneValue =
                String(phone || "").trim();

            const emailValue =
                String(email || "").trim();

            const addressValue =
                String(address || "").trim();

            const openingHoursValue =
                String(opening_hours || "").trim();

            const logoValue =
                String(logo || "").trim();

            const taxRate =
                Number(tax_rate);


            if (!restaurantName) {
                return res.status(400).json({
                    success: false,
                    message: "Restaurant name is required."
                });
            }


            if (
                !Number.isFinite(taxRate) ||
                taxRate < 0 ||
                taxRate > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Tax rate must be between 0 and 100."
                });
            }


            await pool.query(`
                UPDATE business_settings

                SET
                    restaurant_name = $1,
                    description = $2,
                    phone = $3,
                    email = $4,
                    address = $5,
                    opening_hours = $6,
                    tax_rate = $7,
                    logo = $8,
                    updated_at = CURRENT_TIMESTAMP

                WHERE id = 1
            `, [
                restaurantName,
                descriptionValue,
                phoneValue,
                emailValue,
                addressValue,
                openingHoursValue,
                taxRate,
                logoValue
            ]);


            io.emit("restaurant-settings-updated");


            res.json({
                success: true,
                message: "Restaurant profile updated successfully."
            });


        } catch (error) {

            console.error(
                "UPDATE SETTINGS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Unable to update restaurant profile."
            });

        }
    }
);


/* =====================================================
   MENU
===================================================== */
/* =====================================================
   MENU
===================================================== */

app.get("/api/menu", async (req, res) => {
    try {

        const categoriesResult = await pool.query(`
            SELECT
                id,
                name,
                category_type,
                display_order
            FROM categories
            WHERE active = 1
            ORDER BY display_order ASC, id ASC
        `);

        const itemsResult = await pool.query(`
            SELECT
                id,
                category_id,
                name,
                description,
                price,
                image,
                veg,
                available
            FROM menu_items
            WHERE available = 1
            ORDER BY id ASC
        `);

        const categories = categoriesResult.rows;
        const items = itemsResult.rows;

        const menu = categories.map(category => ({
            ...category,
            items: items.filter(
                item =>
                    Number(item.category_id) === Number(category.id)
            )
        }));

        res.json({
            success: true,
            menu
        });

    } catch (error) {

        console.error(
            "LOAD CUSTOMER MENU ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to load menu."
        });
    }
});

/* =====================================================
   TABLES
===================================================== */

app.get("/api/tables", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                table_number
            FROM restaurant_tables
            WHERE active = 1
            ORDER BY id ASC
        `);

        res.json({
            success: true,
            tables: result.rows
        });

    } catch (error) {
        console.error("TABLES ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load tables."
        });
    }
});


/* =====================================================
   ADMIN LOGIN
===================================================== */

const adminLoginLimiter =
    rateLimit({
        windowMs:
            15 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message:
                "Too many login attempts. Please try again later."
        }
    });


app.post(
    "/api/admin/login",
    adminLoginLimiter,
    async (req, res) => {

        try {

            const username =
                String(
                    req.body.username || ""
                ).trim();

            const password =
                String(
                    req.body.password || ""
                );

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Username and password are required."
                });
            }

            const adminResult = await pool.query(`
                SELECT
                    id,
                    username,
                    password,
                    recovery_email
                FROM admins
                WHERE username = $1
            `, [username]);

            const admin = adminResult.rows[0];

            if (!admin) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid username or password."
                });
            }

            const valid =
                await bcrypt.compare(
                    password,
                    admin.password
                );

            if (!valid) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid username or password."
                });
            }

            const token =
                createAdminSession(admin);

            res.json({
                success: true,
                token,
                username: admin.username
            });

        } catch (error) {

            console.error(
                "ADMIN LOGIN ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Login failed."
            });
        }
    }
);


/* =====================================================
   CREATE FIRST ADMIN
===================================================== */

app.post(
    "/api/admin/setup",
    adminLoginLimiter,
    async (req, res) => {

        try {

            const existingResult = await pool.query(`
                SELECT
                    id,
                    recovery_email
                FROM admins
                ORDER BY id ASC
            `);

            const existingAdmins = existingResult.rows;

            const legacyAdmin =
                existingAdmins.length === 1 &&
                !existingAdmins[0].recovery_email
                    ? existingAdmins[0]
                    : null;

            if (existingAdmins.length > 0 && !legacyAdmin) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Admin account is already configured. Please use the existing admin account or its password recovery option."
                });
            }

            const username =
                String(
                    req.body.username || ""
                ).trim();

            const password =
                String(
                    req.body.password || ""
                );

            const confirmPassword =
                String(
                    req.body.confirmPassword || ""
                );

            const recoveryEmail =
                normalizeEmail(
                    req.body.recoveryEmail
                );

            if (!isValidUsername(username)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Username must be 3-40 characters and may contain letters, numbers, dots, underscores or hyphens."
                });
            }

            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Password must contain at least 8 characters."
                });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Passwords do not match."
                });
            }

            if (!isValidEmail(recoveryEmail)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Enter a valid recovery email address."
                });
            }

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    12
                );

            if (legacyAdmin) {

                await pool.query(`
                    UPDATE admins
                    SET
                        username = $1,
                        password = $2,
                        recovery_email = $3,
                        reset_token_hash = NULL,
                        reset_token_expires_at = NULL
                    WHERE id = $4
                `, [
                    username,
                    hashedPassword,
                    recoveryEmail,
                    legacyAdmin.id
                ]);

            } else {

                await pool.query(`
                    INSERT INTO admins
                    (
                        username,
                        password,
                        recovery_email
                    )
                    VALUES ($1, $2, $3)
                `, [
                    username,
                    hashedPassword,
                    recoveryEmail
                ]);
            }

            res.status(201).json({
                success: true,
                message:
                    "Admin account created successfully."
            });

        } catch (error) {

            console.error(
                "ADMIN SETUP ERROR:",
                error
            );

            if (error.code === "23505") {
                return res.status(400).json({
                    success: false,
                    message:
                        "That username is already in use."
                });
            }

            res.status(500).json({
                success: false,
                message:
                    "Unable to create admin account."
            });
        }
    }
);


/* =====================================================
   ADMIN ACCOUNT SETTINGS
===================================================== */

app.get(
    "/api/admin/account",
    requireAdmin,
    async (req, res) => {

        try {

            const result = await pool.query(`
                SELECT
                    username,
                    recovery_email
                FROM admins
                WHERE id = $1
            `, [
                req.admin.adminId
            ]);

            const admin = result.rows[0];

            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Admin account not found."
                });
            }

            res.json({
                success: true,
                account: admin
            });

        } catch (error) {

            console.error(
                "GET ADMIN ACCOUNT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load admin account."
            });
        }
    }
);


app.put(
    "/api/admin/account",
    requireAdmin,
    async (req, res) => {

        try {

            const currentPassword =
                String(
                    req.body.currentPassword || ""
                );

            const username =
                String(
                    req.body.username || ""
                ).trim();

            const recoveryEmail =
                normalizeEmail(
                    req.body.recoveryEmail
                );

            const newPassword =
                String(
                    req.body.newPassword || ""
                );

            const confirmPassword =
                String(
                    req.body.confirmPassword || ""
                );

            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Enter your current password to save account changes."
                });
            }

            if (!isValidUsername(username)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid username."
                });
            }

            if (!isValidEmail(recoveryEmail)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Enter a valid recovery email address."
                });
            }

            const adminResult = await pool.query(`
                SELECT
                    id,
                    username,
                    password
                FROM admins
                WHERE id = $1
            `, [
                req.admin.adminId
            ]);

            const admin = adminResult.rows[0];

            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Admin account not found."
                });
            }

            const valid =
                await bcrypt.compare(
                    currentPassword,
                    admin.password
                );

            if (!valid) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Current password is incorrect."
                });
            }

            if (
                newPassword &&
                newPassword.length < 8
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "New password must contain at least 8 characters."
                });
            }

            if (
                newPassword &&
                newPassword !== confirmPassword
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "New passwords do not match."
                });
            }

            const duplicateResult =
                await pool.query(`
                    SELECT id
                    FROM admins
                    WHERE username = $1
                      AND id != $2
                `, [
                    username,
                    req.admin.adminId
                ]);

            if (duplicateResult.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "That username is already in use."
                });
            }

            const passwordHash =
                newPassword
                    ? await bcrypt.hash(
                        newPassword,
                        12
                    )
                    : admin.password;

            await pool.query(`
                UPDATE admins
                SET
                    username = $1,
                    password = $2,
                    recovery_email = $3,
                    reset_token_hash = NULL,
                    reset_token_expires_at = NULL
                WHERE id = $4
            `, [
                username,
                passwordHash,
                recoveryEmail,
                req.admin.adminId
            ]);

            /* Invalidate all other sessions for this admin. */
            for (const [sessionToken, session] of adminSessions) {
                if (
                    session.adminId === req.admin.adminId &&
                    sessionToken !== req.headers["x-admin-token"]
                ) {
                    adminSessions.delete(sessionToken);
                }
            }

            req.admin.username = username;

            res.json({
                success: true,
                username,
                message:
                    "Admin account updated successfully."
            });

        } catch (error) {

            console.error(
                "UPDATE ADMIN ACCOUNT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to update admin account."
            });
        }
    }
);


/* =====================================================
   FORGOT PASSWORD
===================================================== */

const forgotPasswordLimiter =
    rateLimit({
        windowMs:
            15 * 60 * 1000,
        max: 5,
        standardHeaders: true,
        legacyHeaders: false
    });


app.post(
    "/api/admin/forgot-password",
    forgotPasswordLimiter,
    async (req, res) => {

        const genericMessage =
            "If the account exists and has a recovery email, a password reset link has been sent.";

        try {

            if (!SMTP_CONFIGURED) {
                return res.status(503).json({
                    success: false,
                    message:
                        "Password recovery email is not configured on this server yet."
                });
            }

            const identifier =
                String(
                    req.body.identifier || ""
                ).trim();

            if (!identifier) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Enter your username or recovery email."
                });
            }

            const admin = db
                .prepare(`
                    SELECT
                        id,
                        username,
                        recovery_email
                    FROM admins
                    WHERE username = ?
                       OR lower(recovery_email) = lower(?)
                `)
                .get(
                    identifier,
                    identifier
                );

            if (!admin || !admin.recovery_email) {
                return res.json({
                    success: true,
                    message: genericMessage
                });
            }

            const rawToken =
                crypto.randomBytes(32).toString("hex");

            const tokenHash =
                hashResetToken(rawToken);

            const expiresAt =
                Date.now() +
                15 * 60 * 1000;

            await pool.query(
                `
                UPDATE admins
                SET
                    reset_token_hash = $1,
                    reset_token_expires_at = to_timestamp($2)
                WHERE id = $3
                `,
                [
                    tokenHash,
                    Math.floor(expiresAt / 1000),
                    admin.id
                ]
            );

            const resetUrl =
                `${APP_BASE_URL}/admin/reset-password.html?token=${encodeURIComponent(rawToken)}`;

            try {
                await sendPasswordResetEmail(
                    admin.recovery_email,
                    resetUrl
                );
            } catch (mailError) {
                await pool.query(
                    `
                    UPDATE admins
                    SET
                        reset_token_hash = NULL,
                        reset_token_expires_at = NULL
                    WHERE id = $1
                    `,
                    [admin.id]
                );
            res.json({
                success: true,
                message: genericMessage
            });
            throw mailError;
}

        } catch (error) {

            console.error(
                "FORGOT PASSWORD ERROR:",
                error.message
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to send the password recovery email right now."
            });
        }
    }
);


/* =====================================================
   RESET PASSWORD
===================================================== */

const resetPasswordLimiter =
    rateLimit({
        windowMs:
            15 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false
    });


app.post(
    "/api/admin/reset-password",
    resetPasswordLimiter,
    async (req, res) => {

        try {

            const token =
                String(
                    req.body.token || ""
                ).trim();

            const password =
                String(
                    req.body.password || ""
                );

            const confirmPassword =
                String(
                    req.body.confirmPassword || ""
                );

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid or missing reset link."
                });
            }

            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Password must contain at least 8 characters."
                });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Passwords do not match."
                });
            }

            const tokenHash =
                hashResetToken(token);

            const admin = db
                .prepare(`
                    SELECT
                        id,
                        username,
                        recovery_email
                    FROM admins
                    WHERE reset_token_hash = ?
                      AND reset_token_expires_at IS NOT NULL
                      AND datetime(reset_token_expires_at) > CURRENT_TIMESTAMP
                `)
                .get(tokenHash);

            if (!admin) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This reset link is invalid or has expired."
                });
            }

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );

            await pool.query(
                `
                UPDATE admins
                SET
                    password = $1,
                    reset_token_hash = NULL,
                    reset_token_expires_at = NULL
                WHERE id = $2
                `,
                [
                    passwordHash,
                    admin.id
                ]
            );

            /* Invalidate all currently active sessions. */
            for (const [sessionToken, session] of adminSessions) {
                if (session.adminId === admin.id) {
                    adminSessions.delete(sessionToken);
                }
            }

            if (SMTP_CONFIGURED && admin.recovery_email) {
                try {
                    await mailTransporter.sendMail({
                        from: process.env.MAIL_FROM,
                        to: admin.recovery_email,
                        subject:
                            "Restaurant Admin Password Changed",
                        text:
                            "Your restaurant admin password was changed successfully. If you did not make this change, secure your email account and contact your system administrator immediately."
                    });
                } catch (mailError) {
                    console.error(
                        "PASSWORD CHANGE EMAIL ERROR:",
                        mailError.message
                    );
                }
            }

            res.json({
                success: true,
                message:
                    "Password reset successfully. Please login with your new password."
            });

        } catch (error) {

            console.error(
                "RESET PASSWORD ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to reset the password."
            });
        }
    }
);


/* =====================================================
   ADMIN CATEGORIES
===================================================== */
app.get(
    "/api/admin/categories",
    requireAdmin,
    async (req, res) => {

        try {

            const result = await pool.query(`
                SELECT
                    id,
                    name,
                    category_type,
                    display_order,
                    active
                FROM categories
                ORDER BY display_order ASC, id ASC
            `);

            res.json({
                success: true,
                categories: result.rows
            });

        } catch (error) {

            console.error(
                "LOAD CATEGORIES ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load categories."
            });
        }
    }
);

app.post(
    "/api/admin/categories",
    requireAdmin,
    async (req, res) => {

        try {

            const name =
                String(
                    req.body.name || ""
                ).trim();

            const categoryType =
                String(
                    req.body.category_type ||
                    "restaurant"
                ).trim();

            if (
                !["restaurant", "cafe"]
                    .includes(categoryType)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid category type."
                });
            }

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Category name is required."
                });
            }

            const highestResult =
                await pool.query(`
                    SELECT
                        COALESCE(
                            MAX(display_order),
                            0
                        ) AS value
                    FROM categories
                `);

            const nextOrder =
                Number(
                    highestResult.rows[0].value
                ) + 1;

            const result =
                await pool.query(`
                    INSERT INTO categories
                    (
                        name,
                        category_type,
                        display_order
                    )
                    VALUES ($1, $2, $3)
                    RETURNING id
                `, [
                    name,
                    categoryType,
                    nextOrder
                ]);

            io.emit("menu-updated");

            res.json({
                success: true,
                category: {
                    id: result.rows[0].id,
                    name,
                    category_type:
                        categoryType
                }
            });

        } catch (error) {

            console.error(
                "CREATE CATEGORY ERROR:",
                error
            );

            if (error.code === "23505") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Category already exists."
                });
            }

            res.status(500).json({
                success: false,
                message:
                    "Unable to create category."
            });
        }
    }
);  



/* =====================================================
   DELETE CATEGORY
===================================================== */

app.delete(
    "/api/admin/categories/:id",
    requireAdmin,
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);

            if (
                !Number.isInteger(id) ||
                id <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid category ID."
                });
            }

            const categoryResult =
                await pool.query(`
                    SELECT
                        id,
                        name
                    FROM categories
                    WHERE id = $1
                `, [id]);

            const category =
                categoryResult.rows[0];

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Category not found."
                });
            }

            const orderReferenceResult =
                await pool.query(`
                    SELECT
                        COUNT(*)::int AS count
                    FROM order_items
                    WHERE menu_item_id IN (
                        SELECT id
                        FROM menu_items
                        WHERE category_id = $1
                    )
                `, [id]);

            const orderReferenceCount =
                Number(
                    orderReferenceResult.rows[0].count
                );

            if (orderReferenceCount > 0) {
                return res.status(409).json({
                    success: false,
                    message:
                        `"${category.name}" cannot be permanently deleted because its menu items are already part of ${orderReferenceCount} order item(s). Mark those menu items unavailable instead.`
                });
            }

            const deleteResult =
                await pool.query(`
                    DELETE FROM categories
                    WHERE id = $1
                `, [id]);

            if (deleteResult.rowCount === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Category could not be deleted."
                });
            }

            io.emit("menu-updated");

            res.json({
                success: true,
                message:
                    "Category deleted successfully.",
                category
            });

        } catch (error) {

            console.error(
                "DELETE CATEGORY ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to delete category."
            });
        }
    }
);  


/* =====================================================
   ADMIN MENU ITEMS
===================================================== */
app.get(
    "/api/admin/menu",
    requireAdmin,
    async (req, res) => {

        try {

            const result = await pool.query(`
                SELECT
                    menu_items.id,
                    menu_items.category_id,
                    menu_items.name,
                    menu_items.description,
                    menu_items.price,
                    menu_items.image,
                    menu_items.veg,
                    menu_items.available,
                    categories.name AS category_name
                FROM menu_items
                JOIN categories
                    ON categories.id = menu_items.category_id
                ORDER BY
                    categories.display_order ASC,
                    menu_items.id DESC
            `);

            res.json({
                success: true,
                items: result.rows
            });

        } catch (error) {

            console.error(
                "LOAD ADMIN MENU ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load menu items."
            });
        }
    }
);

app.post(
    "/api/admin/menu",
    requireAdmin,
    async (req, res) => {

        try {

            const {
                category_id,
                name,
                description,
                price,
                image,
                veg,
                available
            } = req.body;

            const cleanName =
                String(name || "").trim();

            const numericPrice =
                Number(price);

            const categoryId =
                Number(category_id);

            if (
                !Number.isInteger(categoryId) ||
                categoryId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Select a category."
                });
            }

            if (!cleanName) {
                return res.status(400).json({
                    success: false,
                    message: "Food name is required."
                });
            }

            if (
                !Number.isFinite(numericPrice) ||
                numericPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid price."
                });
            }

            const result =
                await pool.query(`
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
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id
                `, [
                    categoryId,
                    cleanName,
                    String(description || "").trim(),
                    numericPrice,
                    String(image || "").trim(),
                    veg ? 1 : 0,
                    available === false ? 0 : 1
                ]);

            io.emit("menu-updated");

            res.json({
                success: true,
                id: result.rows[0].id
            });

        } catch (error) {

            console.error(
                "ADD MENU ITEM ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to add menu item."
            });
        }
    }
);

/* =====================================================
   UPDATE MENU ITEM
===================================================== */

app.put(
    "/api/admin/menu/:id",
    requireAdmin,
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const {
                category_id,
                name,
                description,
                price,
                image,
                veg,
                available
            } = req.body;

            const numericPrice =
                Number(price);

            const categoryId =
                Number(category_id);

            if (
                !Number.isInteger(id) ||
                id <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid item."
                });
            }

            if (
                !Number.isInteger(categoryId) ||
                categoryId <= 0 ||
                !String(name || "").trim() ||
                !Number.isFinite(numericPrice) ||
                numericPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid menu information."
                });
            }

            const result =
                await pool.query(`
                    UPDATE menu_items
                    SET
                        category_id = $1,
                        name = $2,
                        description = $3,
                        price = $4,
                        image = $5,
                        veg = $6,
                        available = $7,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $8
                `, [
                    categoryId,
                    String(name).trim(),
                    String(description || "").trim(),
                    numericPrice,
                    String(image || "").trim(),
                    veg ? 1 : 0,
                    available ? 1 : 0,
                    id
                ]);

            if (result.rowCount === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Menu item not found."
                });
            }

            io.emit("menu-updated");

            res.json({
                success: true
            });

        } catch (error) {

            console.error(
                "UPDATE MENU ITEM ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to update menu item."
            });
        }
    }
);


/* =====================================================
   DELETE MENU ITEM
===================================================== */

app.delete(
    "/api/admin/menu/:id",
    requireAdmin,
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);

            if (
                !Number.isInteger(id) ||
                id <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid menu item."
                });
            }

            const itemResult =
                await pool.query(`
                    SELECT
                        id,
                        name
                    FROM menu_items
                    WHERE id = $1
                `, [id]);

            const item =
                itemResult.rows[0];

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Menu item not found."
                });
            }

            const orderReferenceResult =
                await pool.query(`
                    SELECT
                        COUNT(*)::int AS count
                    FROM order_items
                    WHERE menu_item_id = $1
                `, [id]);

            const orderReferenceCount =
                Number(
                    orderReferenceResult.rows[0].count
                );

            if (orderReferenceCount > 0) {
                return res.status(409).json({
                    success: false,
                    message:
                        `"${item.name}" cannot be permanently deleted because it is already part of ${orderReferenceCount} order item(s). Mark it unavailable instead.`
                });
            }

            const deleteResult =
                await pool.query(`
                    DELETE FROM menu_items
                    WHERE id = $1
                `, [id]);

            if (deleteResult.rowCount !== 1) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Menu item could not be deleted."
                });
            }

            io.emit("menu-updated");

            res.json({
                success: true,
                message:
                    `"${item.name}" deleted successfully.`
            });

        } catch (error) {

            console.error(
                "DELETE MENU ITEM ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to delete menu item."
            });
        }
    }
);
/* =====================================================
   ADMIN ORDERS
===================================================== */

app.get(
    "/api/admin/orders",
    requireAdmin,
    async (req, res) => {

        try {

            const result = await pool.query(`
                SELECT
                    o.id,
                    o.order_number,
                    o.order_type,
                    o.table_number,
                    o.customer_name,
                    o.customer_phone,
                    o.pickup_time,
                    o.subtotal,
                    o.tax,
                    o.total,
                    o.status,
                    o.notes,
                    o.created_at,

                    COALESCE(
                        json_agg(
                            json_build_object(
                                'item_name', oi.item_name,
                                'quantity', oi.quantity,
                                'price', oi.price,
                                'total', oi.total
                            )
                            ORDER BY oi.id ASC
                        ) FILTER (
                            WHERE oi.id IS NOT NULL
                        ),
                        '[]'
                    ) AS items

                FROM orders o

                LEFT JOIN order_items oi
                    ON oi.order_id = o.id

                GROUP BY o.id

                ORDER BY o.id DESC

                LIMIT 100
            `);

            const orders = result.rows.map(order => ({
                ...order,
                subtotal: Number(order.subtotal),
                tax: Number(order.tax),
                total: Number(order.total),
                items: order.items.map(item => ({
                    ...item,
                    quantity: Number(item.quantity),
                    price: Number(item.price),
                    total: Number(item.total)
                }))
            }));

            res.json({
                success: true,
                orders
            });

        } catch (error) {

            console.error(
                "LOAD ORDERS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load orders."
            });
        }
    }
);

/* =====================================================
   UPDATE ORDER STATUS
===================================================== */

app.put(
    "/api/admin/orders/:id/status",
    requireAdmin,
    async (req, res) => {

        try {

            const orderId =
                Number(req.params.id);

            const allowedStatuses = [
                "new",
                "accepted",
                "preparing",
                "ready",
                "completed",
                "cancelled"
            ];

            const status =
                String(
                    req.body.status || ""
                ).trim();


            if (
                !Number.isInteger(orderId)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid order."
                });
            }


            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid order status."
                });
            }


            const result =
                await pool.query(
                    `
                    UPDATE orders

                    SET
                        status = $1,
                        updated_at = CURRENT_TIMESTAMP

                    WHERE id = $2

                    RETURNING id
                    `,
                    [
                        status,
                        orderId
                    ]
                );


            if (result.rowCount === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Order not found."
                });
            }


            io.emit(
                "order-status-updated",
                {
                    orderId,
                    status
                }
            );


            res.json({
                success: true,
                status
            });


        } catch (error) {

            console.error(
                "UPDATE ORDER ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to update order."
            });
        }
    }
);

/* =====================================================
   SOCKET.IO
===================================================== */

io.on("connection", socket => {

    console.log(
        "Client connected:",
        socket.id
    );

    socket.on("disconnect", () => {

        console.log(
            "Client disconnected:",
            socket.id
        );
    });
});


/* =====================================================
   CREATE ORDER
===================================================== */

app.post(
    "/api/orders",
    async (req, res) => {

        let client;

        try {

            const {
                orderType,
                tableNumber,
                customerName,
                customerPhone,
                pickupTime,
                notes,
                items
            } = req.body;


            /* -----------------------------
               BASIC VALIDATION
            ----------------------------- */

            if (
                orderType !== "dine_in" &&
                orderType !== "takeaway"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid order type."
                });
            }


            if (
                !Array.isArray(items) ||
                items.length === 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Your cart is empty."
                });
            }


            /* -----------------------------
               DINE-IN VALIDATION
            ----------------------------- */

            if (
                orderType === "dine_in" &&
                !String(
                    tableNumber || ""
                ).trim()
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Table number is required."
                });
            }


            /* -----------------------------
               TAKEAWAY VALIDATION
            ----------------------------- */

            if (
                orderType === "dine_in" ||
                orderType === "takeaway"
            ) {

                if (
                    !String(
                        customerName || ""
                    ).trim()
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Customer name is required."
                    });
                }


                if (
                    !String(
                        customerPhone || ""
                    ).trim()
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Mobile number is required."
                    });
                }
            }


            /* -----------------------------
               POSTGRESQL TRANSACTION
            ----------------------------- */

            client =
                await pool.connect();


            await client.query(
                "BEGIN"
            );


            /* -----------------------------
               GET CURRENT MENU PRICES
            ----------------------------- */

            const orderItems = [];

            let subtotal = 0;


            for (
                const cartItem of items
            ) {

                const menuResult =
                    await client.query(
                        `
                        SELECT
                            id,
                            name,
                            price,
                            available
                        FROM menu_items
                        WHERE id = $1
                        `,
                        [
                            Number(
                                cartItem.id
                            )
                        ]
                    );


                const menuItem =
                    menuResult.rows[0];


                if (!menuItem) {

                    await client.query(
                        "ROLLBACK"
                    );

                    return res.status(400).json({
                        success: false,
                        message:
                            "One of the selected items no longer exists."
                    });
                }


                if (!menuItem.available) {

                    await client.query(
                        "ROLLBACK"
                    );

                    return res.status(400).json({
                        success: false,
                        message:
                            `${menuItem.name} is currently unavailable.`
                    });
                }


                const quantity =
                    Number(
                        cartItem.quantity
                    );


                if (
                    !Number.isInteger(
                        quantity
                    ) ||
                    quantity < 1 ||
                    quantity > 50
                ) {

                    await client.query(
                        "ROLLBACK"
                    );

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid item quantity."
                    });
                }


                const price =
                    Number(
                        menuItem.price
                    );


                const itemTotal =
                    price * quantity;


                subtotal += itemTotal;


                orderItems.push({
                    menuItemId:
                        Number(
                            menuItem.id
                        ),

                    name:
                        menuItem.name,

                    quantity,

                    price,

                    total:
                        itemTotal
                });
            }


            /* -----------------------------
               TAX
            ----------------------------- */

            const settingsResult =
                await client.query(
                    `
                    SELECT tax_rate
                    FROM business_settings
                    WHERE id = 1
                    `
                );


            const settings =
                settingsResult.rows[0];


            const taxRate =
                Number(
                    settings?.tax_rate || 0
                );


            const tax =
                Number(
                    (
                        subtotal *
                        taxRate /
                        100
                    ).toFixed(2)
                );


            const total =
                Number(
                    (
                        subtotal +
                        tax
                    ).toFixed(2)
                );


            /* -----------------------------
               ORDER NUMBER
            ----------------------------- */

            const orderNumber =
                `RB-${crypto
                    .randomBytes(6)
                    .toString("hex")
                    .toUpperCase()}`;


            /* -----------------------------
               INSERT ORDER
            ----------------------------- */

            const orderResult =
                await client.query(
                    `
                    INSERT INTO orders
                    (
                        order_number,
                        order_type,
                        table_number,
                        customer_name,
                        customer_phone,
                        pickup_time,
                        subtotal,
                        tax,
                        total,
                        status,
                        notes
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9,
                        'new',
                        $10
                    )

                    RETURNING id
                    `,
                    [
                        orderNumber,

                        orderType,

                        orderType === "dine_in"
                            ? String(
                                tableNumber || ""
                            ).trim()
                            : null,

                        String(
                            customerName || ""
                        ).trim() || null,

                        String(
                            customerPhone || ""
                        ).trim() || null,

                        orderType === "takeaway"
                            ? String(
                                pickupTime || ""
                            ).trim() || null
                            : null,

                        subtotal,

                        tax,

                        total,

                        String(
                            notes || ""
                        ).trim() || null
                    ]
                );


            const orderId =
                orderResult.rows[0].id;


            /* -----------------------------
               INSERT ORDER ITEMS
            ----------------------------- */

            for (
                const item of orderItems
            ) {

                await client.query(
                    `
                    INSERT INTO order_items
                    (
                        order_id,
                        menu_item_id,
                        item_name,
                        quantity,
                        price,
                        total
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6
                    )
                    `,
                    [
                        orderId,
                        item.menuItemId,
                        item.name,
                        item.quantity,
                        item.price,
                        item.total
                    ]
                );
            }


            /* -----------------------------
               COMMIT
            ----------------------------- */

            await client.query(
                "COMMIT"
            );


            /* -----------------------------
               REAL-TIME ADMIN EVENT
            ----------------------------- */

            io.emit(
                "new-order",
                {
                    orderId,
                    orderNumber,
                    orderType,

                    tableNumber:
                        orderType === "dine_in"
                            ? tableNumber
                            : null,

                    customerName:
                        customerName ||
                        null,

                    total,

                    itemCount:
                        orderItems.reduce(
                            (
                                sum,
                                item
                            ) =>
                                sum +
                                item.quantity,
                            0
                        )
                }
            );


            /* -----------------------------
               RESPONSE
            ----------------------------- */

            res.status(201).json({

                success: true,

                order: {

                    id:
                        orderId,

                    orderNumber,

                    orderType,

                    tableNumber:
                        orderType === "dine_in"
                            ? tableNumber
                            : null,

                    customerName:
                        customerName ||
                        null,

                    customerPhone:
                        customerPhone ||
                        null,

                    pickupTime:
                        pickupTime ||
                        null,

                    items:
                        orderItems,

                    subtotal,

                    tax,

                    taxRate,

                    total,

                    status:
                        "new"
                }
            });


        } catch (error) {

            if (client) {

                try {
                    await client.query(
                        "ROLLBACK"
                    );
                } catch (rollbackError) {
                    console.error(
                        "ROLLBACK ERROR:",
                        rollbackError
                    );
                }
            }


            console.error(
                "CREATE ORDER ERROR:",
                error
            );


            res.status(500).json({
                success: false,
                message:
                    "Unable to place your order."
            });


        } finally {

            if (client) {
                client.release();
            }
        }
    }
);


/* =====================================================
   CUSTOMER TODAY'S ORDERS
===================================================== */

app.get(
    "/api/orders/history/today",
    async (req, res) => {

        try {

            /* -----------------------------
               CUSTOMER PHONE
            ----------------------------- */

            const phone =
                String(
                    req.query.phone || ""
                )
                .replace(/\D/g, "")
                .trim();


            if (phone.length < 10) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Valid customer phone number is required."
                });

            }


            /* -----------------------------
               DATE RANGE
            ----------------------------- */

            const from =
                String(
                    req.query.from || ""
                ).trim();

            const to =
                String(
                    req.query.to || ""
                ).trim();


            if (!from || !to) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Date range is required."
                });

            }


            /* -----------------------------
               GET ONLY THIS CUSTOMER'S
               ORDERS FOR TODAY
            ----------------------------- */

            const ordersResult =
                await pool.query(
                    `
                    SELECT
                        o.id,
                        o.order_number,
                        o.order_type,
                        o.table_number,
                        o.customer_name,
                        o.customer_phone,
                        o.subtotal,
                        o.tax,
                        o.total,
                        o.status,
                        o.created_at,
                        o.updated_at

                    FROM orders o

                    WHERE
                        regexp_replace(
                            COALESCE(
                                o.customer_phone,
                                ''
                            ),
                            '[^0-9]',
                            '',
                            'g'
                        ) = $1

                    AND o.created_at >= $2
                    AND o.created_at < $3

                    ORDER BY
                        o.created_at DESC
                    `,
                    [
                        phone,
                        from,
                        to
                    ]
                );


            /* -----------------------------
               LOAD ITEMS
            ----------------------------- */

            const orders =
                await Promise.all(
                    ordersResult.rows.map(
                        async order => {

                            const itemsResult =
                                await pool.query(
                                    `
                                    SELECT
                                        item_name,
                                        quantity,
                                        price,
                                        total

                                    FROM order_items

                                    WHERE
                                        order_id = $1

                                    ORDER BY
                                        id ASC
                                    `,
                                    [
                                        order.id
                                    ]
                                );


                            return {
                                ...order,

                                subtotal:
                                    Number(
                                        order.subtotal
                                    ),

                                tax:
                                    Number(
                                        order.tax
                                    ),

                                total:
                                    Number(
                                        order.total
                                    ),

                                items:
                                    itemsResult.rows.map(
                                        item => ({
                                            ...item,

                                            quantity:
                                                Number(
                                                    item.quantity
                                                ),

                                            price:
                                                Number(
                                                    item.price
                                                ),

                                            total:
                                                Number(
                                                    item.total
                                                )
                                        })
                                    )
                            };

                        }
                    )
                );


            /* -----------------------------
               RESPONSE
            ----------------------------- */

            res.json({

                success: true,

                orders

            });


        } catch (error) {

            console.error(
                "CUSTOMER ORDER HISTORY ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to load today's orders."

            });

        }

    }
);


/* =====================================================
   GET ORDER
===================================================== */

app.get(
    "/api/orders/:orderNumber",
    async (req, res) => {

        try {

            const orderResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        order_number,
                        order_type,
                        table_number,
                        customer_name,
                        customer_phone,
                        pickup_time,
                        subtotal,
                        tax,
                        total,
                        status,
                        notes,
                        created_at,
                        updated_at

                    FROM orders

                    WHERE order_number = $1
                    `,
                    [
                        req.params.orderNumber
                    ]
                );


            const order =
                orderResult.rows[0];


            if (!order) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Order not found."
                });
            }


            const itemsResult =
                await pool.query(
                    `
                    SELECT
                        item_name,
                        quantity,
                        price,
                        total

                    FROM order_items

                    WHERE order_id = $1

                    ORDER BY id ASC
                    `,
                    [
                        order.id
                    ]
                );


            const items =
                itemsResult.rows.map(
                    item => ({
                        ...item,
                        quantity:
                            Number(
                                item.quantity
                            ),
                        price:
                            Number(
                                item.price
                            ),
                        total:
                            Number(
                                item.total
                            )
                    })
                );


            res.json({

                success: true,

                order: {

                    ...order,

                    subtotal:
                        Number(
                            order.subtotal
                        ),

                    tax:
                        Number(
                            order.tax
                        ),

                    total:
                        Number(
                            order.total
                        ),

                    items
                }
            });


        } catch (error) {

            console.error(
                "GET ORDER ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load order."
            });
        }
    }
);

/* =====================================================
   CUSTOMER TODAY'S ORDERS
===================================================== */

app.get(
    "/api/orders/history/today",
    async (req, res) => {

        try {

            /* -----------------------------
               CUSTOMER PHONE
            ----------------------------- */

            const phone =
                String(
                    req.query.phone || ""
                )
                .replace(/\D/g, "")
                .trim();


            if (phone.length < 10) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Valid customer phone number is required."
                });

            }


            /* -----------------------------
               DATE RANGE
            ----------------------------- */

            const from =
                String(
                    req.query.from || ""
                ).trim();

            const to =
                String(
                    req.query.to || ""
                ).trim();


            if (!from || !to) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Date range is required."
                });

            }


            /* -----------------------------
               GET CUSTOMER ORDERS
            ----------------------------- */

            const ordersResult =
                await pool.query(
                    `
                    SELECT
                        o.id,
                        o.order_number,
                        o.order_type,
                        o.table_number,
                        o.customer_name,
                        o.customer_phone,
                        o.subtotal,
                        o.tax,
                        o.total,
                        o.status,
                        o.created_at,
                        o.updated_at

                    FROM orders o

                    WHERE
                        regexp_replace(
                            COALESCE(
                                o.customer_phone,
                                ''
                            ),
                            '[^0-9]',
                            '',
                            'g'
                        ) = $1

                    AND o.created_at >= $2
                    AND o.created_at < $3

                    ORDER BY
                        o.created_at DESC
                    `,
                    [
                        phone,
                        from,
                        to
                    ]
                );


            /* -----------------------------
               GET ITEMS FOR EACH ORDER
            ----------------------------- */

            const orders =
                await Promise.all(
                    ordersResult.rows.map(
                        async order => {

                            const itemsResult =
                                await pool.query(
                                    `
                                    SELECT
                                        item_name,
                                        quantity,
                                        price,
                                        total

                                    FROM order_items

                                    WHERE
                                        order_id = $1

                                    ORDER BY
                                        id ASC
                                    `,
                                    [
                                        order.id
                                    ]
                                );


                            return {
                                ...order,

                                subtotal:
                                    Number(
                                        order.subtotal
                                    ),

                                tax:
                                    Number(
                                        order.tax
                                    ),

                                total:
                                    Number(
                                        order.total
                                    ),

                                items:
                                    itemsResult.rows.map(
                                        item => ({
                                            ...item,

                                            quantity:
                                                Number(
                                                    item.quantity
                                                ),

                                            price:
                                                Number(
                                                    item.price
                                                ),

                                            total:
                                                Number(
                                                    item.total
                                                )
                                        })
                                    )
                            };

                        }
                    )
                );


            /* -----------------------------
               RESPONSE
            ----------------------------- */

            res.json({

                success: true,

                date:
                    new Date()
                        .toISOString()
                        .slice(0, 10),

                orders

            });


        } catch (error) {

            console.error(
                "CUSTOMER ORDER HISTORY ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to load today's orders."

            });

        }

    }
);


/* =====================================================
   START
===================================================== */

async function startServer() {

   server.listen(
    PORT,
    "0.0.0.0",
    () => {

        const publicUrl =
            process.env.RENDER_EXTERNAL_URL ||
            `http://localhost:${PORT}`;

        console.log(`
========================================
 QR RESTAURANT ORDERING SYSTEM
========================================

 Server:
 ${publicUrl}

 Admin:
 ${publicUrl}/admin/login.html

========================================
        `);

    }
);
}

startServer();  