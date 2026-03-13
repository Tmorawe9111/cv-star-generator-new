import { Link } from "react-router-dom";

export default function CompanySignupFooter() {
  return (
    <footer className="relative mt-16">
      <div className="border-t">
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-10">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <img src="/assets/Logo_visiblle_transparent.png" alt="BeVisiblle" className="h-8 w-8 object-contain" />
                <span className="font-semibold">
                  BeVisib<span className="text-primary">ll</span>e
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                BeVisible ist mehr als eine Jobplattform. Mit uns findest du Menschen, Chancen und Unternehmen, die zu dir passen. Vernetze dich, teile Erfahrungen und werde sichtbar für deinen Traumjob. 💙
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li><Link className="hover:underline" to="/about">Über uns</Link></li>
                <li><a className="hover:underline" href="#community">Community</a></li>
                <li><Link className="hover:underline" to="/company">Unternehmen</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Support</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li><a className="hover:underline" href="#hilfe">Hilfe</a></li>
                <li><a className="hover:underline" href="#feedback">Feedback</a></li>
                <li><a className="hover:underline" href="#kontakt">Kontakt</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Rechtliches</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li><Link className="hover:underline" to="/datenschutz">Datenschutz</Link></li>
                <li><Link className="hover:underline" to="/impressum">Impressum</Link></li>
                <li><Link className="hover:underline" to="/agb">AGB</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t pt-6 text-xs text-gray-500 md:flex-row md:items-center md:justify-between">
            <p>© 2025 BeVisiblle. Alle Rechte vorbehalten.</p>
            <div className="flex items-center gap-4">
              <Link className="hover:underline" to="/datenschutz">Datenschutz</Link>
              <Link className="hover:underline" to="/impressum">Impressum</Link>
              <Link className="hover:underline" to="/agb">AGB</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
