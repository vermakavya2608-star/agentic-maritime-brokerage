import { useEffect, useState } from "react";
import {
  generateQuotation,
  getLiveInsight,
  getSystemHealth,
} from "./services/routeApi";
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

function Dashboard({ user, onLogout, onUpdateUser }) {
  const [customerRequests, setCustomerRequests] = useState([]);
  const [origin, setOrigin] = useState("Tokyo");
  const [destination, setDestination] = useState("Sydney");
  const [cargoType, setCargoType] = useState("Electronics");
  const [containers, setContainers] = useState(10);

  const [result, setResult] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [highlightedRequestId, setHighlightedRequestId] = useState(null);

  // Settings Page State
  const [settingsTab, setSettingsTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Intelligently parse the existing phone string into Code and Number
  const initialPhoneFull = user?.phone || "+91 98765 43210";
  const phoneMatch = initialPhoneFull.match(/^(\+\d{1,3})\s*(.*)$/);
  const initialCode = phoneMatch ? phoneMatch[1] : "+91";
  const initialNumber = phoneMatch ? phoneMatch[2] : initialPhoneFull;

  const [profileData, setProfileData] = useState({
    name: user?.name || "Customer",
    email: user?.email || "",
    company: user?.company || "Maritime Brokerage Inc.",
    role: user?.jobRole || "Operations Manager",
    phoneCode: initialCode,            // <--- NEW: Separated Country Code
    phoneNumber: initialNumber,        // <--- NEW: Separated Phone Number
    timezone: user?.timezone || "Asia/Kolkata (IST)",
    avatar: user?.avatar || null,
  });

  const handleProfileUpdate = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  // 1. AVATAR UPLOAD HANDLER
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleProfileUpdate("avatar", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. INTERNATIONAL SMART PHONE FORMATTER
  const handlePhoneChange = (e) => {
    let input = e.target.value.replace(/[^\d]/g, ""); // Strip non-digits
    if (input.length > 15) input = input.slice(0, 15);

    let formatted = input;
    const code = profileData.phoneCode;

    if (code === "+91") {
      // India: 98765 43210
      if (input.length > 5) formatted = `${input.slice(0, 5)} ${input.slice(5)}`;
    } else if (code === "+1") {
      // US/Canada: (555) 123-4567
      if (input.length > 3 && input.length <= 6) {
        formatted = `(${input.slice(0, 3)}) ${input.slice(3)}`;
      } else if (input.length > 6) {
        formatted = `(${input.slice(0, 3)}) ${input.slice(3, 6)}-${input.slice(6)}`;
      }
    } else {
      // Global Generic: 1234 567 890
      if (input.length > 4 && input.length <= 8) {
        formatted = `${input.slice(0, 4)} ${input.slice(4)}`;
      } else if (input.length > 8) {
        formatted = `${input.slice(0, 4)} ${input.slice(4, 8)} ${input.slice(8)}`;
      }
    }

    handleProfileUpdate("phoneNumber", formatted);
  };

  // 3. INTERNATIONAL PHONE RENDERER (ULTRA-PREMIUM UX)
  const renderInternationalPhoneInput = () => (
    <div className="form-group">
      <label>Phone Number</label>
      <div 
        style={{ 
          position: "relative", display: "flex", alignItems: "center", 
          background: "rgba(0, 0, 0, 0.25)", border: "1px solid rgba(255, 255, 255, 0.08)", 
          borderRadius: "10px", transition: "all 0.2s ease" 
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = "#38bdf8"}
        onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)"}
      >
        <span style={{ position: "absolute", left: "14px", color: "#64748b", fontSize: "15px", pointerEvents: "none", zIndex: 1 }}>📞</span>
        
        {/* Country Code Dropdown */}
        <select
          value={profileData.phoneCode}
          onChange={(e) => {
            handleProfileUpdate("phoneCode", e.target.value);
            // Re-trigger formatting slightly to adjust to new country rules
            handleProfileUpdate("phoneNumber", profileData.phoneNumber.replace(/[^\d]/g, "")); 
          }}
          style={{
            appearance: "none", background: "transparent", border: "none",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)", color: "#38bdf8",
            padding: "13px 26px 13px 40px", fontSize: "13.5px", fontWeight: "700",
            cursor: "pointer", outline: "none", width: "115px", zIndex: 0
          }}
        >
          <option value="+1">🇺🇸 +1</option>
          <option value="+44">🇬🇧 +44</option>
          <option value="+91">🇮🇳 +91</option>
          <option value="+61">🇦🇺 +61</option>
          <option value="+971">🇦🇪 +971</option>
          <option value="+65">🇸🇬 +65</option>
          <option value="+49">🇩🇪 +49</option>
          <option value="+86">🇨🇳 +86</option>
        </select>
        <span style={{ position: "absolute", left: "100px", color: "#64748b", fontSize: "10px", pointerEvents: "none" }}>▼</span>

        {/* Number Input */}
        <input
          type="text"
          value={profileData.phoneNumber}
          onChange={handlePhoneChange}
          placeholder="Phone number"
          style={{
            flex: 1, background: "transparent", border: "none", color: "#f1f5f9",
            padding: "13px 16px", fontSize: "14px", fontFamily: "'Courier New', monospace",
            fontWeight: "600", letterSpacing: "1px", outline: "none"
          }}
        />

        {/* Clear Button */}
        {profileData.phoneNumber && (
          <span
            onClick={() => handleProfileUpdate("phoneNumber", "")}
            title="Clear field"
            style={{
              position: "absolute", right: "14px", color: "#94a3b8", cursor: "pointer",
              fontSize: "10px", background: "rgba(255,255,255,0.08)",
              width: "18px", height: "18px", display: "flex", alignItems: "center",
              justifyContent: "center", borderRadius: "50%", fontWeight: "bold",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => { e.target.style.background = "#ef4444"; e.target.style.color = "#fff"; }}
            onMouseOut={(e) => { e.target.style.background = "rgba(255,255,255,0.08)"; e.target.style.color = "#94a3b8"; }}
          >✕</span>
        )}
      </div>
    </div>
  );

  const saveSettings = () => {
    setIsSaving(true);
    setSaveMessage("");

    setTimeout(() => {
      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          name: profileData.name,
          email: profileData.email,
          company: profileData.company,
          jobRole: profileData.role,
          // Re-combine the global code and the formatted number
          phone: `${profileData.phoneCode} ${profileData.phoneNumber}`, 
          timezone: profileData.timezone,
          avatar: profileData.avatar,
        });
      }

      setIsSaving(false);
      setSaveMessage("Settings saved successfully.");
      setTimeout(() => setSaveMessage(""), 3000);
    }, 800);
  };

  const [llmInsight, setLlmInsight] = useState(
    "Initializing AI trade lane analysis...",
  );
  const [isLlmLoading, setIsLlmLoading] = useState(false);

  const [agentHealth, setAgentHealth] = useState({
    route: "loading",
    weather: "loading",
    pricing: "loading",
  });

  // Poll the backend every 10 seconds for real-time agent health
  useEffect(() => {
    const checkHealth = async () => {
      const health = await getSystemHealth();
      setAgentHealth(
        health.agents || {
          route: "offline",
          weather: "offline",
          pricing: "offline",
        },
      );
    };

    checkHealth(); // Check immediately on load
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedRequests =
      JSON.parse(localStorage.getItem("quotationRequests")) || [];

    const userRequests = savedRequests.filter(
      (request) =>
        request.customer.email?.toLowerCase() === user?.email?.toLowerCase(),
    );

    setCustomerRequests(userRequests);
  }, [user]);

  useEffect(() => {
    const fetchInsight = async () => {
      setIsLlmLoading(true);
      try {
        // Extract specific route details if a route has been clicked/analyzed
        const routeId = activeRoute ? activeRoute.route_id : null;
        const transitDays = activeRoute ? activeRoute.transit_days : null;

        const data = await getLiveInsight(
          origin,
          destination,
          cargoType,
          routeId,
          transitDays,
        );
        if (data.status === "success") {
          setLlmInsight(data.insight);
        }
      } catch (error) {
        console.error("LLM Error:", error);
        setLlmInsight(
          "AI connection unavailable. Running standard deterministic routing.",
        );
      }
      setIsLlmLoading(false);
    };

    // Debounce prevents spamming the API when clicking rapidly
    const timeoutId = setTimeout(() => {
      fetchInsight();
    }, 800);

    // Now it listens to activeRoute changes as well!
    return () => clearTimeout(timeoutId);
  }, [origin, destination, cargoType, activeRoute]);

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

  const goToSettings = () => {
    setActiveSection("settings");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToApi = () => {
    setActiveSection("api");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToDocs = () => {
    setActiveSection("docs");
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

  // 1. Dynamic Search Logic
  const filteredRequests = customerRequests.filter((req) => {
    const q = searchQuery.toLowerCase();
    return (
      req.id.toString().includes(q) ||
      req.shipment.origin.toLowerCase().includes(q) ||
      req.shipment.destination.toLowerCase().includes(q) ||
      req.shipment.cargo_type.toLowerCase().includes(q)
    );
  });

  // 2. Notification Logic (Tracks read/unread state & newest first)
  const notifications = customerRequests
    .filter((req) => req.status !== "Pending Review")
    .sort((a, b) => b.id - a.id) // Show newest notifications at the top
    .slice(0, 5);

  const unreadCount = notifications.filter((req) => !req.read).length;

  const markAsReadAndNavigate = (id) => {
    // 1. Mark as read in local state
    const updatedRequests = customerRequests.map((req) =>
      req.id === id ? { ...req, read: true } : req,
    );
    setCustomerRequests(updatedRequests);

    // 2. Sync read status to localStorage so it persists
    const allRequests =
      JSON.parse(localStorage.getItem("quotationRequests")) || [];
    const syncedAllRequests = allRequests.map((req) =>
      req.id === id ? { ...req, read: true } : req,
    );
    localStorage.setItem(
      "quotationRequests",
      JSON.stringify(syncedAllRequests),
    );

    // 3. Navigate & Highlight
    setHighlightedRequestId(id);
    goToQuotations();
    closeMenus();

    // 4. Scroll to the specific card after React renders the page
    setTimeout(() => {
      document
        .getElementById(`request-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);

    // 5. Turn off the highlight effect after 3 seconds
    setTimeout(() => setHighlightedRequestId(null), 3000);
  };

  const markAllAsRead = () => {
    // BUG FIX: Only mark items as read if they are ALREADY in the notification tray (Approved/Rejected)
    // This prevents "Pending" requests from being secretly marked as read before they are processed.
    const updatedRequests = customerRequests.map((req) =>
      req.status !== "Pending Review" ? { ...req, read: true } : req,
    );
    setCustomerRequests(updatedRequests);

    const allRequests =
      JSON.parse(localStorage.getItem("quotationRequests")) || [];
    const syncedAllRequests = allRequests.map((req) =>
      req.status !== "Pending Review" ? { ...req, read: true } : req,
    );
    localStorage.setItem(
      "quotationRequests",
      JSON.stringify(syncedAllRequests),
    );
  };

  // 3. Click outside handler
  const closeMenus = () => {
    setShowNotifications(false);
    setShowProfileMenu(false);
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
            {/* Live Search Omnibox */}
            <div className="search-container">
              <span className="search-icon">⌕</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search ports, ID, or cargo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={closeMenus}
              />

              {/* Dynamic Right Side: Clear Button OR Shortcut Hint */}
              {searchQuery.length > 0 ? (
                <span
                  className="search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </span>
              ) : (
                <div className="search-shortcut">
                  <kbd>Ctrl</kbd>
                  <kbd>K</kbd>
                </div>
              )}

              {/* Floating Search Results Dropdown */}
              {searchQuery.length > 0 && (
                <div className="dropdown-menu search-dropdown">
                  <h4>Search Results ({filteredRequests.length})</h4>

                  {filteredRequests.length > 0 ? (
                    filteredRequests.slice(0, 5).map((req) => (
                      <div
                        key={req.id}
                        className="dropdown-item notif-item"
                        onClick={() => {
                          setSearchQuery(""); // Clear the search
                          goToQuotations(); // Jump to the quotations page
                        }}
                      >
                        <div
                          className="notif-dot"
                          style={{
                            background: "#38bdf8",
                            boxShadow: "0 0 8px #38bdf8",
                          }}
                        ></div>
                        <div>
                          <strong>
                            {req.shipment.origin} → {req.shipment.destination}
                          </strong>
                          <small>
                            Req #{req.id} • {req.shipment.cargo_type}
                          </small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item" style={{ color: "#64748b" }}>
                      No matches found for "{searchQuery}".
                    </div>
                  )}

                  {/* Show a "View All" button if there are more than 5 results */}
                  {filteredRequests.length > 5 && (
                    <div
                      className="dropdown-item"
                      style={{
                        justifyContent: "center",
                        color: "#38bdf8",
                        fontSize: "11px",
                        fontWeight: "800",
                      }}
                      onClick={() => {
                        goToQuotations();
                        setSearchQuery("");
                      }}
                    >
                      View all {filteredRequests.length} results →
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notification Center */}
            <div className="notification-wrapper">
              <div
                className="notification"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </div>

              {showNotifications && (
                <div className="dropdown-menu notifications-menu">
                  <div className="notif-header">
                    <h4>Recent Updates</h4>
                    {unreadCount > 0 && (
                      <span className="mark-all-read" onClick={markAllAsRead}>
                        Mark all as read ✓
                      </span>
                    )}
                  </div>

                  <div className="notif-list">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`dropdown-item notif-item ${notif.read ? "read" : "unread"}`}
                          onClick={() => markAsReadAndNavigate(notif.id)}
                        >
                          {/* Colored dot for unread, gray dot for read */}
                          <div
                            className={`notif-dot ${notif.read ? "gray" : notif.status === "Approved" ? "green" : "red"}`}
                          ></div>

                          <div className="notif-content">
                            <strong>
                              Request #{notif.id} {notif.status}
                            </strong>
                            <small>
                              {notif.shipment.origin} →{" "}
                              {notif.shipment.destination}
                            </small>
                          </div>

                          {/* Blue indicator dot on the far right for unread items */}
                          {!notif.read && (
                            <div className="unread-indicator"></div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="dropdown-item empty-notif">
                        No recent updates.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Premium Profile Menu */}
            <div className="profile-wrapper">
              <div
                className="profile"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
              >
                {/* NEW AVATAR LOGIC */}
                {profileData.avatar ? (
                  <img
                    src={profileData.avatar}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : user?.name ? (
                  user.name.charAt(0).toUpperCase()
                ) : (
                  "D"
                )}
                <span className="profile-online-dot"></span>
              </div>

              {showProfileMenu && (
                <div className="dropdown-menu profile-menu">
                  <div className="profile-header">
                    <strong>
                      {user?.name || "Customer"}
                      {/* Dynamic Role Badge */}
                      <span
                        className={`role-badge ${user?.role === "admin" ? "admin" : "customer"}`}
                      >
                        {user?.role?.toUpperCase() || "CUSTOMER"}
                      </span>
                    </strong>
                    <small>{user?.email || "No email"}</small>
                  </div>

                  <div className="profile-section-label">Workspace</div>
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      goToDashboard();
                      closeMenus();
                    }}
                  >
                    <span style={{ width: "16px" }}>▦</span> Dashboard
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      goToQuotations();
                      closeMenus();
                    }}
                  >
                    <span style={{ width: "16px" }}>▤</span> My Quotations
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      goToSettings();
                      closeMenus();
                    }}
                  >
                    <span style={{ width: "16px" }}>⚙</span> Account Settings
                  </div>

                  <div className="profile-section-label">Developers</div>
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      goToApi();
                      closeMenus();
                    }}
                  >
                    <span style={{ width: "16px" }}>⌨</span> API & Python SDK
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      goToDocs();
                      closeMenus();
                    }}
                  >
                    <span style={{ width: "16px" }}>📖</span> Documentation
                  </div>

                  <div className="profile-menu-footer">
                    <div
                      className="dropdown-item text-danger"
                      onClick={onLogout}
                    >
                      <span style={{ width: "16px" }}>⇥</span> Sign Out
                    </div>
                  </div>
                </div>
              )}
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

              {/* --- 3D AI AGENTS DISPLAY --- */}
              <div className="section-heading" style={{ marginTop: "12px" }}>
                <div>
                  <p className="section-label">SYSTEM CORE</p>
                  <h2>Live AI Agents</h2>
                </div>
              </div>

              <div className="upcoming-modules-grid">
                {/* 1. Route Agent */}
                <div
                  className={`construction-card ${agentHealth.route === "offline" ? "offline" : ""}`}
                >
                  <div className="card-3d-visual">
                    <div className="radar-pulse-visual">⌖</div>
                  </div>
                  <div className={`agent-status-badge ${agentHealth.route}`}>
                    {agentHealth.route === "loading"
                      ? "⏳ CHECKING"
                      : agentHealth.route === "online"
                        ? "🟢 ONLINE"
                        : "🔴 OFFLINE"}
                  </div>
                  <h3>Route Intelligence</h3>
                  <p>
                    {agentHealth.route === "offline"
                      ? "Agent offline. Unable to access routing network database."
                      : "Scanning global maritime networks for optimal transit paths and transshipment hubs."}
                  </p>
                </div>

                {/* 2. Weather Agent */}
                <div
                  className={`construction-card ${agentHealth.weather === "offline" ? "offline" : ""}`}
                >
                  <div className="card-3d-visual">
                    <div className="holo-globe">🌐</div>
                  </div>
                  <div className={`agent-status-badge ${agentHealth.weather}`}>
                    {agentHealth.weather === "loading"
                      ? "⏳ CHECKING"
                      : agentHealth.weather === "online"
                        ? "🟢 ONLINE"
                        : "🔴 OFFLINE"}
                  </div>
                  <h3>Weather Routing</h3>
                  <p>
                    {agentHealth.weather === "offline"
                      ? "Agent offline. Satellite telemetry connection lost."
                      : "Monitoring live satellite telemetry and marine risk factors across all active ports."}
                  </p>
                </div>

                {/* 3. Pricing Agent */}
                <div
                  className={`construction-card ${agentHealth.pricing === "offline" ? "offline" : ""}`}
                >
                  <div className="card-3d-visual">
                    <div className="cube-container">
                      <div className="cube-face face-front">📊</div>
                      <div className="cube-face face-back">📈</div>
                      <div className="cube-face face-right">💰</div>
                      <div className="cube-face face-left">⚓</div>
                      <div className="cube-face face-top">⚡</div>
                      <div className="cube-face face-bottom">🚢</div>
                    </div>
                  </div>
                  <div className={`agent-status-badge ${agentHealth.pricing}`}>
                    {agentHealth.pricing === "loading"
                      ? "⏳ CHECKING"
                      : agentHealth.pricing === "online"
                        ? "🟢 ONLINE"
                        : "🔴 OFFLINE"}
                  </div>
                  <h3>Dynamic Pricing</h3>
                  <p>
                    {agentHealth.pricing === "offline"
                      ? "Agent offline. Core pricing engine unreachable."
                      : "Calculating live fuel surcharges, port fees, and margin optimization factors."}
                  </p>
                </div>
              </div>
              {/* --------------------------- */}

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
                  {filteredRequests.slice(0, 3).map((request) => (
                    <div
                      className={`customer-request-card ${highlightedRequestId === request.id ? "highlight-pulse" : ""}`}
                      key={request.id}
                      id={`request-${request.id}`}
                    >
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

                        {/* Dark-Mode Friendly Admin Note */}
                        {request.feedback && (
                          <div
                            className={`admin-note ${request.status === "Rejected" ? "rejected" : "approved"}`}
                          >
                            <strong>Admin Note:</strong> {request.feedback}
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

                {/* Live LLM Route Agent Card */}
                <div className="card agent-card">
                  <div
                    className="card-heading"
                    style={{ marginBottom: "16px" }}
                  >
                    <div className="agent-icon">✦</div>
                    <div>
                      <h2>Route Intelligence AI</h2>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "12px",
                          color: "#38bdf8",
                        }}
                      >
                        LIVE ANALYSIS: {origin.toUpperCase()} TO{" "}
                        {destination.toUpperCase()}
                        {activeRoute ? ` (ROUTE ${activeRoute.route_id})` : ""}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`llm-terminal-box ${isLlmLoading ? "pulse-loading" : ""}`}
                  >
                    <div className="terminal-header">
                      <span className="dot red"></span>
                      <span className="dot yellow"></span>
                      <span className="dot green"></span>
                      <small>maritime_llm_core.sh</small>
                    </div>
                    <div className="terminal-content">
                      <span className="prompt-arrow">❯</span>
                      {isLlmLoading ? (
                        <span className="typing-text">
                          Generating custom trade lane analysis...
                        </span>
                      ) : (
                        <p className="insight-text">{llmInsight}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>{" "}
              {/* <-- ADD THIS EXACT LINE HERE */}
              {/* Route Result */}
              {result && activeRoute && (
                <div className="card result-card">
                  {result.status === "success" ? (
                    <>
                      {/* Result Header */}
                      <div className="result-header">
                        <div>
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
                        {/* <div className="milestone-note">
                          Milestone 2 integration: Live Weather Agent is now
                          active alongside Route Intelligence. Dynamic customs
                          and margin agents will be added in later milestones.
                        </div> */}
                        <div className="section-heading">
                          <div>
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

                      {/* 3.5 Maritime Weather Intelligence */}
                      {result.weather && (
                        <section className="weather-section">
                          <div className="section-heading">
                            <div>
                              <h2>Maritime Weather Intelligence</h2>
                            </div>
                          </div>

                          <div className="weather-card">
                            <div className="weather-grid">
                              {/* Origin Port */}
                              <div className="weather-port">
                                <div className="weather-header">
                                  <div className="weather-icon">
                                    {result.weather.origin_weather.icon}
                                  </div>
                                  <div>
                                    <strong>
                                      {result.weather.origin_weather.port}
                                    </strong>
                                    <span>Origin Port</span>
                                  </div>
                                </div>
                                <div className="weather-stats">
                                  <div>
                                    <small>Temperature</small>
                                    <strong>
                                      {result.weather.origin_weather.temp_c}°C
                                    </strong>
                                  </div>
                                  <div>
                                    <small>Wind (Knots)</small>
                                    <strong>
                                      {result.weather.origin_weather.wind_knots}{" "}
                                      kn
                                    </strong>
                                  </div>
                                  <div>
                                    <small>Condition</small>
                                    <strong>
                                      {result.weather.origin_weather.condition}
                                    </strong>
                                  </div>
                                </div>
                              </div>

                              {/* Weather Graphics / Globe */}
                              <div className="weather-center-graphic">
                                <div
                                  className="card-3d-visual"
                                  style={{
                                    width: "80px",
                                    height: "80px",
                                    marginBottom: "8px",
                                  }}
                                >
                                  <div
                                    className="holo-globe"
                                    style={{
                                      width: "50px",
                                      height: "50px",
                                      fontSize: "24px",
                                    }}
                                  >
                                    🌐
                                  </div>
                                </div>
                                <div
                                  className={`risk-badge ${result.weather.marine_risk_level.toLowerCase()}`}
                                >
                                  {result.weather.marine_risk_level} Risk
                                </div>
                              </div>

                              {/* Destination Port */}
                              <div className="weather-port">
                                <div className="weather-header">
                                  <div className="weather-icon">
                                    {result.weather.destination_weather.icon}
                                  </div>
                                  <div>
                                    <strong>
                                      {result.weather.destination_weather.port}
                                    </strong>
                                    <span>Destination Port</span>
                                  </div>
                                </div>
                                <div className="weather-stats">
                                  <div>
                                    <small>Temperature</small>
                                    <strong>
                                      {
                                        result.weather.destination_weather
                                          .temp_c
                                      }
                                      °C
                                    </strong>
                                  </div>
                                  <div>
                                    <small>Wind (Knots)</small>
                                    <strong>
                                      {
                                        result.weather.destination_weather
                                          .wind_knots
                                      }{" "}
                                      kn
                                    </strong>
                                  </div>
                                  <div>
                                    <small>Condition</small>
                                    <strong>
                                      {
                                        result.weather.destination_weather
                                          .condition
                                      }
                                    </strong>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="weather-advisory">
                              <strong>✦ Marine Agent Advisory:</strong>{" "}
                              {result.weather.advisory}
                            </div>
                          </div>
                        </section>
                      )}

                      {/* 4. Final Quotation */}
                      <section className="final-quotation-section">
                        <div className="section-heading">
                          <div>
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
                    <h2>My Requests</h2>
                  </div>
                </div>

                {customerRequests.length === 0 ? (
                  <div className="customer-empty-state">
                    <p>No quotation requests yet.</p>
                  </div>
                ) : (
                  <div className="customer-request-list">
                    {filteredRequests.map((request) => (
                      <div
                        className={`customer-request-card ${highlightedRequestId === request.id ? "highlight-pulse" : ""}`}
                        key={request.id}
                        id={`request-${request.id}`}
                      >
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

                          {/* Dark-Mode Friendly Admin Note */}
                          {request.feedback && (
                            <div
                              className={`admin-note ${request.status === "Rejected" ? "rejected" : "approved"}`}
                            >
                              <strong>Admin Note:</strong> {request.feedback}
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
                  {filteredRequests.map((request) => (
                    <div
                      className={`customer-request-card ${highlightedRequestId === request.id ? "highlight-pulse" : ""}`}
                      key={request.id}
                      id={`request-${request.id}`}
                    >
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

                        {/* Dark-Mode Friendly Admin Note */}
                        {request.feedback && (
                          <div
                            className={`admin-note ${request.status === "Rejected" ? "rejected" : "approved"}`}
                          >
                            <strong>Admin Note:</strong> {request.feedback}
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

          {/* --- ADVANCED SETTINGS SCREEN --- */}
          {activeSection === "settings" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">✦ ACCOUNT</div>
                  <h1>Settings</h1>
                  <p>
                    Manage your preferences, security, and workspace
                    configuration.
                  </p>
                </div>
              </div>

              <div className="settings-layout">
                {/* Settings Sidebar Navigation */}
                <aside className="settings-sidebar">
                  <div
                    className={`settings-nav-item ${settingsTab === "profile" ? "active" : ""}`}
                    onClick={() => setSettingsTab("profile")}
                  >
                    <span>👤</span> Profile Information
                  </div>
                  <div
                    className={`settings-nav-item ${settingsTab === "preferences" ? "active" : ""}`}
                    onClick={() => setSettingsTab("preferences")}
                  >
                    <span>⚙️</span> System Preferences
                  </div>
                  <div
                    className={`settings-nav-item ${settingsTab === "security" ? "active" : ""}`}
                    onClick={() => setSettingsTab("security")}
                  >
                    <span>🔒</span> Security & 2FA
                  </div>
                  <div
                    className={`settings-nav-item ${settingsTab === "billing" ? "active" : ""}`}
                    onClick={() => setSettingsTab("billing")}
                  >
                    <span>💳</span> Billing & Plan
                  </div>
                </aside>

                {/* Settings Content Area */}
                <div className="settings-content">
                  {settingsTab === "profile" && (
                    <div className="card settings-card">
                      <h3>Personal Information</h3>
                      <p className="settings-desc">
                        Update your personal details and public profile.
                      </p>

                      <div className="settings-avatar-row">
                        <div className="settings-avatar-large">
                          {profileData.avatar ? (
                            <img
                              src={profileData.avatar}
                              alt="Avatar"
                              style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            profileData.name.charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* Hidden file input for the avatar */}
                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleAvatarUpload}
                        />

                        {/* Button triggers the hidden input */}
                        <button
                          className="analyze-button outline"
                          onClick={() =>
                            document.getElementById("avatar-upload").click()
                          }
                        >
                          Upload New Avatar
                        </button>
                      </div>

                      <div className="form-grid-2">
                        {renderPremiumInput("Full Name", "name", "text", "👤", "Enter your full name")}
                        {renderPremiumInput("Email Address", "email", "email", "✉️", "name@company.com")}
                        {renderPremiumInput("Company", "company", "text", "🏢", "Your organization name")}
                        {renderPremiumInput("Job Role", "role", "text", "💼", "Your title")}
                        
                        {/* THE NEW GLOBAL PHONE COMPONENT */}
                        {renderInternationalPhoneInput()}
                        
                        {/* Custom Timezone Dropdown */}
                        <div className="form-group">
                          <label>Timezone</label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span style={{ position: 'absolute', left: '16px', color: '#64748b', fontSize: '15px', pointerEvents: 'none', zIndex: 1 }}>🌍</span>
                            <select 
                              className="settings-input" 
                              style={{ paddingLeft: '44px', appearance: 'none', cursor: 'pointer' }}
                              value={profileData.timezone} 
                              onChange={(e) => handleProfileUpdate('timezone', e.target.value)}
                            >
                              <option>Asia/Kolkata (IST)</option>
                              <option>America/New_York (EST)</option>
                              <option>Europe/London (GMT)</option>
                              <option>Asia/Tokyo (JST)</option>
                            </select>
                            <span style={{ position: 'absolute', right: '16px', color: '#38bdf8', fontSize: '10px', pointerEvents: 'none' }}>▼</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === "preferences" && (
                    <div className="card settings-card">
                      <h3>System Preferences</h3>
                      <p className="settings-desc">
                        Customize how the Agentic Routing engine displays data.
                      </p>

                      <div className="preference-row">
                        <div>
                          <strong>Measurement Units</strong>
                          <small>
                            Toggle between Metric (Kilometers, Celsius) and
                            Imperial (Miles, Fahrenheit).
                          </small>
                        </div>
                        <select
                          className="settings-input"
                          style={{ width: "150px" }}
                        >
                          <option>Metric (NM / °C)</option>
                          <option>Imperial (MI / °F)</option>
                        </select>
                      </div>

                      <div className="preference-row">
                        <div>
                          <strong>Default Currency</strong>
                          <small>
                            The base currency used for generating freight
                            quotations.
                          </small>
                        </div>
                        <select
                          className="settings-input"
                          style={{ width: "150px" }}
                        >
                          <option>USD ($)</option>
                          <option>EUR (€)</option>
                          <option>INR (₹)</option>
                        </select>
                      </div>

                      <div className="preference-row borderless">
                        <div>
                          <strong>Email Notifications</strong>
                          <small>
                            Receive email alerts when a quotation is Approved or
                            Rejected by Admin.
                          </small>
                        </div>
                        <label className="toggle-switch">
                          <input type="checkbox" defaultChecked />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </div>
                  )}

                  {settingsTab === "security" && (
                    <div className="card settings-card">
                      <h3>Security & Authentication</h3>
                      <p className="settings-desc">
                        Keep your maritime brokerage account secure.
                      </p>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>Current Password</label>
                          <input
                            type="password"
                            className="settings-input"
                            placeholder="••••••••"
                          />
                        </div>
                        <div></div>
                        <div className="form-group">
                          <label>New Password</label>
                          <input
                            type="password"
                            className="settings-input"
                            placeholder="Enter new password"
                          />
                        </div>
                        <div className="form-group">
                          <label>Confirm Password</label>
                          <input
                            type="password"
                            className="settings-input"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>

                      <hr className="settings-divider" />

                      <div className="preference-row borderless">
                        <div>
                          <strong>Two-Factor Authentication (2FA)</strong>
                          <small>
                            Require an authenticator code in addition to your
                            password when logging in.
                          </small>
                        </div>
                        <button
                          className="analyze-button outline"
                          style={{ width: "auto", padding: "8px 16px" }}
                        >
                          Enable 2FA
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsTab === "billing" && (
                    <div className="card settings-card">
                      <h3>Billing & Subscription</h3>
                      <p className="settings-desc">
                        Manage your Agentic Platform subscription tier.
                      </p>

                      <div className="billing-banner">
                        <div className="billing-info">
                          <span className="plan-badge">PRO TIER</span>
                          <h4>Agentic Platform Pro</h4>
                          <p>
                            Unlimited route analyses, live weather intelligence,
                            and priority LLM processing.
                          </p>
                        </div>
                        <div className="billing-price">
                          <h2>
                            $299<span>/mo</span>
                          </h2>
                        </div>
                      </div>

                      <div className="preference-row borderless">
                        <div>
                          <strong>Payment Method</strong>
                          <small>
                            Visa ending in **** 4242 (Expires 12/28)
                          </small>
                        </div>
                        <button
                          className="analyze-button outline"
                          style={{ width: "auto", padding: "8px 16px" }}
                        >
                          Update Card
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Universal Save Footer */}
                  <div className="settings-footer">
                    {saveMessage && (
                      <span className="save-success-msg">✓ {saveMessage}</span>
                    )}
                    <button
                      className="analyze-button"
                      onClick={saveSettings}
                      disabled={isSaving}
                      style={{ width: "160px", margin: 0 }}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === "api" && (
            <div className="workspace">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">✦ DEVELOPERS</div>
                  <h1>API & Python SDK</h1>
                  <p>
                    Generate API keys and connect your backend infrastructure.
                  </p>
                </div>
              </div>
              <div className="card">
                <h3 style={{ margin: "0 0 16px 0", color: "#fff" }}>
                  Production API Key
                </h3>
                <div style={{ display: "flex", gap: "12px" }}>
                  <input
                    type="password"
                    value="sk_live_51M..."
                    readOnly
                    className="search-input"
                    style={{ width: "300px", borderRadius: "8px" }}
                  />
                  <button
                    className="analyze-button"
                    style={{ width: "auto", background: "#334155" }}
                  >
                    Reveal
                  </button>
                </div>
                <div className="llm-terminal-box" style={{ marginTop: "24px" }}>
                  <div className="terminal-header">
                    <small>python_integration.py</small>
                  </div>
                  <div className="terminal-content">
                    <p style={{ color: "#a78bfa", margin: 0 }}>
                      import{" "}
                      <span style={{ color: "#cbd5e1" }}>
                        maritime_brokerage
                      </span>
                    </p>
                    <p style={{ color: "#cbd5e1", margin: "8px 0 0" }}>
                      client = maritime_brokerage.Client(api_key=
                      <span style={{ color: "#a3e635" }}>"sk_live_..."</span>)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "docs" && (
            <div className="workspace">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">✦ DEVELOPERS</div>
                  <h1>Documentation</h1>
                  <p>Learn how to integrate the Agentic Routing engine.</p>
                </div>
              </div>
              <div className="card">
                <h3 style={{ color: "#fff" }}>Quickstart Guide</h3>
                <p style={{ color: "#94a3b8", lineHeight: "1.6" }}>
                  The Agentic Maritime platform exposes RESTful endpoints for
                  Route Analysis, Dynamic Pricing, and Weather Risk Assessment.
                  Navigate to the API tab to generate your credentials.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
