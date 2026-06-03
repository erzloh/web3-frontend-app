const DEFAULT_BACKEND_URL =
  import.meta.env.VITE_SURPRISE_BACKEND_URL || "http://localhost:3001";

function buildUrl(path) {
  return `${DEFAULT_BACKEND_URL.replace(/\/$/, "")}${path}`;
}

async function requestJson(path, options = {}) {
  let response;

  try {
    response = await fetch(buildUrl(path), {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });
  } catch {
    throw new Error(
      `Could not reach the surprise backend at ${DEFAULT_BACKEND_URL}.`
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && (payload.reason || payload.message)) ||
      (typeof payload === "string" && payload) ||
      `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload;
}

export function getSurpriseBackendUrl() {
  return DEFAULT_BACKEND_URL;
}

export async function getSurprisePayment() {
  return requestJson("/api/surprise/payment");
}

export async function confirmSurprisePayment({ email, payerAddress, txHash }) {
  return requestJson("/api/surprise/confirm", {
    method: "POST",
    body: JSON.stringify({ email, payerAddress, txHash })
  });
}
