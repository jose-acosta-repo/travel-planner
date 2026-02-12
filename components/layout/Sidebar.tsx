'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Plane,
  Share2,
  Archive,
  Calendar,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'My Trips', href: '/trips', icon: Plane },
  { name: 'Shared with Me', href: '/shared', icon: Share2 },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={cn(
      "hidden md:flex h-full flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 relative",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 py-6 border-b border-gray-200 dark:border-gray-800",
        isCollapsed ? "px-4 justify-center" : "px-6"
      )}>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 flex-shrink-0">
          <Plane className="h-6 w-6 text-white" />
        </div>
        {!isCollapsed && (
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Travel Planner</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Collaborative AI</p>
          </div>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                'group flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors',
                isCollapsed ? 'justify-center px-3' : 'gap-3 px-3',
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300'
                )}
              />
              {!isCollapsed && item.name}
            </Link>
          )
        })}
      </nav>

      {/* PRO Plan Section */}
      {!isCollapsed && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-4 text-white">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-90">PRO PLAN</p>
              <p className="mt-1 text-sm">Unlock AI itineraries and unlimited collaborations</p>
            </div>
            <Button
              className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold"
              size="sm"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade Now
            </Button>
          </div>
        </div>
      )}
      {isCollapsed && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-3">
          <Button
            title="Upgrade to PRO"
            className="w-full h-10 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            size="icon"
          >
            <Sparkles className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
