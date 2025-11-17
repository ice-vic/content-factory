'use client'

import { useState, useEffect } from 'react'
import {
  XIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  TagIcon,
  FileTextIcon,
  UserIcon,
  GlobeIcon
} from 'lucide-react'

interface ArticleDetail {
  id: string
  title: string
  content: string
  htmlContent: string
  platform: string
  style: string
  length: string
  targetPlatforms: string[]
  customInstructions: string | null
  insightId: number | null
  topicDirection: string | null
  hasImages: boolean
  imageConfig: any
  status: string
  estimatedReadingTime: number
  sections: any[]
  createdAt: string
  updatedAt: string
  publishRecords: any[]
}

interface ArticleDetailModalProps {
  isOpen: boolean
  onClose: () => void
  articleId: string | null
}

export default function ArticleDetailModal({
  isOpen,
  onClose,
  articleId
}: ArticleDetailModalProps) {
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setArticle(null)
      setError('')
      setLoading(false)
    }
  }, [isOpen])

  // 加载文章详情
  useEffect(() => {
    if (isOpen && articleId) {
      loadArticleDetail()
    }
  }, [isOpen, articleId])

  const loadArticleDetail = async () => {
    if (!articleId) return

    setLoading(true)
    setError('')

    try {
      console.log('📖 加载文章详情:', articleId)

      const response = await fetch(`/api/articles/${articleId}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setArticle(result.article)
        console.log('✅ 文章详情加载成功')
      } else {
        throw new Error(result.error || '加载文章详情失败')
      }

    } catch (error) {
      console.error('💥 加载文章详情失败:', error)
      setError(error instanceof Error ? error.message : '加载文章详情失败')
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      draft: { color: 'bg-gray-100 text-gray-700', label: '草稿' },
      pending: { color: 'bg-yellow-100 text-yellow-700', label: '待发布' },
      published: { color: 'bg-green-100 text-green-700', label: '已发布' },
      withdrawn: { color: 'bg-red-100 text-red-700', label: '已撤回' }
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

  const getPlatformName = (platform: string) => {
    const names = {
      wechat: '微信公众号',
      xiaohongshu: '小红书',
      multi: '多平台'
    }
    return names[platform as keyof typeof names] || platform
  }

  const getStyleName = (style: string) => {
    const styles = {
      professional: '专业商务',
      casual: '轻松日常',
      creative: '创意活泼',
      formal: '正式严肃'
    }
    return styles[style as keyof typeof styles] || style
  }

  const getLengthName = (length: string) => {
    const lengths = {
      short: '短篇 (300-600字)',
      medium: '中篇 (600-1200字)',
      long: '长篇 (1200-2000字)'
    }
    return lengths[length as keyof typeof lengths] || length
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">文章详情</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-500">加载文章详情中...</span>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={loadArticleDetail}
                  className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
                >
                  重试
                </button>
              </div>
            </div>
          ) : article ? (
            <div className="p-6 space-y-6">
              {/* 文章标题和状态 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900 flex-1 mr-4">{article.title}</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(article.status).color}`}>
                    {getStatusConfig(article.status).label}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>创建于 {new Date(article.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>更新于 {new Date(article.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {article.estimatedReadingTime > 0 && (
                    <div className="flex items-center space-x-1">
                      <EyeIcon className="w-4 h-4" />
                      <span>预计阅读 {article.estimatedReadingTime} 分钟</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <GlobeIcon className="w-4 h-4 text-gray-600" />
                    <h4 className="font-medium text-gray-900">发布平台</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {article.targetPlatforms.map((platform, index) => (
                      <span key={index} className="inline-flex items-center space-x-1 text-sm">
                        <span>{getPlatformIcon(platform)}</span>
                        <span>{getPlatformName(platform)}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TagIcon className="w-4 h-4 text-gray-600" />
                    <h4 className="font-medium text-gray-900">内容配置</h4>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div><span className="text-gray-600">风格:</span> {getStyleName(article.style)}</div>
                    <div><span className="text-gray-600">篇幅:</span> {getLengthName(article.length)}</div>
                    <div><span className="text-gray-600">图片:</span> {article.hasImages ? '包含图片' : '无图片'}</div>
                  </div>
                </div>
              </div>

              {/* 主题方向 */}
              {article.topicDirection && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileTextIcon className="w-4 h-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900">主题方向</h4>
                  </div>
                  <p className="text-blue-800">{article.topicDirection}</p>
                </div>
              )}

              {/* 自定义说明 */}
              {article.customInstructions && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserIcon className="w-4 h-4 text-yellow-600" />
                    <h4 className="font-medium text-yellow-900">自定义说明</h4>
                  </div>
                  <p className="text-yellow-800 whitespace-pre-wrap">{article.customInstructions}</p>
                </div>
              )}

              {/* 文章内容 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <FileTextIcon className="w-4 h-4" />
                  <span>文章内容</span>
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {article.htmlContent ? (
                    <div
                      className="prose prose-sm max-w-none article-content"
                      dangerouslySetInnerHTML={{ __html: article.htmlContent }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-gray-700">{article.content}</div>
                  )}
                </div>
              </div>

              {/* 发布记录 */}
              {article.publishRecords && article.publishRecords.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">发布记录</h4>
                  <div className="space-y-2">
                    {article.publishRecords.map((record) => (
                      <div key={record.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span>{getPlatformIcon(record.platform)}</span>
                            <span className="font-medium">{getPlatformName(record.platform)}</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusConfig(record.status).color}`}>
                              {getStatusConfig(record.status).label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(record.createdAt).toLocaleString()}
                          </div>
                        </div>
                        {record.publishedUrl && (
                          <div className="mt-2 text-sm">
                            <a
                              href={record.publishedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              查看已发布内容
                            </a>
                          </div>
                        )}
                        {record.errorMessage && (
                          <div className="mt-2 text-sm text-red-600">
                            错误: {record.errorMessage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              没有找到文章详情
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}