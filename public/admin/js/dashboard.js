const token =
    sessionStorage.getItem("adminToken");


if (!token) {

    window.location.href =
        "/admin/login.html";
}


/* =====================================================
   ELEMENTS
===================================================== */

const categoryForm =
    document.getElementById("categoryForm");

const categoryName =
    document.getElementById("categoryName");

const categoryType =
    document.getElementById("categoryType");    

const categoryList =
    document.getElementById("categoryList");

const menuForm =
    document.getElementById("menuForm");

const menuCategory =
    document.getElementById("menuCategory");

const menuList =
    document.getElementById("menuList");

const menuImage =
    document.getElementById(
        "menuImage"
    );


const menuImagePreview =
    document.getElementById(
        "menuImagePreview"
    );


const menuImagePreviewImg =
    document.getElementById(
        "menuImagePreviewImg"
    );

/* =====================================================
   MENU IMAGE PREVIEW
===================================================== */

menuImage.addEventListener(
    "input",
    () => {

        const url =
            menuImage.value.trim();


        if (!url) {

            menuImagePreview.style.display =
                "none";

            menuImagePreviewImg.src =
                "";

            return;
        }


        menuImagePreviewImg.onload =
            () => {

                menuImagePreview.style.display =
                    "block";

            };


        menuImagePreviewImg.onerror =
            () => {

                menuImagePreview.style.display =
                    "none";

            };


        menuImagePreviewImg.src =
            url;

    }
);

const menuSubmitButton =
    document.getElementById(
        "menuSubmitButton"
    );

const cancelMenuEditButton =
    document.getElementById(
        "cancelMenuEditButton"
    );

let editingMenuId = null;

const logoutButton =
    document.getElementById("logoutButton");

const welcomeText =
    document.getElementById("welcomeText");

const ordersList =
    document.getElementById("ordersList");

const summaryOrders =
    document.getElementById(
        "summaryOrders"
    );


const summaryRevenue =
    document.getElementById(
        "summaryRevenue"
    );


const summaryWeekRevenue =
    document.getElementById(
        "summaryWeekRevenue"
    );


const summaryMonthRevenue =
    document.getElementById(
        "summaryMonthRevenue"
    );


const summaryPending =
    document.getElementById(
        "summaryPending"
    );


const summaryCompleted =
    document.getElementById(
        "summaryCompleted"
    );

/* =====================================================
   ORDER FILTER + SEARCH
===================================================== */

let allOrders = [];

let activeOrderFilter = "all";

let activeOrderDate =
    getOrderDateKey(
        new Date()
    ) || "all";

let orderSearchText = "";


const restaurantQr =
    document.getElementById("restaurantQr");

const restaurantQrUrl =
    document.getElementById("restaurantQrUrl");

const downloadQrButton =
    document.getElementById("downloadQrButton");

const printQrButton =
    document.getElementById("printQrButton");

const copyQrLinkButton =
    document.getElementById("copyQrLinkButton");

const restaurantProfileForm =
    document.getElementById(
        "restaurantProfileForm"
    );

const restaurantLogo =
    document.getElementById(
        "restaurantLogo"
    );

const restaurantLogoPreview =
    document.getElementById(
        "restaurantLogoPreview"
    );

const restaurantLogoFile =
    document.getElementById(
        "restaurantLogoFile"
    );


const restaurantLogoUploadStatus =
    document.getElementById(
        "restaurantLogoUploadStatus"
    );

const restaurantName =
    document.getElementById(
        "restaurantName"
    );

const restaurantDescription =
    document.getElementById(
        "restaurantDescription"
    );

const restaurantPhone =
    document.getElementById(
        "restaurantPhone"
    );

const restaurantEmail =
    document.getElementById(
        "restaurantEmail"
    );

const restaurantAddress =
    document.getElementById(
        "restaurantAddress"
    );

const restaurantHours =
    document.getElementById(
        "restaurantHours"
    );

const restaurantTax =
    document.getElementById(
        "restaurantTax"
    );

const saveRestaurantProfile =
    document.getElementById(
        "saveRestaurantProfile"
    );


const adminAccountForm =
    document.getElementById(
        "adminAccountForm"
    );

const adminAccountUsername =
    document.getElementById(
        "adminAccountUsername"
    );

const adminRecoveryEmail =
    document.getElementById(
        "adminRecoveryEmail"
    );

const adminCurrentPassword =
    document.getElementById(
        "adminCurrentPassword"
    );

const adminNewPassword =
    document.getElementById(
        "adminNewPassword"
    );

const adminConfirmPassword =
    document.getElementById(
        "adminConfirmPassword"
    );

const adminAccountMessage =
    document.getElementById(
        "adminAccountMessage"
    );

const adminAccountError =
    document.getElementById(
        "adminAccountError"
    );

const saveAdminAccount =
    document.getElementById(
        "saveAdminAccount"
    );


/* =====================================================
   SOCKET CONNECTION
===================================================== */

const socket =
    io();


/* =====================================================
   AUTH HEADERS
===================================================== */

function headers() {

    return {
        "Content-Type":
            "application/json",

        "x-admin-token":
            token
    };
}


/* =====================================================
   INITIALIZE
===================================================== */

welcomeText.textContent =
    `Welcome, ${
        sessionStorage.getItem(
            "adminUsername"
        ) || "Admin"
    }`;


loadCategories();

loadMenu();

loadOrders();


loadRestaurantProfile();

loadAdminAccount();

/* =====================================================
   REAL-TIME NEW ORDER
===================================================== */

socket.on(
    "new-order",
    order => {

        console.log(
            "NEW ORDER:",
            order
        );


        playOrderSound();


        showNewOrderNotification(
            order
        );


        loadOrders();
    }
);


/* =====================================================
   ORDER STATUS UPDATE
===================================================== */

socket.on(
    "order-status-updated",
    data => {

        loadOrders();
    }
);


/* =====================================================
   LOAD ORDERS
===================================================== */

async function loadOrders() {

    try {

        const response =
            await fetch(
                "/api/admin/orders",
                {
                    method: "GET",

                    headers:
                        headers(),

                    cache: "no-store"
                }
            );


        const data =
            await response.json();


        console.log(
            "ADMIN ORDERS RESPONSE:",
            response.status,
            data
        );


        if (
            response.status === 401
        ) {

            console.error(
                "ADMIN ORDER API REJECTED THE TOKEN"
            );


            ordersList.innerHTML = `
                <div class="orders-empty">

                    <div>
                        🔐
                    </div>

                    <strong>
                        Admin authorization failed
                    </strong>

                    <p>
                        Please logout and login again.
                    </p>

                </div>
            `;

            return;
        }


        if (!response.ok) {

            ordersList.innerHTML = `
                <div class="orders-empty">

                    <div>
                        ⚠️
                    </div>

                    <strong>
                        Unable to load orders
                    </strong>

                    <p>
                        Server returned
                        ${response.status}.
                    </p>

                </div>
            `;

            return;
        }


        if (!data.success) {

            console.error(
                "ORDER API ERROR:",
                data
            );


            ordersList.innerHTML = `
                <div class="orders-empty">

                    <div>
                        ⚠️
                    </div>

                    <strong>
                        Unable to load orders
                    </strong>

                    <p>
                        ${
                            escapeHtml(
                                data.message ||
                                "Unknown server error."
                            )
                        }
                    </p>

                </div>
            `;

            return;
        }


        allOrders =
            Array.isArray(data.orders)
                ? data.orders
                : [];

        /* Update dashboard summary */

    updateOrderSummary();

        createOrderFilters();


        applyOrderFilters();


    } catch (error) {

        console.error(
            "LOAD ORDERS ERROR:",
            error
        );


        ordersList.innerHTML = `
            <div class="orders-empty">

                <div>
                    ⚠️
                </div>

                <strong>
                    Connection error
                </strong>

                <p>
                    Could not load orders from the server.
                </p>

            </div>
        `;
    }
}


