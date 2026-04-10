"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import theme from "@/utils/theme";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Menu Listing",
    href: "/dashboard/menu",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: "Menu Items",
    href: "/dashboard/menu-items",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
  {
    label: "Stock Management",
    href: "/dashboard/stock",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/dashboard/orders",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    label: "Customer Details",
    href: "/dashboard/customers",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: theme.contentBg }}>

      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col flex-shrink-0 overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${theme.sidebarBgFrom} 0%, ${theme.sidebarBgTo} 100%)`,
          width: sidebarOpen ? "16rem" : "4rem",
          transition: "width 0.25s ease",
        }}
      >
        {/* Logo area */}
        <div
          className="flex items-center gap-3 px-3 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", minHeight: "4rem" }}
        >
          {/* Logo icon — always visible */}
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}
          >
            <span className="text-white font-extrabold text-lg">N</span>
          </div>
          {/* Text — hidden when collapsed */}
          {sidebarOpen && (
            <div className="overflow-hidden whitespace-nowrap">
              <p className="text-white font-bold text-sm leading-none">Nala&apos;s</p>
              <p className="text-xs mt-0.5" style={{ color: theme.primarySoft }}>Admin Panel</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : undefined}
                className="flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  background: isActive ? `${theme.primary}30` : "transparent",
                  color: isActive ? theme.primarySoft : "rgba(255,255,255,0.6)",
                  borderLeft: isActive ? `3px solid ${theme.primary}` : "3px solid transparent",
                  padding: sidebarOpen ? "0.625rem 0.75rem" : "0.625rem 0",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                }}
              >
                <span style={{ color: isActive ? theme.primary : "rgba(255,255,255,0.4)", flexShrink: 0 }}>
                  {item.icon}
                </span>
                {sidebarOpen && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Logout" : undefined}
            className="flex items-center gap-3 w-full rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              color: "rgba(255,255,255,0.5)",
              padding: sidebarOpen ? "0.625rem 0.75rem" : "0.625rem 0",
              justifyContent: sidebarOpen ? "flex-start" : "center",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.15)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fca5a5";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)";
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && "Logout"}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Header */}
        <header
          className="flex items-center justify-between px-4 h-16 flex-shrink-0"
          style={{ background: theme.headerBg, borderBottom: `1px solid ${theme.borderColor}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-3">
            {/* ── Hamburger toggle ── */}
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="flex flex-col justify-center items-center w-9 h-9 rounded-lg flex-shrink-0 transition-colors duration-150"
              style={{ border: `1px solid ${theme.borderColor}` }}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f5ede8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <span className="block w-4 h-0.5 mb-1 rounded" style={{ background: theme.pageTitleColor }} />
              <span className="block w-4 h-0.5 mb-1 rounded" style={{ background: theme.pageTitleColor }} />
              <span className="block w-4 h-0.5 rounded" style={{ background: theme.pageTitleColor }} />
            </button>

            <div>
              <h1 className="text-lg font-bold" style={{ color: theme.pageTitleColor }}>Admin Panel</h1>
              <p className="text-xs" style={{ color: theme.subtitleColor }}>
                {navItems.find((n) =>
                  n.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === n.href || pathname.startsWith(n.href + "/")
                )?.label ?? "Dashboard"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "#fdf0e8", border: `1px solid ${theme.borderColor}` }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: theme.primary }}>
                A
              </div>
              <span className="text-sm font-medium" style={{ color: theme.pageTitleColor }}>Admin</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
