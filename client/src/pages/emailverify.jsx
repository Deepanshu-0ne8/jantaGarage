import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post("/auth/verify-otp", { email, otp });
      setLoading(false);

      if (res.data.success) {
        alert("Email verified successfully!");
        navigate("/login");
      } else {
        alert(res.data.message || "Invalid OTP");
      }
    } catch (error) {
      setLoading(false);
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Dynamic Background Orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }}></div>

      {/* Glass Card */}
      <div className="glass-card w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in duration-500">
        <h2 className="text-3xl font-extrabold text-white text-center tracking-tight mb-2">Verify Email</h2>
        <p className="text-slate-400 text-center mb-6 text-sm">
          Enter the OTP sent to <strong className="text-white">{email}</strong>
        </p>
        
        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : "Verify OTP"}
          </button>
        </form>
        
        <div className="mt-6 text-center space-y-3">
          <p className="text-slate-400 text-sm">
            Mistyped email? <Link to="/signup" state={{ email }} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Go back to Signup</Link>
          </p>
          <p className="text-slate-500 text-sm">
            <Link to="/" className="hover:text-slate-300 transition-colors inline-flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Back to Landing Page
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
