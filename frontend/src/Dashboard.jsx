import { useEffect, useState } from "react";
import { generateQuotation } from "./services/routeApi";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./App.css";

// ----------------------------------------------------
// MAP CONFIGURATION & COORDINATES
// ----------------------------------------------------
const portCoordinates = {
  Antwerp: [51.2194, 4.4025],
  Barcelona: [41.3851, 2.1734],
  "Buenos Aires": [-34.6037, -58.3816],
  Busan: [35.1796, 129.0756],
  "Cape Town": [-33.9249, 18.4241],
  Chennai: [13.0827, 80.2707],
  Colombo: [6.9271, 79.8612],
  Dubai: [25.2048, 55.2708],
  Durban: [-29.8587, 31.0218],
  Genoa: [44.4056, 8.9463],
  Hamburg: [53.5511, 9.9937],
  "Hong Kong": [22.3193, 114.1694],
  "Jebel Ali": [25.0113, 55.056],
  London: [51.5074, -0.1278],
  "Long Beach": [33.7701, -118.1937],
  "Los Angeles": [34.0522, -118.2437],
  Mombasa: [-4.0435, 39.6682],
  Mumbai: [18.9667, 72.8333],
  "New York": [40.7128, -74.006],
  "Panama City": [8.9824, -79.5199],
  "Port Klang": [3.0333, 101.3667],
  Rotterdam: [51.9225, 4.4792],
  Santos: [-23.9618, -46.3322],
  Seattle: [47.6062, -122.3321],
  Shanghai: [31.2304, 121.4737],
  Singapore: [1.3521, 103.8198],
  Sydney: [-33.8688, 151.2093],
  Tokyo: [35.6762, 139.6503],
  Valparaiso: [-33.0456, -71.6202],
  Vancouver: [49.2827, -123.1207],
};

// ----------------------------------------------------
// DYNAMIC WAYPOINT ROUTING FOR ALTERNATIVES
// ----------------------------------------------------
const waypoints = {
  Gibraltar: [35.95, -5.48],
  Suez: [29.92, 32.55],
  BabElMandeb: [12.58, 43.33],
  Malacca: [3.43, 99.27],
  Panama: [9.1, -79.68],
  CapeOfGoodHope: [-35.0, 20.0],
};

const getRegion = (port) => {
  if (
    [
      "Antwerp",
      "Barcelona",
      "Genoa",
      "Hamburg",
      "London",
      "Rotterdam",
    ].includes(port)
  )
    return "EU";
  if (
    [
      "Busan",
      "Chennai",
      "Colombo",
      "Hong Kong",
      "Mumbai",
      "Port Klang",
      "Shanghai",
      "Singapore",
      "Sydney",
      "Tokyo",
    ].includes(port)
  )
    return "ASIA_OCEANIA";
  if (["Long Beach", "Los Angeles", "Seattle", "Vancouver"].includes(port))
    return "NA_WEST";
  if (["New York"].includes(port)) return "NA_EAST";
  if (["Dubai", "Jebel Ali"].includes(port)) return "MIDDLE_EAST";
  return "OTHER";
};

// Generates unique visual routes
const getRealisticRoute = (orig, dest, routeObj, recommendedRouteId) => {
  if (!routeObj) return [];
  const origCoord = portCoordinates[orig];
  const destCoord = portCoordinates[dest];
  if (!origCoord || !destCoord) return [];

  let path = [origCoord];
  const rOrig = getRegion(orig);
  const rDest = getRegion(dest);

  if (
    (rOrig === "EU" && rDest === "ASIA_OCEANIA") ||
    (rOrig === "ASIA_OCEANIA" && rDest === "EU")
  ) {
    if (routeObj.transshipments === 0)
      path.push(
        waypoints.Gibraltar,
        waypoints.Suez,
        waypoints.BabElMandeb,
        waypoints.Malacca,
      );
    else path.push(waypoints.CapeOfGoodHope, waypoints.Malacca);
  } else if (
    (rOrig === "EU" && rDest === "NA_WEST") ||
    (rOrig === "NA_WEST" && rDest === "EU")
  ) {
    path.push(waypoints.Panama);
  } else if (
    (rOrig === "NA_EAST" && rDest === "ASIA_OCEANIA") ||
    (rOrig === "ASIA_OCEANIA" && rDest === "NA_EAST")
  ) {
    path.push(waypoints.Panama);
  }

  // Visual offset so alternative routes don't overlap the main route exactly
  const isRecommended = routeObj.route_id === recommendedRouteId;
  const offset = isRecommended ? 0 : (routeObj.rank || 2) * 1.5;

  const finalPath = path.map((point, index) => {
    if (index === 0) return point;
    return [point[0] + offset, point[1] - offset];
  });

  finalPath.push(destCoord);
  return finalPath;
};