/* =====================================================
   CREATE ORDER FILTERS
===================================================== */

function createOrderFilters() {

    const ordersPanel =
        document.querySelector(
            ".orders-panel"
        );


    if (!ordersPanel) {
        return;
    }


    if (
        document.getElementById(
            "orderFilterBar"
        )
    ) {
        updateOrderDateFilters();
        updateOrderFilterCounts();
        return;
    }


    const filterBar =
        document.createElement(
            "div"
        );


    filterBar.id =
        "orderFilterBar";


    filterBar.className =
        "order-filter-bar";


    filterBar.innerHTML = `

        <div class="order-filter-buttons">

            <button
                type="button"
                class="order-filter-button active"
                data-order-filter="all"
            >
                All
                <span data-order-count="all">
                    0
                </span>
            </button>


            <button
                type="button"
                class="order-filter-button"
                data-order-filter="new"
            >
                New
                <span data-order-count="new">
                    0
                </span>
            </button>


            <button
                type="button"
                class="order-filter-button"
                data-order-filter="accepted"
            >
                Accepted
                <span data-order-count="accepted">
                    0
                </span>
            </button>


            <button
                type="button"
                class="order-filter-button"
                data-order-filter="preparing"
            >
                Preparing
                <span data-order-count="preparing">
                    0
                </span>
            </button>


            <button
                type="button"
                class="order-filter-button"
                data-order-filter="ready"
            >
                Ready
                <span data-order-count="ready">
                    0
                </span>
            </button>


            <button
                type="button"
                class="order-filter-button"
                data-order-filter="completed"
            >
                Completed
                <span data-order-count="completed">
                    0
                </span>
            </button>


            <button
                type="button"
                class="order-filter-button"
                data-order-filter="cancelled"
            >
                Cancelled
                <span data-order-count="cancelled">
                    0
                </span>
            </button>

        </div>


        <div class="order-search-box">

            <span>
                🔍
            </span>

            <input
                id="orderSearchInput"
                type="search"
                placeholder="Search order, customer or table..."
                autocomplete="off"
            >

        </div>


        <div
            class="order-date-filter-row"
            style="
                display:flex;
                align-items:center;
                gap:8px;
                flex-wrap:wrap;
                margin-top:12px;
                width:100%;
            "
        >

            <span
                style="
                    font-weight:700;
                    font-size:13px;
                    white-space:nowrap;
                "
            >
                📅 Date:
            </span>

            <button
                type="button"
                class="order-filter-button active"
                id="orderDateAllButton"
            >
                All Dates
            </button>

            <div
                id="orderDateButtons"
                style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                    flex-wrap:wrap;
                "
            ></div>

            <input
                id="orderDatePicker"
                type="date"
                aria-label="Filter orders by date"
                style="
                    min-height:38px;
                    padding:7px 10px;
                    border:1px solid #d8d8d8;
                    border-radius:8px;
                    background:#fff;
                    font:inherit;
                "
            >

        </div>

    `;


    const ordersHeader =
        ordersPanel.querySelector(
            ".orders-header"
        );


    if (ordersHeader) {

        ordersHeader.insertAdjacentElement(
            "afterend",
            filterBar
        );

    } else {

        ordersList.parentNode.insertBefore(
            filterBar,
            ordersList
        );

    }


    filterBar
        .querySelectorAll(
            "[data-order-filter]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        activeOrderFilter =
                            button.dataset.orderFilter;


                        filterBar
                            .querySelectorAll(
                                ".order-filter-button"
                            )
                            .forEach(
                                item => {

                                    item.classList.toggle(
                                        "active",
                                        item === button
                                    );

                                }
                            );


                        applyOrderFilters();

                    }
                );

            }
        );


    const searchInput =
        document.getElementById(
            "orderSearchInput"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                orderSearchText =
                    searchInput.value
                        .trim()
                        .toLowerCase();


                applyOrderFilters();

            }
        );

    }


    const allDatesButton =
        document.getElementById(
            "orderDateAllButton"
        );


    if (allDatesButton) {

        allDatesButton.addEventListener(
            "click",
            () => {

                activeOrderDate = "all";

                const datePicker =
                    document.getElementById(
                        "orderDatePicker"
                    );

                if (datePicker) {
                    datePicker.value = "";
                }

                updateOrderDateButtonState();

                applyOrderFilters();

            }
        );

    }


    const datePicker =
        document.getElementById(
            "orderDatePicker"
        );


    if (datePicker) {

        datePicker.addEventListener(
            "change",
            () => {

                activeOrderDate =
                    datePicker.value ||
                    "all";

                updateOrderDateButtonState();

                applyOrderFilters();

            }
        );

    }


    updateOrderDateFilters();
    updateOrderFilterCounts();
}


/* =====================================================
   DATE FILTER BUTTONS
===================================================== */

function getOrderDateKey(value) {

    if (!value) {
        return null;
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }


    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        String(
            date.getDate()
        ).padStart(2, "0")
    ].join("-");

}


function formatOrderDateButton(
    dateKey
) {

    const parts =
        dateKey.split("-");


    if (parts.length !== 3) {
        return dateKey;
    }


    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return dateKey;
    }


    return date.toLocaleDateString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function updateOrderDateFilters() {

    const container =
        document.getElementById(
            "orderDateButtons"
        );


    if (!container) {
        return;
    }


    const uniqueDates =
        [
            ...new Set(
                allOrders
                    .map(
                        order =>
                            getOrderDateKey(
                                order.created_at
                            )
                    )
                    .filter(Boolean)
            )
        ]
        .sort(
            (a, b) =>
                b.localeCompare(a)
        );


    container.innerHTML = "";


    uniqueDates.forEach(
        dateKey => {

            const button =
                document.createElement(
                    "button"
                );


            button.type = "button";

            button.className =
                "order-filter-button";


            button.dataset.orderDate =
                dateKey;


            button.textContent =
                formatOrderDateButton(
                    dateKey
                );


            button.addEventListener(
                "click",
                () => {

                    activeOrderDate =
                        dateKey;


                    const datePicker =
                        document.getElementById(
                            "orderDatePicker"
                        );


                    if (datePicker) {
                        datePicker.value =
                            dateKey;
                    }


                    updateOrderDateButtonState();

                    applyOrderFilters();

                }
            );


            container.appendChild(
                button
            );

        }
    );


    updateOrderDateButtonState();
}


function updateOrderDateButtonState() {

    const allDatesButton =
        document.getElementById(
            "orderDateAllButton"
        );


    if (allDatesButton) {

        allDatesButton.classList.toggle(
            "active",
            activeOrderDate === "all"
        );

    }


    document
        .querySelectorAll(
            "[data-order-date]"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.orderDate ===
                        activeOrderDate
                );

            }
        );

}


/* =====================================================
   UPDATE ORDER COUNTS
===================================================== */

function updateOrderFilterCounts() {

    /*
     * Counts should follow the selected date, just like the order list.
     * This prevents the dashboard from showing e.g. "All 10" while
     * today's filtered order list is empty.
     */
    let countOrders = [...allOrders];

    if (activeOrderDate !== "all") {
        countOrders = countOrders.filter(
            order =>
                getOrderDateKey(order.created_at) ===
                activeOrderDate
        );
    }

    const counts = {
        all: countOrders.length,
        new: 0,
        accepted: 0,
        preparing: 0,
        ready: 0,
        completed: 0,
        cancelled: 0
    };

    countOrders.forEach(order => {
        const status = order.status || "new";

        if (counts[status] !== undefined) {
            counts[status]++;
        }
    });

    Object.keys(counts).forEach(status => {
        const element = document.querySelector(
            `[data-order-count="${status}"]`
        );

        if (element) {
            element.textContent = counts[status];
        }
    });
}


