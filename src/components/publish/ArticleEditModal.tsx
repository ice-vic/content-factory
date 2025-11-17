'use client'

import { useState, useEffect } from 'react'
import ArticleEditor from '@/components/ArticleEditor'
import {
  XIcon,
  SaveIcon,
  RefreshCwIcon,
  CheckIcon,
  AlertCircleIcon,
  FileTextIcon
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

interface ArticleEditModalProps {
  isOpen: boolean
  onClose: () => void
  articleId: string | null
  onSave: (updatedArticle: ArticleDetail) => void
}

export default function ArticleEditModal({
  isOpen,
  onClose,
  articleId,
  onSave
}: ArticleEditModalProps) {
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // 编辑状态
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [editorInitialized, setEditorInitialized] = useState(false)

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setArticle(null)
      setError('')
      setSuccessMessage('')
      setLoading(false)
      setSaving(false)
      setEditorInitialized(false)
      // 清空编辑状态
      setTitle('')
      setContent('')
      setHtmlContent('')
      setCustomInstructions('')
    }
  }, [isOpen])

  // 加载文章详情
  useEffect(() => {
    if (isOpen && articleId) {
      loadArticleDetail()
    }
  }, [isOpen, articleId])

  // 当文章数据加载完成后，设置编辑状态（只在首次加载时）
  useEffect(() => {
    if (article && !editorInitialized) {
      console.log('📄 文章数据加载完成，设置编辑状态')
      setTitle(article.title)
      setContent(article.content)
      setHtmlContent(article.htmlContent)
      setCustomInstructions(article.customInstructions || '')
      setEditorInitialized(true)
    }
  }, [article, editorInitialized])

  const loadArticleDetail = async () => {
    if (!articleId) return

    setLoading(true)
    setError('')

    try {
      console.log('📝 加载文章编辑数据:', articleId)

      const response = await fetch(`/api/articles/${articleId}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setArticle(result.article)
        console.log('✅ 文章编辑数据加载成功')
      } else {
        throw new Error(result.error || '加载文章详情失败')
      }

    } catch (error) {
      console.error('💥 加载文章编辑数据失败:', error)
      setError(error instanceof Error ? error.message : '加载文章详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!article || !title.trim()) {
      setError('请输入文章标题')
      return
    }

    if (!content.trim()) {
      setError('请输入文章内容')
      return
    }

    setSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      console.log('💾 保存文章修改:', article.id)

      const updateData = {
        title: title.trim(),
        content: content.trim(),
        htmlContent: htmlContent || null,
        customInstructions: customInstructions.trim() || null
      }

      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log('✅ 文章保存成功')
        setSuccessMessage('文章保存成功！您可以继续编辑或手动关闭窗口。')

        // 更新本地文章数据，但不触发编辑状态重置
        const updatedArticle = {
          ...article,
          ...result.article,
          updatedAt: new Date().toISOString()
        }

        // 只更新必要字段，避免触发useEffect导致编辑器内容被覆盖
        setArticle(prev => {
          if (!prev) return updatedArticle
          return {
            ...prev,
            title: updatedArticle.title,
            content: updatedArticle.content,
            htmlContent: updatedArticle.htmlContent,
            customInstructions: updatedArticle.customInstructions,
            updatedAt: updatedArticle.updatedAt
          }
        })

        // 通知父组件
        onSave(updatedArticle)

        // 移除自动关闭，让用户手动关闭，提升用户体验

      } else {
        throw new Error(result.error || '保存文章失败')
      }

    } catch (error) {
      console.error('💥 保存文章失败:', error)
      const errorMessage = error instanceof Error ? error.message : '保存文章失败'
      setError(errorMessage)

      // 5秒后自动清除错误信息
      setTimeout(() => {
        setError(prev => prev === errorMessage ? '' : prev)
      }, 5000)
    } finally {
      setSaving(false)
    }
  }

  const handleContentChange = (newContent: string, newHtmlContent?: string) => {
    console.log('📝 内容修改:', {
      newContent: newContent.substring(0, 100),
      newHtmlContent: newHtmlContent ? newHtmlContent.substring(0, 100) : 'undefined',
      contentLength: newContent.length,
      htmlLength: newHtmlContent?.length || 0
    })

    setContent(newContent)
    if (newHtmlContent !== undefined) {
      setHtmlContent(newHtmlContent)
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    if (error && !e.target.value.trim()) {
      setError('')
    }
  }

  const handleCustomInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomInstructions(e.target.value)
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">编辑文章</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={saving}
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-500">加载文章数据中...</span>
            </div>
          ) : error && !article ? (
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
              {/* 错误和成功提示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                    <button
                      onClick={() => setError('')}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="清除错误"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={handleSave}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                  >
                    点击重试
                  </button>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <p className="text-green-800 text-sm">{successMessage}</p>
                    </div>
                    <button
                      onClick={() => setSuccessMessage('')}
                      className="text-green-400 hover:text-green-600 transition-colors"
                      title="清除消息"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* 基本信息 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {/* 标题编辑 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      文章标题 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={handleTitleChange}
                      className="input w-full"
                      placeholder="请输入文章标题"
                      disabled={saving}
                    />
                  </div>

                  {/* 内容编辑 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      文章内容 <span className="text-red-500">*</span>
                    </label>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {article && (
                        <ArticleEditor
                          key={`editor-${article.id}`}
                          value={htmlContent || content}
                          onChange={handleContentChange}
                          placeholder="开始编辑文章内容..."
                          className="min-h-[400px]"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 侧边栏信息 */}
                <div className="space-y-4">
                  {/* 文章信息 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                      <FileTextIcon className="w-4 h-4" />
                      <span>文章信息</span>
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">状态:</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          {article.status === 'draft' ? '草稿' :
                           article.status === 'pending' ? '待发布' :
                           article.status === 'published' ? '已发布' : '已撤回'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">平台:</span>
                        <div className="flex space-x-1">
                          {article.targetPlatforms.map((platform, index) => (
                            <span key={index} className="text-lg" title={getPlatformName(platform)}>
                              {getPlatformIcon(platform)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">创建:</span>
                        <div className="text-gray-900">{new Date(article.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">更新:</span>
                        <div className="text-gray-900">{new Date(article.updatedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* 自定义说明 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      自定义说明
                    </label>
                    <textarea
                      value={customInstructions}
                      onChange={handleCustomInstructionsChange}
                      className="input w-full h-24 resize-none"
                      placeholder="添加自定义说明或备注..."
                      disabled={saving}
                    />
                  </div>

                  {/* 快速操作 */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        if (confirm('确定要重置所有修改吗？')) {
                          setTitle(article.title)
                          setContent(article.content)
                          setHtmlContent(article.htmlContent)
                          setCustomInstructions(article.customInstructions || '')
                          setError('')
                          setSuccessMessage('')
                        }
                      }}
                      className="btn btn-secondary w-full flex items-center justify-center space-x-2"
                      disabled={saving}
                    >
                      <RefreshCwIcon className="w-4 h-4" />
                      <span>重置修改</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              没有找到文章数据
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            最后保存: {article ? new Date(article.updatedAt).toLocaleString() : '-'}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="btn btn-secondary"
              disabled={saving}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="btn btn-primary flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <SaveIcon className="w-4 h-4" />
                  <span>保存修改</span>
                </>
              )}
            </button>
            {successMessage && (
              <button
                onClick={onClose}
                className="btn btn-success flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckIcon className="w-4 h-4" />
                <span>完成并关闭</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}