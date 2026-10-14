const API_BASE_URL = "http://127.0.0.1:8000";

export async function generateQuotation(quotationRequest) {
  const response = await fetch(
    `${API_BASE_URL}/api/quotations/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(quotationRequest)
    }
  );

  if (!response.ok) {
    throw new Error(
      `Quotation API failed: ${response.status}`
    );
  }

  return await response.json();
}

export async function getLiveInsight(origin, destination, cargo_type, route_id = null, transit_days = null) {
  const response = await fetch(
    `${API_BASE_URL}/api/llm/insight`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, cargo_type, route_id, transit_days })
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch AI insight");
  }

  return await response.json();
}

export async function getSystemHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error("Backend unreachable");
    }
    return await response.json();
  } catch (error) {
    // If the FastAPI server is turned off, force everything offline
    return {
      status: "error",
      agents: { route: "offline", weather: "offline", pricing: "offline" }
    };
  }
}

export async function auditCustoms(auditPayload) {
  const response = await fetch(`${API_BASE_URL}/api/customs/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(auditPayload)
  });

  if (!response.ok) {
    throw new Error("Failed to audit customs documentation");
  }

  return await response.json();
}

export async function saveQuotation(token, payload) {
  const response = await fetch(`${API_BASE_URL}/api/quotations/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("Failed to save quotation");
  return await response.json();
}

export async function getMyQuotations(token) {
  const response = await fetch(`${API_BASE_URL}/api/quotations/me`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch quotations");
  return await response.json();
}

export async function getAllQuotations(token) {
  const response = await fetch(`${API_BASE_URL}/api/quotations/all`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch all quotations");
  return await response.json();
}

export async function reviewQuotation(token, quoteId, payload) {
  const response = await fetch(`${API_BASE_URL}/api/quotations/${quoteId}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("Failed to review quotation");
  return await response.json();
}