"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, ShieldCheck, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Command Center" },
  { href: "/consignments/LOT-IND-2026-001", label: "Proof Inspector" },
  { href: "/verify/LOT-IND-2026-001", label: "QR Passport" },
  { href: "/simulator", label: "Tamper & Sync Lab" },
  { href: "/research", label: "Engineering & BOM" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#D8E0D5] bg-[#FFFFFF]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#0D4F36] text-white transition-transform duration-150 group-hover:scale-[1.03]">
            <ShieldCheck className="w-5 h-5" strokeWidth={2} />
          </span>
          <div className="leading-tight">
            <div className="font-bold text-base tracking-tight text-[#0E1B14]">
              Sakshi
            </div>
            <div className="text-[11px] font-medium text-[#586E61]">
              Cryptographic Cold-Chain Witness
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href.split("/").slice(0, 2).join("/")));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#ECEFE9] text-[#0D4F36] font-semibold"
                    : "text-[#3B4F43] hover:text-[#0E1B14] hover:bg-[#F6F7F4]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          <Link
            href="/simulator"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D4F36] text-white text-sm font-semibold hover:bg-[#093B28] active:scale-[0.98] transition-all"
          >
            Launch Live Lab
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg border border-[#D8E0D5] text-[#0E1B14]"
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[#D8E0D5] bg-[#FFFFFF] px-4 py-3 space-y-1">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#0E1B14] hover:bg-[#ECEFE9]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