/* =====================================================
   APPLY ORDER FILTERS
===================================================== */

function applyOrderFilters() {

    let filteredOrders =
        [...allOrders];


    /* STATUS FILTER */

    if (
        activeOrderFilter !==
        "all"
    ) {

        filteredOrders =
            filteredOrders.filter(
                order =>
                    (
                        order.status ||
                        "new"
                    ) ===
                    activeOrderFilter
            );

    }


    /* DATE FILTER */

    if (
        activeOrderDate !==
        "all"
    ) {

        filteredOrders =
            filteredOrders.filter(
                order =>
                    getOrderDateKey(
                        order.created_at
                    ) ===
                    activeOrderDate
            );

    }


    /* SEARCH */

    if (orderSearchText) {

        filteredOrders =
            filteredOrders.filter(
                order => {

                    const searchableText = [

                        order.order_number,

                        order.customer_name,

                        order.customer_phone,

                        order.table_number,

                        order.order_type,

                        order.status

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    return searchableText.includes(
                        orderSearchText
                    );

                }
            );

    }


    renderOrders(
        filteredOrders
    );


    updateOrderFilterCounts();
}




/* =====================================================
   TODAY'S ORDER SUMMARY
===================================================== */

function updateOrderSummary() {

    const today =
        new Date();


    const todayKey =
        getOrderDateKey(
            today
        );


    /*
     * Week starts on Monday.
     */
    const startOfWeek =
        new Date(
            today
        );


    const dayOfWeek =
        startOfWeek.getDay();


    const daysFromMonday =
        dayOfWeek === 0
            ? 6
            : dayOfWeek - 1;


    startOfWeek.setHours(
        0,
        0,
        0,
        0
    );


    startOfWeek.setDate(
        startOfWeek.getDate() -
        daysFromMonday
    );


    const startOfMonth =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );


    const validOrderDate =
        order => {

            if (!order.created_at) {
                return false;
            }


            const orderDate =
                new Date(
                    order.created_at
                );


            return !Number.isNaN(
                orderDate.getTime()
            );

        };


    const revenueEligible =
        order =>
            order.status !==
            "cancelled";


    const todaysOrders =
        allOrders.filter(
            order =>
                validOrderDate(order) &&
                getOrderDateKey(
                    order.created_at
                ) ===
                todayKey
        );


    const weekOrders =
        allOrders.filter(
            order => {

                if (
                    !validOrderDate(
                        order
                    ) ||
                    !revenueEligible(
                        order
                    )
                ) {
                    return false;
                }


                const orderDate =
                    new Date(
                        order.created_at
                    );


                return (
                    orderDate >=
                        startOfWeek &&
                    orderDate <=
                        today
                );

            }
        );


    const monthOrders =
        allOrders.filter(
            order => {

                if (
                    !validOrderDate(
                        order
                    ) ||
                    !revenueEligible(
                        order
                    )
                ) {
                    return false;
                }


                const orderDate =
                    new Date(
                        order.created_at
                    );


                return (
                    orderDate >=
                        startOfMonth &&
                    orderDate <=
                        today
                );

            }
        );


    const totalOrders =
        todaysOrders.length;


    const revenue =
        todaysOrders.reduce(
            (sum, order) => {

                if (
                    !revenueEligible(
                        order
                    )
                ) {
                    return sum;
                }


                return (
                    sum +
                    Number(
                        order.total || 0
                    )
                );

            },
            0
        );


    const weekRevenue =
        weekOrders.reduce(
            (sum, order) =>
                sum +
                Number(
                    order.total || 0
                ),
            0
        );


    const monthRevenue =
        monthOrders.reduce(
            (sum, order) =>
                sum +
                Number(
                    order.total || 0
                ),
            0
        );


    const pending =
        todaysOrders.filter(
            order =>
                [
                    "new",
                    "accepted",
                    "preparing",
                    "ready"
                ].includes(
                    order.status
                )
        ).length;


    const completed =
        todaysOrders.filter(
            order =>
                order.status ===
                "completed"
        ).length;


    if (summaryOrders) {

        summaryOrders.textContent =
            totalOrders;

    }


    if (summaryRevenue) {

        summaryRevenue.textContent =
            `₹${revenue.toFixed(2)}`;

    }


    if (summaryWeekRevenue) {

        summaryWeekRevenue.textContent =
            `₹${weekRevenue.toFixed(2)}`;

    }


    if (summaryMonthRevenue) {

        summaryMonthRevenue.textContent =
            `₹${monthRevenue.toFixed(2)}`;

    }


    if (summaryPending) {

        summaryPending.textContent =
            pending;

    }


    if (summaryCompleted) {

        summaryCompleted.textContent =
            completed;

    }

}


/* =====================================================
   RENDER ORDERS
===================================================== */

function renderOrders(
    orders
) {

    if (!orders.length) {

        ordersList.innerHTML = `
            <div class="orders-empty">

                <div>
                    🍽️
                </div>

                <strong>
                    No orders yet
                </strong>

                <p>
                    New customer orders will appear here.
                </p>

            </div>
        `;

        return;
    }


    ordersList.innerHTML = "";


    orders.forEach(
        order => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "order-card-admin" +
                (
                    order.status === "new"
                        ? " new-order"
                        : ""
                );


            const typeLabel =
                order.order_type === "dine_in"
                    ? `🍽️ Table ${
                        escapeHtml(
                            order.table_number ||
                            "—"
                        )
                    }`
                    : "🥡 Takeaway";


            const status =
                order.status || "new";


            card.innerHTML = `

                <div class="order-top">

                    <div>

                        <div class="order-number">
                            #${escapeHtml(
                                order.order_number
                            )}
                        </div>

                        <div class="order-time">
                            ${formatDate(
                                order.created_at
                            )}
                        </div>

                    </div>


                    <span
                        class="order-badge ${status}"
                    >
                        ${statusLabel(status)}
                    </span>

                </div>


                <div class="order-info">

                    <div class="order-info-item">
                        ${typeLabel}
                    </div>

                    ${
                        order.customer_name
                            ? `
                                <div class="order-info-item">
                                    👤 ${
                                        escapeHtml(
                                            order.customer_name
                                        )
                                    }
                                </div>
                            `
                            : ""
                    }

                    ${
                        order.customer_phone
                            ? `
                                <div class="order-info-item">
                                    📞 ${
                                        escapeHtml(
                                            order.customer_phone
                                        )
                                    }
                                </div>
                            `
                            : ""
                    }

                    ${
                        order.pickup_time
                            ? `
                                <div class="order-info-item">
                                    ⏰ Pickup ${
                                        escapeHtml(
                                            order.pickup_time
                                        )
                                    }
                                </div>
                            `
                            : ""
                    }

                </div>


                <div class="order-items">

                    ${
                        order.items
                            .map(
                                item => `
                                    <div class="order-item-row">

                                        <span>
                                            ${
                                                item.quantity
                                            }
                                            ×
                                            ${
                                                escapeHtml(
                                                    item.item_name
                                                )
                                            }
                                        </span>

                                        <strong>
                                            ₹${
                                                Number(
                                                    item.total
                                                ).toFixed(2)
                                            }
                                        </strong>

                                    </div>
                                `
                            )
                            .join("")
                    }


                    ${
                        order.notes
                            ? `
                                <div class="order-info-item"
                                     style="margin-top:10px;">
                                    📝 ${
                                        escapeHtml(
                                            order.notes
                                        )
                                    }
                                </div>
                            `
                            : ""
                    }


                    <div class="order-total-row">

                        <span>
                            Total
                        </span>

                        <strong>
                            ₹${
                                Number(
                                    order.total
                                ).toFixed(2)
                            }
                        </strong>

                    </div>

                </div>


                <div class="order-actions">

                    ${getStatusButtons(
                        order
                    )}

                </div>
            `;


            ordersList.appendChild(
                card
            );
        }
    );


    attachOrderButtons();
}


