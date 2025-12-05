import React from "react";
import { cn } from "@/lib/utils";

interface BaseLayoutProps {
  children: React.ReactNode;
  className?: string;
  showFooter?: boolean;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({ children, className, showFooter = false }) => {
  return (
    <>
      <div className={cn(
        // Global guards
        "min-h-screen w-full overflow-x-hidden bg-background",
        className
      )}>
        <div
          className={cn(
            // Max readable width + horizontal padding (mobile only)
            "mx-auto max-w-[1200px] px-3 sm:px-4 md:px-0",
            // Typography defaults
            "tracking-tight leading-relaxed text-[15px] md:text-base",
            // Prevent layout breaks
            "max-w-full break-words hyphens-auto",
            // Ensure children can shrink
            "min-w-0"
          )}
        >
          {children}
        </div>
      </div>
      {/* Simple text-only footer for portal */}
      {showFooter && (
        <footer className="border-t border-gray-200 bg-white py-6">
          <div className="mx-auto max-w-[1200px] px-4 text-center text-sm text-gray-500">
            © 2025 bevisiblle. Alle Rechte vorbehalten.
          </div>
        </footer>
      )}
    </>
  );
};

export default BaseLayout;
