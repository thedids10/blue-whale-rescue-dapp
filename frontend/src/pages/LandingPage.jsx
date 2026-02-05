import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './LandingPage.css'

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=1920&q=80',
    title: 'Blue whales in open ocean',
    text: 'Vast, deep, and quiet waters are essential for blue whales to feed, migrate, and communicate over hundreds of kilometres.'
  },
  {
    image: 'https://images.unsplash.com/photo-1454991727061-be514eae86f7?w=1920&q=80',
    title: 'Listening beneath the surface',
    text: 'Acoustic monitoring projects track songs and calls, helping scientists measure the impact of shipping noise on whale behaviour.'
  },
  {
    image: 'https://images.unsplash.com/photo-1511405889574-b01de1da5b05?w=1920&q=80',
    title: 'People and whales, together',
    text: 'Community education and policy change can reduce ship strikes and support long-term protection of migration routes.'
  }
]

function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showTopBar, setShowTopBar] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="landing">
      {/* Top Bar */}
      {showTopBar && (
        <div className="top-bar">
          <span>Support our work for safer whales, cleaner air, and a quieter ocean.</span>
          <Link to="/dapp" className="top-bar-btn">Donate with Blockchain DApp</Link>
          <button className="top-bar-close" onClick={() => setShowTopBar(false)} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-title">Blue Whales • Blue Skies</span>
            <span className="logo-sub">Blockchain transparency for conservation</span>
          </div>
        </div>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#impact">Impact</a>
          <a href="#why">Why Blockchain</a>
          <a href="#faq">FAQ</a>
          <Link to="/dapp" className="nav-cta">Open DApp</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=1920&q=80)` }}></div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="hero-eyebrow">Donate</p>
          <h1>Contribute to safer whales, cleaner air, and a quieter ocean.</h1>
          <p className="hero-text">
            Your support helps marine programs adopt responsible shipping practices,
            monitor blue whale migration routes, and reduce underwater noise pollution.
            This educational project demonstrates how blockchain can add transparency to conservation funding.
          </p>
          <div className="hero-actions">
            <Link to="/dapp" className="btn-primary">Donate via Blockchain DApp</Link>
            <a href="#faq" className="btn-ghost">See Donor FAQ</a>
          </div>
        </div>
        <div className="hero-panel" id="about">
          <h2>How the fund works</h2>
          <p>
            Donations are simulated on an Ethereum test network using free test ETH.
            Each contribution mints CTK reward tokens that represent your impact.
          </p>
          <ul>
            <li>Transparent campaigns deployed as smart contracts</li>
            <li>MetaMask integration for secure transactions</li>
            <li>ERC-20 reward tokens for every contribution</li>
          </ul>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">~25,000</span>
            <span className="stat-label">Blue whales remaining worldwide</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">200+</span>
            <span className="stat-label">Tons — weight of a single blue whale</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">188 dB</span>
            <span className="stat-label">Volume of a blue whale call</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">Transparency with blockchain</span>
          </div>
        </div>
      </section>

      {/* Carousel Section */}
      <section className="carousel-section">
        <h2 className="section-title">Conservation in Action</h2>
        <div className="carousel">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="slide-overlay"></div>
              <div className="slide-content">
                <h3>{slide.title}</h3>
                <p>{slide.text}</p>
              </div>
            </div>
          ))}
          <div className="carousel-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="impact-section" id="impact">
        <div className="container">
          <div className="impact-header">
            <h2>Program Impact Areas</h2>
            <p>
              Funds are allocated across a set of model initiatives designed to highlight
              real conservation challenges while remaining fully educational.
            </p>
          </div>
          <div className="impact-grid">
            <div className="impact-card">
              <div className="impact-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19z"/>
                </svg>
              </div>
              <h3>Shipping Lane Safety</h3>
              <p>Supporting research that reroutes busy shipping corridors away from key whale habitats.</p>
            </div>
            <div className="impact-card">
              <div className="impact-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <h3>Acoustic Monitoring</h3>
              <p>Deploying hydrophones to understand migration patterns and reduce noise stress.</p>
            </div>
            <div className="impact-card">
              <div className="impact-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"/>
                </svg>
              </div>
              <h3>Clean Coasts</h3>
              <p>Organising educational beach clean-ups along major migration routes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Blockchain Section */}
      <section className="why-section" id="why">
        <div className="container">
          <div className="why-grid">
            <div className="why-content">
              <h2>Why blockchain for whales?</h2>
              <p>
                Traditional donation systems can be opaque. By representing campaigns as smart contracts,
                every contribution and campaign outcome can be verified on a public ledger.
              </p>
              <p>
                In this educational project, the blockchain layer mirrors the kind of traceability that
                real conservation funds are increasingly exploring: clear goals, transparent allocation,
                and verifiable outcomes.
              </p>
              <div className="why-features">
                <div className="feature">
                  <span className="feature-icon">✓</span>
                  <span>Immutable donation records</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">✓</span>
                  <span>Transparent fund allocation</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">✓</span>
                  <span>Verifiable campaign outcomes</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">✓</span>
                  <span>Reward tokens for contributors</span>
                </div>
              </div>
            </div>
            <div className="why-panel" id="faq">
              <h3>Donor FAQ (exam context)</h3>
              <p>
                This project is built for the <strong>Blockchain 1 final examination</strong>. All transactions use
                Ethereum <strong>test networks only</strong>, and all funds are fictional.
              </p>
              <p>
                The goal is to demonstrate secure interaction between a web interface, MetaMask, and Solidity contracts.
              </p>
              <p>
                When you are ready to see the technical side, open the DApp page and interact with the
                campaigns using your MetaMask wallet.
              </p>
              <Link to="/dapp" className="panel-link">Go to the DApp →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-bg" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1454991727061-be514eae86f7?w=1920&q=80)` }}></div>
        <div className="cta-overlay"></div>
        <div className="cta-content">
          <h2>Ready to make a difference?</h2>
          <p>Connect your MetaMask wallet and support transparent conservation campaigns.</p>
          <Link to="/dapp" className="btn-primary btn-large">Launch DApp</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <h4>Blue Whales • Blue Skies</h4>
            <p>
              A fictional education fund focused on blue whale protection, created for the
              Blockchain 1 final examination project.
            </p>
          </div>
          <div className="footer-links">
            <h5>Explore</h5>
            <ul>
              <li><a href="#about">How the fund works</a></li>
              <li><a href="#impact">Program impact</a></li>
              <li><a href="#why">Why blockchain</a></li>
              <li><Link to="/dapp">Open DApp</Link></li>
            </ul>
          </div>
          <div className="footer-info">
            <h5>Exam Context</h5>
            <p>
              Built with Solidity smart contracts, ERC-20 reward tokens, MetaMask integration,
              and an Ethereum test network. No real funds are accepted or processed.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Blue Whale Rescue Fund — Educational use only</span>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
