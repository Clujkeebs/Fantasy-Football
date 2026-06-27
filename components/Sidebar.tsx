'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Trophy,
  LayoutDashboard,
  ClipboardList,
  ArrowLeftRight,
  Search,
  Users,
  Calendar,
  Menu,
  X,
} from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/draft', label: 'Draft Board', icon: ClipboardList },
  { href: '/trades', label: 'Trade Analyzer', icon: ArrowLeftRight },
  { href: '/waiver', label: 'Waiver Wire', icon: Search },
  { href: '/lineup', label: 'Lineup Optimizer', icon: Users },
  { href: '/playoffs', label: 'Playoff Tracker', icon: Calendar },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const nav = (
    <nav className="flex flex-col gap-1 p-4">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-green-600 text-white'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 text-slate-300 md:hidden"
        onClick={() => setOpen(o => !o)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed md:relative z-40 md:z-auto h-full w-60 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform md:translate-x-0 md:flex shrink-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
            <Trophy size={20} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">Samuel&apos;s FF</div>
            <div className="text-xs text-amber-400 font-semibold">WIN $400 💰</div>
          </div>
        </div>

        {nav}

        {/* Bottom promo */}
        <div className="mt-auto p-4 border-t border-slate-800">
          <div className="bg-gradient-to-br from-green-900/40 to-amber-900/40 border border-green-800/40 rounded-lg p-3 text-center">
            <div className="text-amber-400 font-bold text-lg">$400</div>
            <div className="text-slate-400 text-xs">Prize on the line</div>
            <div className="text-green-400 text-xs mt-1 font-medium">Let&apos;s get it</div>
          </div>
        </div>
      </aside>
    </>
  )
}
