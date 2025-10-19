"use client"

import Image from "next/image"

interface FooterProps {
  onLogoClick?: () => void
}

export default function Footer({ onLogoClick }: FooterProps) {
  return (
    <footer className="py-8 border-t border-border text-center mt-auto">
      <p className="text-muted-foreground text-sm mb-3">Powered by</p>

      <Image
        src="/logo.svg"
        alt="Powered Logo"
        width={160}
        height={40}
        className="mx-auto w-40 h-auto opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
        onClick={onLogoClick}
        priority={false}
      />

      <p className="text-muted-foreground text-xs mt-3 leading-relaxed">
        © 2025 Hydra. All rights reserved.
        <br />
        Hydra uses the <span className="font-semibold text-primary">vidsrc.to</span> API for streaming and{" "}
        <span className="font-semibold text-primary">imdbapi.dev</span> for fetching info from the IMDb database — we do
        not host or upload any videos.
      </p>
    </footer>
  )
}
