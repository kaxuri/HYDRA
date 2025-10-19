"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "../components/ui/button"
import AnimatedLogo from "./logo"
export default function StickyRoundedNavbar({
  items = [],
  logo,
  cta,
  onLogoClick,
}: {
  items?: { href: string; label: string }[]
  logo?: React.ReactNode
  cta?: { label: string; href: string }
  onLogoClick?: () => void
}) {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onLogoClick) {
      onLogoClick() 
    } else {
      window.location.href = "/" 
    }
  }

  return (
    <div className="sticky top-4 z-50 w-full">
      <div className="max-w-6xl mx-auto px-4">
        <nav
          className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-md supports-[backdrop-filter]:bg-card/40 shadow-lg transition-all duration-300"
          role="navigation"
          aria-label="Main"
        >
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
      
            <Link
              href="/"
              onClick={handleLogoClick}
              className="flex items-center gap-2 select-none group"
            >
              <div className="inline-flex items-center justify-center w-32 h-14 rounded-lg overflow-hidden">
    <AnimatedLogo
      width={128}                 
      className="w-32 h-auto transition-transform duration-300 group-hover:scale-105"
      replayOnHover               
      pxPerMs={0.55}             
      strokeWidth={2}
    />
              </div>
            </Link>

            <ul className="hidden md:flex items-center gap-1">
              {items.map((item) => {
                const active = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={
                        "inline-flex items-center rounded-xl px-3 py-2 text-sm transition-colors " +
                        (active
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50")
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center gap-2">
              {cta ? (
                <Button asChild size="sm" className="hidden md:inline-flex">
                  <Link href={cta.href}>{cta.label}</Link>
                </Button>
              ) : null}

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Toggle menu"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>


          <div
            className={
              "md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out px-2 " +
              (open ? "max-h-96 opacity-100" : "max-h-0 opacity-0")
            }
          >
            <ul className="grid gap-1 pb-3">
              {items.map((item) => {
                const active = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={
                        "block rounded-xl px-3 py-2 text-sm " +
                        (active
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50")
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
              {cta ? (
                <li className="pt-1">
                  <Button asChild className="w-full">
                    <Link href={cta.href}>{cta.label}</Link>
                  </Button>
                </li>
              ) : null}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  )
}
