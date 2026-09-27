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
  const [requestFilter, setRequestFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [aiEngineOnline, setAiEngineOnline] = useState(false);

  const pendingCount = requests.filter(
    (request) => request.status === "Pending Review",
  ).length;

  const approvedCount = requests.filter(
    (request) => request.status === "Approved",
  ).length;

  const rejectedCount = requests.filter(
    (request) => request.status === "Rejected",
  ).length;

  const totalFreight = requests.reduce(
    (total, request) =>
      total + (Number(request.quotation?.total_freight_usd) || 0),
    0,
  );

  const averageRouteScore =
    requests.length > 0
      ? requests.reduce(
          (total, request) =>
            total + (Number(request.quotation?.route_score) || 0),
          0,
        ) / requests.length
      : 0;

  const averageTransitTime =
    requests.length > 0
      ? requests.reduce(
          (total, request) =>
            total + (Number(request.quotation?.transit_time_days) || 0),
          0,
        ) / requests.length
      : 0;

  const totalContainers = requests.reduce(
    (total, request) => total + (Number(request.shipment?.containers) || 0),
    0,
  );

  const filteredRequests = requests.filter((request) => {
    const matchesStatus =
      requestFilter === "All" || request.status === requestFilter;

    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !search ||
      request.customer?.name?.toLowerCase().includes(search) ||
      request.shipment?.origin?.toLowerCase().includes(search) ||
      request.shipment?.destination?.toLowerCase().includes(search) ||
      request.shipment?.cargo_type?.toLowerCase().includes(search);

    return matchesStatus && matchesSearch;
  });

  const statusData = [
    {
      name: "Pending",
      value: pendingCount,
    },
    {
      name: "Approved",
      value: approvedCount,
    },
    {
      name: "Rejected",
      value: rejectedCount,
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

    const checkAIEngine = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/");

        if (response.ok) {
          setAiEngineOnline(true);
        } else {
          setAiEngineOnline(false);
        }
      } catch (error) {
        setAiEngineOnline(false);
      }
    };

    checkAIEngine();

    const interval = setInterval(checkAIEngine, 10000);

    return () => clearInterval(interval);
  }, []);

  const openRequests = (filter = "All") => {
    setRequestFilter(filter);
    setActiveSection("requests");
  };

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

  console.log("AI Engine Status:", aiEngineOnline);

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

        <div
          className={`admin-status ${aiEngineOnline ? "online" : "offline"}`}
        >
          <span></span>
          {aiEngineOnline ? "AI Engine Online" : "AI Engine Offline"}
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

        {/* Operations Snapshot */}
        <section className="admin-operations-snapshot">
          <div className="snapshot-heading">
            <div>
              <span className="snapshot-label">LIVE OPERATIONS</span>
              <h2>Operations Snapshot</h2>
              <p>Real-time overview of the maritime quotation workflow.</p>
            </div>
          </div>

          <div className="snapshot-metrics">
            <button
              className="snapshot-item snapshot-button"
              onClick={() => setActiveSection("ai-engine")}
            >
              <span
                className={`snapshot-dot ${
                  aiEngineOnline ? "online" : "offline"
                }`}
              ></span>

              <div>
                <strong>AI Engine</strong>
                <small>
                  {aiEngineOnline ? "Online & Monitoring" : "Offline"}
                </small>
              </div>
            </button>

            <button
              className="snapshot-item snapshot-button"
              onClick={() => openRequests("All")}
            >
              <div>
                <strong>{requests.length}</strong>
                <small>Total Requests</small>
              </div>
            </button>

            <button
              className="snapshot-item snapshot-button"
              onClick={() => openRequests("Pending Review")}
            >
              <div>
                <strong>{pendingCount}</strong>
                <small>Pending Review</small>
              </div>
            </button>

            <button
              className="snapshot-item snapshot-button"
              onClick={() => openRequests("Approved")}
            >
              <div>
                <strong>{approvedCount}</strong>
                <small>Approved</small>
              </div>
            </button>

            <button
              className="snapshot-item snapshot-button"
              onClick={() => openRequests("All")}
            >
              <div>
                <strong>{totalContainers}</strong>
                <small>Containers</small>
              </div>
            </button>
          </div>
        </section>

        <div
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1586528116311-ad8ed7f66909?q=80&w=2070&auto=format&fit=crop')",
            height: "160px",
            borderRadius: "16px",
            backgroundSize: "cover",
            backgroundPosition: "center",
            marginBottom: "24px",
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
                <span>Total Requests</span>
                <strong>{requests.length}</strong>
                <small>All quotation requests</small>
              </div>

              <div className="admin-stat-card">
                <span>Pending Review</span>
                <strong>{pendingCount}</strong>
                <small>Awaiting admin action</small>
              </div>

              <div className="admin-stat-card">
                <span>Approved</span>
                <strong>{approvedCount}</strong>
                <small>Approved quotations</small>
              </div>

              <div className="admin-stat-card">
                <span>Rejected</span>
                <strong>{rejectedCount}</strong>
                <small>Rejected quotations</small>
              </div>

              <div className="admin-stat-card">
                <span>Total Freight Value</span>
                <strong>{formatCurrency(totalFreight)}</strong>
                <small>Combined quotation value</small>
              </div>

              <div className="admin-stat-card">
                <span>Average Route Score</span>
                <strong>{averageRouteScore.toFixed(1)}</strong>
                <small>AI route evaluation</small>
              </div>

              <div className="admin-stat-card">
                <span>Average Transit</span>
                <strong>{averageTransitTime.toFixed(1)} days</strong>
                <small>Estimated journey time</small>
              </div>

              <div className="admin-stat-card">
                <span>Total Containers</span>
                <strong>{totalContainers}</strong>
                <small>Across all requests</small>
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
                          <Cell fill="#ef4444" />
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
                <p>
                  {requestFilter === "All"
                    ? "All customer quotation requests."
                    : `Showing ${requestFilter.toLowerCase()} quotation requests.`}
                </p>
              </div>
              <button className="refresh-button" onClick={loadRequests}>
                Refresh Data
              </button>
            </div>

            <div className="request-filter-bar">
              <span>Filter requests:</span>

              <button
                className={requestFilter === "All" ? "active" : ""}
                onClick={() => setRequestFilter("All")}
              >
                All ({requests.length})
              </button>

              <button
                className={requestFilter === "Pending Review" ? "active" : ""}
                onClick={() => setRequestFilter("Pending Review")}
              >
                Pending ({pendingCount})
              </button>

              <button
                className={requestFilter === "Approved" ? "active" : ""}
                onClick={() => setRequestFilter("Approved")}
              >
                Approved ({approvedCount})
              </button>

              <button
                className={requestFilter === "Rejected" ? "active" : ""}
                onClick={() => setRequestFilter("Rejected")}
              >
                Rejected ({rejectedCount})
              </button>
            </div>

            <div className="request-search-bar">
              <span>🔎</span>

              <input
                type="text"
                placeholder="Search customer, origin, destination or cargo..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              {searchTerm && (
                <button
                  className="clear-search"
                  onClick={() => setSearchTerm("")}
                >
                  Clear
                </button>
              )}
            </div>

            {filteredRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No {requestFilter.toLowerCase()} requests</h3>
                <p>
                  There are currently no quotation requests matching this
                  filter.
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

                {filteredRequests.map((request) => (
                  <div className="request-row" key={request.id}>
                    <div className="customer-cell">
                      <div className="customer-avatar">
                        {request.customer?.name
                          ? request.customer.name.charAt(0).toUpperCase()
                          : "C"}
                      </div>

                      <div>
                        <strong>
                          {request.customer?.name || "Unknown Customer"}
                        </strong>

                        <small>
                          {request.customer?.email || "No email available"}
                        </small>
                      </div>
                    </div>

                    <div className="route-cell">
                      <strong>
                        {request.shipment?.origin || "—"} →{" "}
                        {request.shipment?.destination || "—"}
                      </strong>

                      <small>
                        Route: {request.quotation?.recommended_route || "—"}
                      </small>
                    </div>

                    <div className="cargo-cell">
                      <strong>{request.shipment?.cargo_type || "—"}</strong>

                      <small>Cargo Type</small>
                    </div>

                    <div className="container-cell">
                      <strong>{request.shipment?.containers ?? "—"}</strong>

                      <small>Containers</small>
                    </div>

                    <div className="freight-cell">
                      <strong>
                        {formatCurrency(request.quotation?.total_freight_usd)}
                      </strong>

                      <small>Total Freight</small>
                    </div>

                    <div>
                      <span className="status-badge">
                        {request.status || "Pending Review"}
                      </span>
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

        {activeSection === "ai-engine" && (
          <section className="admin-panel ai-engine-panel">
            <div className="panel-heading">
              <div>
                <h2>AI Engine Overview</h2>
                <p>
                  Monitor the intelligent agents used in the maritime quotation
                  workflow.
                </p>
              </div>

              <button
                className="refresh-button"
                onClick={() => setActiveSection("dashboard")}
              >
                ← Back to Dashboard
              </button>
            </div>

            <div className="ai-engine-content">
              <div className="ai-engine-status">
                <div className="ai-status-indicator">
                  <span
                    className={`snapshot-dot ${
                      aiEngineOnline ? "online" : "offline"
                    }`}
                  ></span>

                  <div>
                    <strong>
                      {aiEngineOnline
                        ? "AI Engine Online"
                        : "AI Engine Offline"}
                    </strong>

                    <p>
                      {aiEngineOnline
                        ? "The quotation intelligence workflow is ready to process maritime shipment requests."
                        : "The quotation backend is currently unavailable."}
                    </p>
                  </div>
                </div>

                <div className="ai-status-meta">
                  <span>3 Agents</span>
                  <span>Quotation Workflow</span>
                </div>
              </div>

              <div className="ai-workflow">
                <div className="workflow-heading">
                  <div>
                    <h3>Quotation Intelligence Workflow</h3>
                    <p>
                      Each agent contributes a specific stage to the quotation
                      generation process.
                    </p>
                  </div>
                </div>

                <div className="workflow-steps">
                  <div className="workflow-step">
                    <div className="workflow-number">01</div>

                    <div className="agent-icon">🚢</div>

                    <div className="workflow-info">
                      <span className="workflow-label">ROUTE INTELLIGENCE</span>
                      <h4>Route Agent</h4>

                      <p>
                        Analyzes available routes using transit time, distance,
                        and transshipment factors to calculate route
                        suitability.
                      </p>

                      <div className="workflow-output">
                        <span>OUTPUT</span>
                        <strong>Recommended Route + Route Score</strong>
                      </div>
                    </div>

                    <div
                      className={`agent-status ${aiEngineOnline ? "ready" : "offline"}`}
                    >
                      <span>●</span>
                      {aiEngineOnline ? "Ready" : "Offline"}
                    </div>
                  </div>

                  <div className="workflow-connector">↓</div>

                  <div className="workflow-step">
                    <div className="workflow-number">02</div>

                    <div className="agent-icon">💰</div>

                    <div className="workflow-info">
                      <span className="workflow-label">
                        PRICING INTELLIGENCE
                      </span>
                      <h4>Pricing Agent</h4>

                      <p>
                        Calculates freight pricing using base freight, fuel
                        surcharge, port charges, risk surcharge, demand factors,
                        and operating costs.
                      </p>

                      <div className="workflow-output">
                        <span>OUTPUT</span>
                        <strong>Pricing Breakdown + Operating Cost</strong>
                      </div>
                    </div>

                    <div
                      className={`agent-status ${aiEngineOnline ? "ready" : "offline"}`}
                    >
                      <span>●</span>
                      {aiEngineOnline ? "Ready" : "Offline"}
                    </div>
                  </div>

                  <div className="workflow-connector">↓</div>

                  <div className="workflow-step">
                    <div className="workflow-number">03</div>

                    <div className="agent-icon">📈</div>

                    <div className="workflow-info">
                      <span className="workflow-label">
                        MARGIN INTELLIGENCE
                      </span>
                      <h4>Margin Agent</h4>

                      <p>
                        Uses the calculated operating cost and target margin to
                        determine the margin amount and proposed selling price.
                      </p>

                      <div className="workflow-output">
                        <span>OUTPUT</span>
                        <strong>Margin Analysis + Selling Price</strong>
                      </div>
                    </div>

                    <div
                      className={`agent-status ${aiEngineOnline ? "ready" : "offline"}`}
                    >
                      <span>●</span>
                      {aiEngineOnline ? "Ready" : "Offline"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ai-engine-note">
                <div className="ai-engine-note-icon">ℹ</div>

                <div>
                  <strong>How the AI Engine works</strong>
                  <p>
                    When a quotation is generated, the workflow processes the
                    shipment through route analysis, pricing calculation, and
                    margin evaluation to produce the final quotation.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSection === "route" && (
          <section className="admin-panel route-analysis-panel">
            <div className="panel-heading">
              <div>
                <h2>Route Analysis</h2>
                <p>
                  Review AI-recommended maritime routes and their performance
                  indicators.
                </p>
              </div>

              <button className="refresh-button" onClick={loadRequests}>
                Refresh Data
              </button>
            </div>

            {requests.length === 0 ? (
              <div className="empty-state">
                <h3>No route data yet</h3>
                <p>
                  Route analysis will appear when customers submit quotations.
                </p>
              </div>
            ) : (
              <div className="route-analysis-list">
                {requests.map((request) => {
                  const score = Number(request.quotation?.route_score) || 0;

                  return (
                    <div className="route-analysis-card" key={request.id}>
                      <div className="route-analysis-header">
                        <div>
                          <span className="route-analysis-label">
                            RECOMMENDED ROUTE
                          </span>

                          <h3>
                            {request.shipment?.origin} →{" "}
                            {request.shipment?.destination}
                          </h3>

                          <span className="route-id">
                            Route: {request.quotation?.recommended_route || "—"}
                          </span>
                        </div>

                        <div className="route-score-box">
                          <span>AI SCORE</span>
                          <strong>{score.toFixed(1)}</strong>
                          <small>OUT OF 100</small>
                        </div>
                      </div>

                      <div className="route-analysis-metrics">
                        <div>
                          <span>Transit Time</span>
                          <strong>
                            {request.quotation?.transit_time_days ?? "—"} days
                          </strong>
                        </div>

                        <div>
                          <span>Cargo Type</span>
                          <strong>{request.shipment?.cargo_type || "—"}</strong>
                        </div>

                        <div>
                          <span>Containers</span>
                          <strong>{request.shipment?.containers ?? "—"}</strong>
                        </div>

                        <div>
                          <span>Quotation Value</span>
                          <strong>
                            {formatCurrency(
                              request.quotation?.total_freight_usd,
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="route-analysis-footer">
                        <span>Request #{request.id}</span>

                        <button
                          className="review-button"
                          onClick={() => setSelectedRequest(request)}
                        >
                          Review →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
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

              <button className="refresh-button" onClick={loadRequests}>
                Refresh Data
              </button>
            </div>

            {requests.length === 0 ? (
              <div className="empty-state">
                <h3>No margin data yet</h3>
                <p>
                  Margin details will appear when customers submit quotations.
                </p>
              </div>
            ) : (
              <div className="margin-review-list">
                {requests.map((request) => {
                  const margin = request.quotation?.margin;

                  return (
                    <div className="margin-review-card" key={request.id}>
                      <div className="margin-review-header">
                        <div>
                          <span className="margin-review-label">
                            MARGIN ANALYSIS
                          </span>

                          <h3>
                            {request.shipment?.origin || "—"} →{" "}
                            {request.shipment?.destination || "—"}
                          </h3>

                          <span className="route-id">
                            Route: {request.quotation?.recommended_route || "—"}
                          </span>
                        </div>

                        <div className="selling-price-box">
                          <span>SELLING PRICE</span>

                          <strong>
                            {formatCurrency(margin?.selling_price)}
                          </strong>
                        </div>
                      </div>

                      <div className="margin-metrics-grid">
                        <div>
                          <span>Operating Cost</span>
                          <strong>
                            {formatCurrency(margin?.operating_cost)}
                          </strong>
                        </div>

                        <div>
                          <span>Target Margin</span>
                          <strong>
                            {margin?.target_margin_percent ?? "—"}%
                          </strong>
                        </div>

                        <div>
                          <span>Margin Amount</span>
                          <strong>
                            {formatCurrency(margin?.margin_amount)}
                          </strong>
                        </div>

                        <div>
                          <span>Containers</span>
                          <strong>{request.shipment?.containers ?? "—"}</strong>
                        </div>
                      </div>

                      <div className="margin-review-footer">
                        <span>
                          Request #{request.id} ·{" "}
                          {request.shipment?.cargo_type || "Cargo"}
                        </span>

                        <button
                          className="review-button"
                          onClick={() => setSelectedRequest(request)}
                        >
                          Review →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeSection === "pricing" && (
          <section className="admin-panel pricing-review-panel">
            <div className="panel-heading">
              <div>
                <h2>Pricing Review</h2>
                <p>
                  Review freight pricing components generated by the Pricing
                  Agent.
                </p>
              </div>

              <button className="refresh-button" onClick={loadRequests}>
                Refresh Data
              </button>
            </div>

            {requests.length === 0 ? (
              <div className="empty-state">
                <h3>No pricing data yet</h3>
                <p>
                  Pricing details will appear when customers submit quotations.
                </p>
              </div>
            ) : (
              <div className="pricing-review-list">
                {requests.map((request) => {
                  const pricing = request.quotation?.pricing;

                  return (
                    <div className="pricing-review-card" key={request.id}>
                      <div className="pricing-review-header">
                        <div>
                          <span className="pricing-review-label">
                            PRICING ANALYSIS
                          </span>

                          <h3>
                            {request.shipment?.origin || "—"} →{" "}
                            {request.shipment?.destination || "—"}
                          </h3>

                          <span className="route-id">
                            Route: {request.quotation?.recommended_route || "—"}
                          </span>
                        </div>

                        <div className="pricing-total-box">
                          <span>TOTAL FREIGHT</span>
                          <strong>
                            {formatCurrency(
                              request.quotation?.total_freight_usd,
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="pricing-metrics-grid">
                        <div>
                          <span>Base Freight</span>
                          <strong>
                            {formatCurrency(pricing?.base_freight)}
                          </strong>
                        </div>

                        <div>
                          <span>Fuel Surcharge</span>
                          <strong>
                            {formatCurrency(pricing?.fuel_surcharge)}
                          </strong>
                        </div>

                        <div>
                          <span>Port Charges</span>
                          <strong>
                            {formatCurrency(pricing?.port_charge)}
                          </strong>
                        </div>

                        <div>
                          <span>Risk Surcharge</span>
                          <strong>
                            {formatCurrency(pricing?.risk_surcharge)}
                          </strong>
                        </div>

                        <div>
                          <span>Operating Cost</span>
                          <strong>
                            {formatCurrency(pricing?.operating_cost)}
                          </strong>
                        </div>

                        <div>
                          <span>Demand Factor</span>
                          <strong>{pricing?.demand_factor ?? "—"}</strong>
                        </div>

                        <div>
                          <span>Target Margin</span>
                          <strong>
                            {pricing?.target_margin_percent ?? "—"}%
                          </strong>
                        </div>

                        <div>
                          <span>Containers</span>
                          <strong>{request.shipment?.containers ?? "—"}</strong>
                        </div>
                      </div>

                      <div className="pricing-review-footer">
                        <span>
                          Request #{request.id} ·{" "}
                          {request.shipment?.cargo_type || "Cargo"}
                        </span>

                        <button
                          className="review-button"
                          onClick={() => setSelectedRequest(request)}
                        >
                          Review →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
