const state = {
    orderType: null,
    menu: [],
    cart: [],
    lastOrderNumber: "",
    customer: {
        name: "",
        phone: "",
        tableNumber: "",
        pickupTime: "",
        notes: ""
    }
};


/* =====================================================
   ELEMENTS
===================================================== */

const restaurantName =
    document.getElementById("restaurantName");

const restaurantLogo =
    document.getElementById(
        "restaurantLogo"
    );


const restaurantDescription =
    document.getElementById(
        "restaurantDescription"
    );


const restaurantAddress =
    document.getElementById(
        "restaurantAddress"
    );


const restaurantPhone =
    document.getElementById(
        "restaurantPhone"
    );


const restaurantEmail =
    document.getElementById(
        "restaurantEmail"
    );


const restaurantHours =
    document.getElementById(
        "restaurantHours"
    );


let taxRate = 5;

const orderSection =
    document.getElementById("orderSection");

const customerSection =
    document.getElementById("customerSection");

const customerTitle =
    document.getElementById("customerTitle");

const tableField =
    document.getElementById("tableField");

const pickupField =
    document.getElementById("pickupField");

const tableNumber =
    document.getElementById("tableNumber");

const customerName =
    document.getElementById("customerName");

const customerPhone =
    document.getElementById("customerPhone");

const pickupTime =
    document.getElementById("pickupTime");

const continueButton =
    document.getElementById("continueButton");

const menuSection =
    document.getElementById("menuSection");

const categories =
    document.getElementById("categories");

const menuItems =
    document.getElementById("menuItems");

const loading =
    document.getElementById("loading");

const toast =
    document.getElementById("toast");

const cartCount =
    document.getElementById("cartCount");


const sidebarCartButton =
    document.getElementById("sidebarCartButton");

const sidebarCartCount =
    document.getElementById("sidebarCartCount");


const floatingCart =
    document.getElementById("floatingCart");

const floatingCartCount =
    document.getElementById("floatingCartCount");

const floatingCartTotal =
    document.getElementById("floatingCartTotal");

const cartOverlay =
    document.getElementById("cartOverlay");

const cartBackdrop =
    document.getElementById("cartBackdrop");

const cartClose =
    document.getElementById("cartClose");

const cartItems =
    document.getElementById("cartItems");

const cartSubtotal =
    document.getElementById("cartSubtotal");

const cartTax =
    document.getElementById("cartTax");

const cartTotal =
    document.getElementById("cartTotal");

const checkoutButton =
    document.getElementById("checkoutButton");

const checkoutOverlay =
    document.getElementById("checkoutOverlay");

const checkoutBackdrop =
    document.getElementById("checkoutBackdrop");

const checkoutClose =
    document.getElementById("checkoutClose");

const checkoutOrderType =
    document.getElementById("checkoutOrderType");

const checkoutTableBox =
    document.getElementById("checkoutTableBox");

const checkoutTable =
    document.getElementById("checkoutTable");

const checkoutName =
    document.getElementById("checkoutName");

const checkoutPhone =
    document.getElementById("checkoutPhone");

const checkoutPickupBox =
    document.getElementById("checkoutPickupBox");

const checkoutPickup =
    document.getElementById("checkoutPickup");

const checkoutNotes =
    document.getElementById("checkoutNotes");

const checkoutTotal =
    document.getElementById("checkoutTotal");

const placeOrderButton =
    document.getElementById("placeOrderButton");

const successOverlay =
    document.getElementById("successOverlay");

const successOrderNumber =
    document.getElementById("successOrderNumber");

const successBill =
    document.getElementById("successBill");

const newOrderButton =
    document.getElementById("newOrderButton");

const trackOrderButton =
    document.getElementById(
        "trackOrderButton"
    );

const trackOrderNav =
    document.getElementById(
        "trackOrderNav"
    );

const trackOrdersOverlay =
    document.getElementById(
        "trackOrdersOverlay"
    );

const trackOrdersBackdrop =
    document.getElementById(
        "trackOrdersBackdrop"
    );

const trackOrdersClose =
    document.getElementById(
        "trackOrdersClose"
    );

const trackOrdersList =
    document.getElementById(
        "trackOrdersList"
    );

