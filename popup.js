document
  .getElementById("ticketForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("title")?.value.trim();
    const ticketType = document.querySelector(
      'input[name="stage"]:checked'
    ).value;
    let description = document.getElementById("descriptionInput")?.value;
    const phone = document.getElementById("phone")?.value.trim();
    const phoneError = document.getElementById("phoneError");
    const tracking = document.getElementById("tracking")?.value.trim();
    description = `Phone: ${phone} <br> Tracking: ${tracking} <br> ${description}`;

    function isValidPhone(value) {
      return /^\+\d{5,}$/.test(value.replace(/\s+/g, ""));
    }

    if (!isValidPhone(phone)) {
      // Show inline error
      if (phoneError) {
        phoneError.textContent =
          "Phone number must start with '+' and country code (e.g. +971501234567).";
        phoneError.classList.remove("hide");
      }
      showStatus("Invalid phone number.", "error");
      return;
    } else if (phoneError) {
      phoneError.classList.add("hide"); // hide previous error
    }

    try {
      // Get all open tabs in all windows
      const tabs = await chrome.tabs.query({});
      const odooTab = tabs.find(
        (tab) => tab.url && tab.url.includes("odoo.com/odoo")
      );

      if (!odooTab) {
        showStatus(
          "⚠️ No Odoo tab open. Please open Odoo and try again.",
          "error"
        );
        return;
      }

      // Send ticket data to content.js
      chrome.tabs.sendMessage(
        odooTab.id,
        {
          action: "createTicket",
          payload: { title, description, ticketType },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            showStatus(
              "❌ Could not reach Odoo tab. Make sure it is loaded.",
              "error"
            );
            return;
          }
          if (response?.success) {
            showStatus("✅ Ticket created successfully!", "success");
            setTimeout(() => window.close(), 1200);
          } else {
            showStatus(
              `❌ ${response?.error || "Failed to create ticket."}`,
              "error"
            );
          }
        }
      );
    } catch (err) {
      showStatus(`Unexpected error: ${err.message}`, "error");
    }
  });

function showStatus(msg, type) {
  const statusEl = document.getElementById("status");
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.className = type; // assumes CSS: .success {color: green}, .error {color: red}
}
