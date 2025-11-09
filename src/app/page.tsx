'use client'

import Navigation from '@/components/Navigation'
import Link from 'next/link'
import {
  BarChart3Icon,
  PenToolIcon,
  ClipboardListIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  ZapIcon,
  SettingsIcon,
  FileTextIcon,
  UsersIcon,
  ClockIcon,
  EyeIcon,
  ArrowUpIcon,
  ActivityIcon
} from 'lucide-react'

export default function Dashboard() {
  // 快速入口功能
  const quickActions = [
    {
      icon: BarChart3Icon,
      title: '选题分析',
      description: '分析热门话题和趋势',
      href: '/analysis',
      color: 'bg-blue-500'
    },
    {
      icon: PenToolIcon,
      title: '内容创作',
      description: 'AI辅助内容生成',
      href: '/create',
      color: 'bg-green-500'
    },
    {
      icon: ClipboardListIcon,
      title: '发布管理',
      description: '多平台内容发布',
      href: '/publish',
      color: 'bg-purple-500'
    },
    {
      icon: SettingsIcon,
      title: 'API设置',
      description: '配置AI模型和接口',
      href: '/settings',
      color: 'bg-orange-500'
    }
  ]

  // 数据统计卡片
  const statsCards = [
    {
      title: '今日分析',
      value: '23',
      change: '+12%',
      icon: BarChart3Icon,
      trend: 'up',
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: '内容创作',
      value: '156',
      change: '+8%',
      icon: FileTextIcon,
      trend: 'up',
      color: 'text-green-600 bg-green-50'
    },
    {
      title: '发布文章',
      value: '89',
      change: '+15%',
      icon: ClipboardListIcon,
      trend: 'up',
      color: 'text-purple-600 bg-purple-50'
    },
    {
      title: '总浏览量',
      value: '12.5K',
      change: '+23%',
      icon: EyeIcon,
      trend: 'up',
      color: 'text-orange-600 bg-orange-50'
    }
  ]

  // 最近活动
  const recentActivities = [
    {
      id: 1,
      type: 'analysis',
      title: '分析了关键词"人工智能"',
      time: '10分钟前',
      status: 'completed'
    },
    {
      id: 2,
      type: 'creation',
      title: '创作了文章《AI技术发展趋势》',
      time: '25分钟前',
      status: 'completed'
    },
    {
      id: 3,
      type: 'publish',
      title: '发布了文章到公众号',
      time: '1小时前',
      status: 'completed'
    },
    {
      id: 4,
      type: 'analysis',
      title: '开始分析"元宇宙"相关话题',
      time: '2小时前',
      status: 'processing'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* 仪表盘头部 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">内容工厂仪表盘</h1>
            <p className="text-gray-600 mt-1">欢迎使用AI驱动的内容创作平台</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/analysis"
              className="btn btn-primary flex items-center space-x-2"
            >
              <ZapIcon className="w-4 h-4" />
              <span>快速开始</span>
            </Link>
          </div>
        </div>

        {/* 数据统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon
            const TrendIcon = stat.trend === 'up' ? ArrowUpIcon : ActivityIcon

            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className={`flex items-center text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    <TrendIcon className="w-4 h-4 mr-1" />
                    {stat.change}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-1">{stat.title}</div>
              </div>
            )
          })}
        </div>

        {/* 快速入口和最近活动 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 快速入口 */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">快速入口</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Link
                    key={index}
                    href={action.href}
                    className="group bg-white rounded-lg shadow p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                  >
                    <div className={`inline-flex items-center justify-center w-12 h-12 ${action.color} rounded-lg mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {action.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {action.description}
                    </p>
                    <div className="flex items-center text-primary-600 font-medium text-sm">
                      <span>立即使用</span>
                      <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* 最近活动 */}
          <div className="lg:col-span-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">最近活动</h2>
              <Link href="/publish" className="text-primary-600 text-sm hover:text-primary-700">
                查看全部
              </Link>
            </div>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                {recentActivities.map((activity, index) => {
                  let ActivityIcon = FileTextIcon
                  let statusColor = 'text-green-600'

                  if (activity.type === 'analysis') {
                    ActivityIcon = BarChart3Icon
                  } else if (activity.type === 'creation') {
                    ActivityIcon = PenToolIcon
                  } else if (activity.type === 'publish') {
                    ActivityIcon = ClipboardListIcon
                  }

                  if (activity.status === 'processing') {
                    statusColor = 'text-yellow-600'
                  }

                  return (
                    <div key={activity.id} className="flex items-start space-x-3 mb-6 last:mb-0">
                      <div className={`p-2 rounded-lg ${statusColor} bg-opacity-10`}>
                        <ActivityIcon className={`w-4 h-4 ${statusColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <div className="flex items-center mt-1">
                          <ClockIcon className="w-3 h-3 text-gray-400 mr-1" />
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}