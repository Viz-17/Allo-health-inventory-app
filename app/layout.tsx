import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = { title: "Allo — Inventory", description: "Multi-warehouse inventory reservation" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header style={{ borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"0 2rem", height:"56px",
          display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0,
          zIndex:100, background:"rgba(10,10,11,0.92)", backdropFilter:"blur(12px)" }}>
          <Link href="/" style={{ fontWeight:600, fontSize:"1.1rem", letterSpacing:"-0.02em",
            color:"#e8e6df", textDecoration:"none", display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ width:22, height:22, borderRadius:"6px",
              background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"inline-block" }} />
            Allo Inventory Reservation Platform
          </Link>
          <span style={{ fontSize:"0.75rem", color:"rgba(232,230,223,0.4)", fontFamily:"DM Mono,monospace", letterSpacing:"0.05em" }}>
            inventory platform
          </span>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
