import { useState } from 'react'
import './App.css'

function Dashboard() {
  const [origin, setOrigin] = useState('Tokyo')
  const [destination, setDestination] = useState('Sydney')
  const [cargoType, setCargoType] = useState('Electronics')
  const [containers, setContainers] = useState(10)

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const analyzeRoute = async () => {
    setLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: origin,
          destination: destination,
          cargo_type: cargoType,
          containers: Number(containers),
        }),
      })

      const data = await response.json()
      setResult(data)

    } catch (error) {
      console.error('Error:', error)

      setResult({
        status: 'error',
        message: 'Could not connect to the backend.',
      })
    }

    setLoading(false)
  }

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
          <div className="nav-item">▦ &nbsp; Dashboard</div>
          <div className="nav-item active">＋ &nbsp; New Quotation</div>
          <div className="nav-item">⇄ &nbsp; Route Intelligence</div>
          <div className="nav-item">▤ &nbsp; Quotations</div>
        </nav>

        <div className="platform">
          <strong>✦ &nbsp; Agentic Platform</strong>
          <small>Milestone 1 • Route Foundation</small>
        </div>

        <div className="nav-item settings">⚙ &nbsp; Settings</div>
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

          <div className="page-heading">
            <div>
              <div className="eyebrow">✦ ROUTE INTELLIGENCE</div>

              <h1>New freight quotation</h1>

              <p>
                Enter shipment details and let the Route Agent analyze the best
                maritime route.
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
                      setOrigin(e.target.value)
                      setResult(null)
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
                      setDestination(e.target.value)
                      setResult(null)
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
                  ? 'Analyzing route...'
                  : '✦ Analyze route & generate quote →'}
              </button>

            </div>

            {/* Route Agent */}
            <div className="card agent-card">

              <div className="agent-icon">✦</div>

              <h2>Route Agent</h2>

              <p>
                The AI agent will compare maritime route alternatives and score
                them using transit time, distance, transshipment, and route
                factors.
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

    {result.status === 'success' ? (
      <>

        <div className="result-header">
          <div>

            <h2>Route Intelligence Result</h2>

            <p>
              {result.candidate_routes} route
              {result.candidate_routes !== 1 ? 's' : ''} evaluated for{' '}
              {result.origin} → {result.destination}
            </p>

          </div>

          <div className="best-route-badge">
            🏆 Best Route: {result.recommended_route}
          </div>

        </div>


        {/* Recommended Route */}

        <div className="routes-list">

          <div className="route-item best-route">

            <div className="route-rank">
              🥇
            </div>

            <div className="route-info">
              <small>Route ID</small>
              <strong>
                {result.recommended_route_details.route_id}
              </strong>
            </div>

            <div className="route-info">
              <small>Transit Time</small>
              <strong>
                {result.recommended_route_details.transit_days} days
              </strong>
            </div>

            <div className="route-info">
              <small>Distance</small>
              <strong>
                {result.recommended_route_details.distance_nm} NM
              </strong>
            </div>

            <div className="route-info">
              <small>Transshipments</small>
              <strong>
                {result.recommended_route_details.transshipments}
              </strong>
            </div>

            <div className="route-info">
              <small>Route Score</small>
              <strong>
                {result.recommended_route_details.route_score}
              </strong>
            </div>

            <div className="route-info freight">
              <small>Base Freight</small>
              <strong>
                ${result.recommended_route_details.base_freight_usd}
              </strong>
            </div>

          </div>


          {/* Alternative Routes */}

          {result.alternatives.map((route) => (

            <div
              className="route-item"
              key={route.route_id}
            >

              <div className="route-rank">

                {route.rank === 2
                  ? '🥈'
                  : route.rank === 3
                  ? '🥉'
                  : `#${route.rank}`}

              </div>


              <div className="route-info">
                <small>Route ID</small>
                <strong>{route.route_id}</strong>
              </div>


              <div className="route-info">
                <small>Transit Time</small>
                <strong>
                  {route.transit_days} days
                </strong>
              </div>


              <div className="route-info">
                <small>Distance</small>
                <strong>
                  {route.distance_nm} NM
                </strong>
              </div>


              <div className="route-info">
                <small>Transshipments</small>
                <strong>
                  {route.transshipments}
                </strong>
              </div>


              <div className="route-info">
                <small>Route Score</small>
                <strong>
                  {route.route_score}
                </strong>
              </div>


              <div className="route-info freight">
                <small>Base Freight</small>
                <strong>
                  ${route.base_freight_usd}
                </strong>
              </div>

            </div>

          ))}

        </div>


        {/* Score Breakdown */}

        <div className="score-section">

          <h3>🏆 Recommended Route Score Breakdown</h3>

          <div className="score-grid">

            <div>
              <small>Transit Score</small>

              <strong>
                {
                  result.recommended_route_details
                    .score_breakdown.transit_score
                }
              </strong>
            </div>


            <div>
              <small>Distance Score</small>

              <strong>
                {
                  result.recommended_route_details
                    .score_breakdown.distance_score
                }
              </strong>
            </div>


            <div>
              <small>Transshipment Score</small>

              <strong>
                {
                  result.recommended_route_details
                    .score_breakdown.transshipment_score
                }
              </strong>
            </div>

          </div>

        </div>

      </>
    ) : (

      <p>{result.message}</p>

    )}

  </div>
)}

      </section>

    </main>

  </div>
)

}

export default Dashboard