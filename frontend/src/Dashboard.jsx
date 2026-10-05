import { useEffect, useState } from "react";
import {
  generateQuotation,
  getLiveInsight,
  getSystemHealth,
  auditCustoms,
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

// UPDATE YOUR IMPORTS TO INCLUDE Plus AND Star
import {
  User,
  Mail,
  Building2,
  Briefcase,
  Phone,
  Globe,
  Camera,
  Trash2,
  Save,
  CheckCircle2,
  Shield,
  CreditCard,
  SlidersHorizontal,
  X,
  MapPin,
  Lock,
  Plus,
  Star,
  Smartphone,
} from "lucide-react";

import { QRCodeSVG } from "qrcode.react";
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

// ----------------------------------------------------
// GLOBAL CURRENCIES
// ----------------------------------------------------
const WORLD_CURRENCIES = [
  "USD ($) - US Dollar",
  "EUR (€) - Euro",
  "GBP (£) - British Pound",
  "JPY (¥) - Japanese Yen",
  "AUD (A$) - Australian Dollar",
  "CAD (C$) - Canadian Dollar",
  "CHF (Fr) - Swiss Franc",
  "CNY (¥) - Chinese Yuan",
  "INR (₹) - Indian Rupee",
  "SGD (S$) - Singapore Dollar",
  "NZD (NZ$) - New Zealand Dollar",
  "MXN ($) - Mexican Peso",
  "HKD (HK$) - Hong Kong Dollar",
  "ZAR (R) - South African Rand",
  "BRL (R$) - Brazilian Real",
  "RUB (₽) - Russian Ruble",
  "KRW (₩) - South Korean Won",
  "TRY (₺) - Turkish Lira",
  "SEK (kr) - Swedish Krona",
  "NOK (kr) - Norwegian Krone",
  "DKK (kr) - Danish Krone",
  "PLN (zł) - Polish Zloty",
  "THB (฿) - Thai Baht",
  "IDR (Rp) - Indonesian Rupiah",
  "MYR (RM) - Malaysian Ringgit",
  "PHP (₱) - Philippine Peso",
  "VND (₫) - Vietnamese Dong",
  "AED (د.إ) - UAE Dirham",
  "SAR (﷼) - Saudi Riyal",
  "ILS (₪) - Israeli New Shekel",
  "EGP (E£) - Egyptian Pound",
  "NGN (₦) - Nigerian Naira",
  "KES (KSh) - Kenyan Shilling",
  "GHS (GH₵) - Ghanaian Cedi",
  "PKR (₨) - Pakistani Rupee",
  "BDT (৳) - Bangladeshi Taka",
  "LKR (Rs) - Sri Lankan Rupee",
  "ARS ($) - Argentine Peso",
  "CLP ($) - Chilean Peso",
  "COP ($) - Colombian Peso",
  "PEN (S/) - Peruvian Sol",
  "UAH (₴) - Ukrainian Hryvnia",
  "CZK (Kč) - Czech Koruna",
  "HUF (Ft) - Hungarian Forint",
  "RON (lei) - Romanian Leu",
  "BGN (лв) - Bulgarian Lev",
  "MAD (MAD) - Moroccan Dirham",
  "QAR (QR) - Qatari Riyal",
  "KWD (KD) - Kuwaiti Dinar",
  "BHD (BD) - Bahraini Dinar",
  "OMR (OR) - Omani Rial",
];

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

  // Holds currently checked document names
  const [checkedDocs, setCheckedDocs] = useState([]);
  const [isAuditingDocs, setIsAuditingDocs] = useState(false);

  // 👉 2. PASTE THE NEW CUSTOMS EFFECT HERE
  useEffect(() => {
    if (result?.customs?.required_documents) {
      const initialChecked = result.customs.required_documents.filter(
        (doc) =>
          doc.includes("Commercial Invoice") ||
          doc.includes("Packing List") ||
          doc.includes("Ocean Bill of Lading"),
      );
      setCheckedDocs(initialChecked);
    }
  }, [result?.recommended_route]);

  // Handler for checking/unchecking documents dynamically
  const toggleDocument = async (docName) => {
    const updatedDocs = checkedDocs.includes(docName)
      ? checkedDocs.filter((d) => d !== docName)
      : [...checkedDocs, docName];

    setCheckedDocs(updatedDocs);
    setIsAuditingDocs(true);

    try {
      const auditedCustoms = await auditCustoms({
        origin: result.origin,
        destination: result.destination,
        cargo_type: result.cargo_type,
        containers: Number(result.containers),
        transshipments: activeRoute?.transshipments || 0,
        route_type: activeRoute?.route_type || "Direct",
        provided_documents: updatedDocs,
      });

      // Update the result object in state with the new customs audit
      setResult((prev) => {
        // --- NEW: Recalculate Overall Risk dynamically! ---
        const wRisk = prev.shipment_risk_report.weather_risk || "Low";

        // If they score a perfect 10/10 on docs, lower the customs risk automatically
        let cRisk = auditedCustoms.customs_risk_level || "Low";
        if (auditedCustoms.audit_metric.score_out_of_10 === 10) {
          cRisk = "Low";
        }

        const riskWeights = { Low: 1, Moderate: 2, High: 3 };
        const maxRisk = Math.max(
          riskWeights[wRisk] || 1,
          riskWeights[cRisk] || 1,
        );

        let newOverallRisk = "Low";
        if (maxRisk === 2) newOverallRisk = "Moderate";
        if (maxRisk === 3) newOverallRisk = "High";

        return {
          ...prev,
          customs: auditedCustoms,
          shipment_risk_report: {
            ...prev.shipment_risk_report,
            customs_risk: auditedCustoms.customs_risk_level,
            overall_risk: newOverallRisk, // <--- This updates the text pill & ring color!
            readiness_grade: auditedCustoms.audit_metric.grade,
            readiness_score: auditedCustoms.audit_metric.score_out_of_10,
            summary: `Customs status: ${auditedCustoms.validation_status} (${auditedCustoms.audit_metric.grade} Readiness).`,
          },
        };
      });

      // Update the stored record in localStorage as well
      const savedRequests =
        JSON.parse(localStorage.getItem("quotationRequests")) || [];
      if (savedRequests.length > 0) {
        const wRisk =
          savedRequests[0].quotation.shipment_risk_report.weather_risk || "Low";

        let cRisk = auditedCustoms.customs_risk_level || "Low";
        if (auditedCustoms.audit_metric.score_out_of_10 === 10) {
          cRisk = "Low";
        }

        const riskWeights = { Low: 1, Moderate: 2, High: 3 };
        const maxRisk = Math.max(
          riskWeights[wRisk] || 1,
          riskWeights[cRisk] || 1,
        );

        let newOverallRisk = "Low";
        if (maxRisk === 2) newOverallRisk = "Moderate";
        if (maxRisk === 3) newOverallRisk = "High";

        savedRequests[0].quotation.customs = auditedCustoms;
        savedRequests[0].quotation.shipment_risk_report.customs_risk =
          auditedCustoms.customs_risk_level;
        savedRequests[0].quotation.shipment_risk_report.overall_risk =
          newOverallRisk; // <--- Save it
        savedRequests[0].quotation.shipment_risk_report.readiness_grade =
          auditedCustoms.audit_metric.grade;
        localStorage.setItem(
          "quotationRequests",
          JSON.stringify(savedRequests),
        );
      }
    } catch (err) {
      console.error("Customs audit update failed:", err);
    } finally {
      setIsAuditingDocs(false);
    }
  };

  // Initialize state from sessionStorage so it survives a refresh
  const [activeSection, setActiveSection] = useState(() => {
    return sessionStorage.getItem("currentDashboardSection") || "dashboard";
  });

  // Automatically save the current section to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem("currentDashboardSection", activeSection);
  }, [activeSection]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [highlightedRequestId, setHighlightedRequestId] = useState(null);

  // Settings Page State (Persisted on refresh)
  const [settingsTab, setSettingsTab] = useState(() => {
    return sessionStorage.getItem("currentSettingsTab") || "profile";
  });

  useEffect(() => {
    sessionStorage.setItem("currentSettingsTab", settingsTab);
  }, [settingsTab]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Custom Glassmorphic Dropdown States
  const [unitsMenuOpen, setUnitsMenuOpen] = useState(false);
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(
    user?.preferences?.unit || "Metric (NM / °C)",
  );
  const [selectedCurrency, setSelectedCurrency] = useState(
    user?.preferences?.currency || "USD ($)",
  );

  // New Interactive Settings States
  const [emailNotifications, setEmailNotifications] = useState(
    user?.preferences?.emailNotifications ?? true,
  );

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  // Look directly at the backend's is_2fa_enabled flag first
  const [twoFactorAuth, setTwoFactorAuth] = useState(
    user?.is_2fa_enabled || user?.security?.twoFactorAuth || false,
  );
  const [securityMsg, setSecurityMsg] = useState("");

  // 2FA Real-world Provisioning State
  const [setup2fa, setSetup2fa] = useState({
    active: false,
    uri: "",
    secret: "",
    token: "",
    error: "",
    loading: false,
  });

  // CRITICAL FIX: Reset the security UI completely when a new user logs in
  useEffect(() => {
    setTwoFactorAuth(
      user?.is_2fa_enabled || user?.security?.twoFactorAuth || false,
    );
    setSetup2fa({
      active: false,
      uri: "",
      secret: "",
      token: "",
      error: "",
      loading: false,
    });
    setSecurityMsg("");
    setPasswords({ current: "", new: "", confirm: "" });
  }, [user?.email, user?.is_2fa_enabled]);

  // Enterprise Billing & Subscription State
  const [billingData, setBillingData] = useState(null);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCard, setNewCard] = useState({
    brand: "Visa",
    last4: "",
    exp_date: "",
    is_primary: false,
    upi_id: "",
  });

  const fetchBilling = () => {
    if (user?.email) {
      fetch(`http://127.0.0.1:8000/api/auth/billing/${user.email}`)
        .then((res) => res.json())
        .then((data) => setBillingData(data))
        .catch((err) => console.error("Failed to fetch billing", err));
    }
  };

  useEffect(() => {
    if (settingsTab === "billing") fetchBilling();
  }, [settingsTab, user]);

  const handleAddPaymentMethod = async () => {
    let payload = { ...newCard };

    // Dynamic validation and formatting based on selected payment type
    if (["Visa", "Mastercard", "American Express"].includes(newCard.brand)) {
      if (newCard.last4.length !== 4 || newCard.exp_date.length < 5) {
        setSaveMessage("Please enter valid card details.");
        return;
      }
    } else if (newCard.brand === "PayPal") {
      payload.last4 = "Acct";
      payload.exp_date = "Linked";
    } else if (newCard.brand === "Bank Transfer") {
      if (newCard.last4.length !== 4) {
        setSaveMessage("Please enter last 4 digits of account.");
        return;
      }
      payload.exp_date = "Verified";
    } else if (["Apple Pay", "Google Pay"].includes(newCard.brand)) {
      payload.last4 = "Devc";
      payload.exp_date = "Active";
    } else if (newCard.brand === "UPI") {
      if (!newCard.upi_id || !newCard.upi_id.includes("@")) {
        setSaveMessage("Please enter a valid UPI ID (e.g., name@okbank).");
        return;
      }
      // Sends only the last 4 characters of the UPI handle to fit the database schema securely
      payload.last4 = newCard.upi_id.slice(-4);
      payload.exp_date = "Active";
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/auth/billing/methods/add",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, ...payload }),
        },
      );

      if (!response.ok) {
        const errData = await response.json();
        setSaveMessage(errData.detail || "Server validation failed.");
        return;
      }

      setIsAddingCard(false);
      setNewCard({
        brand: "Visa",
        last4: "",
        exp_date: "",
        is_primary: false,
        upi_id: "",
      });
      fetchBilling(); // Refresh the list dynamically from the backend
      setSaveMessage("Payment method added successfully.");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      setSaveMessage("Network error. Cannot reach backend.");
    }
  };

  const handleDeleteMethod = async (id) => {
    await fetch(
      `http://127.0.0.1:8000/api/auth/billing/methods/${id}?email=${user.email}`,
      { method: "DELETE" },
    );
    fetchBilling();
  };

  const handleMakePrimary = async (id) => {
    await fetch(
      `http://127.0.0.1:8000/api/auth/billing/methods/${id}/primary?email=${user.email}`,
      { method: "PUT" },
    );
    fetchBilling();
  };

  const handleGenerate2FA = async () => {
    setSetup2fa({ ...setup2fa, loading: true, error: "" });
    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/2fa/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setSetup2fa({
          active: true,
          uri: data.uri,
          secret: data.secret,
          token: "",
          error: "",
          loading: false,
        });
      }
    } catch (err) {
      setSetup2fa({
        ...setup2fa,
        error: "Failed to reach server.",
        loading: false,
      });
    }
  };

  const handleVerify2FA = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, token: setup2fa.token }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setTwoFactorAuth(true);
        setSetup2fa({
          active: false,
          uri: "",
          token: "",
          error: "",
          loading: false,
        });
        onUpdateUser({ ...user, security: { twoFactorAuth: true } }); // Sync to local memory
        setSaveMessage("Authenticator connected successfully.");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSetup2fa({ ...setup2fa, error: data.detail });
      }
    } catch (err) {
      setSetup2fa({ ...setup2fa, error: "Verification failed." });
    }
  };

  const handleDisable2FA = async () => {
    await fetch("http://127.0.0.1:8000/api/auth/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    });
    setTwoFactorAuth(false);
    onUpdateUser({ ...user, security: { twoFactorAuth: false } });
  };

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
    phoneCode: initialCode, // <--- NEW: Separated Country Code
    phoneNumber: initialNumber, // <--- NEW: Separated Phone Number
    timezone: user?.timezone || "Asia/Kolkata (IST)",
    avatar: user?.avatar || null,
  });

  const handleProfileUpdate = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  // 1. AVATAR UPLOAD HANDLER
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");

        // Aggressively resize to 150px max to stay well under local storage limits
        const MAX_SIZE = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to a highly compressed JPEG (60% quality)
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
        handleProfileUpdate("avatar", compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // 2. INTERNATIONAL SMART PHONE FORMATTER
  const handlePhoneChange = (e) => {
    let input = e.target.value.replace(/[^\d]/g, ""); // Strip non-digits
    if (input.length > 15) input = input.slice(0, 15);

    let formatted = input;
    const code = profileData.phoneCode;

    if (code === "+91") {
      // India: 98765 43210
      if (input.length > 5)
        formatted = `${input.slice(0, 5)} ${input.slice(5)}`;
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

  // 3. PREMIUM INPUT RENDERER (UX ENHANCER)
  const renderPremiumInput = (
    label,
    field,
    type,
    IconComponent,
    placeholder,
    customHandler = null,
  ) => (
    <div className="form-group">
      <label>{label}</label>
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
      >
        <span
          style={{
            position: "absolute",
            left: "14px",
            color: "#64748b",
            pointerEvents: "none",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
          }}
        >
          <IconComponent size={16} />
        </span>
        <input
          type={type}
          className="settings-input"
          style={{
            paddingLeft: "46px",
            paddingRight: profileData[field] ? "40px" : "16px",
            fontFamily: "inherit",
            fontWeight: "500",
            width: "100%",
          }}
          value={profileData[field]}
          onChange={
            customHandler
              ? customHandler
              : (e) => handleProfileUpdate(field, e.target.value)
          }
          placeholder={placeholder}
        />
        {/* Dynamic Clear Button */}
        {profileData[field] && (
          <span
            onClick={() => handleProfileUpdate(field, "")}
            title="Clear field"
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "10px",
              background: "rgba(255,255,255,0.08)",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              fontWeight: "bold",
              transition: "all 0.2s ease",
              zIndex: 2,
            }}
            onMouseOver={(e) => {
              e.target.style.background = "#ef4444";
              e.target.style.color = "#fff";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "#94a3b8";
            }}
          >
            <X size={12} strokeWidth={3} />
          </span>
        )}
      </div>
    </div>
  );

  // 4. INTERNATIONAL PHONE RENDERER (ULTRA-PREMIUM UX)
  const renderInternationalPhoneInput = () => (
    <div className="form-group">
      <label>Phone Number</label>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          background: "rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "10px",
          transition: "all 0.2s ease",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#38bdf8")}
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)")
        }
      >
        <span
          style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#64748b",
            display: "flex",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <Phone size={16} />
        </span>

        {/* Country Code Dropdown */}
        <select
          value={profileData.phoneCode}
          onChange={(e) => {
            handleProfileUpdate("phoneCode", e.target.value);
            handleProfileUpdate(
              "phoneNumber",
              profileData.phoneNumber.replace(/[^\d]/g, ""),
            );
          }}
          style={{
            appearance: "none",
            background: "transparent",
            border: "none",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#38bdf8",
            padding: "13px 26px 13px 40px",
            fontSize: "13.5px",
            fontWeight: "700",
            cursor: "pointer",
            outline: "none",
            width: "115px",
            zIndex: 0,
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
        <span
          style={{
            position: "absolute",
            left: "100px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#64748b",
            fontSize: "10px",
            pointerEvents: "none",
          }}
        >
          ▼
        </span>

        {/* Number Input */}
        <input
          type="text"
          value={profileData.phoneNumber}
          onChange={handlePhoneChange}
          placeholder="Phone number"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: "#f1f5f9",
            padding: "13px 16px",
            fontSize: "14px",
            fontFamily: "'Courier New', monospace",
            fontWeight: "600",
            letterSpacing: "1px",
            outline: "none",
          }}
        />

        {/* Clear Button */}
        {profileData.phoneNumber && (
          <span
            onClick={() => handleProfileUpdate("phoneNumber", "")}
            title="Clear field"
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "10px",
              background: "rgba(255,255,255,0.08)",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              fontWeight: "bold",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.target.style.background = "#ef4444";
              e.target.style.color = "#fff";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "rgba(255,255,255,0.08)";
              e.target.style.color = "#94a3b8";
            }}
          >
            ✕
          </span>
        )}
      </div>
    </div>
  );

  const saveSettings = () => {
    setIsSaving(true);
    setSaveMessage("");
    setSecurityMsg("");

    // Basic password validation if user is trying to change it
    if (settingsTab === "security" && (passwords.new || passwords.current)) {
      if (!passwords.current) {
        setSecurityMsg("Please enter your current password.");
        setIsSaving(false);
        return;
      }
      if (passwords.new.length < 8) {
        setSecurityMsg("New password must be at least 8 characters.");
        setIsSaving(false);
        return;
      }
      if (passwords.new !== passwords.confirm) {
        setSecurityMsg("New passwords do not match.");
        setIsSaving(false);
        return;
      }
    }

    setTimeout(() => {
      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          name: profileData.name,
          email: profileData.email,
          company: profileData.company,
          jobRole: profileData.role,
          phone: `${profileData.phoneCode} ${profileData.phoneNumber}`,
          timezone: profileData.timezone,
          avatar: profileData.avatar,
          preferences: {
            unit: selectedUnit,
            currency: selectedCurrency,
            emailNotifications: emailNotifications,
          },
          security: {
            twoFactorAuth: twoFactorAuth,
          },
        });
      }

      // Clear the password boxes upon a successful save
      if (settingsTab === "security") {
        setPasswords({ current: "", new: "", confirm: "" });
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
    customs: "loading",
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
                      ? "Agent offline. Live weather data unavailable."
                      : "Live weather monitoring active. Analyzing port conditions, wind risk, marine alerts, and weather impact on freight pricing."}
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

                {/* 4. Customs Agent */}
                <div
                  className={`construction-card ${agentHealth.customs === "offline" ? "offline" : ""}`}
                >
                  <div className="card-3d-visual">
                    <div
                      className="radar-pulse-visual"
                      style={{
                        borderColor: "#f59e0b",
                        color: "#f59e0b",
                        background: "rgba(245, 158, 11, 0.1)",
                      }}
                    >
                      🏛️
                    </div>
                  </div>
                  <div className={`agent-status-badge ${agentHealth.customs}`}>
                    {agentHealth.customs === "loading"
                      ? "⏳ CHECKING"
                      : agentHealth.customs === "online"
                        ? "🟢 ONLINE"
                        : "🔴 OFFLINE"}
                  </div>
                  <h3>Customs & Risk</h3>
                  <p>
                    {agentHealth.customs === "offline"
                      ? "Agent offline. Customs database unreachable."
                      : "Validating international shipping documents and assessing holistic shipment risk."}
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
                <div className="llm-agent-card">
                  <div
                    className="card-heading"
                    style={{
                      marginBottom: "0px",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      className="agent-icon"
                      style={{
                        background: "rgba(56, 189, 248, 0.15)",
                        border: "1px solid rgba(56, 189, 248, 0.4)",
                        boxShadow: "0 0 15px rgba(56, 189, 248, 0.3)",
                        color: "#38bdf8",
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                      }}
                    >
                      ✦
                    </div>
                    <div>
                      <h2
                        style={{
                          color: "#ffffff",
                          margin: "0 0 4px 0",
                          fontSize: "20px",
                          fontWeight: "800",
                          letterSpacing: "-0.5px",
                        }}
                      >
                        Route Intelligence AI
                      </h2>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "11px",
                          fontWeight: "700",
                          letterSpacing: "1.5px",
                          color: "#38bdf8",
                          textTransform: "uppercase",
                        }}
                      >
                        LIVE ANALYSIS: {origin.toUpperCase()} TO{" "}
                        {destination.toUpperCase()}
                        {activeRoute ? ` // ROUTE ${activeRoute.route_id}` : ""}
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
                          Generating custom trade lane analysis..._
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

                            {/* Weather Pricing Impact */}
                            {result.weather_pricing && (
                              <div className="weather-pricing-impact">
                                <div className="weather-impact-header">
                                  <div>
                                    <strong>Weather Pricing Impact</strong>
                                    <span>
                                      Dynamic pricing adjustment based on marine
                                      risk
                                    </span>
                                  </div>

                                  <div
                                    className={`risk-badge ${result.weather_pricing.weather_risk_level?.toLowerCase()}`}
                                  >
                                    {result.weather_pricing.weather_risk_level}{" "}
                                    Risk
                                  </div>
                                </div>

                                <div className="weather-impact-grid">
                                  <div className="weather-impact-item">
                                    <small>Weather Surcharge</small>
                                    <strong>
                                      {
                                        result.weather_pricing
                                          .weather_surcharge_percent
                                      }
                                      %
                                    </strong>
                                  </div>

                                  <div className="weather-impact-item">
                                    <small>Estimated Delay</small>
                                    <strong>
                                      {
                                        result.weather_pricing
                                          .estimated_delay_days
                                      }{" "}
                                      days
                                    </strong>
                                  </div>

                                  <div className="weather-impact-item">
                                    <small>Price Before Weather</small>
                                    <strong>
                                      {formatCurrency(
                                        result.weather_pricing
                                          .price_before_weather_usd,
                                      )}
                                    </strong>
                                  </div>

                                  <div className="weather-impact-item">
                                    <small>Price After Weather</small>
                                    <strong>
                                      {formatCurrency(
                                        result.weather_pricing
                                          .price_after_weather_usd,
                                      )}
                                    </strong>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Weather Alerts */}
                            {result.weather.weather_alerts &&
                              result.weather.weather_alerts.length > 0 && (
                                <div className="weather-alerts">
                                  <div className="weather-alerts-header">
                                    <strong>⚠️ Weather Alerts</strong>
                                    <span>
                                      Marine conditions requiring attention
                                    </span>
                                  </div>

                                  <div className="weather-alert-list">
                                    {result.weather.weather_alerts.map(
                                      (alert, index) => (
                                        <div
                                          className="weather-alert-item"
                                          key={index}
                                        >
                                          <span className="weather-alert-icon">
                                            ⚠️
                                          </span>
                                          <span>{alert}</span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </section>
                      )}

                      {/* 3.6 Real-Time Agentic Customs & Regulatory Intelligence */}
                      {result.customs && result.shipment_risk_report && (
                        <section className="weather-section">
                          <div className="section-heading">
                            <div>
                              <p
                                className="section-label"
                                style={{ color: "#38bdf8" }}
                              >
                                REGULATORY CORE
                              </p>
                              <h2>Shipment Risk & Customs Intelligence</h2>
                              <p
                                style={{
                                  color: "#94a3b8",
                                  fontSize: "14px",
                                  margin: "6px 0 0",
                                }}
                              >
                                Dynamic route compliance, HS tariff validation,
                                and interactive document audit.
                              </p>
                            </div>
                          </div>

                          <div className="customs-modern-container">
                            {/* 🌟 BENTO GRID 🌟 */}
                            <div className="customs-bento-grid">
                              {/* PANEL 1: Readiness (Hero Panel) */}
                              <div className="bento-panel readiness-panel">
                                <div className="bento-header">
                                  <span className="bento-icon">⚡</span>
                                  <h4>Clearance Readiness</h4>
                                </div>

                                <div className="readiness-core">
                                  <div className="readiness-score-modern">
                                    <strong>
                                      {
                                        result.customs.audit_metric
                                          .score_out_of_10
                                      }
                                    </strong>
                                    <span>/ 10</span>
                                  </div>

                                  <div className="readiness-meta">
                                    <span
                                      className={`grade-pill-modern ${result.customs.audit_metric.grade.toLowerCase().replace(/\s+/g, "-")}`}
                                    >
                                      {result.customs.audit_metric.grade}
                                    </span>
                                    <div className="overall-risk-indicator">
                                      Risk Level:{" "}
                                      <strong
                                        className={result.shipment_risk_report.overall_risk.toLowerCase()}
                                      >
                                        {
                                          result.shipment_risk_report
                                            .overall_risk
                                        }
                                      </strong>
                                    </div>
                                  </div>
                                </div>

                                <div className="readiness-progress-wrapper">
                                  <div className="readiness-stat-row">
                                    <span>
                                      <strong>
                                        {
                                          result.customs.audit_metric
                                            .total_provided
                                        }
                                      </strong>{" "}
                                      of{" "}
                                      {
                                        result.customs.audit_metric
                                          .total_required
                                      }{" "}
                                      Documents Verified
                                    </span>
                                    <span>
                                      {
                                        result.customs.audit_metric
                                          .fulfillment_percent
                                      }
                                      %
                                    </span>
                                  </div>
                                  <div className="readiness-bar-track">
                                    <div
                                      className="readiness-bar-fill"
                                      style={{
                                        width: `${result.customs.audit_metric.fulfillment_percent}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>

                                <p className="audit-commentary-modern">
                                  <strong
                                    style={{
                                      color: "#38bdf8",
                                      fontWeight: "600",
                                    }}
                                  >
                                    Agent Note:
                                  </strong>{" "}
                                  {result.customs.audit_metric.audit_advisory}
                                </p>
                              </div>

                              {/* PANEL 2: Financials & Tariffs */}
                              <div className="bento-panel finance-panel">
                                <div className="bento-header">
                                  <span className="bento-icon">🏛️</span>
                                  <h4>{result.customs.customs_authority}</h4>
                                </div>

                                <div className="bento-stats-group">
                                  <div className="bento-stat">
                                    <small>HS Tariff Code</small>
                                    <strong>{result.customs.hs_code}</strong>
                                  </div>
                                  <div className="bento-stat">
                                    <small>Duty Rate</small>
                                    <strong>
                                      {result.customs.estimated_duty_rate}
                                    </strong>
                                  </div>
                                </div>

                                <div className="bento-highlight-box">
                                  <small>Estimated Duties</small>
                                  <strong className="text-emerald">
                                    $
                                    {result.customs.estimated_duties_usd.toLocaleString(
                                      "en-US",
                                    )}
                                  </strong>
                                </div>
                              </div>

                              {/* PANEL 3: Status & Clearance */}
                              <div className="bento-panel status-panel">
                                <div className="bento-header">
                                  <span className="bento-icon">⏱️</span>
                                  <h4>Clearance Status</h4>
                                </div>

                                <div className="status-highlight">
                                  <strong>
                                    {result.customs.validation_status}
                                  </strong>
                                  <small>
                                    Est. Window:{" "}
                                    <span className="text-cyan">
                                      {result.customs.estimated_clearance_time}
                                    </span>
                                  </small>
                                </div>

                                <div className="bento-stats-group mt-auto">
                                  <div className="bento-stat">
                                    <small>Weather Risk</small>
                                    <strong>
                                      {result.shipment_risk_report.weather_risk}
                                    </strong>
                                  </div>
                                  <div className="bento-stat">
                                    <small>Customs Risk</small>
                                    <strong>
                                      {result.shipment_risk_report.customs_risk}
                                    </strong>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 🌟 INTERACTIVE DOCUMENT AUDIT 🌟 */}
                            <div className="interactive-docs-modern">
                              <div className="interactive-docs-header">
                                <div>
                                  <h4>Interactive Document Audit</h4>
                                  <p>
                                    Select documents in your possession to
                                    dynamically recalculate clearance readiness.
                                  </p>
                                </div>
                                {isAuditingDocs && (
                                  <span className="auditing-indicator-modern">
                                    <span className="spinner"></span>{" "}
                                    Auditing...
                                  </span>
                                )}
                              </div>

                              <div className="doc-checklist-modern">
                                {result.customs.required_documents.map(
                                  (doc, idx) => {
                                    const isChecked = checkedDocs.includes(doc);
                                    return (
                                      <label
                                        key={idx}
                                        className={`doc-card-modern ${isChecked ? "verified" : "pending"}`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => toggleDocument(doc)}
                                        />
                                        <div
                                          className={`checkbox-modern ${isChecked ? "checked" : ""}`}
                                        >
                                          {isChecked && (
                                            <svg
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="3"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            >
                                              <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                          )}
                                        </div>
                                        <div className="doc-info-modern">
                                          <strong>{doc}</strong>
                                          <small>
                                            {isChecked
                                              ? "Verified In-Hand"
                                              : "Required"}
                                          </small>
                                        </div>
                                      </label>
                                    );
                                  },
                                )}
                              </div>
                            </div>

                            {/* 🌟 MISSING DOCS ALERTS 🌟 */}
                            {result.customs.missing_documents.length > 0 && (
                              <div className="missing-docs-modern">
                                <div className="missing-header">
                                  <span className="alert-icon">⚠️</span>
                                  <strong>
                                    {result.customs.missing_documents.length}{" "}
                                    Document(s) Pending Resolution
                                  </strong>
                                </div>
                                <div className="missing-chips">
                                  {result.customs.missing_documents.map(
                                    (doc, i) => (
                                      <span key={i} className="chip">
                                        ✕ {doc}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 🌟 ADVISORY 🌟 */}
                            <div className="customs-advisory-modern">
                              <div className="advisory-title">
                                <span className="advisory-icon">✦</span>
                                <strong>Customs Intelligence Advisory</strong>
                              </div>
                              <p className="advisory-text">
                                {result.customs.advisory}
                              </p>

                              {result.customs.flags.length > 0 && (
                                <ul className="advisory-flags">
                                  {result.customs.flags.map((flag, i) => (
                                    <li key={i}>{flag}</li>
                                  ))}
                                </ul>
                              )}
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
                    <User size={18} /> Profile Information
                  </div>
                  <div
                    className={`settings-nav-item ${settingsTab === "preferences" ? "active" : ""}`}
                    onClick={() => setSettingsTab("preferences")}
                  >
                    <SlidersHorizontal size={18} /> System Preferences
                  </div>
                  <div
                    className={`settings-nav-item ${settingsTab === "security" ? "active" : ""}`}
                    onClick={() => setSettingsTab("security")}
                  >
                    <Shield size={18} /> Security & 2FA
                  </div>
                  <div
                    className={`settings-nav-item ${settingsTab === "billing" ? "active" : ""}`}
                    onClick={() => setSettingsTab("billing")}
                  >
                    <CreditCard size={18} /> Billing & Plan
                  </div>
                </aside>

                {/* Settings Content Area */}
                <div className="settings-content">
                  {settingsTab === "profile" && (
                    <div className="card settings-card">
                      {/* --- REFINED HEADER --- */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingBottom: "24px",
                          marginBottom: "32px",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                        }}
                      >
                        <div>
                          <h3 style={{ margin: "0 0 6px 0", fontSize: "20px" }}>
                            Personal Information
                          </h3>
                          <p
                            className="settings-desc"
                            style={{ marginBottom: 0, fontSize: "13px" }}
                          >
                            Update your personal details and public profile.
                          </p>
                        </div>
                      </div>

                      {/* --- REFINED AVATAR ROW --- */}
                      <div
                        className="settings-avatar-row"
                        style={{
                          marginTop: "-10px",
                          paddingBottom: "36px",
                          marginBottom: "36px",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                        }}
                      >
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

                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleAvatarUpload}
                        />

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          <div style={{ display: "flex", gap: "12px" }}>
                            {profileData.avatar ? (
                              <>
                                <button
                                  className="analyze-button outline"
                                  style={{
                                    borderRadius: "24px",
                                    padding: "8px 20px",
                                    fontSize: "12px",
                                    background: "rgba(56, 189, 248, 0.1)",
                                    borderColor: "rgba(56, 189, 248, 0.3)",
                                    color: "#38bdf8",
                                  }}
                                  onClick={() =>
                                    document
                                      .getElementById("avatar-upload")
                                      .click()
                                  }
                                >
                                  📷 Change Picture
                                </button>
                                <button
                                  className="analyze-button outline"
                                  style={{
                                    borderRadius: "24px",
                                    padding: "8px 20px",
                                    fontSize: "12px",
                                    color: "#fca5a5",
                                    borderColor: "rgba(239, 68, 68, 0.3)",
                                    background: "rgba(239, 68, 68, 0.05)",
                                  }}
                                  onClick={() =>
                                    handleProfileUpdate("avatar", null)
                                  }
                                >
                                  🗑️ Remove
                                </button>
                              </>
                            ) : (
                              <button
                                className="analyze-button outline"
                                style={{
                                  borderRadius: "24px",
                                  padding: "8px 20px",
                                  fontSize: "12px",
                                }}
                                onClick={() =>
                                  document
                                    .getElementById("avatar-upload")
                                    .click()
                                }
                              >
                                Upload New Avatar
                              </button>
                            )}
                          </div>
                          <small
                            style={{
                              color: "#64748b",
                              fontSize: "11px",
                              fontWeight: "600",
                              letterSpacing: "0.3px",
                            }}
                          >
                            Automatically compressed. Max size 2MB.
                          </small>
                        </div>
                      </div>

                      <div className="form-grid-2">
                        {renderPremiumInput(
                          "Full Name",
                          "name",
                          "text",
                          User,
                          "Enter your full name",
                        )}
                        {renderPremiumInput(
                          "Email Address",
                          "email",
                          "email",
                          Mail,
                          "name@company.com",
                        )}
                        {renderPremiumInput(
                          "Company",
                          "company",
                          "text",
                          Building2,
                          "Your organization name",
                        )}
                        {renderPremiumInput(
                          "Job Role",
                          "role",
                          "text",
                          Briefcase,
                          "Your title",
                        )}

                        {renderInternationalPhoneInput()}

                        {/* Pixel-Perfect Timezone Dropdown */}
                        <div className="form-group">
                          <label>Timezone</label>
                          <div
                            style={{
                              position: "relative",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: "16px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#64748b",
                                fontSize: "15px",
                                pointerEvents: "none",
                                zIndex: 1,
                              }}
                            >
                              🌍
                            </span>
                            <select
                              className="settings-input"
                              style={{
                                paddingLeft: "42px",
                                cursor: "pointer",
                                width: "100%",
                                fontFamily: "inherit",
                                fontWeight: "500",
                              }}
                              value={profileData.timezone}
                              onChange={(e) =>
                                handleProfileUpdate("timezone", e.target.value)
                              }
                            >
                              <option>Asia/Kolkata (IST)</option>
                              <option>America/New_York (EST)</option>
                              <option>Europe/London (GMT)</option>
                              <option>Asia/Tokyo (JST)</option>
                            </select>
                            <span
                              style={{
                                position: "absolute",
                                right: "16px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#38bdf8",
                                fontSize: "10px",
                                pointerEvents: "none",
                              }}
                            >
                              ▼
                            </span>
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
                        <div
                          className="custom-dropdown"
                          style={{ width: "190px" }}
                        >
                          <div
                            className="settings-input custom-dropdown-trigger"
                            onClick={() => {
                              setUnitsMenuOpen(!unitsMenuOpen);
                              setCurrencyMenuOpen(false);
                            }}
                          >
                            {selectedUnit}
                          </div>
                          {unitsMenuOpen && (
                            <>
                              {/* Invisible backdrop to close menu when clicking outside */}
                              <div
                                style={{
                                  position: "fixed",
                                  inset: 0,
                                  zIndex: 999,
                                }}
                                onClick={() => setUnitsMenuOpen(false)}
                              />
                              <div className="custom-dropdown-menu">
                                <div
                                  className="custom-dropdown-item"
                                  onClick={() => {
                                    setSelectedUnit("Metric (NM / °C)");
                                    setUnitsMenuOpen(false);
                                  }}
                                >
                                  Metric (NM / °C)
                                </div>
                                <div
                                  className="custom-dropdown-item"
                                  onClick={() => {
                                    setSelectedUnit("Imperial (MI / °F)");
                                    setUnitsMenuOpen(false);
                                  }}
                                >
                                  Imperial (MI / °F)
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="preference-row">
                        <div>
                          <strong>Default Currency</strong>
                          <small>
                            The base currency used for generating freight
                            quotations.
                          </small>
                        </div>

                        <div
                          className="custom-dropdown"
                          style={{ width: "190px" }}
                        >
                          <div
                            className="settings-input custom-dropdown-trigger"
                            onClick={() => {
                              setCurrencyMenuOpen(!currencyMenuOpen);
                              setUnitsMenuOpen(false);
                            }}
                          >
                            {selectedCurrency}
                          </div>
                          {currencyMenuOpen && (
                            <>
                              {/* Invisible backdrop to close menu when clicking outside */}
                              <div
                                style={{
                                  position: "fixed",
                                  inset: 0,
                                  zIndex: 999,
                                }}
                                onClick={() => setCurrencyMenuOpen(false)}
                              />
                              <div className="custom-dropdown-menu">
                                {WORLD_CURRENCIES.map((currency) => (
                                  <div
                                    key={currency}
                                    className="custom-dropdown-item"
                                    onClick={() => {
                                      // Splits "USD ($) - US Dollar" so the box just shows "USD ($)"
                                      setSelectedCurrency(
                                        currency.split(" - ")[0],
                                      );
                                      setCurrencyMenuOpen(false);
                                    }}
                                  >
                                    {currency}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
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
                          <input
                            type="checkbox"
                            checked={emailNotifications}
                            onChange={(e) =>
                              setEmailNotifications(e.target.checked)
                            }
                          />
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

                      {securityMsg && (
                        <div
                          style={{
                            color: "#f87171",
                            background: "rgba(239, 68, 68, 0.1)",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            marginBottom: "20px",
                            fontSize: "13.5px",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Shield size={16} /> {securityMsg}
                        </div>
                      )}

                      {/* Moved Current Password out of the split-grid for a cleaner hierarchy */}
                      <div
                        className="form-group"
                        style={{
                          maxWidth: "48%",
                          minWidth: "250px",
                          marginBottom: "24px",
                        }}
                      >
                        <label>Current Password</label>
                        <div
                          style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              left: "14px",
                              color: "#64748b",
                              pointerEvents: "none",
                              zIndex: 2,
                              display: "flex",
                            }}
                          >
                            <Lock size={16} />
                          </span>
                          <input
                            type="password"
                            className="settings-input"
                            style={{
                              paddingLeft: "42px",
                              fontFamily: "inherit",
                              fontWeight: "500",
                              letterSpacing: "2px",
                            }}
                            placeholder="••••••••"
                            value={passwords.current}
                            onChange={(e) =>
                              setPasswords({
                                ...passwords,
                                current: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* New & Confirm Passwords sit together in the grid below */}
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>New Password</label>
                          <div
                            style={{
                              position: "relative",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: "14px",
                                color: "#64748b",
                                pointerEvents: "none",
                                zIndex: 2,
                                display: "flex",
                              }}
                            >
                              <Lock size={16} />
                            </span>
                            <input
                              type="password"
                              className="settings-input"
                              style={{
                                paddingLeft: "42px",
                                fontFamily: "inherit",
                                fontWeight: "500",
                              }}
                              placeholder="Enter new password"
                              value={passwords.new}
                              onChange={(e) =>
                                setPasswords({
                                  ...passwords,
                                  new: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Confirm Password</label>
                          <div
                            style={{
                              position: "relative",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: "14px",
                                color: "#64748b",
                                pointerEvents: "none",
                                zIndex: 2,
                                display: "flex",
                              }}
                            >
                              <Lock size={16} />
                            </span>
                            <input
                              type="password"
                              className="settings-input"
                              style={{
                                paddingLeft: "42px",
                                fontFamily: "inherit",
                                fontWeight: "500",
                              }}
                              placeholder="Confirm new password"
                              value={passwords.confirm}
                              onChange={(e) =>
                                setPasswords({
                                  ...passwords,
                                  confirm: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <hr
                        className="settings-divider"
                        style={{
                          border: "none",
                          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                          margin: "32px 0",
                        }}
                      />

                      <div
                        className="preference-row borderless"
                        style={{
                          flexDirection: "column",
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <strong>Two-Factor Authentication (2FA)</strong>
                            <small>
                              Require an authenticator code in addition to your
                              password when logging in.
                            </small>
                          </div>
                          <button
                            className="analyze-button"
                            onClick={
                              twoFactorAuth
                                ? handleDisable2FA
                                : handleGenerate2FA
                            }
                            disabled={setup2fa.loading}
                            style={{
                              width: "auto",
                              padding: "0 24px",
                              height: "42px",
                              borderRadius: "10px",
                              margin: 0,
                              background: twoFactorAuth
                                ? "rgba(239, 68, 68, 0.1)"
                                : "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
                              color: twoFactorAuth ? "#fca5a5" : "#fff",
                              border: twoFactorAuth
                                ? "1px solid rgba(239, 68, 68, 0.4)"
                                : "none",
                              boxShadow: twoFactorAuth
                                ? "none"
                                : "0 4px 15px rgba(37, 99, 235, 0.4)",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                            }}
                          >
                            <Shield size={16} style={{ marginTop: "-2px" }} />
                            <span style={{ lineHeight: "1" }}>
                              {setup2fa.loading
                                ? "Generating..."
                                : twoFactorAuth
                                  ? "Disable 2FA"
                                  : "Enable 2FA"}
                            </span>
                          </button>
                        </div>

                        {/* --- THE QR CODE PROVISIONING MODAL INLINE --- */}
                        {setup2fa.active && !twoFactorAuth && (
                          <div
                            style={{
                              width: "100%",
                              marginTop: "16px",
                              padding: "24px",
                              background: "rgba(2, 6, 23, 0.6)",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              borderRadius: "14px",
                              display: "flex",
                              gap: "24px",
                              boxShadow: "inset 0 4px 20px rgba(0,0,0,0.5)",
                              animation: "settingsFadeIn 0.3s forwards",
                              flexWrap: "wrap",
                            }}
                          >
                            <div
                              style={{
                                background: "white",
                                padding: "8px",
                                borderRadius: "8px",
                                height: "150px",
                                width: "150px",
                                minWidth: "150px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                              }}
                            >
                              {setup2fa.uri ? (
                                <QRCodeSVG
                                  value={setup2fa.uri}
                                  size={134}
                                  level="M"
                                  includeMargin={false}
                                />
                              ) : (
                                <span
                                  style={{
                                    color: "#94a3b8",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    textAlign: "center",
                                  }}
                                >
                                  Loading QR...
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                              }}
                            >
                              <strong
                                style={{
                                  color: "#38bdf8",
                                  fontSize: "15px",
                                  marginBottom: "6px",
                                }}
                              >
                                Scan this QR Code
                              </strong>

                              <small
                                style={{
                                  color: "#94a3b8",
                                  lineHeight: "1.6",
                                  marginBottom: "12px",
                                }}
                              >
                                Open Google Authenticator or Authy, scan the
                                code to the left, and enter the generated
                                6-digit token below to verify setup.
                              </small>

                              {/* Manual Secret Key Fallback */}
                              {setup2fa.secret && (
                                <small
                                  style={{
                                    color: "#64748b",
                                    fontSize: "11px",
                                    marginBottom: "16px",
                                    display: "block",
                                  }}
                                >
                                  Manual Setup Key:{" "}
                                  <code
                                    style={{
                                      color: "#38bdf8",
                                      background: "rgba(56,189,248,0.1)",
                                      padding: "3px 8px",
                                      borderRadius: "6px",
                                      letterSpacing: "1px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {setup2fa.secret}
                                  </code>
                                </small>
                              )}

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                }}
                              >
                                <input
                                  type="text"
                                  maxLength={6}
                                  placeholder="000000"
                                  className="settings-input"
                                  value={setup2fa.token}
                                  onChange={(e) =>
                                    setSetup2fa({
                                      ...setup2fa,
                                      token: e.target.value.replace(/\D/g, ""),
                                    })
                                  }
                                  style={{
                                    width: "120px",
                                    textAlign: "center",
                                    fontSize: "18px",
                                    letterSpacing: "4px",
                                    padding: "0",
                                  }}
                                />
                                <button
                                  className="analyze-button"
                                  onClick={handleVerify2FA}
                                  style={{
                                    margin: 0,
                                    height: "44px",
                                    borderRadius: "10px",
                                  }}
                                >
                                  Verify Setup
                                </button>
                                <button
                                  className="analyze-button outline"
                                  onClick={() =>
                                    setSetup2fa({
                                      active: false,
                                      uri: "",
                                      secret: "",
                                      token: "",
                                      error: "",
                                      loading: false,
                                    })
                                  }
                                  style={{
                                    margin: 0,
                                    height: "44px",
                                    border: "none",
                                    background: "transparent",
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                              {setup2fa.error && (
                                <span
                                  style={{
                                    color: "#f87171",
                                    fontSize: "12px",
                                    marginTop: "10px",
                                    fontWeight: "600",
                                  }}
                                >
                                  {setup2fa.error}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {settingsTab === "billing" && (
                    <div className="card settings-card">
                      <div
                        style={{
                          paddingBottom: "20px",
                          marginBottom: "32px",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                        }}
                      >
                        <h3 style={{ margin: "0 0 6px 0", fontSize: "20px" }}>
                          Billing & Subscription
                        </h3>
                        <p
                          className="settings-desc"
                          style={{ marginBottom: 0, fontSize: "13px" }}
                        >
                          Manage your Agentic Platform subscription tier and
                          payment methods.
                        </p>
                      </div>

                      {/* Render a loading skeleton or the actual data */}
                      {!billingData ? (
                        <div
                          style={{
                            color: "#94a3b8",
                            textAlign: "center",
                            padding: "40px",
                          }}
                        >
                          Loading billing intelligence...
                        </div>
                      ) : (
                        <>
                          <div
                            style={{
                              background:
                                "linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(37, 99, 235, 0.03) 100%)",
                              border: "1px solid rgba(56, 189, 248, 0.25)",
                              borderRadius: "16px",
                              padding: "32px",
                              marginBottom: "32px",
                              position: "relative",
                              overflow: "hidden",
                              boxShadow:
                                "inset 0 0 20px rgba(56, 189, 248, 0.05)",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: "-100px",
                                right: "-100px",
                                width: "300px",
                                height: "300px",
                                background:
                                  "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)",
                                borderRadius: "50%",
                                pointerEvents: "none",
                              }}
                            ></div>

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: "28px",
                                position: "relative",
                                zIndex: 1,
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    display: "inline-block",
                                    background:
                                      "linear-gradient(135deg, #0ea5e9, #2563eb)",
                                    color: "white",
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    fontSize: "10.5px",
                                    fontWeight: "800",
                                    letterSpacing: "1px",
                                    marginBottom: "14px",
                                    boxShadow:
                                      "0 4px 12px rgba(14, 165, 233, 0.4)",
                                  }}
                                >
                                  {billingData.tier.includes("Pro")
                                    ? "PRO TIER"
                                    : "BASE TIER"}
                                </span>
                                <h4
                                  style={{
                                    color: "white",
                                    fontSize: "24px",
                                    margin: "0 0 6px 0",
                                    fontWeight: "700",
                                    letterSpacing: "-0.5px",
                                  }}
                                >
                                  {billingData.tier}
                                </h4>
                                <p
                                  style={{
                                    color: "#94a3b8",
                                    fontSize: "13.5px",
                                    margin: 0,
                                  }}
                                >
                                  Next billing date:{" "}
                                  {billingData.next_billing_date}
                                </p>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <h2
                                  style={{
                                    color: "white",
                                    fontSize: "36px",
                                    margin: 0,
                                    fontWeight: "800",
                                    letterSpacing: "-1px",
                                  }}
                                >
                                  $299
                                  <span
                                    style={{
                                      fontSize: "16px",
                                      color: "#64748b",
                                      fontWeight: "600",
                                      letterSpacing: "0",
                                    }}
                                  >
                                    /mo
                                  </span>
                                </h2>
                              </div>
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: "16px",
                                marginBottom: "32px",
                                position: "relative",
                                zIndex: 1,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  color: "#e2e8f0",
                                  fontSize: "13.5px",
                                  fontWeight: "500",
                                }}
                              >
                                <CheckCircle2 size={18} color="#38bdf8" />{" "}
                                Unlimited Route Analysis
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  color: "#e2e8f0",
                                  fontSize: "13.5px",
                                  fontWeight: "500",
                                }}
                              >
                                <CheckCircle2 size={18} color="#38bdf8" /> Live
                                Weather Intelligence
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  color: "#e2e8f0",
                                  fontSize: "13.5px",
                                  fontWeight: "500",
                                }}
                              >
                                <CheckCircle2 size={18} color="#38bdf8" />{" "}
                                Priority LLM Processing
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  color: "#e2e8f0",
                                  fontSize: "13.5px",
                                  fontWeight: "500",
                                }}
                              >
                                <CheckCircle2 size={18} color="#38bdf8" />{" "}
                                Customs & Margin Agents
                              </div>
                            </div>

                            {/* DYNAMIC USAGE BAR */}
                            <div
                              style={{
                                background: "rgba(2, 6, 23, 0.6)",
                                padding: "18px 20px",
                                borderRadius: "12px",
                                border: "1px solid rgba(255, 255, 255, 0.05)",
                                position: "relative",
                                zIndex: 1,
                                boxShadow: "inset 0 4px 10px rgba(0,0,0,0.3)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: "12px",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#94a3b8",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  API Usage (This Month)
                                </span>
                                <span
                                  style={{
                                    color: "#64748b",
                                    fontSize: "12.5px",
                                    fontWeight: "600",
                                  }}
                                >
                                  <strong style={{ color: "#f8fafc" }}>
                                    {billingData.api_usage.toLocaleString()}
                                  </strong>{" "}
                                  / {billingData.api_limit.toLocaleString()}{" "}
                                  reqs
                                </span>
                              </div>
                              <div
                                style={{
                                  height: "6px",
                                  background: "rgba(255, 255, 255, 0.08)",
                                  borderRadius: "10px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    /* MATH: Calculates exact percentage of API usage */
                                    width: `${(billingData.api_usage / billingData.api_limit) * 100}%`,
                                    height: "100%",
                                    background:
                                      "linear-gradient(90deg, #38bdf8, #818cf8)",
                                    borderRadius: "10px",
                                    boxShadow:
                                      "0 0 10px rgba(56, 189, 248, 0.6)",
                                    transition:
                                      "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          {/* ENTERPRISE PAYMENT METHODS SECTION */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "16px",
                              marginTop: "40px",
                            }}
                          >
                            <div>
                              <h4
                                style={{
                                  color: "white",
                                  fontSize: "16px",
                                  margin: "0 0 4px 0",
                                  fontWeight: "600",
                                }}
                              >
                                Payment Methods
                              </h4>
                              <p
                                style={{
                                  color: "#94a3b8",
                                  fontSize: "12.5px",
                                  margin: 0,
                                }}
                              >
                                Add or remove billing methods for your
                                workspace.
                              </p>
                            </div>
                            <button
                              className="analyze-button outline"
                              onClick={() => setIsAddingCard(!isAddingCard)}
                              style={{
                                margin: 0,
                                height: "36px",
                                padding: "0 16px",
                                width: "auto",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              {/* FIXED: Swaps to an 'X' icon when the form is open to make sense contextually */}
                              {isAddingCard ? (
                                <X size={16} />
                              ) : (
                                <Plus size={16} />
                              )}
                              {isAddingCard ? "Cancel" : "Add Method"}
                            </button>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "12px",
                            }}
                          >
                            {/* INLINE ADD METHOD FORM */}
                            {isAddingCard && (
                              <div
                                style={{
                                  padding: "24px",
                                  background: "rgba(2, 6, 23, 0.6)",
                                  border: "1px dashed rgba(56, 189, 248, 0.5)",
                                  borderRadius: "14px",
                                  animation: "settingsFadeIn 0.3s forwards",
                                }}
                              >
                                {/* Inputs Row */}
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "16px",
                                    marginBottom: "24px",
                                  }}
                                >
                                  <div
                                    style={{
                                      position: "relative",
                                      width: "200px",
                                    }}
                                  >
                                    <select
                                      className="settings-input"
                                      style={{
                                        width: "100%",
                                        paddingLeft: "16px",
                                        cursor: "pointer",
                                        fontFamily: "inherit",
                                        appearance: "none",
                                      }}
                                      value={newCard.brand}
                                      onChange={(e) =>
                                        setNewCard({
                                          ...newCard,
                                          brand: e.target.value,
                                          last4: "",
                                          exp_date: "",
                                          upi_id: "",
                                        })
                                      }
                                    >
                                      <optgroup label="Credit/Debit Cards">
                                        <option value="Visa">Visa</option>
                                        <option value="Mastercard">
                                          Mastercard
                                        </option>
                                        <option value="American Express">
                                          American Express
                                        </option>
                                      </optgroup>
                                      <optgroup label="Digital Wallets">
                                        <option value="PayPal">PayPal</option>
                                        <option value="Apple Pay">
                                          Apple Pay
                                        </option>
                                        <option value="Google Pay">
                                          Google Pay
                                        </option>
                                      </optgroup>
                                      <optgroup label="Bank Accounts">
                                        <option value="Bank Transfer">
                                          ACH / Bank Transfer
                                        </option>
                                      </optgroup>
                                      <optgroup label="Regional">
                                        <option value="UPI">UPI (India)</option>
                                      </optgroup>
                                    </select>
                                    <span
                                      style={{
                                        position: "absolute",
                                        right: "16px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "#38bdf8",
                                        fontSize: "10px",
                                        pointerEvents: "none",
                                      }}
                                    >
                                      ▼
                                    </span>
                                  </div>

                                  {/* Dynamic Inputs based on Payment Type */}
                                  {[
                                    "Visa",
                                    "Mastercard",
                                    "American Express",
                                  ].includes(newCard.brand) && (
                                    <>
                                      <input
                                        type="text"
                                        className="settings-input"
                                        placeholder="Card Number (Last 4)"
                                        maxLength={4}
                                        style={{
                                          flex: 1,
                                          minWidth: "160px",
                                          paddingLeft: "16px",
                                          fontFamily: "inherit",
                                        }}
                                        value={newCard.last4}
                                        onChange={(e) =>
                                          setNewCard({
                                            ...newCard,
                                            last4: e.target.value.replace(
                                              /\D/g,
                                              "",
                                            ),
                                          })
                                        }
                                      />
                                      <input
                                        type="text"
                                        className="settings-input"
                                        placeholder="MM/YYYY"
                                        maxLength={7}
                                        style={{
                                          width: "120px",
                                          paddingLeft: "16px",
                                          fontFamily: "inherit",
                                        }}
                                        value={newCard.exp_date}
                                        onChange={(e) =>
                                          setNewCard({
                                            ...newCard,
                                            exp_date: e.target.value,
                                          })
                                        }
                                      />
                                    </>
                                  )}

                                  {newCard.brand === "UPI" && (
                                    <input
                                      type="text"
                                      className="settings-input"
                                      placeholder="Enter UPI ID (e.g., user@okhdfcbank)"
                                      style={{
                                        flex: 1,
                                        minWidth: "220px",
                                        paddingLeft: "16px",
                                        fontFamily: "inherit",
                                      }}
                                      value={newCard.upi_id || ""}
                                      onChange={(e) =>
                                        setNewCard({
                                          ...newCard,
                                          upi_id: e.target.value.toLowerCase(),
                                        })
                                      }
                                    />
                                  )}

                                  {newCard.brand === "PayPal" && (
                                    <div
                                      style={{
                                        flex: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "0 16px",
                                        background: "rgba(255,255,255,0.05)",
                                        borderRadius: "10px",
                                        color: "#cbd5e1",
                                        fontSize: "13.5px",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        minWidth: "250px",
                                      }}
                                    >
                                      You will be redirected to PayPal to
                                      authorize the billing agreement.
                                    </div>
                                  )}

                                  {["Apple Pay", "Google Pay"].includes(
                                    newCard.brand,
                                  ) && (
                                    <div
                                      style={{
                                        flex: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "0 16px",
                                        background: "rgba(255,255,255,0.05)",
                                        borderRadius: "10px",
                                        color: "#cbd5e1",
                                        fontSize: "13.5px",
                                        border:
                                          "1px solid rgba(255,255,255,0.1)",
                                        minWidth: "250px",
                                      }}
                                    >
                                      Click save to authenticate securely via
                                      your device wallet.
                                    </div>
                                  )}

                                  {newCard.brand === "Bank Transfer" && (
                                    <>
                                      <input
                                        type="text"
                                        className="settings-input"
                                        placeholder="Routing Number"
                                        maxLength={9}
                                        style={{
                                          flex: 1,
                                          minWidth: "140px",
                                          paddingLeft: "16px",
                                          fontFamily: "inherit",
                                        }}
                                      />
                                      <input
                                        type="text"
                                        className="settings-input"
                                        placeholder="Account (Last 4)"
                                        maxLength={4}
                                        style={{
                                          width: "160px",
                                          paddingLeft: "16px",
                                          fontFamily: "inherit",
                                        }}
                                        value={newCard.last4}
                                        onChange={(e) =>
                                          setNewCard({
                                            ...newCard,
                                            last4: e.target.value.replace(
                                              /\D/g,
                                              "",
                                            ),
                                          })
                                        }
                                      />
                                    </>
                                  )}
                                </div>

                                {/* Actions Row */}
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "16px",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "14px",
                                    }}
                                  >
                                    <label className="toggle-switch">
                                      <input
                                        type="checkbox"
                                        checked={newCard.is_primary}
                                        onChange={(e) =>
                                          setNewCard({
                                            ...newCard,
                                            is_primary: e.target.checked,
                                          })
                                        }
                                      />
                                      <span className="slider"></span>
                                    </label>
                                    <span
                                      style={{
                                        color: "#cbd5e1",
                                        fontSize: "13.5px",
                                        fontWeight: "600",
                                        userSelect: "none",
                                      }}
                                    >
                                      Set as default method
                                    </span>
                                  </div>

                                  <button
                                    className="analyze-button"
                                    onClick={handleAddPaymentMethod}
                                    style={{
                                      margin: 0,
                                      height: "42px",
                                      padding: "0 28px",
                                      width: "auto",
                                      minWidth: "160px",
                                      borderRadius: "10px",
                                      flexShrink: 0,
                                    }}
                                  >
                                    Save{" "}
                                    {newCard.brand === "Bank Transfer"
                                      ? "Account"
                                      : newCard.brand === "PayPal"
                                        ? "PayPal"
                                        : ["Apple Pay", "Google Pay"].includes(
                                              newCard.brand,
                                            )
                                          ? "Wallet"
                                          : newCard.brand === "UPI"
                                            ? "UPI ID"
                                            : "Card"}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* RENDER SAVED METHODS DYNAMICALLY */}
                            {billingData.payment_methods?.length === 0 ? (
                              <div
                                style={{
                                  padding: "30px 20px",
                                  textAlign: "center",
                                  background: "rgba(15, 23, 42, 0.4)",
                                  border: "1px dashed rgba(255, 255, 255, 0.1)",
                                  borderRadius: "14px",
                                  color: "#94a3b8",
                                  fontSize: "13.5px",
                                }}
                              >
                                No payment methods found. Add a method to keep
                                your workspace active.
                              </div>
                            ) : (
                              billingData.payment_methods?.map((method) => {
                                let MethodIcon = CreditCard;
                                let displayName = `${method.brand} ending in ${method.last4}`;
                                let displayStatus = `Expires ${method.exp_date}`;

                                if (method.brand === "PayPal") {
                                  MethodIcon = Globe;
                                  displayName = "PayPal Account";
                                  displayStatus = "Linked Billing Agreement";
                                } else if (
                                  method.brand === "Apple Pay" ||
                                  method.brand === "Google Pay"
                                ) {
                                  MethodIcon = Shield;
                                  displayName = method.brand;
                                  displayStatus = "Device Authenticated";
                                } else if (method.brand === "Bank Transfer") {
                                  MethodIcon = Building2;
                                  displayName = `ACH Bank Account (*${method.last4})`;
                                  displayStatus = "Verified Active";
                                } else if (method.brand === "UPI") {
                                  MethodIcon = Smartphone;
                                  displayName = `UPI Handle (*${method.last4})`;
                                  displayStatus = "Verified VPA";
                                }

                                return (
                                  <div
                                    key={method.id}
                                    style={{
                                      padding: "20px",
                                      background: method.is_primary
                                        ? "rgba(14, 165, 233, 0.05)"
                                        : "rgba(15, 23, 42, 0.4)",
                                      border: method.is_primary
                                        ? "1px solid rgba(56, 189, 248, 0.4)"
                                        : "1px solid rgba(255, 255, 255, 0.06)",
                                      borderRadius: "14px",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      transition: "all 0.2s ease",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "16px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: "52px",
                                          height: "36px",
                                          background:
                                            "rgba(255, 255, 255, 0.08)",
                                          borderRadius: "6px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          border:
                                            "1px solid rgba(255, 255, 255, 0.1)",
                                          boxShadow:
                                            "0 4px 10px rgba(0,0,0,0.2)",
                                        }}
                                      >
                                        <MethodIcon
                                          size={20}
                                          color={
                                            method.is_primary
                                              ? "#38bdf8"
                                              : "#cbd5e1"
                                          }
                                        />
                                      </div>
                                      <div>
                                        <strong
                                          style={{
                                            display: "block",
                                            color: "#f8fafc",
                                            fontSize: "14.5px",
                                            marginBottom: "4px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                          }}
                                        >
                                          {displayName}
                                          {method.is_primary && (
                                            <span
                                              style={{
                                                background:
                                                  "rgba(56, 189, 248, 0.15)",
                                                color: "#38bdf8",
                                                fontSize: "10px",
                                                padding: "2px 6px",
                                                borderRadius: "4px",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                              }}
                                            >
                                              Default
                                            </span>
                                          )}
                                        </strong>
                                        <small
                                          style={{
                                            color: "#64748b",
                                            fontSize: "12.5px",
                                            fontWeight: "500",
                                          }}
                                        >
                                          {displayStatus}
                                        </small>
                                      </div>
                                    </div>

                                    <div
                                      style={{ display: "flex", gap: "8px" }}
                                    >
                                      {!method.is_primary && (
                                        <button
                                          className="analyze-button outline"
                                          onClick={() =>
                                            handleMakePrimary(method.id)
                                          }
                                          title="Make Default"
                                          style={{
                                            margin: 0,
                                            height: "36px",
                                            width: "36px",
                                            padding: 0,
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            border: "none",
                                            background:
                                              "rgba(255,255,255,0.05)",
                                          }}
                                        >
                                          <Star size={16} color="#cbd5e1" />
                                        </button>
                                      )}
                                      <button
                                        className="analyze-button outline"
                                        onClick={() =>
                                          handleDeleteMethod(method.id)
                                        }
                                        title="Delete Method"
                                        style={{
                                          margin: 0,
                                          height: "36px",
                                          width: "36px",
                                          padding: 0,
                                          display: "flex",
                                          justifyContent: "center",
                                          alignItems: "center",
                                          border: "none",
                                          background: "rgba(239, 68, 68, 0.1)",
                                        }}
                                      >
                                        <Trash2 size={16} color="#f87171" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}

                            {/* Billing History Link */}
                            <div
                              style={{
                                padding: "20px",
                                marginTop: "16px",
                                background: "transparent",
                                border: "1px solid transparent",
                                borderRadius: "14px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  "rgba(255, 255, 255, 0.03)";
                                e.currentTarget.style.borderColor =
                                  "rgba(255, 255, 255, 0.06)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "transparent";
                                e.currentTarget.style.borderColor =
                                  "transparent";
                              }}
                              onClick={() => {
                                setSaveMessage("Invoice PDF downloaded.");
                                setTimeout(() => setSaveMessage(""), 3000);
                              }}
                            >
                              <div>
                                <strong
                                  style={{
                                    display: "block",
                                    color: "#f8fafc",
                                    fontSize: "14.5px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Billing History
                                </strong>
                                <small
                                  style={{
                                    color: "#64748b",
                                    fontSize: "12.5px",
                                    fontWeight: "500",
                                  }}
                                >
                                  Download previous invoices and receipts.
                                </small>
                              </div>
                              <div
                                style={{
                                  color: "#38bdf8",
                                  fontSize: "13.5px",
                                  fontWeight: "600",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                View History <span>→</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* UNIVERSAL STICKY SAVE FOOTER */}
                  <div className="settings-footer-sticky">
                    {saveMessage && (
                      <span className="save-success-msg">
                        <CheckCircle2 size={16} /> {saveMessage}
                      </span>
                    )}
                    <button
                      className="analyze-button"
                      onClick={saveSettings}
                      disabled={isSaving}
                    >
                      <Save size={16} />{" "}
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