// ----------------------------------------------------
// UI COMPONENTS
// ----------------------------------------------------
const originIcon = new L.DivIcon({
  className: "custom-icon",
  html: `<div style="background-color: #38bdf8; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(56,189,248,0.8);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const destIcon = new L.DivIcon({
  className: "custom-icon",
  html: `<div style="background-color: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(16,185,129,0.8);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function MapBounds({ origin, destination }) {
  const map = useMap();
  useEffect(() => {
    if (origin && destination) {
      const bounds = L.latLngBounds([
        portCoordinates[origin],
        portCoordinates[destination],
      ]);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [origin, destination, map]);
  return null;
}

// ----------------------------------------------------

function Dashboard({ user, onLogout }) {
  const [customerRequests, setCustomerRequests] = useState([]);
  const [origin, setOrigin] = useState("Tokyo");
  const [destination, setDestination] = useState("Sydney");
  const [cargoType, setCargoType] = useState("Electronics");
  const [containers, setContainers] = useState(10);

  const [result, setResult] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
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
    setActiveRoute(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToNewQuotation = () => {
    setActiveSection("quotation");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToQuotations = () => {
    setActiveSection("quotations");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRouteSelection = (route) => {
    setActiveRoute(route);
    document
      .getElementById("map-view-section")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
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

  const analyzeRoute = async () => {
    setLoading(true);
    setResult(null);
    setActiveRoute(null);

    try {
      const data = await generateQuotation({
        origin: origin,
        destination: destination,
        cargo_type: cargoType,
        containers: Number(containers),
      });

      setResult(data);

      if (data.status === "success") {
        setActiveRoute(data.recommended_route_details);

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
          feedback: "",
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
            <div className="profile">
              {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
            </div>
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
                      <div style={{ flex: 1 }}>
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

                        {/* Customer Dashboard Feedback Display */}
                        {request.feedback && (
                          <div
                            className={`admin-feedback-note ${request.status === "Rejected" ? "rejected" : "approved"}`}
                          >
                            <strong>✦ Admin Dispatch Note</strong>
                            <p>{request.feedback}</p>
                          </div>
                        )}
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

              {result && activeRoute && (
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

                      {/* 🗺️ INTERACTIVE MAP SHOWING ALL ROUTES */}
                      <div
                        id="map-view-section"
                        style={{
                          height: "420px",
                          width: "100%",
                          borderRadius: "14px",
                          overflow: "hidden",
                          marginBottom: "40px",
                          border: "1px solid #1e293b",
                          zIndex: 0,
                          backgroundColor: "#323232",
                        }}
                      >
                        <MapContainer
                          style={{ height: "100%", width: "100%" }}
                          zoomControl={true}
                          scrollWheelZoom={true}
                        >
                          <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                            attribution="&copy; Esri"
                          />

                          {/* Map the main recommended route first */}
                          <Polyline
                            positions={getRealisticRoute(
                              result.origin,
                              result.destination,
                              result.recommended_route_details,
                              result.recommended_route,
                            )}
                            color={
                              activeRoute.route_id === result.recommended_route
                                ? "#10b981"
                                : "#64748b"
                            }
                            weight={
                              activeRoute.route_id === result.recommended_route
                                ? 4
                                : 2
                            }
                            dashArray={
                              activeRoute.route_id === result.recommended_route
                                ? ""
                                : "6, 6"
                            }
                            opacity={
                              activeRoute.route_id === result.recommended_route
                                ? 1
                                : 0.4
                            }
                          >
                            <Popup>
                              <strong>{result.recommended_route}</strong>
                              <br />
                              Click to view details
                            </Popup>
                          </Polyline>

                          {/* Map all alternative routes dynamically */}
                          {result.alternatives.map((routeOpt) => {
                            const isActive =
                              activeRoute.route_id === routeOpt.route_id;
                            return (
                              <Polyline
                                key={routeOpt.route_id}
                                positions={getRealisticRoute(
                                  result.origin,
                                  result.destination,
                                  routeOpt,
                                  result.recommended_route,
                                )}
                                color={isActive ? "#0d6efd" : "#64748b"}
                                weight={isActive ? 4 : 2}
                                dashArray={isActive ? "" : "6, 6"}
                                opacity={isActive ? 1 : 0.4}
                              >
                                <Popup>
                                  <strong>{routeOpt.route_id}</strong>
                                  <br />
                                  Click to view details
                                </Popup>
                              </Polyline>
                            );
                          })}

                          <Marker
                            position={portCoordinates[result.origin]}
                            icon={originIcon}
                          >
                            <Popup>
                              <strong>{result.origin}</strong>
                              <br />
                              Origin Port
                            </Popup>
                          </Marker>
                          <Marker
                            position={portCoordinates[result.destination]}
                            icon={destIcon}
                          >
                            <Popup>
                              <strong>{result.destination}</strong>
                              <br />
                              Destination Port
                            </Popup>
                          </Marker>
                          <MapBounds
                            origin={result.origin}
                            destination={result.destination}
                          />
                        </MapContainer>
                      </div>
                      <p
                        style={{
                          textAlign: "center",
                          fontSize: "12px",
                          color: "#64748b",
                          marginTop: "-30px",
                          marginBottom: "30px",
                          zIndex: 10,
                          position: "relative",
                        }}
                      >
                        Map is fully interactive. Click any dashed line to
                        select an alternative route.
                      </p>

                      {/* 1. Active Route Details */}
                      <section className="recommended-section">
                        <div className="section-heading">
                          <div>
                            <p className="section-label">
                              {activeRoute.route_id === result.recommended_route
                                ? "BEST RECOMMENDED ROUTE"
                                : "SELECTED ALTERNATIVE ROUTE"}
                            </p>
                            <h2>
                              {activeRoute.route_id === result.recommended_route
                                ? "Best Recommended Route"
                                : `Details for ${activeRoute.route_id}`}
                            </h2>
                          </div>
                        </div>

                        <div
                          className="recommended-route-card"
                          style={{
                            borderColor:
                              activeRoute.route_id === result.recommended_route
                                ? "#e2e8f0"
                                : "#bfdbfe",
                          }}
                        >
                          <p className="section-label">
                            {activeRoute.route_id === result.recommended_route
                              ? "RECOMMENDED ROUTE"
                              : "ALTERNATIVE ROUTE"}
                          </p>

                          <h3>{activeRoute.route_id}</h3>

                          <p className="route-id">{activeRoute.route_type}</p>

                          <div className="route-metrics">
                            <div className="route-metric">
                              <span>Transit Time</span>
                              <strong>{activeRoute.transit_days} days</strong>
                            </div>

                            <div className="route-metric">
                              <span>Distance</span>
                              <strong>{activeRoute.distance_nm} NM</strong>
                            </div>

                            <div className="route-metric">
                              <span>Transshipments</span>
                              <strong>{activeRoute.transshipments}</strong>
                            </div>
                          </div>

                          <div className="route-base-freight">
                            <span>Route Score</span>
                            <strong>{activeRoute.route_score}/100</strong>
                          </div>

                          <div className="route-base-freight">
                            <span>Base Freight</span>
                            <strong>
                              {formatCurrency(activeRoute.base_freight_usd)}
                            </strong>
                          </div>
                        </div>
                      </section>

                      {/* 2. Alternative Routes List */}
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
                              <div
                                className="route-item"
                                key={route.route_id}
                                onClick={() => handleRouteSelection(route)}
                                style={{
                                  cursor: "pointer",
                                  border:
                                    activeRoute.route_id === route.route_id
                                      ? "2px solid #0d6efd"
                                      : "1px solid #e2e8f0",
                                  backgroundColor:
                                    activeRoute.route_id === route.route_id
                                      ? "#f0f6ff"
                                      : "white",
                                }}
                              >
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
                                    {formatCurrency(route.base_freight_usd)}
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
                          <h3>🏆 Route Score ({activeRoute.route_id})</h3>

                          <p>AI evaluation of the currently selected route</p>

                          {/* Transit */}
                          <div className="score-item">
                            <div className="score-item-header">
                              <span>⏱️ Transit Time</span>

                              <strong>
                                {activeRoute.score_breakdown.transit_score}
                                /100
                              </strong>
                            </div>

                            <div className="score-bar">
                              <div
                                className="score-bar-fill"
                                style={{
                                  width: `${activeRoute.score_breakdown.transit_score}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Distance */}
                          <div className="score-item">
                            <div className="score-item-header">
                              <span>📍 Distance</span>

                              <strong>
                                {activeRoute.score_breakdown.distance_score}
                                /100
                              </strong>
                            </div>

                            <div className="score-bar">
                              <div
                                className="score-bar-fill"
                                style={{
                                  width: `${activeRoute.score_breakdown.distance_score}%`,
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
                                  activeRoute.score_breakdown
                                    .transshipment_score
                                }
                                /100
                              </strong>
                            </div>

                            <div className="score-bar">
                              <div
                                className="score-bar-fill"
                                style={{
                                  width: `${activeRoute.score_breakdown.transshipment_score}%`,
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
                            <span>Total Freight Cost</span>

                            <strong>
                              {formatCurrency(result.total_freight_usd)}
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
                        <div style={{ flex: 1 }}>
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

                          {/* Customer Quotation Creation Feedback Display */}
                          {request.feedback && (
                            <div
                              style={{
                                marginTop: "12px",
                                padding: "10px 14px",
                                background:
                                  request.status === "Rejected"
                                    ? "#fef2f2"
                                    : "#ecfdf5",
                                borderLeft: `3px solid ${request.status === "Rejected" ? "#ef4444" : "#10b981"}`,
                                borderRadius: "4px",
                                fontSize: "12px",
                                color: "#334155",
                                maxWidth: "600px",
                              }}
                            >
                              <strong
                                style={{
                                  color:
                                    request.status === "Rejected"
                                      ? "#b91c1c"
                                      : "#047857",
                                }}
                              >
                                Admin Note:
                              </strong>{" "}
                              {request.feedback}
                            </div>
                          )}
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
                      <div style={{ flex: 1 }}>
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

                        {/* Customer All Quotations Feedback Display */}
                        {request.feedback && (
                          <div
                            style={{
                              marginTop: "12px",
                              padding: "10px 14px",
                              background:
                                request.status === "Rejected"
                                  ? "#fef2f2"
                                  : "#ecfdf5",
                              borderLeft: `3px solid ${request.status === "Rejected" ? "#ef4444" : "#10b981"}`,
                              borderRadius: "4px",
                              fontSize: "12px",
                              color: "#334155",
                              maxWidth: "600px",
                            }}
                          >
                            <strong
                              style={{
                                color:
                                  request.status === "Rejected"
                                    ? "#b91c1c"
                                    : "#047857",
                              }}
                            >
                              Admin Note:
                            </strong>{" "}
                            {request.feedback}
                          </div>
                        )}
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
