import './Home.css'

function Home({ onGetStarted }) {
  return (
    <div className="home-page">

      {/* Navbar */}
      <nav className="home-navbar">
        <div className="home-brand">
          <div className="brand-icon">⚓</div>
          <div>
            <h2>Maritime AI</h2>
            <span>Brokerage Intelligence</span>
          </div>
        </div>

        <button className="nav-login-btn" onClick={onGetStarted}>
          Login
        </button>
      </nav>


      {/* Hero Section */}
      <main className="home-hero">

        <div className="hero-content">

          <div className="hero-badge">
            ✦ AI-POWERED MARITIME BROKERAGE
          </div>

          <h1>
            Smarter Freight.
            <br />
            <span>Better Routes.</span>
          </h1>

          <p>
            Optimize maritime freight routes, pricing, and brokerage
            margins with intelligent AI agents.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={onGetStarted}
            >
              Get Started →
            </button>

            <button
              className="secondary-btn"
              onClick={() =>
                document
                  .getElementById('how-it-works')
                  .scrollIntoView({ behavior: 'smooth' })
              }
            >
              How It Works
            </button>
          </div>

        </div>


        {/* Hero Visual */}
        <div className="hero-visual">

          <div className="ocean-card">

            <div className="radar-circle">
              <div className="radar-line"></div>
              <div className="radar-dot dot-one"></div>
              <div className="radar-dot dot-two"></div>
              <div className="radar-dot dot-three"></div>
            </div>

            <div className="route-line"></div>

            <div className="port port-one">
              <span></span>
              Tokyo
            </div>

            <div className="port port-two">
              <span></span>
              Sydney
            </div>

            <div className="ai-status">
              <div className="status-dot"></div>
              AI Engine Online
            </div>

          </div>

        </div>

      </main>


      {/* How It Works */}
      <section id="how-it-works" className="how-section">

        <div className="section-heading">
          <span>HOW IT WORKS</span>
          <h2>One intelligent workflow</h2>
          <p>
            From shipment requirements to a complete freight quotation.
          </p>
        </div>


        <div className="feature-grid">

          <div className="feature-card">
            <div className="feature-number">01</div>
            <div className="feature-icon">🚢</div>
            <h3>Route Intelligence</h3>
            <p>
              Our Route Agent analyzes available maritime routes,
              transit time, distance, and transshipments.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-number">02</div>
            <div className="feature-icon">💰</div>
            <h3>AI Pricing</h3>
            <p>
              Calculate freight costs using fuel, port charges,
              risk, and demand factors.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-number">03</div>
            <div className="feature-icon">📈</div>
            <h3>Margin Optimization</h3>
            <p>
              Determine a suitable selling price while protecting
              the brokerage's target margin.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-number">04</div>
            <div className="feature-icon">📄</div>
            <h3>Final Quotation</h3>
            <p>
              Generate a complete quotation that can be reviewed
              and approved by the broker.
            </p>
          </div>

        </div>

      </section>


      {/* Bottom CTA */}
      <section className="home-cta">

        <div>
          <span>READY TO GET STARTED?</span>
          <h2>Turn shipment data into smarter decisions.</h2>
        </div>

        <button
          className="primary-btn"
          onClick={onGetStarted}
        >
          Start a Quotation →
        </button>

      </section>


      {/* Footer */}
      <footer className="home-footer">
        <div>⚓ Maritime AI</div>
        <span>Agentic Maritime Brokerage Platform</span>
      </footer>

    </div>
  )
}

export default Home