const form = document.getElementById("forgotForm");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");
const forgotButton = document.getElementById("forgotButton");

form.addEventListener("submit", async event => {
    event.preventDefault();
    errorMessage.textContent = "";
    successMessage.textContent = "";
    forgotButton.disabled = true;
    forgotButton.textContent = "Sending...";

    const identifier = document.getElementById("identifier").value.trim();

    try {
        const response = await fetch("/api/admin/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            errorMessage.textContent = data.message || "Unable to process the request.";
            return;
        }

        successMessage.textContent = data.message;

    } catch (error) {
        console.error(error);
        errorMessage.textContent = "Unable to connect to server.";
    } finally {
        forgotButton.disabled = false;
        forgotButton.textContent = "Send Reset Link →";
    }
});
