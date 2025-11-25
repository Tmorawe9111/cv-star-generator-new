const legalLinks = [
  { label: "Nutzungsbestimmung", href: "https://www.bevisiblle.de/nutzungsbedingungen" },
  { label: "Datenschutzvereinbarung", href: "https://www.bevisiblle.de/datenschutz" },
  { label: "AGBs", href: "https://www.bevisiblle.de/agb" },
  { label: "Impressum", href: "https://www.bevisiblle.de/impressum" },
];

export function CompanyPortalFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white/95">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-8 py-4 text-sm text-muted-foreground">
        <p className="text-center text-xs text-muted-foreground">
          Mit der Nutzung dieser Website erklären Sie sich mit den
          <a
            href="https://www.bevisiblle.de/nutzungsbedingungen"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-1 text-primary hover:underline"
          >
            BeVisiblle Nutzungsbedingungen
          </a>
          einverstanden. Die Nutzung der Website zu gewerblichen Zwecken ohne ausdrückliche Zustimmung ist untersagt.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>© {year} BeVisiblle</span>
          <span className="text-slate-300">•</span>
          {legalLinks.map((link, index) => (
            <span key={link.href} className="flex items-center gap-3">
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-slate-900"
              >
                {link.label}
              </a>
              {index !== legalLinks.length - 1 && <span className="text-slate-300">•</span>}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default CompanyPortalFooter;
