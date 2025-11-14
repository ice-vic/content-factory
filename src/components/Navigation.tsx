'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3Icon,
  PenToolIcon,
  ClipboardListIcon,
  HomeIcon,
  CogIcon,
  HistoryIcon,
  HeartIcon,
  ChevronDownIcon,
  FileTextIcon,
  TrendingUpIcon
} from 'lucide-react'

const navItems = [
  {
    href: '/',
    label: '仪表盘',
    icon: HomeIcon,
  },
  {
    label: '内容分析',
    icon: TrendingUpIcon,
    dropdown: true,
    children: [
      {
        href: '/analysis',
        label: '公众号分析',
        icon: FileTextIcon,
      },
      {
        href: '/xiaohongshu',
        label: '小红书分析',
        icon: HeartIcon,
      },
    ],
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

// 判断是否为内容分析的子页面
const isContentAnalysisActive = (pathname: string): boolean => {
  return pathname === '/analysis' || pathname === '/xiaohongshu'
}

export default function Navigation() {
  const pathname = usePathname()
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 清除定时器
  const clearDropdownTimeout = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
      dropdownTimeoutRef.current = null
    }
  }

  // 鼠标进入处理
  const handleMouseEnter = (label: string) => {
    if (!isMobile) {
      clearDropdownTimeout()
      setActiveDropdown(label)
    }
  }

  // 鼠标离开处理
  const handleMouseLeave = () => {
    if (!isMobile) {
      clearDropdownTimeout()
      dropdownTimeoutRef.current = setTimeout(() => {
        setActiveDropdown(null)
      }, 300)
    }
  }

  // 点击处理（移动端）
  const handleClick = (label: string) => {
    if (isMobile) {
      setActiveDropdown(activeDropdown === label ? null : label)
    }
  }

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

          {/* Desktop navigation */}
          <div className="hidden md:flex space-x-8" ref={dropdownRef}>
            {navItems.map((item) => {
              const Icon = item.icon
              let isActive = pathname === item.href

              // 处理内容分析分组的高亮状态
              if (item.label === '内容分析') {
                isActive = isContentAnalysisActive(pathname)
              }

              if (item.dropdown) {
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(item.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      onClick={() => handleClick(item.label)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform duration-200 ${
                          activeDropdown === item.label ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Dropdown menu */}
                    {activeDropdown === item.label && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                        <div className="py-2">
                          {item.children?.map((child) => {
                            const ChildIcon = child.icon
                            const isChildActive = pathname === child.href

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors border-l-4 ${
                                  isChildActive
                                    ? 'bg-primary-50 text-primary-600 border-primary-600'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                                }`}
                              >
                                <ChildIcon className="w-4 h-4" />
                                <span className="font-medium">{child.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

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
        <div className="flex flex-col">
          {navItems.map((item) => {
            const Icon = item.icon
            let isActive = pathname === item.href

            // 处理内容分析分组的高亮状态
            if (item.label === '内容分析') {
              isActive = isContentAnalysisActive(pathname)
            }

            if (item.dropdown) {
              return (
                <div key={item.label} className="border-b border-gray-100">
                  <button
                    onClick={() => handleClick(item.label)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium ${
                      isActive
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDownIcon
                      className={`w-4 h-4 transition-transform duration-200 ${
                        activeDropdown === item.label ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Mobile dropdown */}
                  {activeDropdown === item.label && (
                    <div className="bg-gray-50">
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon
                        const isChildActive = pathname === child.href

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`flex items-center space-x-3 px-8 py-3 text-sm border-b border-gray-100 ${
                              isChildActive
                                ? 'text-primary-600 bg-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <ChildIcon className="w-4 h-4" />
                            <span>{child.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b border-gray-100 ${
                  isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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