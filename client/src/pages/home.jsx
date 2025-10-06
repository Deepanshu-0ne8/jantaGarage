import React, { useState } from "react";
import Navbar from "../components/navbar";
import ReportPopup from "../components/reportPopup";
import "./home.css";

const Home = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  return (
    <div className="home-container">
      <Navbar />

      <div className="home-content">
        <h1>Welcome to Janta Garage</h1>
        <p>Manage and report public issues efficiently.</p>

        <button className="open-report-btn" onClick={openPopup}>
          + Create Report
        </button>
      </div>

      {/* ✅ FIXED: prop name should be onRequestClose */}
      <ReportPopup isOpen={isPopupOpen} onRequestClose={closePopup} />
    </div>
  );
};

export default Home;
