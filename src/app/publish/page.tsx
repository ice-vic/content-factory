'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'
import {
  ClipboardListIcon,
  SearchIcon,
  FilterIcon,
  Edit3Icon,
  EyeIcon,
  SendIcon,
  BarChart3Icon,
  Trash2Icon,
  RefreshCwIcon,
  DownloadIcon,
  PlusIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  AlertCircleIcon,
  ChevronDownIcon
} from 'lucide-react'

export default function PublishPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [selectedArticles, setSelectedArticles] = useState<string[]>([])
  const [showBatchActions, setShowBatchActions] = useState(false)

  // 模拟文章数据
  const mockArticles = [
    {
      id: '1',
      title: '2024年AI创业必备的5个工具推荐',
      createdAt: '2024-11-06 14:30',
      status: 'draft',
      targetPlatforms: ['wechat'],
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=100&fit=crop'
    },
    {
      id: '2',
      title: '内容营销的黄金法则：如何提高用户参与度',
      createdAt: '2024-11-06 13:15',
      status: 'pending',
      targetPlatforms: ['xiaohongshu', 'wechat'],
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=100&fit=crop'
    },
    {
      id: '3',
      title: '小企业数字化转型实战指南',
      createdAt: '2024-11-06 12:00',
      status: 'published',
      targetPlatforms: ['wechat'],
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=100&fit=crop',
      publishRecords: [
        { platform: 'wechat', status: 'success', publishedAt: '2024-11-06 12:30' }
      ]
    },
    {
      id: '4',
      title: '创业者必备的数据分析技能',
      createdAt: '2024-11-06 11:45',
      status: 'withdrawn',
      targetPlatforms: ['xiaohongshu'],
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=100&fit=crop',
      publishRecords: [
        { platform: 'xiaohongshu', status: 'success', publishedAt: '2024-11-06 12:00', withdrawnAt: '2024-11-06 13:00' }
      ]
    },
    {
      id: '5',
      title: '如何用ChatGPT提升工作效率',
      createdAt: '2024-11-05 16:20',
      status: 'draft',
      targetPlatforms: ['wechat', 'xiaohongshu'],
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=100&fit=crop'
    }
  ]

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'draft', label: '草稿' },
    { value: 'pending', label: '待发布' },
    { value: 'published', label: '已发布' },
    { value: 'withdrawn', label: '已撤回' }
  ]

  const platformOptions = [
    { value: 'all', label: '全部平台' },
    { value: 'wechat', label: '公众号' },
    { value: 'xiaohongshu', label: '小红书' },
    { value: 'multi', label: '多平台' }
  ]

  const getStatusConfig = (status: string) => {
    const configs = {
      draft: { color: 'bg-gray-100 text-gray-700', icon: ClockIcon, label: '草稿' },
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: ClockIcon, label: '待发布' },
      published: { color: 'bg-green-100 text-green-700', icon: CheckIcon, label: '已发布' },
      withdrawn: { color: 'bg-red-100 text-red-700', icon: XIcon, label: '已撤回' }
    }
    return configs[status as keyof typeof configs] || configs.draft
  }

  const getPlatformIcon = (platform: string) => {
    const icons = {
      wechat: '🟢',
      xiaohongshu: '🔴'
    }
    return icons[platform as keyof typeof icons] || '📱'
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedArticles(mockArticles.map(article => article.id))
    } else {
      setSelectedArticles([])
    }
  }

  const handleSelectArticle = (articleId: string, checked: boolean) => {
    if (checked) {
      setSelectedArticles(prev => [...prev, articleId])
    } else {
      setSelectedArticles(prev => prev.filter(id => id !== articleId))
    }
  }

  const handlePublish = (articleId: string, platform: string) => {
    alert(`准备发布文章 ${articleId} 到 ${platform}`)
  }

  const handleBatchPublish = () => {
    alert(`批量发布 ${selectedArticles.length} 篇文章`)
  }

  const handleViewStats = (articleId: string) => {
    alert(`查看文章 ${articleId} 的发布统计`)
  }

  // 过滤文章
  const filteredArticles = mockArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter
    const matchesPlatform = platformFilter === 'all' ||
      (platformFilter === 'multi' && article.targetPlatforms.length > 1) ||
      (platformFilter !== 'multi' && article.targetPlatforms.includes(platformFilter))

    return matchesSearch && matchesStatus && matchesPlatform
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">发布管理</h1>
            <p className="text-gray-600">管理所有AI生成的文章，支持多平台发布</p>
          </div>
          <div className="flex space-x-2">
            <button className="btn btn-secondary flex items-center space-x-2">
              <PlusIcon className="w-4 h-4" />
              <span>新建文章</span>
            </button>
            <button className="btn btn-secondary flex items-center space-x-2">
              <DownloadIcon className="w-4 h-4" />
              <span>导出</span>
            </button>
            <button className="btn btn-secondary flex items-center space-x-2">
              <RefreshCwIcon className="w-4 h-4" />
              <span>刷新</span>
            </button>
          </div>
        </div>

        {/* 筛选和搜索 */}
        <div className="card p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input w-full appearance-none pr-8"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">平台</label>
              <div className="relative">
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="input w-full appearance-none pr-8"
                >
                  {platformOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">搜索</label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="关键词搜索..."
                  className="input pl-10 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 批量操作 */}
        {selectedArticles.length > 0 && (
          <div className="card p-4 mb-6 bg-primary-50 border-primary-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-primary-700">
                  已选择 {selectedArticles.length} 篇文章
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleBatchPublish}
                  className="btn btn-primary btn-sm"
                >
                  批量发布
                </button>
                <button
                  onClick={() => setSelectedArticles([])}
                  className="btn btn-secondary btn-sm"
                >
                  取消选择
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 文章列表 */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedArticles.length === filteredArticles.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="text-primary-600"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    目标平台
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredArticles.map((article) => {
                  const statusConfig = getStatusConfig(article.status)
                  const StatusIcon = statusConfig.icon

                  return (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedArticles.includes(article.id)}
                          onChange={(e) => handleSelectArticle(article.id, e.target.checked)}
                          className="text-primary-600"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={article.thumbnail}
                            alt=""
                            className="w-12 h-8 object-cover rounded"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {article.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {article.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {article.createdAt}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-1">
                          {article.targetPlatforms.map((platform, index) => (
                            <span
                              key={index}
                              className="text-lg"
                              title={platform === 'wechat' ? '公众号' : '小红书'}
                            >
                              {getPlatformIcon(platform)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => alert(`编辑文章 ${article.id}`)}
                            className="text-gray-400 hover:text-gray-600"
                            title="编辑"
                          >
                            <Edit3Icon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => alert(`查看文章 ${article.id}`)}
                            className="text-gray-400 hover:text-gray-600"
                            title="查看"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {article.targetPlatforms.includes('wechat') && article.status !== 'published' && (
                            <button
                              onClick={() => handlePublish(article.id, 'wechat')}
                              className="text-green-500 hover:text-green-600"
                              title="发布到公众号"
                            >
                              <SendIcon className="w-4 h-4" />
                            </button>
                          )}
                          {article.targetPlatforms.includes('xiaohongshu') && article.status !== 'published' && (
                            <button
                              onClick={() => handlePublish(article.id, 'xiaohongshu')}
                              className="text-red-500 hover:text-red-600"
                              title="发布到小红书"
                            >
                              <SendIcon className="w-4 h-4" />
                            </button>
                          )}
                          {article.status === 'published' && (
                            <button
                              onClick={() => handleViewStats(article.id)}
                              className="text-blue-500 hover:text-blue-600"
                              title="查看统计"
                            >
                              <BarChart3Icon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => alert(`删除文章 ${article.id}`)}
                            className="text-red-400 hover:text-red-600"
                            title="删除"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              显示 1-{filteredArticles.length} 条，共 {filteredArticles.length} 条
            </div>
            <div className="flex space-x-2">
              <button className="btn btn-secondary btn-sm">上一页</button>
              <button className="btn btn-primary btn-sm">1</button>
              <button className="btn btn-secondary btn-sm">2</button>
              <button className="btn btn-secondary btn-sm">3</button>
              <button className="btn btn-secondary btn-sm">下一页</button>
            </div>
          </div>
        </div>

        {/* 快速操作浮动按钮 */}
        <div className="fixed bottom-8 right-8">
          <div className="flex flex-col space-y-2">
            <button className="btn btn-primary rounded-full shadow-lg flex items-center space-x-2 px-6">
              <PlusIcon className="w-5 h-5" />
              <span>快速创作</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}