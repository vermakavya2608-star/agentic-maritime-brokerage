import { useEffect, useState } from "react";
import { generateQuotation } from "./services/routeApi";
import "./App.css";

function Dashboard({ user, onLogout }) {
  const [customerRequests, setCustomerRequests] = useState([]);
  const [origin, setOrigin] = useState("Tokyo");
  const [destination, setDestination] = useState("Sydney");
  const [cargoType, setCargoType] = useState("Electronics");
  const [containers, setContainers] = useState(10);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    const savedRequests =
      JSON.parse(localStorage.getItem("quotationRequests")) || [];

    const userRequests = savedRequests.filter(
      (request) =>
        request.customer.email?.toLowerCase() === user?.email?.toLowerCase(),
    );

    setCustomerRequests(userRequests);
  }, [user]);

  const goToDashboard = () => {
    setActiveSection("dashboard");
    setResult(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const goToNewQuotation = () => {
    setActiveSection("quotation");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const goToQuotations = () => {
    setActiveSection("quotations");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const analyzeRoute = async () => {
    setLoading(true);
    setResult(null);

    try {
      const data = await generateQuotation({
        origin: origin,
        destination: destination,
        cargo_type: cargoType,
        containers: Number(containers),
      });

      setResult(data);

      if (data.status === "success") {
        const quotationRequest = {
          id: Date.now(),
          customer: {
            name: user?.name || "Customer",
            email: user?.email || "",
          },
          shipment: {
            origin: origin,
            destination: destination,
            cargo_type: cargoType,
            containers: Number(containers),
          },
          quotation: data,
          status: "Pending Review",
          createdAt: new Date().toLocaleString(),
        };

        const existingRequests =
          JSON.parse(localStorage.getItem("quotationRequests")) || [];

        existingRequests.unshift(quotationRequest);

        localStorage.setItem(
          "quotationRequests",
          JSON.stringify(existingRequests),
        );

        setCustomerRequests(
          existingRequests.filter(
            (request) =>
              request.customer.email?.toLowerCase() ===
              user?.email?.toLowerCase(),
          ),
        );
      }
    } catch (error) {
      console.error("Error:", error);

      setResult({
        status: "error",
        message: "Could not connect to the backend.",
      });
    }

    setLoading(false);
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">⚓</div>
          <div>
            <h2>Maritime</h2>
            <span>Brokerage AI</span>
          </div>
        </div>

        <div className="engine-status">
          <span className="status-dot"></span>
          <div>
            <strong>AI Engine Online</strong>
            <small>Route Intelligence active</small>
          </div>
        </div>

        <p className="menu-title">WORKSPACE</p>

        <nav>
          <div
            className={`nav-item ${
              activeSection === "dashboard" ? "active" : ""
            }`}
            onClick={goToDashboard}
          >
            ▦ &nbsp; Dashboard
          </div>

          <div
            className={`nav-item ${
              activeSection === "quotation" ? "active" : ""
            }`}
            onClick={goToNewQuotation}
          >
            ＋ &nbsp; New Quotation
          </div>

          <div
            className={`nav-item ${
              activeSection === "quotations" ? "active" : ""
            }`}
            onClick={goToQuotations}
          >
            ▤ &nbsp; Quotations
          </div>
        </nav>

        <div className="platform">
          <strong>✦ &nbsp; Agentic Platform</strong>
          <small>Milestone 1 • Route Foundation</small>
        </div>

        <div className="nav-item settings">⚙ &nbsp; Settings</div>

        <button className="logout-button" onClick={onLogout}>
          ⇥ &nbsp; Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <div className="breadcrumb">
            Maritime Brokerage AI &nbsp;/&nbsp; <strong>Workspace</strong>
          </div>

          <div className="top-actions">
            <div className="search">⌕ &nbsp; Search quotations...</div>
            <div className="notification">♧</div>
            <div className="profile">KV</div>
          </div>
        </header>

        {/* Page */}
        <section className="page">
          {activeSection === "dashboard" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">✦ CUSTOMER DASHBOARD</div>

                  <h1>Welcome, {user?.name || "Customer"}</h1>

                  <p>
                    Manage your freight quotations and track their approval
                    status.
                  </p>
                </div>
              </div>

              <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                  <span>Total Quotations</span>
                  <strong>{customerRequests.length}</strong>
                </div>

                <div className="dashboard-stat-card">
                  <span>Pending Review</span>
                  <strong>
                    {
                      customerRequests.filter(
                        (request) => request.status === "Pending Review",
                      ).length
                    }
                  </strong>
                </div>

                <div className="dashboard-stat-card">
                  <span>Approved</span>
                  <strong>
                    {
                      customerRequests.filter(
                        (request) => request.status === "Approved",
                      ).length
                    }
                  </strong>
                </div>

                <div className="dashboard-stat-card">
                  <span>Rejected</span>
                  <strong>
                    {
                      customerRequests.filter(
                        (request) => request.status === "Rejected",
                      ).length
                    }
                  </strong>
                </div>
              </div>

              <div className="card dashboard-overview-card">
                <div className="section-heading">
                  <div>
                    <p className="section-label">QUICK ACTION</p>
                    <h2>Create a New Quotation</h2>
                  </div>
                </div>

                <p>
                  Enter your shipment details and let our AI agents analyze the
                  best route and generate your freight quotation.
                </p>

                <button className="analyze-button" onClick={goToNewQuotation}>
                  ＋ Create New Quotation →
                </button>
              </div>

              <div className="section-heading">
                <div>
                  <p className="section-label">RECENT ACTIVITY</p>
                  <h2>Recent Quotations</h2>
                </div>
              </div>

              {customerRequests.length === 0 ? (
                <div className="customer-empty-state">
                  <p>You haven't created any quotations yet.</p>
                </div>
              ) : (
                <div className="customer-request-list">
                  {customerRequests.slice(0, 3).map((request) => (
                    <div className="customer-request-card" key={request.id}>
                      <div>
                        <strong>
                          {request.shipment.origin}
                          {" → "}
                          {request.shipment.destination}
                        </strong>

                        <p>
                          {request.shipment.cargo_type}
                          {" • "}
                          {request.shipment.containers} containers
                        </p>

                        <small>Request #{request.id}</small>
                      </div>

                      <span
                        className={`customer-status ${request.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {request.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeSection === "quotation" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">✦ NEW QUOTATION</div>

                  <h1>New freight quotation</h1>

                  <p>
                    Enter shipment details and let the Route Agent analyze the
                    best maritime route.
                  </p>
                </div>
              </div>

              <div className="workspace">
                {/* Quotation form */}
                <div className="card quotation-card">
                  <div className="card-heading">
                    <div className="heading-icon">⌖</div>

                    <div>
                      <h2>Route details</h2>
                      <p>Where is the shipment moving?</p>
                    </div>
                  </div>

                  <div className="form-grid">
                    {/* Origin */}
                    <div className="form-group">
                      <label>Origin port</label>

                      <select
                        value={origin}
                        onChange={(e) => {
                          setOrigin(e.target.value);
                          setResult(null);
                        }}
                      >
                        <option>Antwerp</option>
                        <option>Barcelona</option>
                        <option>Buenos Aires</option>
                        <option>Busan</option>
                        <option>Cape Town</option>
                        <option>Chennai</option>
                        <option>Colombo</option>
                        <option>Dubai</option>
                        <option>Durban</option>
                        <option>Genoa</option>
                        <option>Hamburg</option>
                        <option>Hong Kong</option>
                        <option>Jebel Ali</option>
                        <option>London</option>
                        <option>Long Beach</option>
                        <option>Los Angeles</option>
                        <option>Mombasa</option>
                        <option>Mumbai</option>
                        <option>New York</option>
                        <option>Panama City</option>
                        <option>Port Klang</option>
                        <option>Rotterdam</option>
                        <option>Santos</option>
                        <option>Seattle</option>
                        <option>Shanghai</option>
                        <option>Singapore</option>
                        <option>Sydney</option>
                        <option>Tokyo</option>
                        <option>Valparaiso</option>
                        <option>Vancouver</option>
                      </select>
                    </div>

                    {/* Destination */}
                    <div className="form-group">
                      <label>Destination port</label>

                      <select
                        value={destination}
                        onChange={(e) => {
                          setDestination(e.target.value);
                          setResult(null);
                        }}
                      >
                        <option>Antwerp</option>
                        <option>Barcelona</option>
                        <option>Buenos Aires</option>
                        <option>Busan</option>
                        <option>Cape Town</option>
                        <option>Chennai</option>
                        <option>Colombo</option>
                        <option>Dubai</option>
                        <option>Durban</option>
                        <option>Genoa</option>
                        <option>Hamburg</option>
                        <option>Hong Kong</option>
                        <option>Jebel Ali</option>
                        <option>London</option>
                        <option>Long Beach</option>
                        <option>Los Angeles</option>
                        <option>Mombasa</option>
                        <option>Mumbai</option>
                        <option>New York</option>
                        <option>Panama City</option>
                        <option>Port Klang</option>
                        <option>Rotterdam</option>
                        <option>Santos</option>
                        <option>Seattle</option>
                        <option>Shanghai</option>
                        <option>Singapore</option>
                        <option>Sydney</option>
                        <option>Tokyo</option>
                        <option>Valparaiso</option>
                        <option>Vancouver</option>
                      </select>
                    </div>

                    {/* Cargo */}
                    <div className="form-group">
                      <label>Cargo type</label>

                      <select
                        value={cargoType}
                        onChange={(e) => setCargoType(e.target.value)}
                      >
                        <option>Electronics</option>
                        <option>General Cargo</option>
                        <option>Machinery</option>
                        <option>Textiles</option>
                      </select>
                    </div>

                    {/* Containers */}
                    <div className="form-group">
                      <label>Container quantity</label>

                      <input
                        type="number"
                        min="1"
                        value={containers}
                        onChange={(e) => setContainers(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Shipment Summary */}
                  <div className="shipment-summary">
                    <div>
                      <span>▣</span>
                      <small>Container load</small>
                      <strong>{containers} containers</strong>
                    </div>

                    <div>
                      <span>▣</span>
                      <small>Cargo</small>
                      <strong>{cargoType}</strong>
                    </div>

                    <div>
                      <span>⌖</span>
                      <small>Route</small>
                      <strong>
                        {origin} → {destination}
                      </strong>
                    </div>
                  </div>

                  <button
                    className="analyze-button"
                    onClick={analyzeRoute}
                    disabled={loading}
                  >
                    {loading
                      ? "Analyzing route..."
                      : "✦ Analyze route & generate quote →"}
                  </button>
                </div>

                {/* Route Agent */}
                <div className="card agent-card">
                  <div className="agent-icon">✦</div>

                  <h2>Route Agent</h2>

                  <p>
                    The AI agent will compare maritime route alternatives and
                    score them using transit time, distance, transshipment, and
                    route factors.
                  </p>

                  <div className="agent-steps">
                    <div>
                      <b>1</b>
                      <span>Find available routes</span>
                    </div>

                    <div>
                      <b>2</b>
                      <span>Estimate transit time</span>
                    </div>

                    <div>
                      <b>3</b>
                      <span>Compare alternatives</span>
                    </div>

                    <div>
                      <b>4</b>
                      <span>Recommend best route</span>
                    </div>
                  </div>

                  <div className="milestone-note">
                    Milestone 1 uses the foundational route intelligence engine.
                    Dynamic pricing, weather, customs and margin agents will be
                    added in later milestones.
                  </div>
                </div>
              </div>

              {/* Route Result */}

              {result && (
                <div className="card result-card">
                  {result.status === "success" ? (
                    <>
                      {/* Result Header */}
                      <div className="result-header">
                        <div>
                          <p className="section-label">ROUTE INTELLIGENCE</p>
                          <h2>Quotation Analysis</h2>
                          <p>
                            {result.candidate_routes} route
                            {result.candidate_routes !== 1 ? "s" : ""} evaluated
                            for {result.origin} → {result.destination}
                          </p>
                        </div>

                        <div className="best-route-badge">
                          🏆 Best Route: {result.recommended_route}
                        </div>
                      </div>

                      {/* 1. Best Recommended Route */}
                      <section className="recommended-section">
                        <div className="section-heading">
                          <div>
                            <p className="section-label">
                              BEST RECOMMENDED ROUTE
                            </p>
                            <h2>Best Recommended Route</h2>
                          </div>
                        </div>

                        <div className="recommended-route-card">
                          <p className="section-label">RECOMMENDED ROUTE</p>

                          <h3>{result.recommended_route_details.route_id}</h3>

                          <p className="route-id">
                            {result.recommended_route_details.route_type}
                          </p>

                          <div className="route-metrics">
                            <div className="route-metric">
                              <span>Transit Time</span>
                              <strong>
                                {result.recommended_route_details.transit_days}{" "}
                                days
                              </strong>
                            </div>

                            <div className="route-metric">
                              <span>Distance</span>
                              <strong>
                                {result.recommended_route_details.distance_nm}{" "}
                                NM
                              </strong>
                            </div>

                            <div className="route-metric">
                              <span>Transshipments</span>
                              <strong>
                                {
                                  result.recommended_route_details
                                    .transshipments
                                }
                              </strong>
                            </div>
                          </div>

                          <div className="route-base-freight">
                            <span>Route Score</span>
                            <strong>
                              {result.recommended_route_details.route_score}/100
                            </strong>
                          </div>

                          <div className="route-base-freight">
                            <span>Base Freight</span>
                            <strong>
                              $
                              {result.recommended_route_details.base_freight_usd.toLocaleString()}
                            </strong>
                          </div>
                        </div>
                      </section>

                      {/* 2. Alternative Routes */}
                      {result.alternatives.length > 0 && (
                        <section className="alternatives-section">
                          <div className="section-heading">
                            <div>
                              <p className="section-label">ALTERNATIVES</p>
                              <h2>Alternative Routes</h2>
                            </div>
                          </div>

                          <div className="routes-list">
                            {result.alternatives.map((route) => (
                              <div className="route-item" key={route.route_id}>
                                <div className="route-rank">
                                  {route.rank === 2
                                    ? "🥈"
                                    : route.rank === 3
                                      ? "🥉"
                                      : `#${route.rank}`}
                                </div>

                                <div className="route-info">
                                  <small>Route ID</small>
                                  <strong>{route.route_id}</strong>
                                </div>

                                <div className="route-info">
                                  <small>Transit</small>
                                  <strong>{route.transit_days} days</strong>
                                </div>

                                <div className="route-info">
                                  <small>Distance</small>
                                  <strong>{route.distance_nm} NM</strong>
                                </div>

                                <div className="route-info">
                                  <small>Transshipments</small>
                                  <strong>{route.transshipments}</strong>
                                </div>

                                <div className="route-info">
                                  <small>Score</small>
                                  <strong>{route.route_score}</strong>
                                </div>

                                <div className="route-info freight">
                                  <small>Base Freight</small>
                                  <strong>
                                    ${route.base_freight_usd.toLocaleString()}
                                  </strong>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* 3. Route Score */}
                      <section className="route-score-section">
                        <div className="section-heading">
                          <div>
                            <p className="section-label">ROUTE SCORE</p>
                            <h2>Route Score</h2>
                          </div>
                        </div>

                        <div className="score-breakdown-card">
                          <h3>🏆 Route Score</h3>

                          <p>AI evaluation of the selected route</p>

                          {/* Transit */}
                          <div className="score-item">
                            <div className="score-item-header">
                              <span>⏱️ Transit Time</span>

                              <strong>
                                {
                                  result.recommended_route_details
                                    .score_breakdown.transit_score
                                }
                                /100
                              </strong>
                            </div>

                            <div className="score-bar">
                              <div
                                className="score-bar-fill"
                                style={{
                                  width: `${result.recommended_route_details.score_breakdown.transit_score}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Distance */}
                          <div className="score-item">
                            <div className="score-item-header">
                              <span>📍 Distance</span>

                              <strong>
                                {
                                  result.recommended_route_details
                                    .score_breakdown.distance_score
                                }
                                /100
                              </strong>
                            </div>

                            <div className="score-bar">
                              <div
                                className="score-bar-fill"
                                style={{
                                  width: `${result.recommended_route_details.score_breakdown.distance_score}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Transshipment */}
                          <div className="score-item">
                            <div className="score-item-header">
                              <span>🔄 Transshipment</span>

                              <strong>
                                {
                                  result.recommended_route_details
                                    .score_breakdown.transshipment_score
                                }
                                /100
                              </strong>
                            </div>

                            <div className="score-bar">
                              <div
                                className="score-bar-fill"
                                style={{
                                  width: `${result.recommended_route_details.score_breakdown.transshipment_score}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* 4. Final Quotation */}
                      <section className="final-quotation-section">
                        <div className="section-heading">
                          <div>
                            <p className="section-label">FINAL QUOTATION</p>
                            <h2>Final Quotation</h2>
                          </div>
                        </div>

                        <div className="final-quotation-card">
                          <div>
                            <p className="section-label">QUOTATION READY</p>

                            <h2>Ready for Review</h2>

                            <p>
                              {result.containers} containers • {result.origin} →{" "}
                              {result.destination}
                            </p>
                          </div>

                          <div className="final-price">
                            <span>Total Freight</span>

                            <strong>
                              ${result.total_freight_usd.toLocaleString()}
                            </strong>
                          </div>
                        </div>
                      </section>
                    </>
                  ) : (
                    <p>{result.message}</p>
                  )}
                </div>
              )}

              {/* Customer Quotation Status */}

              <section className="customer-status-section">
                <div className="section-heading">
                  <div>
                    <p className="section-label">QUOTATION STATUS</p>

                    <h2>My Requests</h2>
                  </div>
                </div>

                {customerRequests.length === 0 ? (
                  <div className="customer-empty-state">
                    <p>No quotation requests yet.</p>
                  </div>
                ) : (
                  <div className="customer-request-list">
                    {customerRequests.map((request) => (
                      <div className="customer-request-card" key={request.id}>
                        <div>
                          <strong>
                            {request.shipment.origin}
                            {" → "}
                            {request.shipment.destination}
                          </strong>

                          <p>
                            {request.shipment.cargo_type}
                            {" • "}
                            {request.shipment.containers} containers
                          </p>

                          <small>Request #{request.id}</small>
                        </div>

                        <span
                          className={`customer-status ${request.status
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {request.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
          {activeSection === "quotations" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">✦ QUOTATIONS</div>

                  <h1>My Quotations</h1>

                  <p>View and track all your freight quotation requests.</p>
                </div>
              </div>

              <div className="section-heading">
                <div>
                  <p className="section-label">QUOTATION HISTORY</p>
                  <h2>My Requests</h2>
                </div>
              </div>

              {customerRequests.length === 0 ? (
                <div className="customer-empty-state">
                  <p>No quotation requests yet.</p>

                  <button className="analyze-button" onClick={goToNewQuotation}>
                    ＋ Create New Quotation →
                  </button>
                </div>
              ) : (
                <div className="customer-request-list">
                  {customerRequests.map((request) => (
                    <div className="customer-request-card" key={request.id}>
                      <div>
                        <strong>
                          {request.shipment.origin}
                          {" → "}
                          {request.shipment.destination}
                        </strong>

                        <p>
                          {request.shipment.cargo_type}
                          {" • "}
                          {request.shipment.containers} containers
                        </p>

                        <small>
                          Request #{request.id} • {request.createdAt}
                        </small>
                      </div>

                      <span
                        className={`customer-status ${request.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {request.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
