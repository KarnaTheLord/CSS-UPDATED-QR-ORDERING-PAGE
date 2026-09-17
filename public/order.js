/* =====================================================
   CUSTOMER ORDER TRACKING
===================================================== */

const params =
    new URLSearchParams(
        window.location.search
    );


const orderNumber =
    params.get("order");


const restaurantName =
    document.getElementById(
        "restaurantName"
    );


const restaurantLogo =
    document.getElementById(
        "restaurantLogo"
    );


const orderNumberElement =
    document.getElementById(
        "orderNumber"
    );


const statusTitle =
    document.getElementById(
        "statusTitle"
    );


const statusIcon =
    document.getElementById(
        "statusIcon"
    );


const statusMessage =
    document.getElementById(
        "statusMessage"
    );


const orderItems =
    document.getElementById(
        "orderItems"
    );


const subtotalElement =
    document.getElementById(
        "subtotal"
    );


const taxElement =
    document.getElementById(
        "tax"
    );


const totalElement =
    document.getElementById(
        "total"
    );


const orderInfo =
    document.getElementById(
        "orderInfo"
    );


const errorState =
    document.getElementById(
        "errorState"
    );


const printBillButton =
    document.getElementById(
        "printBillButton"
    );


const backMenuButton =
    document.getElementById(
        "backMenuButton"
    );


let currentOrder = null;


/* =====================================================
   VALIDATE ORDER NUMBER
===================================================== */

if (!orderNumber) {

    showError();

} else {

    orderNumberElement.textContent =
        `#${orderNumber}`;

    loadRestaurant();

    loadOrder();
}


/* =====================================================
   SOCKET
===================================================== */

const socket =
    io();


socket.on(
    "order-status-updated",
    data => {

        if (
            !currentOrder
        ) {
            return;
        }


        if (
            Number(data.orderId) !==
            Number(currentOrder.id)
        ) {
            return;
        }


        loadOrder();
    }
);


/* =====================================================
   LOAD RESTAURANT
===================================================== */

async function loadRestaurant() {

    try {

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


        if (
            settings.restaurant_name
        ) {

            restaurantName.textContent =
                settings.restaurant_name;
        }


        if (
            settings.logo
        ) {

            restaurantLogo.innerHTML = `
                <img
                    src="${escapeHtml(
                        settings.logo
                    )}"
                    alt="Restaurant logo"
                >
            `;
        }


        document.title =
            `${
                settings.restaurant_name ||
                "Restaurant"
            } — Your Order`;

    } catch (error) {

        console.warn(
            "Unable to load restaurant settings."
        );
    }
}


/* =====================================================
   LOAD ORDER
===================================================== */

