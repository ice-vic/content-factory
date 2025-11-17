'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import ArticleDetailModal from '@/components/publish/ArticleDetailModal'
import ArticleEditModal from '@/components/publish/ArticleEditModal'
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
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedArticles, setSelectedArticles] = useState<string[]>([])
  const [showBatchActions, setShowBatchActions] = useState(false)

  // 弹窗状态管理
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)

  // 数据加载状态
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [exporting, setExporting] = useState(false)

  // 每页显示数量
  const pageSize = 10

  // ID类型转换工具函数
  const toArticleId = (id: string | number): string => String(id)
  const toApiId = (id: string | number): number => {
    const parsed = parseInt(String(id))
    return isNaN(parsed) ? 0 : parsed
  }

  // 加载文章列表
  const loadArticles = async (page: number = currentPage) => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString()
      })

      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (platformFilter !== 'all') params.append('platform', platformFilter)
      if (dateFilter !== 'all') params.append('dateFilter', dateFilter)

      console.log('🔄 加载文章列表:', {
        page,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter,
        platform: platformFilter,
        dateFilter: dateFilter
      })

      const response = await fetch(`/api/articles?${params}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setArticles(result.articles)
        setTotalPages(result.totalPages)
        setTotalCount(result.total)
        setCurrentPage(result.page)
        console.log('✅ 文章列表加载成功:', {
          count: result.articles.length,
          total: result.total,
          page: result.page
        })
      } else {
        throw new Error(result.error || '加载文章列表失败')
      }

    } catch (error) {
      console.error('💥 加载文章列表失败:', error)
      setError(error instanceof Error ? error.message : '加载文章列表失败')
      setArticles([])
      setTotalPages(1)
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  // 组件加载时获取文章列表
  useEffect(() => {
    loadArticles(1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 当筛选条件改变时重新加载
  useEffect(() => {
    if (currentPage === 1) {
      loadArticles(1)
    } else {
      setCurrentPage(1) // 重置到第一页
    }
  }, [searchTerm, statusFilter, platformFilter, dateFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  // 当页码改变时加载
  useEffect(() => {
    if (currentPage > 1) {
      loadArticles(currentPage)
    }
  }, [currentPage]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const dateOptions = [
    { value: 'all', label: '全部时间' },
    { value: 'today', label: '今天' },
    { value: 'yesterday', label: '昨天' },
    { value: 'week', label: '最近7天' },
    { value: 'month', label: '最近30天' },
    { value: 'quarter', label: '最近3个月' }
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
      setSelectedArticles(articles.map(article => article.id))
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

  const handleBatchDelete = async () => {
    if (!confirm(`确定要删除选中的 ${selectedArticles.length} 篇文章吗？此操作不可恢复。`)) {
      return
    }

    try {
      console.log('🗑️ 批量删除文章:', selectedArticles)

      const deletePromises = selectedArticles.map(articleId =>
        fetch(`/api/articles/${articleId}`, { method: 'DELETE' })
      )

      const results = await Promise.all(deletePromises)
      const failedDeletes = results.filter(response => !response.ok)

      if (failedDeletes.length === 0) {
        console.log('✅ 批量删除成功')
        setSelectedArticles([])
        await loadArticles(currentPage)
      } else {
        throw new Error(`${failedDeletes.length} 篇文章删除失败`)
      }

    } catch (error) {
      console.error('💥 批量删除失败:', error)
      alert(error instanceof Error ? error.message : '批量删除失败')
    }
  }

  const handleBatchStatusChange = async (newStatus: string) => {
    try {
      console.log('🔄 批量更新状态:', selectedArticles, newStatus)

      const updatePromises = selectedArticles.map(articleId =>
        fetch(`/api/articles/${articleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })
      )

      const results = await Promise.all(updatePromises)
      const failedUpdates = results.filter(response => !response.ok)

      if (failedUpdates.length === 0) {
        console.log('✅ 批量状态更新成功')
        setSelectedArticles([])
        await loadArticles(currentPage)
      } else {
        throw new Error(`${failedUpdates.length} 篇文章状态更新失败`)
      }

    } catch (error) {
      console.error('💥 批量状态更新失败:', error)
      alert(error instanceof Error ? error.message : '批量状态更新失败')
    }
  }

  const handleViewStats = (articleId: string) => {
    alert(`查看文章 ${articleId} 的发布统计`)
  }

  const handleViewArticle = (articleId: string) => {
    setSelectedArticleId(articleId)
    setShowDetailModal(true)
  }

  const handleEditArticle = (articleId: string) => {
    setSelectedArticleId(articleId)
    setShowEditModal(true)
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedArticleId(null)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedArticleId(null)
  }

  const handleArticleSaved = (updatedArticle: any) => {
    console.log('✅ 文章已更新:', updatedArticle)

    // 确保ID类型一致
    const articleId = toArticleId(updatedArticle.id)

    // 选择性更新字段，避免覆盖不相关数据
    const updateFields = {
      title: updatedArticle.title,
      content: updatedArticle.content,
      htmlContent: updatedArticle.htmlContent,
      customInstructions: updatedArticle.customInstructions,
      status: updatedArticle.status,
      updatedAt: updatedArticle.updatedAt || new Date().toISOString()
    }

    // 更新文章列表中的对应文章
    setArticles(prev => prev.map(article => {
      if (toArticleId(article.id) === articleId) {
        // 只更新编辑相关字段，保留其他元数据
        return {
          ...article,
          ...updateFields
        }
      }
      return article
    }))

    console.log('🔄 文章列表已更新，ID:', articleId)
  }

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
      return
    }

    try {
      console.log('🗑️ 删除文章:', articleId)

      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log('✅ 文章删除成功:', articleId)
        // 重新加载文章列表
        await loadArticles(currentPage)
      } else {
        throw new Error(result.error || '删除文章失败')
      }

    } catch (error) {
      console.error('💥 删除文章失败:', error)
      alert(error instanceof Error ? error.message : '删除文章失败')
    }
  }

  const handleRefresh = () => {
    loadArticles(currentPage)
  }

  const handleCreateNew = () => {
    window.location.href = '/create'
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      // 获取所有要导出的文章（考虑筛选条件）
      const params = new URLSearchParams({
        limit: '1000' // 导出时获取更多数据
      })

      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (platformFilter !== 'all') params.append('platform', platformFilter)

      const response = await fetch(`/api/articles?${params}`)
      const result = await response.json()

      if (response.ok && result.success) {
        const articlesToExport = result.articles

        // 创建 CSV 内容
        const headers = ['标题', '状态', '目标平台', '创建时间', '更新时间', '内容摘要']
        const csvContent = [
          headers.join(','),
          ...articlesToExport.map((article: any) => [
            `"${article.title.replace(/"/g, '""')}"`,
            article.status,
            article.targetPlatforms.join(';'),
            article.createdAt,
            article.updatedAt,
            `"${article.content.substring(0, 100).replace(/"/g, '""')}..."`
          ].join(','))
        ].join('\n')

        // 创建 Blob 并下载
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        link.setAttribute('href', url)
        link.setAttribute('download', `文章导出_${new Date().toLocaleDateString()}.csv`)
        link.style.visibility = 'hidden'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        console.log('✅ 文章导出成功:', articlesToExport.length, '篇')
      } else {
        throw new Error(result.error || '导出失败')
      }
    } catch (error) {
      console.error('💥 导出文章失败:', error)
      alert(error instanceof Error ? error.message : '导出文章失败')
    } finally {
      setExporting(false)
    }
  }

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
            <button onClick={handleCreateNew} className="btn btn-secondary flex items-center space-x-2">
              <PlusIcon className="w-4 h-4" />
              <span>新建文章</span>
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span>导出中...</span>
                </>
              ) : (
                <>
                  <DownloadIcon className="w-4 h-4" />
                  <span>导出</span>
                </>
              )}
            </button>
            <button onClick={handleRefresh} className="btn btn-secondary flex items-center space-x-2">
              <RefreshCwIcon className="w-4 h-4" />
              <span>刷新</span>
            </button>
          </div>
        </div>

        {/* 筛选和搜索 */}
        <div className="card p-6 mb-6">
          <div className="grid md:grid-cols-5 gap-4">
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

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">时间范围</label>
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="input w-full appearance-none pr-8"
                >
                  {dateOptions.map(option => (
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
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-primary-700 font-medium">
                  已选择 {selectedArticles.length} 篇文章
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBatchStatusChange(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="btn btn-secondary btn-sm text-sm"
                >
                  <option value="">批量更新状态...</option>
                  <option value="draft">设为草稿</option>
                  <option value="pending">设为待发布</option>
                  <option value="published">设为已发布</option>
                  <option value="withdrawn">设为已撤回</option>
                </select>
                <button
                  onClick={handleBatchPublish}
                  className="btn btn-primary btn-sm"
                >
                  批量发布
                </button>
                <button
                  onClick={handleBatchDelete}
                  className="btn btn-danger btn-sm bg-red-600 hover:bg-red-700 text-white"
                >
                  批量删除
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
          {/* 错误提示 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg m-4">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircleIcon className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
                <button
                  onClick={handleRefresh}
                  className="ml-auto text-red-600 hover:text-red-800 text-sm underline"
                >
                  重试
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCwIcon className="w-8 h-8 text-gray-400 animate-spin" />
                <span className="ml-2 text-gray-500">加载文章列表中...</span>
              </div>
            ) : articles.length === 0 && !error ? (
              <div className="text-center py-12">
                <ClipboardListIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无文章</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' || platformFilter !== 'all' || dateFilter !== 'all'
                    ? '没有符合筛选条件的文章，请尝试调整筛选条件'
                    : '还没有保存任何文章到发布管理'}
                </p>
                <a
                  href="/create"
                  className="btn btn-primary inline-flex items-center space-x-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>创作文章</span>
                </a>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={articles.length > 0 && selectedArticles.length === articles.length}
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
                  {articles.map((article) => {
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
                              alt={`${article.title}的缩略图`}
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
                            {article.targetPlatforms.map((platform: string, index: number) => (
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
                              onClick={() => handleEditArticle(article.id)}
                              className="text-gray-400 hover:text-gray-600"
                              title="编辑"
                            >
                              <Edit3Icon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleViewArticle(article.id)}
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
                              onClick={() => handleDeleteArticle(article.id)}
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
            )}
          </div>

          {/* 分页 */}
          {!loading && articles.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                显示 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} 条，共 {totalCount} 条
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 弹窗组件 */}
        <ArticleDetailModal
          isOpen={showDetailModal}
          onClose={handleCloseDetailModal}
          articleId={selectedArticleId}
        />

        <ArticleEditModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          articleId={selectedArticleId}
          onSave={handleArticleSaved}
        />

        {/* 快速操作浮动按钮 */}
        <div className="fixed bottom-8 right-8">
          <div className="flex flex-col space-y-2">
            <button onClick={handleCreateNew} className="btn btn-primary rounded-full shadow-lg flex items-center space-x-2 px-6">
              <PlusIcon className="w-5 h-5" />
              <span>快速创作</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}