/* =====================================================
   STATUS BUTTONS
===================================================== */

function getStatusButtons(
    order
) {

    const status =
        order.status;


    if (
        status === "completed" ||
        status === "cancelled"
    ) {

        return `
            <button
                class="order-status-button"
                data-status="new"
                data-order-id="${order.id}"
            >
                Reopen
            </button>
        `;
    }


    if (status === "new") {

        return `
           <button
                class="order-status-button primary"
                data-status="accepted"
                data-order-id="${order.id}"
            >
                ✓ Confirm Order
            </button>

            <button
                class="order-status-button"
                data-status="cancelled"
                data-order-id="${order.id}"
            >
                Cancel
            </button>
        `;
    }


    if (status === "accepted") {

        return `
            <button
                class="order-status-button primary"
                data-status="preparing"
                data-order-id="${order.id}"
            >
                👨‍🍳 Start Preparing
            </button>
        `;
    }


    if (status === "preparing") {

        return `
            <button
                class="order-status-button primary"
                data-status="ready"
                data-order-id="${order.id}"
            >
                ✓ Mark Ready
            </button>
        `;
    }


    if (status === "ready") {

        return `
            <button
                class="order-status-button primary"
                data-status="completed"
                data-order-id="${order.id}"
            >
                ✓ Complete Order
            </button>
        `;
    }


    return "";
}


/* =====================================================
   ATTACH STATUS BUTTONS
===================================================== */

function attachOrderButtons() {

    document
        .querySelectorAll("[data-order-id]")
        .forEach(button => {

            button.addEventListener("click", async function () {

                if (this.disabled) {
                    return;
                }

                const orderId =
                    Number(this.dataset.orderId);

                const status =
                    this.dataset.status;

                // Save original button content
                const originalHTML =
                    this.innerHTML;

                // Immediately show loading state
                this.disabled = true;

                this.innerHTML =
                    "⏳ Updating...";

                try {

                    const response =
                        await fetch(
                            `/api/admin/orders/${orderId}/status`,
                            {
                                method: "PUT",

                                headers: headers(),

                                body: JSON.stringify({
                                    status: status
                                })
                            }
                        );


                    const data =
                        await response.json();


                    if (
                        !response.ok ||
                        !data.success
                    ) {

                        throw new Error(
                            data.message ||
                            "Unable to update order."
                        );
                    }


                    // Reload orders after successful update
                    await loadOrders();


                } catch (error) {

                    console.error(
                        "ORDER STATUS UPDATE:",
                        error
                    );


                    alert(
                        error.message ||
                        "Unable to update order."
                    );


                    // Restore button if update failed
                    this.disabled = false;

                    this.innerHTML =
                        originalHTML;
                }

            });

        });
}

/* =====================================================
   UPDATE ORDER STATUS
===================================================== */

async function updateOrderStatus(
    orderId,
    status
) {

    try {

        const response =
            await fetch(
                `/api/admin/orders/${orderId}/status`,
                {
                    method: "PUT",

                    headers:
                        headers(),

                    body:
                        JSON.stringify({
                            status
                        })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Unable to update order."
            );

            return false;
        }


        await loadOrders();


        return true;


    } catch (error) {

        console.error(
            "UPDATE ORDER STATUS:",
            error
        );


        alert(
            "Unable to connect to server."
        );


        return false;
    }
}

/* =====================================================
   NEW ORDER SOUND
===================================================== */

function playOrderSound() {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContext) {
            return;
        }


        const context =
            new AudioContext();


        const oscillator =
            context.createOscillator();

        const gain =
            context.createGain();


        oscillator.type =
            "sine";


        oscillator.frequency.setValueAtTime(
            880,
            context.currentTime
        );


        oscillator.frequency.exponentialRampToValueAtTime(
            1320,
            context.currentTime + 0.12
        );


        gain.gain.setValueAtTime(
            0.0001,
            context.currentTime
        );


        gain.gain.exponentialRampToValueAtTime(
            0.22,
            context.currentTime + 0.02
        );


        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            context.currentTime + 0.45
        );


        oscillator.connect(
            gain
        );

        gain.connect(
            context.destination
        );


        oscillator.start();

        oscillator.stop(
            context.currentTime + 0.5
        );


        setTimeout(
            () => {
                context.close();
            },
            700
        );


    } catch (error) {

        console.warn(
            "Notification sound unavailable."
        );
    }
}


/* =====================================================
   VISUAL NEW ORDER NOTIFICATION
===================================================== */

function showNewOrderNotification(order) {

    const message =
        document.createElement("div");


    message.className =
        "new-order-notification";


    message.innerHTML = `
        <div class="notification-title">
            🔔 NEW ORDER
        </div>

        <div class="notification-order">
            #${escapeHtml(
                order.orderNumber
            )}
        </div>

        <div class="notification-details">

            ${
                order.orderType === "dine_in"
                    ? `🍽️ Table ${
                        escapeHtml(
                            order.tableNumber || "—"
                        )
                    }`
                    : "🥡 Takeaway"
            }

            · ₹${Number(
                order.total
            ).toFixed(2)}

        </div>

        <button
            type="button"
            class="notification-view-button"
        >
            View Order
        </button>
    `;


    document.body.appendChild(
        message
    );


    message
        .querySelector(
            ".notification-view-button"
        )
        .addEventListener(
            "click",
            () => {

                message.remove();

                document
                    .querySelector(
                        ".orders-panel"
                    )
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
            }
        );


    setTimeout(
        () => {

            if (
                message.parentNode
            ) {
                message.remove();
            }

        },
        8000
    );
}


/* =====================================================
   ADMIN ACCOUNT SECURITY
===================================================== */

async function loadAdminAccount() {

    try {

        const response =
            await fetch(
                "/api/admin/account",
                {
                    headers: headers(),
                    cache: "no-store"
                }
            );

        if (response.status === 401) {
            logout();
            return;
        }

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Unable to load admin account."
            );
        }

        adminAccountUsername.value =
            data.account.username || "";

        adminRecoveryEmail.value =
            data.account.recovery_email || "";

    } catch (error) {
        console.error(
            "LOAD ADMIN ACCOUNT ERROR:",
            error
        );
    }
}


adminAccountForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        adminAccountMessage.textContent = "";
        adminAccountError.textContent = "";
        saveAdminAccount.disabled = true;
        saveAdminAccount.textContent =
            "⏳ Saving...";

        try {

            const response =
                await fetch(
                    "/api/admin/account",
                    {
                        method: "PUT",
                        headers: headers(),
                        body: JSON.stringify({
                            username:
                                adminAccountUsername.value.trim(),
                            recoveryEmail:
                                adminRecoveryEmail.value.trim(),
                            currentPassword:
                                adminCurrentPassword.value,
                            newPassword:
                                adminNewPassword.value,
                            confirmPassword:
                                adminConfirmPassword.value
                        })
                    }
                );

            const data =
                await response.json();

            if (response.status === 401) {
                logout();
                return;
            }

            if (!response.ok || !data.success) {
                adminAccountError.textContent =
                    data.message ||
                    "Unable to update admin account.";
                return;
            }

            sessionStorage.setItem(
                "adminUsername",
                data.username
            );

            welcomeText.textContent =
                `Welcome, ${data.username}`;

            adminCurrentPassword.value = "";
            adminNewPassword.value = "";
            adminConfirmPassword.value = "";

            adminAccountMessage.textContent =
                "✓ Admin account updated successfully.";

        } catch (error) {

            console.error(
                "UPDATE ADMIN ACCOUNT ERROR:",
                error
            );

            adminAccountError.textContent =
                "Unable to connect to server.";

        } finally {
            saveAdminAccount.disabled = false;
            saveAdminAccount.textContent =
                "🔐 Save Admin Account";
        }
    }
);


