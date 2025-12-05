import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export function LandingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="fixed top-4 left-0 right-0 z-50">
      <nav className="mx-auto max-w-5xl px-4">
        <div className="bg-white/90 backdrop-blur rounded-full shadow-sm border px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Logo */}
            <Link to="/" className="flex items-center gap-2 pl-1">
              <div className="flex items-center gap-2">
                <img src="/assets/Logo_visiblle-2.svg" alt="BeVisiblle" className="h-8 w-8" />
                <span className="text-lg font-semibold tracking-tight">
                  BeVisib<span className="text-primary">ll</span>e
                </span>
              </div>
            </Link>

            {/* Center: Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/cv-generator" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Lebenslauf
              </Link>
              <Link to="/jobs" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Jobs
              </Link>
              <Link to="/company" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Unternehmen
              </Link>
              <Link to="/about" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Über uns
              </Link>
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Link to="/auth" className="hidden sm:inline-flex rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Login
              </Link>
              <Link to="/cv-generator" className="rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-[#5170ff]">
                Jetzt registrieren
              </Link>
              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile dropdown */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden mx-4 mt-2 bg-white/90 backdrop-blur rounded-lg shadow-sm border px-4 py-2`}>
          <Link to="/cv-generator" className="block py-2 text-gray-700 hover:text-gray-900">
            Lebenslauf
          </Link>
          <Link to="/jobs" className="block py-2 text-gray-700 hover:text-gray-900">
            Jobs
          </Link>
          <Link to="/company" className="block py-2 text-gray-700 hover:text-gray-900">
            Unternehmen
          </Link>
          <Link to="/about" className="block py-2 text-gray-700 hover:text-gray-900">
            Über uns
          </Link>
          <Link to="/auth" className="block py-2 text-gray-700 hover:text-gray-900">
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
}

