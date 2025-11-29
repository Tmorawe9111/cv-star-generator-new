import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 items-start text-center md:text-left">
        <div>
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <img 
              src="/assets/Logo_visiblle-2.svg" 
              alt="bevisiblle Logo" 
              className="h-8 w-8 object-contain" 
              width="32" 
              height="32"
              loading="lazy"
            />
            <span className="text-lg font-semibold">
              BeVisib<span className="text-primary">ll</span>e
            </span>
          </div>
          <p className="mt-3 text-sm text-zinc-300 max-w-xs">
            BeVisible ist mehr als eine Jobplattform. Mit uns findest du Menschen, Chancen und Unternehmen, die zu dir passen. Vernetze dich, teile Erfahrungen und werde sichtbar für deinen Traumjob. 💙
          </p>
          <div className="mt-6 flex items-center gap-4 justify-center md:justify-start">
            <img 
              src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
              alt="App Store" 
              className="h-10 w-auto" 
            />
            <img 
              src="https://developer.android.com/images/brand/de_generic_rgb_wo_45.png" 
              alt="Google Play" 
              className="h-10 w-auto" 
            />
          </div>
        </div>
        
        <div className="text-sm text-zinc-300">
          <div className="font-semibold text-white">Navigation</div>
          <ul className="mt-3 space-y-2">
            <li><Link to="/features" className="hover:text-white">Features</Link></li>
            <li><Link to="/produkt" className="hover:text-white">Produkt</Link></li>
            <li><Link to="/blog" className="hover:text-white">Newsroom</Link></li>
            <li><Link to="/kontakt" className="hover:text-white">Kontakt</Link></li>
          </ul>
        </div>
        
        <div className="text-sm text-zinc-300">
          <div className="font-semibold text-white">Unternehmen</div>
          <ul className="mt-3 space-y-2">
            <li><Link to="/unternehmen" className="hover:text-white">Unternehmen</Link></li>
            <li><Link to="/unternehmen/onboarding" className="hover:text-white">Registrierung</Link></li>
            <li><Link to="/ueber-uns" className="hover:text-white">Über uns</Link></li>
          </ul>
        </div>
        
        <div className="text-sm text-zinc-300">
          <div className="font-semibold text-white">Rechtliches</div>
          <ul className="mt-3 space-y-2">
            <li><Link to="/impressum" className="hover:text-white">Impressum</Link></li>
            <li><Link to="/datenschutz" className="hover:text-white">Datenschutz</Link></li>
            <li><Link to="/agb" className="hover:text-white">AGB</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="px-4 pb-8 mx-auto max-w-7xl text-xs text-zinc-400 text-center">
        © 2025 bevisiblle. Alle Rechte vorbehalten.
      </div>
    </footer>
  );
}