/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    try {

        await loadRestaurant();

        await loadTables();

        await loadMenu();

        setupOrderButtons();

        setupContinueButton();

        setupCart();

        setupCheckout();

        setupCustomerOrderHistory();

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to load restaurant data."
        );
    }
}


/* =====================================================
   RESTAURANT
===================================================== */

async function loadRestaurant() {

    const response =
        await fetch(
            "/api/settings"
        );


    const data =
        await response.json();


    if (
        !data.success ||
        !data.settings
    ) {

        return;
    }


    const settings =
        data.settings;


    /* =====================================================
       RESTAURANT NAME
    ===================================================== */

    restaurantName.textContent =
        settings.restaurant_name ||
        "My Restaurant";


    /* =====================================================
       LOGO
    ===================================================== */

    if (
        settings.logo &&
        settings.logo.trim()
    ) {

        restaurantLogo.innerHTML = `
            <img
                src="${escapeHtml(
                    settings.logo
                )}"
                alt="${escapeHtml(
                    settings.restaurant_name ||
                    "Restaurant"
                )}"
            >
        `;

    } else {

        restaurantLogo.textContent =
            "🍽️";

    }


    /* =====================================================
       DESCRIPTION
    ===================================================== */

    restaurantDescription.textContent =
        settings.description ||
        "Explore our menu and order your favourites in just a few taps.";


    /* =====================================================
       CONTACT INFORMATION
    ===================================================== */

    restaurantAddress.textContent =
        settings.address
            ? `📍 ${settings.address}`
            : "";


    restaurantPhone.textContent =
        settings.phone
            ? `📞 ${settings.phone}`
            : "";


    restaurantEmail.textContent =
        settings.email
            ? `✉️ ${settings.email}`
            : "";


    restaurantHours.textContent =
        settings.opening_hours
            ? `🕐 ${settings.opening_hours}`
            : "";


    /* =====================================================
       TAX RATE
    ===================================================== */

    const parsedTax =
        Number(
            settings.tax_rate
        );


    if (
        Number.isFinite(
            parsedTax
        ) &&
        parsedTax >= 0
    ) {

        taxRate =
            parsedTax;

    } else {

        taxRate =
            5;

    }

}

/* =====================================================
   TABLES
===================================================== */

async function loadTables() {

    const response =
        await fetch("/api/tables");

    const data =
        await response.json();

    if (!data.success) {
        return;
    }

    tableNumber.innerHTML = `
        <option value="">
            Select your table
        </option>
    `;

    data.tables.forEach(table => {

        const option =
            document.createElement("option");

        option.value =
            table.table_number;

        option.textContent =
            `Table ${table.table_number}`;

        tableNumber.appendChild(option);
    });
}


/* =====================================================
   MENU
===================================================== */

async function loadMenu() {

    loading.classList.remove(
        "hidden"
    );

    const response =
        await fetch("/api/menu");

    const data =
        await response.json();

    loading.classList.add(
        "hidden"
    );

    if (!data.success) {
        return;
    }

    state.menu =
        data.menu || [];
}


/* =====================================================
   ORDER TYPE
===================================================== */

function setupOrderButtons() {

    document
        .querySelectorAll(
            ".order-card"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectOrderType(
                        button.dataset.orderType
                    );
                }
            );
        });
}


