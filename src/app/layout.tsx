import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sakshi — Farm-to-Fork Cryptographic Cold-Chain Witness",
  description:
    "Low-cost offline-first IoT blockchain nodes with hardware ECDSA P-256 signing, ethylene & cold-chain telemetry, and GS1 EPCIS 2.0 traceability (SIH26232).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-type="software"
      className={`${inter.variable} ${jakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-[#F6F7F4] text-[#0E1B14]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#D8E0D5] bg-[#FFFFFF] py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-[#586E61]">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#0D4F36] text-white font-semibold text-xs">
                S
              </span>
              <span>
                <strong className="text-[#0E1B14] font-semibold">Sakshi 2.0</strong> · Team Upper Moons (ID 165001) · SIH26232 (MoFPI)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-xs font-medium">
              <span>GS1 EPCIS 2.0</span>
              <span>FDA FSMA 204</span>
              <span>ECDSA P-256 / SHA-256</span>
              <span>MeitY Vishvasya Ready</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