/* =====================================================
   RESTAURANT PROFILE
===================================================== */

async function loadRestaurantProfile() {

    try {

        const response =
            await fetch(
                "/api/settings",
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            console.error(
                "Unable to load restaurant settings.",
                data
            );

            return;
        }


        const settings =
            data.settings || {};


        restaurantName.value =
            settings.restaurant_name || "";


        restaurantDescription.value =
            settings.description || "";


        restaurantPhone.value =
            settings.phone || "";


        restaurantEmail.value =
            settings.email || "";


        restaurantAddress.value =
            settings.address || "";


        restaurantHours.value =
            settings.opening_hours || "";


        restaurantTax.value =
            settings.tax_rate ?? "";


        restaurantLogo.value =
            settings.logo || "";


        updateRestaurantLogoPreview(
            settings.logo
        );


    } catch (error) {

        console.error(
            "LOAD RESTAURANT PROFILE ERROR:",
            error
        );

    }
}

/* logo preview */

function updateRestaurantLogoPreview(
    logoUrl
) {

    if (!logoUrl) {

        restaurantLogoPreview.innerHTML =
            "🍽️";

        return;
    }


    restaurantLogoPreview.innerHTML =
        `
            <img
                src="${escapeHtml(
                    logoUrl
                )}"
                alt="Restaurant Logo"
                style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    border-radius:inherit;
                "
                onerror="
                    this.parentElement.innerHTML='🍽️';
                "
            >
        `;
}


/* =====================================================
   RESTAURANT LOGO UPLOAD
===================================================== */

restaurantLogoFile.addEventListener(
    "change",
    async () => {

        const file =
            restaurantLogoFile.files[0];


        if (!file) {
            return;
        }


        /* ---------------------------------------------
           VALIDATE FILE TYPE
        --------------------------------------------- */

        const allowedTypes = [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp"
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            alert(
                "Please select a PNG, JPG, JPEG or WEBP image."
            );


            restaurantLogoFile.value =
                "";


            return;
        }


        /* ---------------------------------------------
           VALIDATE FILE SIZE
           Maximum: 5 MB
        --------------------------------------------- */

        if (
            file.size >
            5 * 1024 * 1024
        ) {

            alert(
                "Logo image must be smaller than 5 MB."
            );


            restaurantLogoFile.value =
                "";


            return;
        }


        /* ---------------------------------------------
           SHOW LOCAL PREVIEW
        --------------------------------------------- */

        const previewUrl =
            URL.createObjectURL(
                file
            );


        updateRestaurantLogoPreview(
            previewUrl
        );


        restaurantLogoUploadStatus.textContent =
            "⏳ Uploading logo...";


        try {

            const formData =
                new FormData();


            formData.append(
                "logo",
                file
            );


            const response =
                await fetch(
                    "/api/admin/upload-logo",
                    {
                        method:
                            "POST",

                        headers: {
                            "x-admin-token":
                                token
                        },

                        body:
                            formData
                    }
                );


            const data =
                await response.json();


            if (
                response.status ===
                401
            ) {

                logout();

                return;
            }


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Unable to upload logo."
                );

            }


            /* -----------------------------------------
               PUT SERVER URL INTO LOGO FIELD
            ----------------------------------------- */

            restaurantLogo.value =
            `${window.location.origin}${data.logo}`;

            updateRestaurantLogoPreview(
                data.logo
            );


            restaurantLogoUploadStatus.textContent =
                "✓ Logo uploaded successfully";


        } catch (error) {

            console.error(
                "LOGO UPLOAD ERROR:",
                error
            );


            restaurantLogoUploadStatus.textContent =
                "";


            alert(
                error.message ||
                "Unable to upload logo."
            );


        } finally {

            /*
             * Allow selecting the same file again.
             */

            restaurantLogoFile.value =
                "";

        }

    }
);




/* =====================================================
    SAVE RESTAURANT PROFILE
===================================================== */

restaurantProfileForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        saveRestaurantProfile.disabled =
            true;


        saveRestaurantProfile.textContent =
            "⏳ Saving...";


        const settings = {

            restaurant_name:
                restaurantName.value.trim(),

            description:
                restaurantDescription.value.trim(),

            phone:
                restaurantPhone.value.trim(),

            email:
                restaurantEmail.value.trim(),

            address:
                restaurantAddress.value.trim(),

            opening_hours:
                restaurantHours.value.trim(),

            tax_rate:
                Number(
                    restaurantTax.value || 0
                ),

            logo:
                restaurantLogo.value.trim()
        };


        try {

            const response =
                await fetch(
                    "/api/admin/settings",
                    {
                        method: "PUT",

                        headers:
                            headers(),

                        body:
                            JSON.stringify(
                                settings
                            )
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                alert(
                    data.message ||
                    "Unable to save restaurant profile."
                );

                return;
            }


            updateRestaurantLogoPreview(
                settings.logo
            );


            saveRestaurantProfile.textContent =
                "✓ Saved Successfully";


            setTimeout(
                () => {

                    saveRestaurantProfile.textContent =
                        "💾 Save Restaurant Profile";

                },
                2000
            );


        } catch (error) {

            console.error(
                "SAVE RESTAURANT PROFILE ERROR:",
                error
            );


            alert(
                "Unable to connect to server."
            );


        } finally {

            saveRestaurantProfile.disabled =
                false;

        }

    }
);


/* =====================================================
    Live logo preview
===================================================== */

restaurantLogo.addEventListener(
    "input",
    () => {

        updateRestaurantLogoPreview(
            restaurantLogo.value.trim()
        );

    }
);



/* =====================================================
   CATEGORIES
===================================================== */

categoryForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const name =
            categoryName.value.trim();

        const selectedCategoryType =
            categoryType.options[
                categoryType.selectedIndex
            ].value;

        console.log(
            "CATEGORY TYPE BEING SENT:",
            selectedCategoryType
        );

        if (!name) {
            return;
        }


        const response =
            await fetch(
                "/api/admin/categories",
                {
                    method: "POST",

                    headers:
                        headers(),

                    body:
                        JSON.stringify({
                            name,
                            category_type:
                                selectedCategoryType
                        })
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message ||
                "Unable to create category."
            );

            return;
        }


        categoryName.value = "";

        await loadCategories();
    }
);


