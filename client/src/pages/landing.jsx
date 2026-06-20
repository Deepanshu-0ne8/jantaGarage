import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png"; // Ensure this path is correct

const Landing = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative overflow-hidden font-sans">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Navbar (Glassmorphic) */}
      <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-slate-950/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <img src={logo} alt="Janta Garage Logo" className="h-10 w-auto" />
              <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
                Janta Garage
              </span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-slate-300 hover:text-white transition-colors font-medium text-sm">Home</a>
              <a href="#departments" className="text-slate-300 hover:text-white transition-colors font-medium text-sm">Departments</a>
              <a href="#about" className="text-slate-300 hover:text-white transition-colors font-medium text-sm">About</a>
              <a href="#contact" className="text-slate-300 hover:text-white transition-colors font-medium text-sm">Contact</a>
            </div>

            {/* CTA */}
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-slate-300 hover:text-white font-medium text-sm transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-300 hover:text-white focus:outline-none p-2"
              >
                <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 absolute w-full left-0 animate-in slide-in-from-top-4 duration-200 shadow-xl">
            <div className="px-4 pt-2 pb-6 space-y-3 flex flex-col">
              <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
              <a href="#departments" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setIsMobileMenuOpen(false)}>Departments</a>
              <a href="#about" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setIsMobileMenuOpen(false)}>About</a>
              <a href="#contact" className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
              <div className="border-t border-slate-700/50 pt-4 mt-2 flex flex-col gap-3">
                <Link to="/login" className="block text-center px-4 py-2 text-slate-300 hover:text-white font-medium" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                <Link to="/signup" className="block text-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-semibold" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center text-center min-h-[90vh]">
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-emerald-400 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Next-Gen Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Welcome to <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400 animate-gradient-x">
              Janta Garage
            </span>
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Your one-stop solution for all automotive needs. Experience seamless service tracking and transparent reporting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link 
              to="/signup" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:-translate-y-1"
            >
              Start Now
            </Link>
            <a 
              href="#departments" 
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-8 py-4 rounded-full text-lg font-bold transition-all hover:-translate-y-1"
            >
              Explore Departments
            </a>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section id="departments" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Departments</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-emerald-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Dept Card 1 */}
            <div className="glass-card p-6 group hover:-translate-y-2 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30 group-hover:bg-blue-500/30 transition-colors">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Mechanical</h3>
              <p className="text-slate-400 text-sm leading-relaxed">We specialize in engine maintenance, repairs, and servicing for all types of vehicles.</p>
            </div>

            {/* Dept Card 2 */}
            <div className="glass-card p-6 group hover:-translate-y-2 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/30 group-hover:bg-emerald-500/30 transition-colors">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Electrical</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Our experts handle all kinds of vehicle electrical issues with precision and care.</p>
            </div>

            {/* Dept Card 3 */}
            <div className="glass-card p-6 group hover:-translate-y-2 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-6 border border-amber-500/30 group-hover:bg-amber-500/30 transition-colors">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Body Work</h3>
              <p className="text-slate-400 text-sm leading-relaxed">From dents to full paint jobs, our team ensures your car looks brand new.</p>
            </div>

            {/* Dept Card 4 */}
            <div className="glass-card p-6 group hover:-translate-y-2 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-6 border border-cyan-500/30 group-hover:bg-cyan-500/30 transition-colors">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Washing</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Eco-friendly washing and detailing services to make your car shine.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 relative z-10 bg-slate-900/30 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">About Us</h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            Janta Garage is a trusted name in automobile service, known for 
            quality work, skilled professionals, and excellent customer satisfaction. 
            We leverage technology to bring transparency and efficiency to every repair.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950 py-8 text-center relative z-10">
        <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Janta Garage. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