async function loadOrder() {

    try {

        const response =
            await fetch(
                `/api/orders/${encodeURIComponent(
                    orderNumber
                )}`,
                {
                    cache:
                        "no-store"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success ||
            !data.order
        ) {

            showError();

            return;
        }


        currentOrder =
            data.order;


        renderOrder(
            currentOrder
        );


    } catch (error) {

        console.error(
            "ORDER LOAD ERROR:",
            error
        );

        showError();
    }
}


/* =====================================================
   RENDER ORDER
===================================================== */

function renderOrder(order) {

    orderNumberElement.textContent =
        `#${order.order_number}`;


    renderStatus(
        order.status
    );


    renderItems(
        order.items || []
    );


    subtotalElement.textContent =
        formatCurrency(
            order.subtotal
        );


    taxElement.textContent =
        formatCurrency(
            order.tax
        );


    totalElement.textContent =
        formatCurrency(
            order.total
        );


    renderOrderInfo(
        order
    );
}


/* =====================================================
   STATUS
===================================================== */

const statusConfig = {

    new: {
        title:
            "Order Received",

        icon:
            "🧾",

        message:
            "Your order has been received. Waiting for the restaurant to confirm it.",

        step:
            0
    },


    accepted: {
        title:
            "Order Confirmed",

        icon:
            "✓",

        message:
            "Your order has been confirmed by the restaurant.",

        step:
            1
    },


    preparing: {
        title:
            "Preparing Your Order",

        icon:
            "👨‍🍳",

        message:
            "Our kitchen is preparing your food.",

        step:
            2
    },


    ready: {
        title:
            "Order Ready",

        icon:
            "🍽️",

        message:
            "Your order is ready.",

        step:
            3
    },


    completed: {
        title:
            "Order Completed",

        icon:
            "🎉",

        message:
            "Your order has been completed. Thank you for ordering!",

        step:
            4
    },


    cancelled: {
        title:
            "Order Cancelled",

        icon:
            "✕",

        message:
            "This order has been cancelled by the restaurant.",

        step:
            -1
    }

};


function renderStatus(status) {

    const config =
        statusConfig[
            status
        ] ||
        statusConfig.new;


    statusTitle.textContent =
        config.title;


    statusIcon.textContent =
        config.icon;


    statusMessage.textContent =
        config.message;


    document
        .querySelectorAll(
            ".progress-step"
        )
        .forEach(
            step => {

                const stepStatus =
                    step.dataset.status;


                const stepNumber =
                    getStepNumber(
                        stepStatus
                    );


                step.classList.remove(
                    "active",
                    "completed"
                );


                if (
                    config.step >=
                    stepNumber
                ) {

                    step.classList.add(
                        "completed"
                    );
                }


                if (
                    status ===
                    stepStatus
                ) {

                    step.classList.add(
                        "active"
                    );
                }
            }
        );


    const progress =
        document.getElementById(
            "progressLine"
        );


    if (
        status === "new"
    ) {

        progress.style.width =
            "0%";

    } else if (
        status === "accepted"
    ) {

        progress.style.width =
            "0%";

    } else if (
        status === "preparing"
    ) {

        progress.style.width =
            "33%";

    } else if (
        status === "ready"
    ) {

        progress.style.width =
            "66%";

    } else if (
        status === "completed"
    ) {

        progress.style.width =
            "100%";

    } else {

        progress.style.width =
            "0%";
    }


    if (
        status === "cancelled"
    ) {

        statusTitle.classList.add(
            "cancelled"
        );

    } else {

        statusTitle.classList.remove(
            "cancelled"
        );
    }
}


function getStepNumber(
    status
) {

    const steps = {

        accepted: 1,

        preparing: 2,

        ready: 3,

        completed: 4

    };


    return (
        steps[status] ||
        0
    );
}


/* =====================================================
   ITEMS
===================================================== */

function renderItems(items) {

    if (!items.length) {

        orderItems.innerHTML = `
            <div class="loading">
                No items found.
            </div>
        `;

        return;
    }


    orderItems.innerHTML =
        items
            .map(
                item => `
                    <div
                        class="order-item"
                    >

                        <div
                            class="item-left"
                        >

                            <strong>
                                ${
                                    Number(
                                        item.quantity
                                    )
                                } ×
                            </strong>

                            <span>
                                ${escapeHtml(
                                    item.item_name
                                )}
                            </span>

                        </div>


                        <strong>
                            ${formatCurrency(
                                item.total
                            )}
                        </strong>

                    </div>
                `
            )
            .join("");
}


/* =====================================================
   ORDER INFO
===================================================== */

function renderOrderInfo(order) {

    const info = [];


    if (
        order.order_type ===
        "dine_in"
    ) {

        info.push(`
            <div class="info-item">

                <span>
                    Order Type
                </span>

                <strong>
                    🍽️ Dine In
                </strong>

            </div>
        `);


        info.push(`
            <div class="info-item">

                <span>
                    Table
                </span>

                <strong>
                    Table ${
                        escapeHtml(
                            order.table_number ||
                            "—"
                        )
                    }
                </strong>

            </div>
        `);

    } else {

        info.push(`
            <div class="info-item">

                <span>
                    Order Type
                </span>

                <strong>
                    🥡 Takeaway
                </strong>

            </div>
        `);


        if (
            order.customer_name
        ) {

            info.push(`
                <div class="info-item">

                    <span>
                        Customer
                    </span>

                    <strong>
                        ${escapeHtml(
                            order.customer_name
                        )}
                    </strong>

                </div>
            `);
        }


        if (
            order.customer_phone
        ) {

            info.push(`
                <div class="info-item">

                    <span>
                        Mobile
                    </span>

                    <strong>
                        ${escapeHtml(
                            order.customer_phone
                        )}
                    </strong>

                </div>
            `);
        }


        if (
            order.pickup_time
        ) {

            info.push(`
                <div class="info-item">

                    <span>
                        Pickup Time
                    </span>

                    <strong>
                        ${escapeHtml(
                            order.pickup_time
                        )}
                    </strong>

                </div>
            `);
        }
    }


    if (
        order.notes
    ) {

        info.push(`
            <div class="info-item full">

                <span>
                    Notes
                </span>

                <strong>
                    ${escapeHtml(
                        order.notes
                    )}
                </strong>

            </div>
        `);
    }


    orderInfo.innerHTML =
        info.join("");
}


/* =====================================================
   PRINT BILL
===================================================== */

printBillButton.addEventListener(
    "click",
    () => {

        if (!currentOrder) {
            return;
        }


        printBill(
            currentOrder
        );
    }
);


function printBill(order) {

    const restaurant =
        restaurantName.textContent ||
        "Restaurant";


    const items =
        order.items
            .map(
                item => `
                    <tr>

                        <td>
                            ${Number(
                                item.quantity
                            )} ×
                            ${escapeHtml(
                                item.item_name
                            )}
                        </td>

                        <td>
                            ₹${Number(
                                item.total
                            ).toFixed(2)}
                        </td>

                    </tr>
                `
            )
            .join("");


    const type =
        order.order_type ===
        "dine_in"
            ? `Dine In — Table ${
                escapeHtml(
                    order.table_number ||
                    "—"
                )
            }`
            : "Takeaway";


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=600,height=800"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups to print the bill."
        );

        return;
    }


    printWindow.document.write(`
        <!DOCTYPE html>

        <html>

        <head>

            <title>
                Bill #${escapeHtml(
                    order.order_number
                )}
            </title>


            <style>

                body {
                    font-family:
                        Arial,
                        sans-serif;

                    color: #111;

                    padding: 30px;

                    max-width: 600px;

                    margin: auto;
                }


                h1 {
                    text-align: center;

                    margin-bottom: 5px;
                }


                .center {
                    text-align: center;
                }


                .muted {
                    color: #666;
                }


                table {
                    width: 100%;

                    border-collapse:
                        collapse;

                    margin-top: 25px;
                }


                td {
                    padding: 10px 0;

                    border-bottom:
                        1px solid #ddd;
                }


                td:last-child {
                    text-align: right;
                }


                .summary {
                    margin-top: 20px;
                }


                .summary div {
                    display: flex;

                    justify-content:
                        space-between;

                    padding: 7px 0;
                }


                .total {
                    border-top:
                        2px solid #111;

                    margin-top: 8px;

                    padding-top: 12px;

                    font-size: 20px;

                    font-weight: 900;
                }


                .thanks {
                    margin-top: 35px;

                    text-align: center;

                    font-weight: 700;
                }

            </style>

        </head>


        <body>

            <h1>
                ${escapeHtml(
                    restaurant
                )}
            </h1>


            <div class="center">

                <strong>
                    ORDER #${escapeHtml(
                        order.order_number
                    )}
                </strong>

                <p class="muted">
                    ${type}
                </p>

            </div>


            <table>

                ${items}

            </table>


            <div class="summary">

                <div>

                    <span>
                        Subtotal
                    </span>

                    <strong>
                        ₹${Number(
                            order.subtotal
                        ).toFixed(2)}
                    </strong>

                </div>


                <div>

                    <span>
                        Tax
                    </span>

                    <strong>
                        ₹${Number(
                            order.tax
                        ).toFixed(2)}
                    </strong>

                </div>


                <div class="total">

                    <span>
                        TOTAL
                    </span>

                    <strong>
                        ₹${Number(
                            order.total
                        ).toFixed(2)}
                    </strong>

                </div>

            </div>


            <div class="thanks">

                Thank you for ordering ❤️

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


/* =====================================================
   BACK TO MENU
===================================================== */

backMenuButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "/";
    }
);


/* =====================================================
   HELPERS
===================================================== */

function formatCurrency(
    value
) {

    return `₹${Number(
        value || 0
    ).toFixed(2)}`;
}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
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


function showError() {

    document
        .querySelector(
            ".order-page"
        )
        .classList.add(
            "hidden"
        );


    errorState.classList.remove(
        "hidden"
    );
}