async function loadCategories() {

    const response =
        await fetch(
            "/api/admin/categories",
            {
                headers:
                    headers()
            }
        );


    if (
        response.status === 401
    ) {

        logout();

        return;
    }


    const data =
        await response.json();


    categoryList.innerHTML = "";


    menuCategory.innerHTML = `
        <option value="">
            Select category
        </option>
    `;


    /* =====================================================
       SPLIT RESTAURANT AND CAFÉ CATEGORIES
    ===================================================== */

    const restaurantCategories =
        data.categories.filter(
            category =>
                category.category_type !== "cafe"
        );


    const cafeCategories =
        data.categories.filter(
            category =>
                category.category_type === "cafe"
        );


    /* =====================================================
       CREATE CATEGORY GROUP
    ===================================================== */

    function addCategoryGroup(
        title,
        emoji,
        categories
    ) {

        if (
            categories.length === 0
        ) {

            return;
        }


        const heading =
            document.createElement(
                "div"
            );


        heading.className =
            "category-group-heading";


        heading.innerHTML = `
            <strong>
                ${emoji} ${title}
            </strong>
        `;


        categoryList.appendChild(
            heading
        );


        categories.forEach(
            category => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "category-item";


                item.innerHTML = `
                    <div
                        class="category-item-info"
                    >

                        <span>
                            ${escapeHtml(
                                category.name
                            )}
                        </span>

                        <small>
                            #${categories.indexOf(category) + 1}
                        </small>

                    </div>


                    <button
                        type="button"
                        class="small-button delete"
                        data-category-delete-id="${category.id}"
                    >
                        🗑️ Delete
                    </button>
                `;


                categoryList.appendChild(
                    item
                );

            }
        );

    }


    /* =====================================================
       ADMIN CATEGORY LIST
    ===================================================== */

    addCategoryGroup(
        "Restaurant",
        "🍽️",
        restaurantCategories
    );


    addCategoryGroup(
        "Café",
        "☕",
        cafeCategories
    );


    /* =====================================================
       MENU CATEGORY DROPDOWN
    ===================================================== */

    if (
        restaurantCategories.length > 0
    ) {

        const restaurantGroup =
            document.createElement(
                "optgroup"
            );


        restaurantGroup.label =
            "🍽️ Restaurant";


        restaurantCategories.forEach(
            category => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    category.id;


                option.textContent =
                    category.name;


                restaurantGroup.appendChild(
                    option
                );

            }
        );


        menuCategory.appendChild(
            restaurantGroup
        );

    }


    if (
        cafeCategories.length > 0
    ) {

        const cafeGroup =
            document.createElement(
                "optgroup"
            );


        cafeGroup.label =
            "☕ Café";


        cafeCategories.forEach(
            category => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    category.id;


                option.textContent =
                    category.name;


                cafeGroup.appendChild(
                    option
                );

            }
        );


        menuCategory.appendChild(
            cafeGroup
        );

    }


    /* =====================================================
       DELETE CATEGORY
    ===================================================== */

    document
        .querySelectorAll(
            "[data-category-delete-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            Number(
                                button.dataset
                                    .categoryDeleteId
                            );


                        const category =
                            data.categories.find(
                                item =>
                                    Number(
                                        item.id
                                    ) === id
                            );


                        if (!category) {

                            alert(
                                "Category not found."
                            );

                            return;
                        }


                        const confirmed =
                            confirm(
                                `Delete "${category.name}"?\n\n` +
                                `All menu items inside this category ` +
                                `will also be deleted.\n\n` +
                                `This action cannot be undone.`
                            );


                        if (!confirmed) {

                            return;
                        }


                        button.disabled =
                            true;


                        button.textContent =
                            "⏳ Deleting...";


                        try {

                            const response =
                                await fetch(
                                    `/api/admin/categories/${id}`,
                                    {
                                        method:
                                            "DELETE",

                                        headers:
                                            headers()
                                    }
                                );


                            const result =
                                await response.json();


                            if (
                                !response.ok ||
                                !result.success
                            ) {

                                throw new Error(
                                    result.message ||
                                    "Unable to delete category."
                                );

                            }


                            await loadCategories();


                            await loadMenu();


                        } catch (error) {

                            console.error(
                                "DELETE CATEGORY ERROR:",
                                error
                            );


                            alert(
                                error.message ||
                                "Unable to delete category."
                            );


                            button.disabled =
                                false;


                            button.textContent =
                                "🗑️ Delete";

                        }

                    }
                );

            }
        );

}
/* =====================================================
   MENU
===================================================== */

menuForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const data = {

            category_id:
                Number(
                    menuCategory.value
                ),

            name:
                document
                    .getElementById(
                        "menuName"
                    )
                    .value
                    .trim(),

            description:
                document
                    .getElementById(
                        "menuDescription"
                    )
                    .value
                    .trim(),

            price:
                Number(
                    document
                        .getElementById(
                            "menuPrice"
                        )
                        .value
                ),

            image:
                document
                    .getElementById(
                        "menuImage"
                    )
                    .value
                    .trim(),

            veg:
                document
                    .getElementById(
                        "menuVeg"
                    )
                    .value === "1",

            available:
                true
        };


        const isEditing =
            editingMenuId !== null;


        const url =
            isEditing
                ? `/api/admin/menu/${editingMenuId}`
                : "/api/admin/menu";


        const response =
            await fetch(
                url,
                {
                    method:
                        isEditing
                            ? "PUT"
                            : "POST",

                    headers:
                        headers(),

                    body:
                        JSON.stringify(data)
                }
            );


        const result =
            await response.json();


        if (!result.success) {

            alert(
                result.message ||
                "Unable to save item."
            );

            return;
        }


        resetMenuForm();

        await loadMenu();
    }
);


function resetMenuForm() {

    editingMenuId = null;


    menuForm.reset();


    menuCategory.value = "";


    menuSubmitButton.textContent =
        "+ Add Food Item";


    cancelMenuEditButton.style.display =
        "none";
}


cancelMenuEditButton.addEventListener(
    "click",
    resetMenuForm
);



