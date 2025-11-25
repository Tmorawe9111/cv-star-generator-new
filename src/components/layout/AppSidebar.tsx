"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type NavItem = {
  icon?: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
};

export interface AppSidebarProps {
  topItems: NavItem[];
  communityItems: NavItem[];
  systemItems: NavItem[];
  TokenWidget?: React.ComponentType;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function AppSidebar({
  topItems,
  communityItems,
  systemItems,
  TokenWidget,
  collapsed = false,
  onToggle,
}: AppSidebarProps) {
  const Token = TokenWidget ?? (() => null);
  const ToggleIcon = collapsed ? ChevronRight : ChevronLeft;

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-gray-200 bg-[#f6f8fc] transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between px-2 py-3">
        <span className={cn("px-3 text-xs font-semibold uppercase tracking-wide text-gray-500", collapsed && "sr-only")}>Menü</span>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Sidebar ausklappen" : "Sidebar einklappen"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100"
          >
            <ToggleIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto px-2 pb-6">
        <SidebarSection title="Navigation" items={topItems} collapsed={collapsed} />
        <SidebarDivider collapsed={collapsed} />
        <SidebarSection title="Community" items={communityItems} collapsed={collapsed} />
        <SidebarDivider collapsed={collapsed} />
        <SidebarSection title="System" items={systemItems} collapsed={collapsed} />
      </nav>

      <div className={cn("mt-auto p-3", collapsed && "px-1")}>{!collapsed ? <Token /> : null}</div>
    </aside>
  );
}

function SidebarSection({ title, items, collapsed }: { title: string; items: NavItem[]; collapsed?: boolean }) {
  return (
    <div>
      <span
        className={cn(
          "px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500",
          collapsed && "sr-only"
        )}
      >
        {title}
      </span>
      <ul className="mt-2 space-y-1">
        {items.map(item => (
          <li key={item.label}>
            <a
              href={item.href}
              onClick={item.onClick}
              className={cn(
                "group relative flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition",
                item.active ? "bg-white text-gray-900 shadow-sm" : "hover:bg-white/80",
                collapsed ? "justify-center px-2" : "gap-3"
              )}
            >
              {item.active && (
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded bg-cyan-500",
                    collapsed && "left-[-2px]"
                  )}
                />
              )}
              {item.icon}
              <span className={cn(collapsed && "sr-only")}>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SidebarDivider({ collapsed }: { collapsed?: boolean }) {
  return <div className={cn("my-3 h-px bg-gray-200/80", collapsed && "mx-2")}></div>;
}
