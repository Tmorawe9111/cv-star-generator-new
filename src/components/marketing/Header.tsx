import React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface HeaderProps {
  variant: "talent" | "business";
}

export default function Header({ variant }: HeaderProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const RightCtas = () => (
    <div className="hidden sm:flex items-center gap-2">
      <Link to="/auth" className="text-sm text-white hover:text-white/80">Login</Link>
      {variant === "talent" ? (
        <>
          <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/cv-generator">Profil erstellen – kostenlos</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="bg-white text-black border-white hover:bg-white/90">
            <Link to="/unternehmen">Für Unternehmen</Link>
          </Button>
        </>
      ) : (
        <>
          <Button asChild size="sm" className="bg-[color:var(--brand)] text-black hover:opacity-90">
            <Link to="/unternehmen/onboarding">Unternehmen-Account erstellen</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="bg-white text-black border-white hover:bg-white/90">
            <Link to="/produkt#demo">Demo ansehen</Link>
          </Button>
        </>
      )}
    </div>
  );

  return (
    <header className={cn("sticky top-0 z-30 w-full bg-black text-white")}
      aria-label="Hauptnavigation"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/Logo_visiblle_transparent.png" alt="BeVisiblle" className="h-8 w-8 object-contain" />
            <span className="font-semibold hidden sm:inline">
              BeVisib<span className="text-primary">ll</span>e
            </span>
          </Link>
          {/* Navigation removed per request: keep only logo + CTAs + login */}
        </div>

        <RightCtas />

        {/* Mobile-only: show only Login on the right */}
        <div className="sm:hidden">
          <Link to="/auth" className="text-sm text-white hover:text-white/80">Login</Link>
        </div>

      </div>
    </header>
  );
}