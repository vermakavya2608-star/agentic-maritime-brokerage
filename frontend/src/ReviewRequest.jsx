import { useState, useEffect } from "react";
import "./ReviewRequest.css";

function ReviewRequest({ request, onBack }) {
  // Load saved feedback or default to empty
  const [feedback, setFeedback] = useState(request?.feedback || "");

  // Check if it's still pending
  const isPending = request?.status === "Pending Review";

  // Force the text box to sync up with the saved data
  useEffect(() => {
    setFeedback(request?.feedback || "");
  }, [request]);

  const updateStatus = (newStatus) => {
    const existingRequests =
      JSON.parse(localStorage.getItem("quotationRequests")) || [];

    const updatedRequests = existingRequests.map((item) =>
      item.id === request.id
        ? {
            ...item,
            status: newStatus,
            feedback: feedback, // 2. Save feedback to the request object
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
      <header className="review-header">
        <div>
          <p className="review-label">QUOTATION REVIEW</p>
          <h1>Review Request</h1>
          <p>Review the customer's shipment and quotation details.</p>
        </div>
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
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
          <div>
            <span>Total Freight</span>
            <strong>
              $
              {Number(request.quotation.total_freight_usd).toLocaleString(
                "en-US",
                { minimumFractionDigits: 2, maximumFractionDigits: 2 },
              )}
            </strong>
          </div>
        </div>
      </section>

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

      {/* 3. New Feedback Section */}
      <section className="review-section">
        <div className="section-title">
          <h2>Admin Feedback</h2>
          <span>Provide a reason for approving or rejecting this request.</span>
        </div>
        <textarea
          className="feedback-input"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={
            isPending
              ? "Enter feedback for the customer here..."
              : "No feedback was provided."
          }
          readOnly={!isPending}
        />
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
