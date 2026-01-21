const api = typeof browser !== "undefined" ? browser : chrome;

api.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      const payloadData = request.payload;

      // Extract CSRF token from multiple possible locations
      function getCsrfToken() {
        // 1️⃣ Search all script tags on the page
        const scripts = document.querySelectorAll("script");
        for (const script of scripts) {
          if (!script.textContent) continue;
          const match = script.textContent.match(/csrf_token:\s*"([^"]+)"/);
          if (match) return match[1];
        }

        // 2️⃣ Fallback: global variables
        if (window.__OdooSession?.csrf_token)
          return window.__OdooSession.csrf_token;
        if (window.odoo?.__session_info__?.csrf_token)
          return window.odoo.__session_info__.csrf_token;

        // 3️⃣ Not found
        return null;
      }

      const csrfToken = getCsrfToken();
      if (!csrfToken) {
        sendResponse({ success: false, error: "Could not find CSRF token." });
        return;
      }

      // Prepare ticket payload
      const payload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "project.task",
          method: "create",
          args: [
            {
              name: payloadData.title,
              description: payloadData.description,
              project_id: 23901,
              stage_id: parseInt(payloadData.ticketType || 1),
              reviewer_id: null,
            },
          ],
          kwargs: {},
        },
        id: Date.now(),
      };

      const response = await fetch("/web/dataset/call_kw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.error) {
        sendResponse({
          success: false,
          error: result.error.data?.message || "Unknown error",
        });
      } else {
        const taskId = result.result;
        const url = `https://www.odoo.com/odoo/project.task/${taskId}`;
        sendResponse({ success: true, taskId, ticket: url });
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("Error creating ticket:", err);
      sendResponse({ success: false, error: err.message });
    }
  })();

  return true;
});
