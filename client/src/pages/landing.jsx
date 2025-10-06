import React from "react";
import "./landing.css";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-left">
          <div className="nav-logo">
            {/* Replace /assets/logo.png with your actual logo path */}
            <img src="../assets/logo.png" alt="Logo" className="logo-image"/>
            <span className="logo-text">Janta Garage</span>
          </div>
        </div>

        <ul className="nav-links">
          <li><a href="#">Home</a></li>
          <li><a href="#departments">Departments</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>

        <Link to="/login" className="login-btn">Login</Link>

      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to Janta Garage</h1>
          <p>Your one-stop solution for all automotive needs.</p>
          <Link to="/signup" className="cta-btn">Get Started</Link>
        </div>
      </section>

      {/* Departments Section */}
      <section id="departments" className="departments">
        <h2>Our Departments</h2>
        <div className="departments-grid">
          <div className="department-card">
            <h3>Mechanical</h3>
            <p>We specialize in engine maintenance, repairs, and servicing for all types of vehicles.</p>
          </div>

          <div className="department-card">
            <h3>Electrical</h3>
            <p>Our experts handle all kinds of vehicle electrical issues with precision and care.</p>
          </div>

          <div className="department-card">
            <h3>Body Work</h3>
            <p>From dents to full paint jobs, our team ensures your car looks brand new.</p>
          </div>

          <div className="department-card">
            <h3>Washing</h3>
            <p>Eco-friendly washing and detailing services to make your car shine.</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <h2>About Us</h2>
        <p>
          Janta Garage is a trusted name in automobile service, known for 
          quality work, skilled professionals, and excellent customer satisfaction.
        </p>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 Janta Garage. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