function selectOrderType(type) {

    state.orderType =
        type;

    orderSection.classList.add(
        "hidden"
    );

    customerSection.classList.remove(
        "hidden"
    );


    if (type === "dine_in") {

        customerTitle.textContent =
            "Where are you sitting?";

        tableField.classList.remove(
            "hidden"
        );

        pickupField.classList.add(
            "hidden"
        );

    } else {

        customerTitle.textContent =
            "Tell us where to send your order";

        tableField.classList.add(
            "hidden"
        );

        pickupField.classList.remove(
            "hidden"
        );
    }


    customerSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =====================================================
   CUSTOMER DETAILS
===================================================== */

function setupContinueButton() {

    continueButton.addEventListener(
        "click",
        continueToMenu
    );
}


async function continueToMenu() {

    if (
        state.orderType === "dine_in" &&
        !tableNumber.value
    ) {

        showToast(
            "Please select your table."
        );

        tableNumber.focus();

        return;
    }


    /*
       Name and phone are required for
       both Dine In and Takeaway.
    */

    if (!customerName.value.trim()) {

        showToast(
            "Please enter your name."
        );

        customerName.focus();

        return;
    }


    if (!customerPhone.value.trim()) {

        showToast(
            "Please enter your mobile number."
        );

        customerPhone.focus();

        return;
    }


    if (
        customerPhone.value
            .replace(/\D/g, "")
            .length < 10
    ) {

        showToast(
            "Please enter a valid mobile number."
        );

        customerPhone.focus();

        return;
    }


    state.customer.name =
        customerName.value.trim();

    state.customer.phone =
        customerPhone.value.trim();

        state.customer.tableNumber =
        tableNumber.value.trim();

    state.customer.pickupTime =
        pickupTime.value.trim();

    menuSection.classList.remove(
        "hidden"
    );

    customerSection.classList.add(
        "hidden"
    );

    renderMenu();

    menuSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/* =====================================================
   RENDER MENU
===================================================== */

function renderMenu() {

    categories.innerHTML = "";

    menuItems.innerHTML = "";


    if (!state.menu.length) {

        menuItems.innerHTML = `
            <div class="customer-card">
                <h3>
                    Menu coming soon
                </h3>

                <p>
                    Our menu items will appear here.
                </p>
            </div>
        `;

        return;
    }


    state.menu.forEach(
        (category, index) => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "category-button" +
                (
                    index === 0
                        ? " active"
                        : ""
                );

            button.textContent =
                category.name;


            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".category-button"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );

                    button.classList.add(
                        "active"
                    );

                    showCategory(
                        category.id
                    );
                }
            );


            categories.appendChild(
                button
            );
        }
    );


    showCategory(
        state.menu[0].id
    );
}


/* =====================================================
   CATEGORY
===================================================== */

function showCategory(categoryId) {

    menuItems.innerHTML = "";

    const category =
    state.menu.find(
        category =>
            Number(category.id) === Number(categoryId)
    );


    if (!category) {
        return;
    }


    if (!category.items.length) {

        menuItems.innerHTML = `
            <div class="customer-card">
                <p>
                    No items available in this category.
                </p>
            </div>
        `;

        return;
    }


    category.items.forEach(
        item => {

            menuItems.appendChild(
                createMenuItem(item)
            );
        }
    );
}


/* =====================================================
   MENU ITEM
===================================================== */

function createMenuItem(item) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "menu-item";


    const imageContent =
        item.image
            ? `
                <img
                    src="${escapeHtml(item.image)}"
                    alt="${escapeHtml(item.name)}"
                    loading="lazy"
                >
            `
            : getFoodEmoji(
                item.name
            );


    card.innerHTML = `
        <div class="menu-image">
            ${imageContent}
        </div>

        <div class="menu-content">

            <div class="menu-top">

                <div class="menu-name">
                    ${escapeHtml(item.name)}
                </div>

                <div
                    class="veg-dot"
                    title="${
                        item.veg
                            ? "Vegetarian"
                            : "Non-vegetarian"
                    }"
                    style="${
                        item.veg
                            ? ""
                            : "background:#ef5350;box-shadow:0 0 0 4px rgba(239,83,80,.12);"
                    }"
                ></div>

            </div>

            <p class="menu-description">
                ${
                    escapeHtml(
                        item.description ||
                        "Delicious and freshly prepared."
                    )
                }
            </p>

            <div class="menu-bottom">

                <strong class="menu-price">
                    ₹${Number(item.price).toFixed(0)}
                </strong>

                <button
                    class="add-button"
                    type="button"
                >
                    + Add
                </button>

            </div>

        </div>
    `;


    card
        .querySelector(".add-button")
        .addEventListener(
            "click",
            () => addToCart(item)
        );


    return card;
}


/* =====================================================
   ADD TO CART
===================================================== */

function addToCart(item) {

    const existing =
        state.cart.find(
            cartItem =>
                cartItem.id === item.id
        );


    if (existing) {

        existing.quantity += 1;

    } else {

        state.cart.push({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            quantity: 1
        });
    }


    updateCartUI();

    showToast(
        `${item.name} added to cart`
    );
}


/* =====================================================
   CART
===================================================== */

