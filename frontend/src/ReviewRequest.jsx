import { useState, useEffect } from "react";
import "./ReviewRequest.css";

function ReviewRequest({ request, onBack }) {
  // Load saved feedback or default to empty
  const [feedback, setFeedback] = useState(request?.feedback || "");

  // 1. ADD ERROR STATE HERE:
  const [feedbackError, setFeedbackError] = useState("");

  // Check if it's still pending
  const isPending = request?.status === "Pending Review";

  // Force the text box to sync up with the saved data
  useEffect(() => {
    setFeedback(request?.feedback || "");
    setFeedbackError(""); // Clear any previous error when request changes
  }, [request]);

  const updateStatus = (newStatus) => {
    // 1. Mandatory feedback check ONLY for Rejection
    if (newStatus === "Rejected" && !feedback.trim()) {
      setFeedbackError(
        "Feedback is required when rejecting a quotation. Please provide a reason.",
      );
      return;
    }

    // 2. Clear any active error if valid
    setFeedbackError("");

    const existingRequests =
      JSON.parse(localStorage.getItem("quotationRequests")) || [];

    const updatedRequests = existingRequests.map((item) =>
      item.id === request.id
        ? {
            ...item,
            status: newStatus,
            feedback: feedback.trim(), // Save trimmed feedback (optional for Approved, mandatory for Rejected)
          }
        : item,
    );

    localStorage.setItem("quotationRequests", JSON.stringify(updatedRequests));

    alert(`Quotation ${newStatus.toLowerCase()} successfully.`);

    onBack();
  };

  if (!request) {
    return (
      <div className="review-page">
        <h2>No request selected</h2>
        <button onClick={onBack}>← Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="review-page">
      <div className="quotation-brand">
        <div>
          <h2>MARITIME AI</h2>
          <span>Brokerage Intelligence</span>
        </div>

        <div className="quotation-meta">
          <strong>FREIGHT QUOTATION</strong>
          <span>Quotation ID: #{request.id}</span>
          <span>Status: {request.status}</span>
          <span>
            Generated:{" "}
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      <header className="review-header">
        <div>
          <p className="review-label">MARITIME FREIGHT QUOTATION</p>
          <h1>Freight Quotation</h1>
          <p>AI-generated maritime freight quotation and shipment details.</p>
        </div>

        <div className="review-header-actions">
          <button className="download-button" onClick={() => window.print()}>
            ↓ Download Quotation
          </button>

          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
        </div>
      </header>

      {/* Customer Details */}
      <section className="review-section">
        <div className="section-title">
          <h2>Customer Details</h2>
        </div>
        <div className="detail-grid">
          <div>
            <span>Customer</span>
            <strong>{request.customer.name}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{request.customer.email}</strong>
          </div>
          <div>
            <span>Request ID</span>
            <strong>#{request.id}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{request.status}</strong>
          </div>
        </div>
      </section>

      {/* Shipment Details */}
      <section className="review-section">
        <div className="section-title">
          <h2>Shipment Details</h2>
        </div>
        <div className="detail-grid">
          <div>
            <span>Origin</span>
            <strong>{request.shipment.origin}</strong>
          </div>
          <div>
            <span>Destination</span>
            <strong>{request.shipment.destination}</strong>
          </div>
          <div>
            <span>Cargo Type</span>
            <strong>{request.shipment.cargo_type}</strong>
          </div>
          <div>
            <span>Containers</span>
            <strong>{request.shipment.containers}</strong>
          </div>
        </div>
      </section>

      {/* Route + Quotation Summary */}
      <div className="route-quotation-group">
        {/* Route Details */}
        <section className="review-section">
          <div className="section-title">
            <h2>Route Intelligence</h2>
          </div>
          <div className="route-highlight">
            <div>
              <span>Recommended Route</span>
              <strong>{request.quotation.recommended_route}</strong>
            </div>
            <div>
              <span>Route Score</span>
              <strong>{request.quotation.route_score}</strong>
            </div>
          </div>
          <div className="detail-grid">
            <div>
              <span>Transit Time</span>
              <strong>{request.quotation.transit_time_days} days</strong>
            </div>
            <div>
              <span>Freight / Container</span>
              <strong>${request.quotation.freight_per_container_usd}</strong>
            </div>
          </div>
        </section>

        {/* Quotation Summary */}
        <section className="quotation-summary">
          <div>
            <span>TOTAL QUOTATION VALUE</span>
            <strong>
              $
              {Number(request.quotation.total_freight_usd).toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                },
              )}
            </strong>
          </div>

          <div>
            <span>FREIGHT / CONTAINER</span>
            <strong>
              $
              {Number(
                request.quotation.freight_per_container_usd,
              ).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>
        </section>
      </div>

      {/* Pricing Agent */}
      <section className="review-section">
        <div className="section-title">
          <h2>Pricing Agent</h2>
          <span>Internal Cost Analysis</span>
        </div>
        <div className="detail-grid">
          <div>
            <span>Base Freight</span>
            <strong>${request.quotation.pricing.base_freight}</strong>
          </div>
          <div>
            <span>Fuel Surcharge</span>
            <strong>${request.quotation.pricing.fuel_surcharge}</strong>
          </div>
          <div>
            <span>Port Charge</span>
            <strong>${request.quotation.pricing.port_charge}</strong>
          </div>
          <div>
            <span>Risk Surcharge</span>
            <strong>${request.quotation.pricing.risk_surcharge}</strong>
          </div>
          <div>
            <span>Operating Cost</span>
            <strong>${request.quotation.pricing.operating_cost}</strong>
          </div>
          <div>
            <span>Demand Factor</span>
            <strong>{request.quotation.pricing.demand_factor}</strong>
          </div>
          <div>
            <span>Adjusted Cost</span>
            <strong>${request.quotation.pricing.adjusted_cost}</strong>
          </div>
        </div>
      </section>

      {/* Margin Agent */}
      <section className="review-section">
        <div className="section-title">
          <h2>Margin Agent</h2>
          <span>Internal Margin Analysis</span>
        </div>
        <div className="detail-grid">
          <div>
            <span>Operating Cost</span>
            <strong>${request.quotation.margin.operating_cost}</strong>
          </div>
          <div>
            <span>Target Margin</span>
            <strong>{request.quotation.margin.target_margin_percent}%</strong>
          </div>
          <div>
            <span>Margin Amount</span>
            <strong>${request.quotation.margin.margin_amount}</strong>
          </div>
          <div>
            <span>Selling Price / Container</span>
            <strong>${request.quotation.margin.selling_price}</strong>
          </div>
        </div>
      </section>

      {/* Customs & Risk Agent */}
      {request.quotation.customs && request.quotation.shipment_risk_report && (
        <section className="review-section">
          <div className="section-title">
            <h2>Customs & Regulatory Intelligence Agent</h2>
            <span>
              Live Route Compliance, Interactive Audit & Tariff Assessment
            </span>
          </div>

          <div
            className="route-highlight"
            style={{ gridTemplateColumns: "1fr 1fr 1fr", marginBottom: "16px" }}
          >
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(15, 23, 42, 0.5) 100%)",
                borderColor: "rgba(56, 189, 248, 0.3)",
              }}
            >
              <span>Readiness Metric</span>
              <strong style={{ color: "#38bdf8" }}>
                {request.quotation.customs.audit_metric?.score_out_of_10 || 10}
                /10 •{" "}
                {request.quotation.customs.audit_metric?.grade || "Verified"}
              </strong>
            </div>

            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.5) 100%)",
                borderColor: "rgba(245, 158, 11, 0.3)",
              }}
            >
              <span>Estimated Duty (USD)</span>
              <strong style={{ color: "#fcd34d" }}>
                $
                {request.quotation.customs.estimated_duties_usd?.toLocaleString(
                  "en-US",
                ) || "—"}
              </strong>
            </div>

            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.5) 100%)",
                borderColor: "rgba(16, 185, 129, 0.3)",
              }}
            >
              <span>Clearance Window</span>
              <strong style={{ color: "#10b981", fontSize: "18px" }}>
                {request.quotation.customs.estimated_clearance_time ||
                  "Standard"}
              </strong>
            </div>
          </div>

          <div
            className="detail-grid"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            <div>
              <span>
                Verified In-Hand Documents (
                {request.quotation.customs.provided_documents?.length || 0})
              </span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginTop: "8px",
                }}
              >
                {request.quotation.customs.provided_documents?.map(
                  (doc, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#34d399",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "600",
                      }}
                    >
                      ✓ {doc}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div>
              <span>
                Pending / Missing Documents (
                {request.quotation.customs.missing_documents?.length || 0})
              </span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginTop: "8px",
                }}
              >
                {request.quotation.customs.missing_documents?.length > 0 ? (
                  request.quotation.customs.missing_documents.map(
                    (doc, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "rgba(239, 68, 68, 0.15)",
                          color: "#fca5a5",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        ✕ {doc}
                      </span>
                    ),
                  )
                ) : (
                  <span
                    style={{
                      color: "#10b981",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    All documents submitted!
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. New Feedback Section */}
      <section className="review-section admin-feedback-section">
        <div className="section-title">
          <h2>Admin Feedback</h2>
          <span>Provide a reason for approving or rejecting this request.</span>
        </div>
        <textarea
          value={feedback}
          onChange={(e) => {
            setFeedback(e.target.value);
            if (feedbackError) setFeedbackError("");
          }}
          placeholder="Add optional notes for approval, or mandatory reason for rejection..."
          rows={4}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "12px",
            background: "rgba(11, 27, 53, 0.65)",
            border: feedbackError
              ? "1px solid rgba(239, 68, 68, 0.5)"
              : "1px solid rgba(56, 189, 248, 0.18)",
            boxShadow: feedbackError
              ? "0 0 0 3px rgba(239, 68, 68, 0.15), inset 0 2px 6px rgba(0,0,0,0.3)"
              : "inset 0 2px 6px rgba(0,0,0,0.25)",
            color: "#f8fafc",
            fontFamily: "inherit",
            fontSize: "13.5px",
            lineHeight: "1.6",
            outline: "none",
            resize: "vertical",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          }}
        />

        {/* Render the error warning if validation fails on rejection */}
        {feedbackError && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderLeft: "4px solid #ef4444",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.2)",
                color: "#f87171",
                fontSize: "12px",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              !
            </span>
            <span
              style={{
                color: "#fca5a5",
                fontSize: "13px",
                lineHeight: "1.5",
                fontWeight: "500",
                letterSpacing: "0.2px",
              }}
            >
              {feedbackError}
            </span>
          </div>
        )}
      </section>

      {/* Actions */}
      <section className="review-actions">
        {isPending ? (
          <>
            <button
              className="reject-button"
              onClick={() => updateStatus("Rejected")}
            >
              Reject Request
            </button>
            <button
              className="approve-button"
              onClick={() => updateStatus("Approved")}
            >
              Approve Quotation
            </button>
          </>
        ) : (
          <div
            style={{
              color: "#94a3b8",
              fontWeight: "600",
              fontSize: "14px",
              padding: "12px 0",
            }}
          >
            ✦ This request has already been {request.status.toLowerCase()}.
          </div>
        )}
      </section>
    </div>
  );
}

export default ReviewRequest;
