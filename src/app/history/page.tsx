'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import {
  SearchIcon,
  HistoryIcon,
  EyeIcon,
  TrashIcon,
  FileTextIcon,
  TrendingUpIcon,
  CalendarIcon,
  AlertCircleIcon
} from 'lucide-react'

interface SearchHistory {
  id: number
  keyword: string
  searchTime: string
  articleCount?: number
  avgRead?: number
  avgLike?: number
  originalRate?: number
  status: string
  errorMessage?: string
  hasAnalysisResult: boolean
}

interface ApiResponse {
  success: boolean
  data: {
    histories: SearchHistory[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export default function HistoryPage() {
  const [histories, setHistories] = useState<SearchHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)

  const fetchHistories = async (page: number = 1, keyword: string = '') => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(keyword && { keyword })
      })

      const response = await fetch(`/api/history?${params}`)
      const data: ApiResponse = await response.json()

      if (data.success) {
        setHistories(data.data.histories)
        setCurrentPage(data.data.pagination.page)
        setTotalPages(data.data.pagination.totalPages)
      } else {
        setError('获取历史记录失败')
      }
    } catch (err) {
      console.error('获取历史记录失败:', err)
      setError('获取历史记录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条历史记录吗？删除后无法恢复。')) {
      return
    }

    try {
      setDeleteLoading(id)
      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        // 重新获取数据
        await fetchHistories(currentPage, searchKeyword)
      } else {
        setError('删除失败')
      }
    } catch (err) {
      console.error('删除失败:', err)
      setError('删除失败')
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchHistories(1, searchKeyword)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchHistories(page, searchKeyword)
  }

  useEffect(() => {
    fetchHistories()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatNumber = (num: number | undefined) => {
    if (!num) return '0'
    return num.toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">历史记录</h1>
            <p className="text-gray-600">查看和分析历史搜索记录</p>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="card p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索历史关键词..."
                className="input pl-10 w-full"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary flex items-center space-x-2"
            >
              <SearchIcon className="w-4 h-4" />
              <span>搜索</span>
            </button>
          </form>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="card p-4 mb-8 border-red-200 bg-red-50">
            <div className="flex items-center space-x-2">
              <AlertCircleIcon className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="card p-8 text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">加载历史记录中...</p>
          </div>
        )}

        {/* 历史记录列表 */}
        {!loading && histories.length === 0 && (
          <div className="card p-8 text-center">
            <HistoryIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">暂无历史记录</p>
            <Link href="/analysis" className="btn btn-primary mt-4">
              开始分析
            </Link>
          </div>
        )}

        {!loading && histories.length > 0 && (
          <div className="space-y-6">
            {histories.map((history) => (
              <div key={history.id} className="card p-6">
                <div className="flex items-start justify-between">
                  {/* 基本信息 */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {history.keyword}
                      </h3>
                      {history.status === 'completed' && history.hasAnalysisResult && (
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          已完成
                        </span>
                      )}
                      {history.status === 'failed' && (
                        <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                          失败
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{formatDate(history.searchTime)}</span>
                      </span>
                      {history.articleCount && (
                        <span className="flex items-center space-x-1">
                          <FileTextIcon className="w-4 h-4" />
                          <span>{formatNumber(history.articleCount)} 篇文章</span>
                        </span>
                      )}
                      {history.avgRead && (
                        <span className="flex items-center space-x-1">
                          <EyeIcon className="w-4 h-4" />
                          <span>平均阅读 {formatNumber(history.avgRead)}</span>
                        </span>
                      )}
                    </div>

                    {/* 错误信息 */}
                    {history.errorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{history.errorMessage}</p>
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-2">
                    {history.hasAnalysisResult && (
                      <Link
                        href={`/history/${history.id}`}
                        className="btn btn-secondary flex items-center space-x-2 text-sm"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>查看</span>
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(history.id)}
                      disabled={deleteLoading === history.id}
                      className="btn btn-secondary flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {deleteLoading === history.id ? (
                        <>
                          <div className="loading-spinner w-4 h-4"></div>
                          <span>删除中...</span>
                        </>
                      ) : (
                        <>
                          <TrashIcon className="w-4 h-4" />
                          <span>删除</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="text-gray-600">
              第 {currentPage} 页，共 {totalPages} 页
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}