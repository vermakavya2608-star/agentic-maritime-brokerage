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