function setupCart() {

    /*
     * Sidebar Cart
     */
    if (sidebarCartButton) {

        sidebarCartButton.addEventListener(
            "click",
            openCart
        );

    }


    /*
     * Old floating cart
     * Keep it optional for compatibility.
     */
    if (floatingCart) {

        floatingCart.addEventListener(
            "click",
            openCart
        );

    }


    if (cartClose) {

        cartClose.addEventListener(
            "click",
            closeCart
        );

    }


    if (cartBackdrop) {

        cartBackdrop.addEventListener(
            "click",
            closeCart
        );

    }

}

function openCart() {

    if (!state.cart.length) {

        showToast(
            "Your cart is empty."
        );

        return;
    }


    renderCart();

    cartOverlay.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";
}


function closeCart() {

    cartOverlay.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";
}


function renderCart() {

    cartItems.innerHTML = "";


    state.cart.forEach(item => {

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "cart-item";


        row.innerHTML = `
            <div class="cart-item-info">

                <div class="cart-item-name">
                    ${escapeHtml(item.name)}
                </div>

                <div class="cart-item-price">
                    ₹${item.price.toFixed(0)}
                    each
                </div>

            </div>


            <div class="quantity-controls">

                <button
                    class="quantity-button"
                    data-action="minus"
                >
                    −
                </button>

                <span
                    class="quantity-number"
                >
                    ${item.quantity}
                </span>

                <button
                    class="quantity-button"
                    data-action="plus"
                >
                    +
                </button>

            </div>
        `;


        row
            .querySelector(
                '[data-action="minus"]'
            )
            .addEventListener(
                "click",
                () =>
                    changeQuantity(
                        item.id,
                        -1
                    )
            );


        row
            .querySelector(
                '[data-action="plus"]'
            )
            .addEventListener(
                "click",
                () =>
                    changeQuantity(
                        item.id,
                        1
                    )
            );


        cartItems.appendChild(row);
    });


    updateCartTotals();
}


function changeQuantity(
    itemId,
    change
) {

    const item =
        state.cart.find(
            cartItem =>
                cartItem.id === itemId
        );


    if (!item) {
        return;
    }


    item.quantity += change;


    if (item.quantity <= 0) {

        state.cart =
            state.cart.filter(
                cartItem =>
                    cartItem.id !== itemId
            );
    }


    updateCartUI();

    renderCart();


    if (!state.cart.length) {
        closeCart();
    }
}


function updateCartUI() {

    const totalQuantity =
        state.cart.reduce(
            (sum, item) =>
                sum + item.quantity,
            0
        );


    const total =
        state.cart.reduce(
            (sum, item) =>
                sum +
                item.price *
                item.quantity,
            0
        );


    /*
     * Sidebar cart count
     */
    if (sidebarCartCount) {

        sidebarCartCount.textContent =
            totalQuantity;

    }


    /*
     * Keep existing cart counter
     * working if it still exists.
     */
    if (cartCount) {

        cartCount.textContent =
            totalQuantity;

    }


    /*
     * Old floating cart is optional now.
     */
    if (
        floatingCartCount &&
        floatingCartTotal
    ) {

        floatingCartCount.textContent =
            `${totalQuantity} ${
                totalQuantity === 1
                    ? "Item"
                    : "Items"
            }`;

        floatingCartTotal.textContent =
            `₹${total.toFixed(0)}`;

    }


    if (floatingCart) {

        if (totalQuantity > 0) {

            floatingCart.classList.remove(
                "hidden"
            );

        } else {

            floatingCart.classList.add(
                "hidden"
            );

        }

    }

}


function updateCartTotals() {

    const subtotal =
        state.cart.reduce(
            (sum, item) =>
                sum +
                item.price *
                item.quantity,
            0
        );


    /*
       We don't trust the browser
       for the final amount.
       Server calculates the final
       bill when order is placed.

       This is only a visual estimate.
    */

    const tax =
        subtotal *
        (taxRate / 100);

    const total =
        subtotal + tax;


    cartSubtotal.textContent =
        `₹${subtotal.toFixed(2)}`;

    cartTax.textContent =
        `₹${tax.toFixed(2)}`;

    cartTotal.textContent =
        `₹${total.toFixed(2)}`;
}


/* =====================================================
   CHECKOUT
===================================================== */

