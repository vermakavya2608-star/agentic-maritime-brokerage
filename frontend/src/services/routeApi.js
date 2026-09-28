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

export async function getLiveInsight(origin, destination, cargo_type) {
  const response = await fetch(
    `${API_BASE_URL}/api/llm/insight`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, cargo_type })
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch AI insight");
  }

  return await response.json();
}