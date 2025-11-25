"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface AppNavbarProps {
  BrandComponent?: React.ComponentType;
  SearchComponent?: React.ComponentType;
  RightComponent?: React.ComponentType;
  className?: string;
}

const defaultLogoPath = "/logo.svg";

function DefaultBrand() {
  return (
    <div className="flex items-center gap-2">
      <img src={defaultLogoPath} alt="Logo" className="h-6 w-6" />
      <span className="font-medium text-gray-900">Ausbildungsbasis</span>
    </div>
  );
}

function DefaultSearch() {
  return (
    <input
      placeholder="Suche in freigeschalteten Kandidaten, Unternehmen, Beiträgen, Jobs…"
      className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
    />
  );
}

function DefaultRight() {
  return <div className="h-9" />;
}

export default function AppNavbar({
  BrandComponent,
  SearchComponent,
  RightComponent,
  className,
}: AppNavbarProps) {
  const Brand = BrandComponent ?? DefaultBrand;
  const Search = SearchComponent ?? DefaultSearch;
  const Right = RightComponent ?? DefaultRight;

  return (
    <header className={cn("sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur", className)}>
      <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center px-4">
        <div className="flex min-w-[220px] items-center justify-start gap-3">
          <Brand />
        </div>
        <div className="flex flex-1 justify-center px-4">
          <div className="w-full max-w-xl">
            <Search />
          </div>
        </div>
        <div className="flex min-w-[220px] items-center justify-end gap-3">
          <Right />
        </div>
      </div>
    </header>
  );
}
