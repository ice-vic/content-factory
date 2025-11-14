'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HistoryIcon, XIcon, ExternalLinkIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react'

interface HistoryItem {
  id: string
  type: 'wechat' | 'xiaohongshu'
  keyword: string
  params: any
  result_summary: any
  articleCount: number
  createdAt: string
  duration: number
  status: 'completed' | 'failed' | 'pending'
}

interface HistoryModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'wechat' | 'xiaohongshu'
}

export function HistoryModal({ isOpen, onClose, type }: HistoryModalProps) {
  const router = useRouter()
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 处理查看详情
  const handleViewDetail = (recordId: string) => {
    // 根据类型跳转到对应的详情页面
    if (type === 'wechat') {
      router.push(`/analysis/history/${recordId}`)
    } else {
      router.push(`/xiaohongshu/history/${recordId}`)
    }
    onClose() // 关闭弹窗
  }

  // 处理重新分析
  const handleReanalyze = (keyword: string, params: any) => {
    // 根据类型跳转到对应的分析页面，并预填充参数
    if (type === 'wechat') {
      router.push(`/analysis?keyword=${encodeURIComponent(keyword)}&return=true`)
    } else {
      router.push(`/xiaohongshu?keyword=${encodeURIComponent(keyword)}&return=true`)
    }
    onClose() // 关闭弹窗
  }

  // 获取历史记录
  useEffect(() => {
    if (isOpen) {
      fetchHistory()
    }
  }, [isOpen, type])

  const fetchHistory = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/history?type=${type}&limit=20&offset=0`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setHistoryItems(data.data)
      } else {
        setError(data.error || '获取历史记录失败')
      }
    } catch (err) {
      console.error('History fetch error:', err)
      setError(`网络错误: ${err instanceof Error ? err.message : '请稍后重试'}`)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeLabel = (itemType: string) => {
    return itemType === 'wechat' ? '公众号' : '小红书'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'failed': return '失败'
      case 'pending': return '进行中'
      default: return '未知'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <HistoryIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {type === 'wechat' ? '公众号' : '小红书'}分析历史
              </h2>
              <p className="text-sm text-gray-500">查看历史分析记录</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCwIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">加载历史记录中...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XIcon className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchHistory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HistoryIcon className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">暂无历史记录</p>
                <p className="text-sm text-gray-500">开始你的第一次分析吧</p>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto h-full">
              <div className="p-4 space-y-3">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900 truncate">
                            {item.keyword}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                            {getStatusText(item.status)}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center space-x-4">
                            <span>获取 {item.articleCount} 篇文章</span>
                            <span>耗时 {item.duration}s</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(item.createdAt)}
                          </div>
                        </div>

                        {item.result_summary && (
                          <div className="mt-3 text-sm text-gray-600">
                            <div className="flex flex-wrap gap-2">
                              {item.result_summary.totalArticles && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  总数: {item.result_summary.totalArticles}
                                </span>
                              )}
                              {item.result_summary.avgLikes && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  平均点赞: {item.result_summary.avgLikes}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleViewDetail(item.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <ExternalLinkIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReanalyze(item.keyword, item.params)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="重新分析"
                        >
                          <RefreshCwIcon className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除记录"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部 */}
        {historyItems.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                共 {historyItems.length} 条记录
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}