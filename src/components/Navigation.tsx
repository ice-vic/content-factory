'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3Icon,
  PenToolIcon,
  ClipboardListIcon,
  HomeIcon,
  CogIcon,
  HistoryIcon,
  HeartIcon
} from 'lucide-react'

const navItems = [
  {
    href: '/',
    label: '仪表盘',
    icon: HomeIcon,
  },
  {
    href: '/analysis',
    label: '公众号分析',
    icon: BarChart3Icon,
  },
  {
    href: '/xiaohongshu',
    label: '小红书分析',
    icon: HeartIcon,
  },
  {
    href: '/create',
    label: '内容创作',
    icon: PenToolIcon,
  },
  {
    href: '/publish',
    label: '发布管理',
    icon: ClipboardListIcon,
  },
  {
    href: '/history',
    label: '历史记录',
    icon: HistoryIcon,
  },
  {
    href: '/settings',
    label: 'API设置',
    icon: CogIcon,
  },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <PenToolIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">内容工厂</span>
            </Link>
          </div>

          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center space-y-1 px-3 py-2 text-xs font-medium ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}