function setupCheckout() {

    checkoutButton.addEventListener(
        "click",
        openCheckout
    );


    checkoutClose.addEventListener(
        "click",
        closeCheckout
    );


    checkoutBackdrop.addEventListener(
        "click",
        closeCheckout
    );


    placeOrderButton.addEventListener(
        "click",
        placeOrder
    );


    newOrderButton.addEventListener(
        "click",
        () => {

            successOverlay.classList.add(
                "hidden"
            );

            document.body.style.overflow =
                "";

            window.location.reload();
        }
    );


    trackOrderButton.addEventListener(
    "click",
    () => {

        const orderNumber =
            state.lastOrderNumber;


        if (!orderNumber) {

            showToast(
                "Order number is not available."
            );

            return;
        }


        window.location.href =
            `/order.html?order=${encodeURIComponent(
                orderNumber
            )}`;
    }
);
}


function openCheckout() {

    if (!state.cart.length) {

        showToast(
            "Your cart is empty."
        );

        return;
    }


    closeCart();


    checkoutOrderType.textContent =
        state.orderType === "dine_in"
            ? "Dine In"
            : "Takeaway";


    if (
        state.orderType === "dine_in"
    ) {

        checkoutTableBox.classList.remove(
            "hidden"
        );

        checkoutTable.textContent =
            `Table ${state.customer.tableNumber}`;

        checkoutPickupBox.classList.add(
            "hidden"
        );

    } else {

        checkoutTableBox.classList.add(
            "hidden"
        );

        checkoutPickupBox.classList.remove(
            "hidden"
        );
    }


    checkoutName.value =
        state.customer.name;

    checkoutPhone.value =
        state.customer.phone;

    checkoutPickup.value =
        state.customer.pickupTime;


    checkoutNotes.value = "";


    const total =
        state.cart.reduce(
            (sum, item) =>
                sum +
                item.price *
                item.quantity,
            0
        );


    checkoutTotal.textContent =
        `₹${(
            total *
            (
                1 +
                taxRate / 100
            )
                    ).toFixed(2)}`;


    checkoutOverlay.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";
}


function closeCheckout() {

    checkoutOverlay.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";
}


/* =====================================================
   PLACE ORDER
===================================================== */

async function placeOrder() {

    if (!state.cart.length) {

        showToast(
            "Your cart is empty."
        );

        return;
    }


    const name =
        checkoutName.value.trim();

    const phone =
        checkoutPhone.value.trim();


    if (
    state.orderType === "dine_in" ||
    state.orderType === "takeaway"
) {

        if (!name) {

            showToast(
                "Please enter your name."
            );

            checkoutName.focus();

            return;
        }


        if (!phone) {

            showToast(
                "Please enter your mobile number."
            );

            checkoutPhone.focus();

            return;
        }


        if (
            phone
                .replace(/\D/g, "")
                .length < 10
        ) {

            showToast(
                "Please enter a valid mobile number."
            );

            checkoutPhone.focus();

            return;
        }
    }


    placeOrderButton.disabled =
        true;

    placeOrderButton.innerHTML =
        "Placing Order...";


    const payload = {

        orderType:
            state.orderType,

        tableNumber:
            state.customer.tableNumber,

        customerName:
            name,

        customerPhone:
            phone,

        pickupTime:
            checkoutPickup.value,

        notes:
            checkoutNotes.value.trim(),

        items:
            state.cart.map(item => ({
                id: item.id,
                quantity: item.quantity
            }))
    };


    try {

        const response =
            await fetch(
                "/api/orders",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            showToast(
                data.message ||
                "Unable to place order."
            );

            return;
        }

        if (phone) {

            localStorage.setItem(
                "rb_customer_phone",
                phone.replace(/\D/g, "")
            );

        }


        closeCheckout();

        state.lastOrderNumber =
            data.order.orderNumber;

        showSuccess(
            data.order
        );


    } catch (error) {

        console.error(error);

        showToast(
            "Unable to connect to server."
        );

    } finally {

        placeOrderButton.disabled =
            false;

        placeOrderButton.innerHTML =
            `
                Place Order
                <span>✓</span>
            `;
    }
}


/* =====================================================
   SUCCESS / BILL
===================================================== */