async function loadMenu() {

    const response =
        await fetch(
            "/api/admin/menu",
            {
                headers:
                    headers()
            }
        );


    if (
        response.status === 401
    ) {

        logout();

        return;
    }


    const data =
        await response.json();


    menuList.innerHTML = "";


    const items =
        Array.isArray(data.items)
            ? data.items
            : [];


    /* =====================================================
       GET CATEGORY INFORMATION
    ===================================================== */

    let categories = [];

    try {

        const categoryResponse =
            await fetch(
                "/api/admin/categories",
                {
                    headers:
                        headers()
                }
            );


        if (
            categoryResponse.status === 401
        ) {

            logout();

            return;
        }


        const categoryData =
            await categoryResponse.json();


        categories =
            Array.isArray(
                categoryData.categories
            )
                ? categoryData.categories
                : [];

    } catch (error) {

        console.error(
            "LOAD MENU CATEGORIES ERROR:",
            error
        );

    }


    /* =====================================================
       CREATE CATEGORY LOOKUP
    ===================================================== */

    const categoryMap =
        new Map();


    categories.forEach(
        category => {

            categoryMap.set(
                Number(category.id),
                category
            );

        }
    );


    /* =====================================================
       SPLIT MENU ITEMS
    ===================================================== */

    const restaurantItems =
        items.filter(
            item => {

                const category =
                    categoryMap.get(
                        Number(
                            item.category_id
                        )
                    );


                return !category ||
                    category.category_type !==
                        "cafe";

            }
        );


    const cafeItems =
        items.filter(
            item => {

                const category =
                    categoryMap.get(
                        Number(
                            item.category_id
                        )
                    );


                return (
                    category &&
                    category.category_type ===
                        "cafe"
                );

            }
        );


    /* =====================================================
       CATEGORY NAME HELPER
    ===================================================== */

    function getCategoryName(
        item
    ) {

        const category =
            categoryMap.get(
                Number(
                    item.category_id
                )
            );


        return (
            category?.name ||
            item.category_name ||
            "Uncategorized"
        );

    }


    /* =====================================================
       CREATE MENU ITEM CARD
    ===================================================== */

    function createMenuCard(
        item
    ) {

        const card =
            document.createElement(
                "article"
            );


        card.className =
            "admin-menu-card";


        const category =
            categoryMap.get(
                Number(
                    item.category_id
                )
            );


        const categoryType =
            category &&
            category.category_type ===
                "cafe"
                ? "☕ Café"
                : "🍽️ Restaurant";


        card.innerHTML = `

            ${
                item.image
                    ? `
                        <div
                            class="admin-menu-image"
                        >
                            <img
                                src="${escapeHtml(
                                    item.image
                                )}"
                                alt="${escapeHtml(
                                    item.name
                                )}"
                                loading="lazy"
                                onerror="
                                    this.parentElement.style.display='none';
                                "
                            >
                        </div>
                    `
                    : ""
            }


            <div
                class="admin-menu-card-content"
            >

                <div
                    class="admin-menu-category-type"
                >
                    ${categoryType}
                </div>


                <h3>
                    ${escapeHtml(
                        item.name
                    )}
                </h3>


                <p
                    class="admin-menu-category"
                >
                    ${escapeHtml(
                        getCategoryName(
                            item
                        )
                    )}
                </p>


                ${
                    item.description
                        ? `
                            <p>
                                ${escapeHtml(
                                    item.description
                                )}
                            </p>
                        `
                        : ""
                }


                <div
                    class="admin-menu-price"
                >
                    ₹${Number(
                        item.price
                    ).toFixed(0)}
                </div>


                <p>
                    ${
                        item.available
                            ? "🟢 Available"
                            : "🔴 Unavailable"
                    }
                </p>


                <div
                    class="admin-menu-actions"
                >

                    <button
                        class="small-button"
                        type="button"
                        data-edit-id="${item.id}"
                    >
                        ✏️ Edit
                    </button>


                    <button
                        class="small-button"
                        type="button"
                        data-toggle-id="${item.id}"
                    >
                        ${
                            item.available
                                ? "Mark Unavailable"
                                : "Mark Available"
                        }
                    </button>


                    <button
                        class="small-button delete"
                        type="button"
                        data-delete-id="${item.id}"
                    >
                        🗑️ Delete
                    </button>

                </div>

            </div>
        `;


        return card;

    }


    /* =====================================================
       CREATE MENU GROUP
    ===================================================== */

    function addMenuGroup(
        title,
        emoji,
        groupItems
    ) {

        if (
            groupItems.length === 0
        ) {

            return;
        }


        const heading =
            document.createElement(
                "div"
            );


        heading.className =
            "menu-group-heading";


        heading.innerHTML = `
            <strong>
                ${emoji} ${title}
            </strong>
        `;


        menuList.appendChild(
            heading
        );


        /*
         * Group items by category
         */

        const grouped =
            new Map();


        groupItems.forEach(
            item => {

                const categoryName =
                    getCategoryName(
                        item
                    );


                if (
                    !grouped.has(
                        categoryName
                    )
                ) {

                    grouped.set(
                        categoryName,
                        []
                    );

                }


                grouped
                    .get(categoryName)
                    .push(item);

            }
        );


        /*
         * Render each category
         */

        grouped.forEach(
            (
                categoryItems,
                categoryName
            ) => {

                const categoryHeading =
                    document.createElement(
                        "div"
                    );


                categoryHeading.className =
                    "menu-category-heading";


                categoryHeading.innerHTML = `
                    <h3>
                        ${escapeHtml(
                            categoryName
                        )}
                    </h3>
                `;


                menuList.appendChild(
                    categoryHeading
                );


                categoryItems.forEach(
                    item => {

                        menuList.appendChild(
                            createMenuCard(
                                item
                            )
                        );

                    }
                );

            }
        );

    }


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    if (
        items.length === 0
    ) {

        menuList.innerHTML = `
            <div class="orders-empty">

                <div>
                    🍽️
                </div>

                <strong>
                    No menu items yet
                </strong>

                <p>
                    Add food or café items
                    using the form above.
                </p>

            </div>
        `;

        return;
    }


    /* =====================================================
       RESTAURANT MENU
    ===================================================== */

    addMenuGroup(
        "Restaurant Menu",
        "🍽️",
        restaurantItems
    );


    /* =====================================================
       CAFÉ MENU
    ===================================================== */

    addMenuGroup(
        "Café Menu",
        "☕",
        cafeItems
    );


    /* =====================================================
       EDIT MENU ITEMS
    ===================================================== */

    document
        .querySelectorAll(
            "[data-edit-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async function () {

                        const id =
                            Number(
                                this.dataset
                                    .editId
                            );


                        if (!id) {

                            alert(
                                "Invalid menu item."
                            );

                            return;
                        }


                        try {

                            const response =
                                await fetch(
                                    "/api/admin/menu",
                                    {
                                        method:
                                            "GET",

                                        headers:
                                            headers(),

                                        cache:
                                            "no-store"
                                    }
                                );


                            if (
                                response.status ===
                                401
                            ) {

                                logout();

                                return;
                            }


                            if (
                                !response.ok
                            ) {

                                throw new Error(
                                    `Server returned ${response.status}`
                                );

                            }


                            const data =
                                await response.json();


                            const item =
                                data.items.find(
                                    menuItem =>
                                        Number(
                                            menuItem.id
                                        ) === id
                                );


                            if (!item) {

                                alert(
                                    "Menu item not found."
                                );

                                return;
                            }


                            /* =========================
                               ENTER EDIT MODE
                            ========================= */

                            editingMenuId =
                                Number(
                                    item.id
                                );


                            /* CATEGORY */

                            menuCategory.value =
                                String(
                                    item.category_id
                                );


                            /* FOOD NAME */

                            document
                                .getElementById(
                                    "menuName"
                                )
                                .value =
                                item.name || "";


                            /* DESCRIPTION */

                            document
                                .getElementById(
                                    "menuDescription"
                                )
                                .value =
                                item.description ||
                                "";


                            /* PRICE */

                            document
                                .getElementById(
                                    "menuPrice"
                                )
                                .value =
                                item.price ?? "";


                            /* IMAGE */

                            document
                                .getElementById(
                                    "menuImage"
                                )
                                .value =
                                item.image || "";


                            /* FOOD TYPE */

                            document
                                .getElementById(
                                    "menuVeg"
                                )
                                .value =
                                Number(
                                    item.veg
                                ) === 1
                                    ? "1"
                                    : "0";


                            /* UPDATE BUTTON */

                            menuSubmitButton.textContent =
                                "✓ Update Food Item";


                            /* CANCEL BUTTON */

                            cancelMenuEditButton
                                .style
                                .display =
                                "inline-flex";


                            /* SCROLL TO FORM */

                            menuForm.scrollIntoView({
                                behavior:
                                    "smooth",

                                block:
                                    "center"
                            });


                        } catch (error) {

                            console.error(
                                "EDIT MENU ITEM ERROR:",
                                error
                            );


                            alert(
                                error.message ||
                                "Unable to load menu item."
                            );

                        }

                    }
                );

            }
        );


    /* =====================================================
       TOGGLE AVAILABILITY
    ===================================================== */

    document
        .querySelectorAll(
            "[data-toggle-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            Number(
                                button.dataset
                                    .toggleId
                            );


                        const response =
                            await fetch(
                                "/api/admin/menu",
                                {
                                    headers:
                                        headers()
                                }
                            );


                        const data =
                            await response.json();


                        const item =
                            data.items.find(
                                item =>
                                    Number(
                                        item.id
                                    ) === id
                            );


                        if (!item) {

                            return;
                        }


                        await fetch(
                            `/api/admin/menu/${id}`,
                            {
                                method:
                                    "PUT",

                                headers:
                                    headers(),

                                body:
                                    JSON.stringify({
                                        category_id:
                                            item.category_id,

                                        name:
                                            item.name,

                                        description:
                                            item.description,

                                        price:
                                            item.price,

                                        image:
                                            item.image,

                                        veg:
                                            Boolean(
                                                item.veg
                                            ),

                                        available:
                                            !Boolean(
                                                item.available
                                            )
                                    })
                            }
                        );


                        await loadMenu();

                    }
                );

            }
        );


   /* =====================================================
   DELETE MENU ITEMS
===================================================== */

