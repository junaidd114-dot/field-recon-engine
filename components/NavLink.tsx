"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavLinkProps {
  href: string
  children?: React.ReactNode
  className?: string
  activeClassName?: string
  end?: boolean
}

export function NavLink({ href, children, className = "", activeClassName = "", end = false }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = end ? pathname === href : pathname.startsWith(href)
  return (
    <Link href={href} className={`${className} ${isActive ? activeClassName : ""}`}>
      {children}
    </Link>
  )
}