function showSuccess(order) {

    successOrderNumber.textContent =
        order.orderNumber;


    let html = "";


    order.items.forEach(item => {

        html += `
            <div class="success-bill-row">

                <span>
                    ${escapeHtml(item.name)}
                    × ${item.quantity}
                </span>

                <strong>
                    ₹${Number(
                        item.total
                    ).toFixed(2)}
                </strong>

            </div>
        `;
    });


    html += `
        <div class="success-bill-row">

            <span>
                Subtotal
            </span>

            <strong>
                ₹${Number(
                    order.subtotal
                ).toFixed(2)}
            </strong>

        </div>


        <div class="success-bill-row">

            <span>
                Tax
            </span>

            <strong>
                ₹${Number(
                    order.tax
                ).toFixed(2)}
            </strong>

        </div>


        <div class="success-bill-total">

            <span>
                Total
            </span>

            <strong>
                ₹${Number(
                    order.total
                ).toFixed(2)}
            </strong>

        </div>
    `;


    successBill.innerHTML =
        html;


    successOverlay.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";


    state.cart = [];

    updateCartUI();
}


/* =====================================================
   TOAST
===================================================== */

let toastTimer;


function showToast(message) {

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );
}


/* =====================================================
   HELPERS
===================================================== */

function getFoodEmoji(name) {

    const value =
        name.toLowerCase();


    if (
        value.includes("biryani")
    ) {
        return "🍛";
    }


    if (
        value.includes("pizza")
    ) {
        return "🍕";
    }


    if (
        value.includes("burger")
    ) {
        return "🍔";
    }


    if (
        value.includes("chicken")
    ) {
        return "🍗";
    }


    if (
        value.includes("cake") ||
        value.includes("dessert")
    ) {
        return "🍰";
    }


    if (
        value.includes("drink") ||
        value.includes("juice") ||
        value.includes("coke")
    ) {
        return "🥤";
    }


    return "🍽️";
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
   CUSTOMER ORDER HISTORY
===================================================== */

function setupCustomerOrderHistory() {

    if (trackOrderNav) {

        trackOrderNav.addEventListener(
            "click",
            openCustomerOrderHistory
        );

    }


    if (trackOrdersClose) {

        trackOrdersClose.addEventListener(
            "click",
            closeCustomerOrderHistory
        );

    }


    if (trackOrdersBackdrop) {

        trackOrdersBackdrop.addEventListener(
            "click",
            closeCustomerOrderHistory
        );

    }

}


/* =====================================================
   OPEN TODAY'S ORDERS
===================================================== */

async function openCustomerOrderHistory() {

    const phone =
        getCustomerPhone();


    if (!phone) {

        showToast(
            "Place an order with your mobile number first."
        );

        return;

    }


    trackOrdersOverlay.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";


    renderOrderHistoryLoading();


    try {

        const now =
            new Date();


        /*
         * Start of today in the customer's
         * browser timezone.
         */

        const startOfDay =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                0,
                0,
                0,
                0
            );


        /*
         * Start of tomorrow.
         */

        const startOfTomorrow =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1,
                0,
                0,
                0,
                0
            );


        const from =
            formatSqlDate(
                startOfDay
            );


        const to =
            formatSqlDate(
                startOfTomorrow
            );


        const response =
            await fetch(
                `/api/orders/history/today?phone=${encodeURIComponent(
                    phone
                )}&from=${encodeURIComponent(
                    from
                )}&to=${encodeURIComponent(
                    to
                )}`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load orders."
            );

        }


        renderCustomerOrders(
            data.orders || []
        );


    } catch (error) {

        console.error(
            "ORDER HISTORY:",
            error
        );


        trackOrdersList.innerHTML = `

            <div class="track-orders-empty">

                <div class="track-empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load orders
                </h3>

                <p>
                    Please try again.
                </p>

            </div>

        `;

    }

}


/* =====================================================
   CUSTOMER PHONE
===================================================== */

function getCustomerPhone() {

    /*
     * First use the phone remembered
     * from the current customer.
     */

    const storedPhone =
        localStorage.getItem(
            "rb_customer_phone"
        );


    if (storedPhone) {

        return storedPhone
            .replace(/\D/g, "");

    }


    /*
     * Fallback to the current checkout state.
     */

    if (
        typeof checkoutPhone !==
        "undefined" &&
        checkoutPhone &&
        checkoutPhone.value
    ) {

        return checkoutPhone.value
            .replace(/\D/g, "");

    }


    return "";

}


/* =====================================================
   FORMAT DATE FOR SQLITE
===================================================== */

