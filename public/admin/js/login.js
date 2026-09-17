const form =
    document.getElementById("loginForm");

const errorMessage =
    document.getElementById("errorMessage");

const loginButton =
    document.getElementById("loginButton");

const setupLink =
    document.getElementById("setupLink");


async function checkAdminSetup() {

    try {

        const response =
            await fetch(
                "/api/admin/status",
                {
                    cache: "no-store"
                }
            );

        const data =
            await response.json();

        if (data.setupRequired) {
            setupLink.textContent =
                "Set up admin account";
        }

    } catch (error) {
        console.error(
            "ADMIN STATUS ERROR:",
            error
        );
    }
}


checkAdminSetup();


form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        errorMessage.textContent = "";
        loginButton.disabled = true;
        loginButton.textContent = "Signing in...";

        const username =
            document
                .getElementById("username")
                .value
                .trim();

        const password =
            document
                .getElementById("password")
                .value;

        try {

            const response =
                await fetch(
                    "/api/admin/login",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            username,
                            password
                        })
                    }
                );

            const data =
                await response.json();

            if (!data.success) {
                errorMessage.textContent =
                    data.message ||
                    "Login failed.";
                return;
            }

            sessionStorage.setItem(
                "adminToken",
                data.token
            );

            sessionStorage.setItem(
                "adminUsername",
                data.username
            );

            window.location.href =
                "/admin/dashboard.html";

        } catch (error) {

            console.error(error);

            errorMessage.textContent =
                "Unable to connect to server.";

        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "Login →";
        }
    }
);
