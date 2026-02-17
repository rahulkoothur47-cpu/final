"use client";

import { useState } from "react";

export default function Home() {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleTrackBus = () => {
    setShowOptions(true);
    setSelectedCategory(null);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      setShowOptions(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            {/* Logo */}
            <div className="logo-circle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="logo-icon"
              >
                <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
              </svg>
            </div>
            <div className="logo-text">
              <h1>Real-Time Bus Tracker</h1>
              <p>Real-time Bus Tracking</p>
            </div>
          </div>
          <nav className="nav">
            <a href="#">Home</a>
            <a href="#">About</a>
            <a href="#">Contact</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className={`main-content ${showOptions ? "main-active" : "main-default"}`}>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="container hero-content">
            <h2 className={`hero-title ${showOptions ? "hero-title-light" : "hero-title-dark"}`}>
              Track Your Bus in Real-Time
            </h2>
            <p className={`hero-description ${showOptions ? "hero-description-light" : "hero-description-dark"}`}>
              Never miss your bus again! Our advanced tracking system helps you know 
              exactly where your bus is and when it will arrive.
            </p>
            
            {!showOptions ? (
              <button onClick={handleTrackBus} className="track-btn">
                🚌 Track Bus
              </button>
            ) : (
              <div className="options-panel">
                {!selectedCategory ? (
                  <>
                    <h3 className="options-title">Select Bus Category</h3>
                    <div className="options-buttons">
                      <button
                        onClick={() => handleCategorySelect("college")}
                        className="category-btn category-btn-college"
                      >
                        <span className="btn-icon">🎓</span>
                        College Buses
                      </button>
                      <button
                        onClick={() => handleCategorySelect("ksrtc")}
                        className="category-btn category-btn-ksrtc"
                      >
                        <span className="btn-icon">🚍</span>
                        KSRTC
                      </button>
                    </div>
                    <button onClick={handleBack} className="back-btn">
                      ← Back
                    </button>
                  </>
                ) : selectedCategory === "college" ? (
                  <>
                    <h3 className="options-title">Select College</h3>
                    <div className="options-buttons">
                      <button
                        onClick={() => alert("GCEK Bus Tracking - Coming Soon!")}
                        className="category-btn category-btn-gcek"
                      >
                        <span className="btn-icon">🏛️</span>
                        GCEK (Govt. College of Engineering, Kannur)
                      </button>
                    </div>
                    <button onClick={handleBack} className="back-btn">
                      ← Back
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="options-title">KSRTC Bus Tracking</h3>
                    <p className="coming-soon-text">
                      KSRTC tracking features coming soon!
                    </p>
                    <button onClick={handleBack} className="back-btn">
                      ← Back
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Features Section / Stats Section */}
        {!showOptions ? (
          <section className="features-section">
            <div className="container">
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">📍</div>
                  <h4 className="feature-title">Real-Time Location</h4>
                  <p className="feature-text">Track your bus with accurate GPS.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">⏰</div>
                  <h4 className="feature-title">Arrival Estimates</h4>
                  <p className="feature-text">Get accurate arrival predictions.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🔔</div>
                  <h4 className="feature-title">Smart Notifications</h4>
                  <p className="feature-text">Get alerts when your bus is near.</p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="stats-section">
            <div className="container">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">50+</div>
                  <p className="stat-label">Active Buses</p>
                </div>
                <div className="stat-item">
                  <div className="stat-number">99.4%</div>
                  <p className="stat-label">Accuracy</p>
                </div>
                <div className="stat-item">
                  <div className="stat-number">24/7</div>
                  <p className="stat-label">Live Tracking</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-logo">
            <div className="footer-logo-circle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="footer-logo-icon"
              >
                <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
              </svg>
            </div>
            <span>BusTracker</span>
          </div>
          <div className="footer-copyright">
            © 2026 BusTracker. All rights reserved.
          </div>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