document
    .querySelectorAll(
        "[data-delete-id]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        Number(
                            button.dataset
                                .deleteId
                        );


                    if (
                        !Number.isInteger(id)
                    ) {

                        alert(
                            "Invalid menu item."
                        );

                        return;
                    }


                    const confirmed =
                        confirm(
                            "Delete this menu item?\n\nThis action cannot be undone."
                        );


                    if (!confirmed) {
                        return;
                    }


                    const originalText =
                        button.innerHTML;


                    button.disabled =
                        true;


                    button.innerHTML =
                        "⏳ Deleting...";


                    try {

                        const response =
                            await fetch(
                                `/api/admin/menu/${id}`,
                                {
                                    method:
                                        "DELETE",

                                    headers:
                                        headers()
                                }
                            );


                        const data =
                            await response.json();


                        console.log(
                            "DELETE MENU RESPONSE:",
                            response.status,
                            data
                        );


                        if (
                            response.status ===
                            401
                        ) {

                            logout();

                            return;
                        }


                        if (
                            !response.ok ||
                            !data.success
                        ) {

                            throw new Error(
                                data.message ||
                                "Unable to delete menu item."
                            );

                        }


                        /* ---------------------------------
                           SUCCESS
                        --------------------------------- */

                        await loadMenu();


                    } catch (error) {

                        console.error(
                            "DELETE MENU ITEM ERROR:",
                            error
                        );


                        alert(
                            error.message ||
                            "Unable to delete menu item."
                        );


                        button.disabled =
                            false;


                        button.innerHTML =
                            originalText;

                    }

                }
            );

        }
    );
}


/* =====================================================
   LOGOUT
===================================================== */

logoutButton.addEventListener(
    "click",
    logout
);


async function logout() {

    const currentToken =
        sessionStorage.getItem("adminToken");

    try {
        if (currentToken) {
            await fetch(
                "/api/admin/logout",
                {
                    method: "POST",
                    headers: {
                        "x-admin-token": currentToken
                    },
                    keepalive: true
                }
            );
        }
    } catch (error) {
        console.warn(
            "LOGOUT REQUEST ERROR:",
            error
        );
    } finally {
        sessionStorage.removeItem(
            "adminToken"
        );

        sessionStorage.removeItem(
            "adminUsername"
        );

        window.location.href =
            "/admin/login.html";
    }
}


/* =====================================================
   HELPERS
===================================================== */

function statusLabel(status) {

    const labels = {

        new:
            "NEW",

        accepted:
            "CONFIRMED",

        preparing:
            "PREPARING",

        ready:
            "READY",

        completed:
            "COMPLETED",

        cancelled:
            "CANCELLED"
    };


    return (
        labels[status] ||
        status.toUpperCase()
    );
}


function formatDate(value) {

    if (!value) {
        return "Just now";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;
    }


    return date.toLocaleString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =====================================================
   RESTAURANT QR CODE
===================================================== */

let restaurantMenuUrl =
    window.location.origin + "/";


function initializeRestaurantQr() {

    if (
        !restaurantQr ||
        typeof QRCode === "undefined"
    ) {

        console.error(
            "QR Code library is not available."
        );

        return;
    }


    restaurantMenuUrl =
        window.location.origin + "/";


    restaurantQrUrl.textContent =
        restaurantMenuUrl;


    restaurantQr.innerHTML = "";


    new QRCode(
        restaurantQr,
        {
            text:
                restaurantMenuUrl,

            width:
                180,

            height:
                180,

            colorDark:
                "#111111",

            colorLight:
                "#ffffff",

            correctLevel:
                QRCode.CorrectLevel.H
        }
    );


    setupQrButtons();
}


/* =====================================================
   QR BUTTONS
===================================================== */

function setupQrButtons() {

    downloadQrButton.addEventListener(
        "click",
        downloadRestaurantQr
    );


    printQrButton.addEventListener(
        "click",
        printRestaurantQr
    );


    copyQrLinkButton.addEventListener(
        "click",
        copyRestaurantQrLink
    );
}


/* =====================================================
   DOWNLOAD QR
===================================================== */

function downloadRestaurantQr() {

    const canvas =
        restaurantQr.querySelector("canvas");


    if (!canvas) {

        alert(
            "QR code is not ready yet."
        );

        return;
    }


    canvas.toBlob(
        function (blob) {

            if (!blob) {

                alert(
                    "Unable to create QR image."
                );

                return;
            }


            const url =
                URL.createObjectURL(blob);


            const link =
                document.createElement("a");


            link.href = url;

            link.download =
                "restaurant-menu-qr.png";


            document.body.appendChild(
                link
            );


            link.click();


            document.body.removeChild(
                link
            );


            setTimeout(
                function () {

                    URL.revokeObjectURL(
                        url
                    );

                },
                1000
            );

        },
        "image/png"
    );
}

/* =====================================================
   COPY MENU LINK
===================================================== */

async function copyRestaurantQrLink() {

    try {

        await navigator.clipboard.writeText(
            restaurantMenuUrl
        );


        copyQrLinkButton.textContent =
            "✓ Link Copied";


        setTimeout(
            () => {

                copyQrLinkButton.textContent =
                    "🔗 Copy Menu Link";

            },
            1800
        );


    } catch (error) {

        console.error(error);

        alert(
            `Copy this link:\n\n${restaurantMenuUrl}`
        );
    }
}


/* =====================================================
   PRINT QR
===================================================== */

function printRestaurantQr() {

    const canvas =
        restaurantQr.querySelector("canvas");

    const image =
        restaurantQr.querySelector("img");

    let imageUrl = null;


    if (canvas) {

        imageUrl =
            canvas.toDataURL("image/png");

    } else if (image) {

        imageUrl =
            image.src;
    }


    if (!imageUrl) {

        alert(
            "QR code is not ready yet."
        );

        return;
    }


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=700,height=800"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups to print the QR."
        );

        return;
    }


    printWindow.document.write(`
        <!DOCTYPE html>

        <html>

        <head>

            <title>
                Restaurant Menu QR
            </title>

            <style>

                * {
                    box-sizing: border-box;
                }


                body {
                    margin: 0;

                    min-height: 100vh;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    font-family:
                        Arial,
                        sans-serif;

                    background: white;

                    color: #111;
                }


                .qr-print {
                    width: 520px;

                    padding: 45px;

                    text-align: center;

                    border:
                        2px solid #111;

                    border-radius: 25px;
                }


                h1 {
                    margin:
                        0 0 10px;

                    font-size: 30px;
                }


                p {
                    margin:
                        0 0 25px;

                    color: #555;

                    font-size: 15px;
                }


                .qr-image {
                    width: 320px;

                    height: 320px;

                    display: block;

                    margin: 0 auto;

                    image-rendering:
                        pixelated;
                }


                .scan {
                    margin-top: 25px;

                    font-size: 22px;

                    font-weight: 900;
                }


                .sub {
                    margin-top: 8px;

                    color: #666;

                    font-size: 13px;
                }


                @media print {

                    body {
                        min-height: auto;
                    }

                    .qr-print {
                        border: none;
                    }

                }

            </style>

        </head>


        <body>

            <div class="qr-print">

                <h1>
                    Scan to Order
                </h1>

                <p>
                    Scan the QR code to view
                    our menu and place your order.
                </p>


                <img
                    class="qr-image"
                    src="${imageUrl}"
                    alt="Restaurant Menu QR"
                >


                <div class="scan">
                    SCAN • ORDER • ENJOY
                </div>


                <div class="sub">
                    Dine In &nbsp;•&nbsp; Takeaway
                </div>

            </div>


            <script>

                window.onload = function() {

                    setTimeout(
                        function() {
                            window.print();
                        },
                        300
                    );

                };

            <\/script>

        </body>

        </html>
    `);


    printWindow.document.close();
}

initializeRestaurantQr();