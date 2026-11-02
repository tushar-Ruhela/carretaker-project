import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareConnect — India's Most Trusted Elderly Care Platform",
  description: "Verified caretakers, real-time health monitoring, and emergency response for your elderly parents. Designed for NRI families across India.",
  keywords: "elderly care India, NRI caregiver, home nursing India, caretaker booking, dementia care India",
  openGraph: {
    title: "CareConnect — Elderly Care You Can Trust",
    description: "Aadhaar-verified caregivers for your parents. Book, monitor, and pay — all from one dashboard.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
