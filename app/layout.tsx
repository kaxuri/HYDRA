import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import StickyRoundedNavbar from "../components/Navbar"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "H Y D R A ",
  description: "Search and watch movies instantly",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
                <StickyRoundedNavbar
          logo={<span className="font-semibold tracking-tight">Hydra</span>}
          items={[
            { href: "/", label: "Home" },
            { href: "/about", label: "About" },
            { href: "https://donate.stripe.com/bJe7sN0o846xfP71GdgYU00", label: "Support" },
            { href: "/discover", label: "Discover" },
          ]}
          cta={{ label: "GitHub", href: "/pro" }}
        />
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
