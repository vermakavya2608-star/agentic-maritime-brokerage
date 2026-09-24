import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./AdminDashboard.css";
import ReviewRequest from "./ReviewRequest";

function AdminDashboard({ user, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");

  const statusData = [
    {
      name: "Pending",
      value: requests.filter((request) => request.status === "Pending Review")
        .length,
    },
    {
      name: "Approved",
      value: requests.filter((request) => request.status === "Approved").length,
    },
  ];

  const routeScoreData = requests.map((request, index) => ({
  route: `Q${index + 1}`,
  fullRoute: `${request.shipment.origin} → ${request.shipment.destination}`,
  score: Number(request.quotation?.route_score) || 0,
}));

  const pricingData = requests.map((request, index) => ({
  route: `Q${index + 1}`,
  fullRoute: `${request.shipment.origin} → ${request.shipment.destination}`,
  baseFreight: Number(request.quotation?.pricing?.base_freight) || 0,
  adjustedCost: Number(request.quotation?.pricing?.adjusted_cost) || 0,
}));

  const loadRequests = () => {
    const savedRequests =
      JSON.parse(localStorage.getItem("quotationRequests")) || [];
    setRequests(savedRequests);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "—";
    return (
      "$" +
      Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  if (selectedRequest) {
    return (
      <ReviewRequest
        request={selectedRequest}
        onBack={() => {
          setSelectedRequest(null);
          loadRequests(); /* This forces the table to update immediately! */
        }}
      />
    );
  }

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>Maritime AI</h2>
          <p>Brokerage Intelligence</p>
        </div>

        <nav>
          <button
            className={activeSection === "dashboard" ? "active" : ""}
            onClick={() => setActiveSection("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={activeSection === "requests" ? "active" : ""}
            onClick={() => setActiveSection("requests")}
          >
            Quotation Requests
          </button>

          <button
            className={activeSection === "route" ? "active" : ""}
            onClick={() => setActiveSection("route")}
          >
            Route Analysis
          </button>

          <button
            className={activeSection === "pricing" ? "active" : ""}
            onClick={() => setActiveSection("pricing")}
          >
            Pricing Review
          </button>

          <button
            className={activeSection === "margin" ? "active" : ""}
            onClick={() => setActiveSection("margin")}
          >
            Margin Review
          </button>
        </nav>

        <div className="admin-status">
          <span></span>
          AI Engine Online
        </div>

        <button className="admin-logout-button" onClick={onLogout}>
          ⇥ &nbsp; Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p className="admin-label">ADMIN CONTROL CENTER</p>
            <h1>Admin Dashboard</h1>
            <p>Review and manage maritime freight quotations.</p>
          </div>

          <div className="admin-profile">
            <div className="profile-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div>
              <strong>{user?.name || "Maritime Admin"}</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        <div
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1586528116311-ad8ed7f66909?q=80&w=2070&auto=format&fit=crop')",
            height: "160px",
            borderRadius: "16px",
            backgroundSize: "cover",
            backgroundPosition: "center",
            marginBottom: "32px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(15,23,42,0.1)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.1) 100%)",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              bottom: "28px",
              left: "32px",
              color: "white",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>
              Global Freight Command
            </h2>
            <p
              style={{ margin: "6px 0 0", color: "#cbd5e1", fontSize: "14px" }}
            >
              Live AI Agent Monitoring & Optimization
            </p>
          </div>
        </div>

        {activeSection === "dashboard" && (
          <>
            <section className="admin-stats">
              <div className="admin-stat-card">
                <span>Quotation Requests</span>
                <strong>{requests.length}</strong>
                <small>Total requests</small>
              </div>

              <div className="admin-stat-card">
                <span>Pending Review</span>
                <strong>
                  {
                    requests.filter(
                      (request) => request.status === "Pending Review",
                    ).length
                  }
                </strong>
                <small>Awaiting approval</small>
              </div>

              <div className="admin-stat-card">
                <span>Approved</span>
                <strong>
                  {
                    requests.filter((request) => request.status === "Approved")
                      .length
                  }
                </strong>
                <small>Approved quotations</small>
              </div>

              <div className="admin-stat-card">
                <span>AI Engine</span>
                <strong>ON</strong>
                <small>All agents operational</small>
              </div>
            </section>

            <section className="admin-analytics-grid">
              {/* Quotation Status */}
              <div className="analytics-card">
                <div className="analytics-card-header">
                  <div>
                    <h2>Quotation Status</h2>
                    <p>Current quotation request distribution</p>
                  </div>
                </div>

                {requests.length === 0 ? (
                  <div className="chart-empty">
                    No quotation data available yet.
                  </div>
                ) : (
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          <Cell fill="#f59e0b" />
                          <Cell fill="#10b981" />
                        </Pie>

                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Route Performance */}
              <div className="analytics-card">
                <div className="analytics-card-header">
                  <div>
                    <h2>Route Performance</h2>
                    <p>AI route score for each quotation</p>
                  </div>
                </div>

                {requests.length === 0 ? (
                  <div className="chart-empty">
                    No route data available yet.
                  </div>
                ) : (
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={routeScoreData}
                        margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis
                          dataKey="route"
                          interval={0}
                          tick={{ fontSize: 11 }}
                        />

                        <YAxis
                          domain={[0, 100]}
                          label={{
                            value: "Score",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />

                        <Tooltip
                          formatter={(value) => [value, "Route Score"]}
                        />

                        <Bar
                          dataKey="score"
                          name="Route Score"
                          fill="#0d6efd"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Pricing Overview */}
              <div className="analytics-card analytics-card-wide">
                <div className="analytics-card-header">
                  <div>
                    <h2>Pricing Overview</h2>
                    <p>Comparison of base freight and adjusted cost</p>
                  </div>
                </div>

                {requests.length === 0 ? (
                  <div className="chart-empty">
                    No pricing data available yet.
                  </div>
                ) : (
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={pricingData}
                        margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis
                          dataKey="route"
                          interval={0}
                          tick={{ fontSize: 11 }}
                        />

                        <YAxis />

                        <Tooltip
                          formatter={(value) =>
                            `$${Number(value).toLocaleString("en-US")}`
                          }
                        />

                        <Legend />

                        <Bar
                          dataKey="baseFreight"
                          name="Base Freight"
                          fill="#0d6efd"
                          radius={[6, 6, 0, 0]}
                        />

                        <Bar
                          dataKey="adjustedCost"
                          name="Adjusted Cost"
                          fill="#10b981"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
        {activeSection === "requests" && (
          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <h2>Quotation Requests</h2>
                <p>Customer requests will appear here.</p>
              </div>
              <button className="refresh-button" onClick={loadRequests}>
                Refresh Data
              </button>
            </div>

            {requests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No quotation requests yet</h3>
                <p>
                  When customers submit shipment requirements, their quotation
                  requests will appear here for review.
                </p>
              </div>
            ) : (
              <div className="requests-table">
                <div className="requests-table-header">
                  <span>Customer</span>
                  <span>Route</span>
                  <span>Cargo</span>
                  <span>Containers</span>
                  <span>Freight</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>

                {requests.map((request) => (
                  <div className="request-row" key={request.id}>
                    <div className="customer-cell">
                      <div className="customer-avatar">
                        {request.customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{request.customer.name}</strong>
                        <small>{request.customer.email}</small>
                      </div>
                    </div>

                    <div className="route-cell">
                      <strong>
                        {request.shipment.origin} →{" "}
                        {request.shipment.destination}
                      </strong>
                      <small>{request.quotation.recommended_route}</small>
                    </div>

                    <div className="cargo-cell">
                      {request.shipment.cargo_type}
                    </div>

                    <div className="container-cell">
                      {request.shipment.containers}
                    </div>

                    <div className="freight-cell">
                      {formatCurrency(request.quotation.total_freight_usd)}
                    </div>

                    <div>
                      <span className="status-badge">{request.status}</span>
                    </div>

                    <div>
                      <button
                        className="review-button"
                        onClick={() => setSelectedRequest(request)}
                      >
                        Review →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === "route" && (
          <section className="admin-panel route-analysis-panel">
            <div className="panel-heading">
              <div>
                <h2>Route Analysis</h2>
                <p>Review AI-recommended maritime routes.</p>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="empty-state">
                <h3>No route data yet</h3>
                <p>
                  Route analysis will appear when customers submit quotations.
                </p>
              </div>
            ) : (
              requests.map((request) => (
                <div className="request-row" key={request.id}>
                  <div className="route-cell">
                    <strong>
                      {request.shipment.origin} → {request.shipment.destination}
                    </strong>
                    <small>Route: {request.quotation.recommended_route}</small>
                  </div>
                  <div>
                    <strong>{request.quotation.route_score ?? "—"}</strong>
                    <small>Route Score</small>
                  </div>
                  <div>
                    <strong>
                      {request.quotation.transit_time_days ?? "—"} days
                    </strong>
                    <small>Transit Time</small>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {activeSection === "pricing" && (
          <section className="admin-panel pricing-review-panel">
            <div className="panel-heading">
              <div>
                <h2>Pricing Review</h2>
                <p>
                  Review pricing calculations generated by the Pricing Agent.
                </p>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="empty-state">
                <h3>No pricing data yet</h3>
                <p>
                  Pricing details will appear when customers submit quotations.
                </p>
              </div>
            ) : (
              requests.map((request) => {
                const pricing = request.quotation?.pricing;
                return (
                  <div className="request-row" key={request.id}>
                    <div className="route-cell">
                      <strong>
                        {request.shipment.origin} →{" "}
                        {request.shipment.destination}
                      </strong>
                      <small>
                        Route: {request.quotation.recommended_route}
                      </small>
                    </div>
                    <div>
                      <strong>{formatCurrency(pricing?.base_freight)}</strong>
                      <small>Base Freight</small>
                    </div>
                    <div>
                      <strong>{formatCurrency(pricing?.fuel_surcharge)}</strong>
                      <small>Fuel Surcharge</small>
                    </div>
                    <div>
                      <strong>{formatCurrency(pricing?.port_charge)}</strong>
                      <small>Port Charge</small>
                    </div>
                    <div>
                      <strong>{formatCurrency(pricing?.adjusted_cost)}</strong>
                      <small>Adjusted Cost</small>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}

        {activeSection === "margin" && (
          <section className="admin-panel margin-review-panel">
            <div className="panel-heading">
              <div>
                <h2>Margin Review</h2>
                <p>Review margin calculations generated by the Margin Agent.</p>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="empty-state">
                <h3>No margin data yet</h3>
                <p>
                  Margin details will appear when customers submit quotations.
                </p>
              </div>
            ) : (
              requests.map((request) => {
                const margin = request.quotation?.margin;
                return (
                  <div className="request-row" key={request.id}>
                    <div className="route-cell">
                      <strong>
                        {request.shipment.origin} →{" "}
                        {request.shipment.destination}
                      </strong>
                      <small>
                        Route: {request.quotation.recommended_route}
                      </small>
                    </div>
                    <div>
                      <strong>{formatCurrency(margin?.operating_cost)}</strong>
                      <small>Operating Cost</small>
                    </div>
                    <div>
                      <strong>{margin?.target_margin_percent ?? "—"}%</strong>
                      <small>Target Margin</small>
                    </div>
                    <div>
                      <strong>{formatCurrency(margin?.margin_amount)}</strong>
                      <small>Margin Amount</small>
                    </div>
                    <div>
                      <strong>{formatCurrency(margin?.selling_price)}</strong>
                      <small>Selling Price</small>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
