const form = document.getElementById("setupForm");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");
const setupButton = document.getElementById("setupButton");

async function checkSetup() {
    try {
        const response = await fetch("/api/admin/status", { cache: "no-store" });
        const data = await response.json();

        if (!data.setupRequired) {
            errorMessage.textContent = "An admin account is already configured. Please login instead.";
            setupButton.disabled = true;
        }
    } catch (error) {
        console.error(error);
    }
}

checkSetup();

form.addEventListener("submit", async event => {
    event.preventDefault();
    errorMessage.textContent = "";
    successMessage.textContent = "";
    setupButton.disabled = true;
    setupButton.textContent = "Creating...";

    const username = document.getElementById("username").value.trim();
    const recoveryEmail = document.getElementById("recoveryEmail").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    try {
        const response = await fetch("/api/admin/setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                recoveryEmail,
                password,
                confirmPassword
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            errorMessage.textContent = data.message || "Unable to create admin account.";
            return;
        }

        successMessage.textContent = "Admin account created. Redirecting to login...";

        setTimeout(() => {
            window.location.href = "/admin/login.html";
        }, 1000);

    } catch (error) {
        console.error(error);
        errorMessage.textContent = "Unable to connect to server.";
    } finally {
        setupButton.disabled = false;
        setupButton.textContent = "Create Admin Account →";
    }
});