function formatSqlDate(date) {

    return date
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

}


/* =====================================================
   LOADING
===================================================== */

function renderOrderHistoryLoading() {

    trackOrdersList.innerHTML = `

        <div class="track-orders-loading">

            <div class="loader"></div>

            <p>
                Loading today's orders...
            </p>

        </div>

    `;

}


/* =====================================================
   RENDER ORDERS
===================================================== */

function renderCustomerOrders(
    orders
) {

    if (!orders.length) {

        trackOrdersList.innerHTML = `

            <div class="track-orders-empty">

                <div class="track-empty-icon">
                    🧾
                </div>

                <h3>
                    No orders today
                </h3>

                <p>
                    Your orders placed today
                    will appear here.
                </p>

            </div>

        `;

        return;

    }


    trackOrdersList.innerHTML =
        orders
            .map(
                renderCustomerOrderCard
            )
            .join("");


    trackOrdersList
        .querySelectorAll(
            "[data-track-order]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const orderNumber =
                            button.dataset
                                .trackOrder;

                        if (!orderNumber) {
                            return;
                        }


                        window.location.href =
                            `/order.html?order=${encodeURIComponent(
                                orderNumber
                            )}`;

                    }
                );

            }
        );

}


/* =====================================================
   ORDER CARD
===================================================== */

function renderCustomerOrderCard(
    order
) {

    const statusInfo =
        getOrderStatusInfo(
            order.status
        );


    const itemCount =
        (order.items || [])
            .reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.quantity || 0
                    ),
                0
            );


    const createdAt =
        formatOrderTime(
            order.created_at
        );


    const preview =
        (order.items || [])
            .slice(0, 3)
            .map(
                item =>
                    `${escapeHtml(
                        item.item_name
                    )} × ${
                        item.quantity
                    }`
            )
            .join(" • ");


    return `

        <button
            type="button"
            class="track-order-card"
            data-track-order="${escapeHtml(
                order.order_number
            )}"
        >

            <div class="track-order-card-top">

                <div>

                    <span class="track-order-label">
                        ORDER
                    </span>

                    <strong class="track-order-number">
                        #${escapeHtml(
                            order.order_number
                        )}
                    </strong>

                </div>


                <span
                    class="track-status-badge ${statusInfo.className}"
                >
                    ${statusInfo.icon}
                    ${statusInfo.label}
                </span>

            </div>


            <div class="track-order-card-middle">

                <div>

                    <strong>
                        ${itemCount}
                        ${
                            itemCount === 1
                                ? "item"
                                : "items"
                        }
                    </strong>

                    <span>
                        ${createdAt}
                    </span>

                </div>


                <strong class="track-order-total">
                    ₹${Number(
                        order.total
                    ).toFixed(2)}
                </strong>

            </div>


            <p class="track-order-items">
                ${preview || "Order items"}
            </p>


            <div class="track-order-card-footer">

                <span>
                    ${
                        order.order_type ===
                        "dine_in"
                            ? "🍽 Dine In"
                            : "🥡 Takeaway"
                    }
                </span>

                <span>
                    View tracking →
                </span>

            </div>

        </button>

    `;

}


/* =====================================================
   STATUS
===================================================== */

function getOrderStatusInfo(
    status
) {

    switch (status) {

        case "accepted":

            return {
                label: "Accepted",
                icon: "✓",
                className:
                    "status-accepted"
            };


        case "preparing":

            return {
                label: "Preparing",
                icon: "🔥",
                className:
                    "status-preparing"
            };


        case "ready":

            return {
                label: "Ready",
                icon: "📦",
                className:
                    "status-ready"
            };


        case "completed":

            return {
                label: "Completed",
                icon: "✓",
                className:
                    "status-completed"
            };


        case "cancelled":

            return {
                label: "Cancelled",
                icon: "×",
                className:
                    "status-cancelled"
            };


        default:

            return {
                label: "Received",
                icon: "●",
                className:
                    "status-new"
            };

    }

}


/* =====================================================
   TIME
===================================================== */

function formatOrderTime(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(
            value.replace(" ", "T") +
            "Z"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleTimeString(
        [],
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


/* =====================================================
   CLOSE
===================================================== */

function closeCustomerOrderHistory() {

    if (!trackOrdersOverlay) {
        return;
    }


    trackOrdersOverlay.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}