const form = document.getElementById("resetForm");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");
const resetButton = document.getElementById("resetButton");

const token =
    new URLSearchParams(window.location.search).get("token") || "";

if (!token) {
    errorMessage.textContent = "This reset link is invalid or missing.";
    resetButton.disabled = true;
}

form.addEventListener("submit", async event => {
    event.preventDefault();
    errorMessage.textContent = "";
    successMessage.textContent = "";
    resetButton.disabled = true;
    resetButton.textContent = "Resetting...";

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    try {
        const response = await fetch("/api/admin/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token,
                password,
                confirmPassword
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            errorMessage.textContent = data.message || "Unable to reset password.";
            return;
        }

        successMessage.textContent = data.message;
        form.style.display = "none";

        setTimeout(() => {
            window.location.href = "/admin/login.html";
        }, 1400);

    } catch (error) {
        console.error(error);
        errorMessage.textContent = "Unable to connect to server.";
    } finally {
        resetButton.disabled = false;
        resetButton.textContent = "Reset Password →";
    }
});
