'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { XiaohongshuAnalysisResultDisplay } from '@/components/XiaohongshuAnalysisResultDisplay'
import { XiaohongshuCompleteAnalysisResult } from '@/types/xiaohongshu'
import {
  ArrowLeftIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CheckIcon,
  BrainIcon,
  ClockIcon,
  ExternalLinkIcon,
  BarChart3Icon,
  CalendarIcon,
  FileTextIcon,
  LightbulbIcon,
  HeartIcon,
  BookmarkIcon,
  MessageCircleIcon
} from 'lucide-react'
import { XiaohongshuNote } from '@/types/xiaohongshu'

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircleIcon className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">渲染错误</h3>
            </div>
            <p className="text-red-600 mb-2">分析结果展示时出现错误，请稍后重试。</p>
            <details className="text-sm text-gray-500">
              <summary>错误详情</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {this.state.error?.message}
              </pre>
            </details>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// 简化的编码修复函数
const fixEncoding = (text: string): string => {
  if (!text || typeof text !== 'string') return text

  try {
    let fixed = text

    // 只处理最常见的编码问题
    // 修复 \uXXXX 编码
    fixed = fixed.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
      try {
        return String.fromCharCode(parseInt(code, 16))
      } catch (e) {
        return match
      }
    })

    // 直接替换已知的乱码模式
    const replacements: { [key: string]: string } = {
      'С����': '内容创作',
      'Ã©': '创',
      'Â': '',
      'Ã': '',
      '©': '©',
      '®': '®'
    }

    for (const [broken, correct] of Object.entries(replacements)) {
      fixed = fixed.replace(new RegExp(broken, 'g'), correct)
    }

    return fixed
  } catch (error) {
    console.warn('编码修复失败:', error)
    return text
  }
}

export default function XiaohongshuHistoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const recordId = params.id as string

  const [historyRecord, setHistoryRecord] = useState<any>(null)
  const [notes, setNotes] = useState<XiaohongshuNote[]>([])
  const [completeAnalysisResult, setCompleteAnalysisResult] = useState<XiaohongshuCompleteAnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取历史记录详情
  useEffect(() => {
    if (!recordId) return

    let isMounted = true

    const fetchHistoryDetail = async () => {
      try {
        if (!isMounted) return

        setLoading(true)
        setError(null)

        // 获取历史记录详情
        const response = await fetch(`/api/history/${recordId}`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || '获取历史详情失败')
        }

        if (!isMounted) return

        const record = result.data

      // 验证数据类型 - API已经验证过，这里只是双重保险
        if (record.type && record.type !== 'xiaohongshu') {
          throw new Error(`数据类型不匹配：该记录是${record.type === 'wechat' ? '公众号' : record.type}数据，但当前页面是小红书历史详情页面`)
        }

        // 调试编码问题
        console.log('🔍 原始关键词:', record.keyword)
        console.log('🔍 关键词字符码:', Array.from<string>(record.keyword || '').map(c => c.charCodeAt(0)))
        console.log('🔍 历史记录对象:', record)

        setHistoryRecord(record)

        // 设置分析结果数据
        if (record.analysisResult) {
          // 修复可能的编码问题
          const fixedAnalysisResult = {
            ...record.analysisResult,
            keyword: fixEncoding(record.analysisResult.keyword),
            structuredTopicInsights: record.analysisResult.structuredTopicInsights?.map((insight: any) => ({
              ...insight,
              title: fixEncoding(insight.title),
              coreFinding: fixEncoding(insight.coreFinding),
              recommendedTopics: insight.recommendedTopics?.map((topic: string) => fixEncoding(topic)) || [],
              targetAudience: insight.targetAudience?.map((audience: string) => fixEncoding(audience)) || [],
              contentStrategy: insight.contentStrategy?.map((strategy: string) => fixEncoding(strategy)) || [],
              hashtagStrategy: insight.hashtagStrategy?.map((hashtag: string) => fixEncoding(hashtag)) || [],
              bestPostTime: insight.bestPostTime?.map((time: string) => fixEncoding(time)) || []
            })) || []
          }

          console.log('📊 历史数据分析:', fixedAnalysisResult)
          setCompleteAnalysisResult(fixedAnalysisResult)
        } else {
          console.warn('⚠️ 该历史记录没有分析结果数据')
        }

        // 设置笔记数据
        if (record.analysisResult?.allArticles) {
          const fixedNotes = record.analysisResult.allArticles.map((note: any) => ({
            ...note,
            title: fixEncoding(note.title),
            content: fixEncoding(note.content),
            author: {
              ...note.author,
              name: fixEncoding(note.author.name)
            },
            tags: note.tags?.map((tag: string) => fixEncoding(tag)) || []
          }))

          console.log('📝 设置笔记数据:', fixedNotes.length, '条')
          setNotes(fixedNotes)
        } else {
          console.warn('⚠️ 该历史记录没有笔记数据')
        }

      } catch (err) {
        if (!isMounted) return
        console.error('获取历史详情失败:', err)
        setError(err instanceof Error ? err.message : '获取历史详情失败')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchHistoryDetail()

    return () => {
      isMounted = false
    }
  }, [recordId])

  // 处理重新分析
  const handleReanalyze = () => {
    if (historyRecord?.keyword) {
      router.push(`/xiaohongshu?keyword=${encodeURIComponent(historyRecord.keyword)}&return=true`)
    }
  }

  // 处理返回
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/xiaohongshu')
    }
  }

  // 格式化日期
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

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCwIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">加载历史详情中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error || !historyRecord) {
    const isTypeError = error?.includes('数据类型不匹配') || error?.includes('不是小红书分析数据')

    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-md">
              <AlertCircleIcon className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error || '未找到历史记录'}</p>

              {isTypeError && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">
                    💡 <strong>解决建议：</strong>
                  </p>
                  <ul className="text-xs text-yellow-700 space-y-1 text-left">
                    <li>• 如果这是公众号数据，请前往公众号历史页面查看</li>
                    <li>• 如果这是小红书数据，请联系管理员检查数据类型设置</li>
                    <li>• 可以尝试重新进行分析来生成正确的历史记录</li>
                  </ul>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  返回上一页
                </button>
                {isTypeError && (
                  <button
                    onClick={() => router.push('/xiaohongshu')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    小红书主页
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="返回"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                小红书分析历史详情
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleReanalyze}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCwIcon className="w-4 h-4" />
                <span>重新分析</span>
              </button>
            </div>
          </div>

          {/* 基础信息卡片 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                  <FileTextIcon className="w-4 h-4" />
                  <span>分析关键词</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {historyRecord.keyword}
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                  <BarChart3Icon className="w-4 h-4" />
                  <span>分析笔记数</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {historyRecord.articleCount} 篇
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>分析时间</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatDate(historyRecord.searchTime)}
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>分析耗时</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {historyRecord.duration ? `${historyRecord.duration}s` : '未知'}
                </div>
              </div>
            </div>

            {/* 统计数据 */}
            {(historyRecord.result_summary || completeAnalysisResult) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      {historyRecord.result_summary?.avgLikes ||
                       (completeAnalysisResult?.avgLikes ?
                        completeAnalysisResult.avgLikes >= 10000 ? `${(completeAnalysisResult.avgLikes/10000).toFixed(1)}w` :
                        completeAnalysisResult.avgLikes >= 1000 ? `${(completeAnalysisResult.avgLikes/1000).toFixed(1)}k` :
                        completeAnalysisResult.avgLikes : '0')}
                    </div>
                    <div className="text-sm text-gray-600">平均点赞量</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">
                      {completeAnalysisResult?.avgCollects ?
                        completeAnalysisResult.avgCollects >= 10000 ? `${(completeAnalysisResult.avgCollects/10000).toFixed(1)}w` :
                        completeAnalysisResult.avgCollects >= 1000 ? `${(completeAnalysisResult.avgCollects/1000).toFixed(1)}k` :
                        completeAnalysisResult.avgCollects : '-'}
                    </div>
                    <div className="text-sm text-gray-600">平均收藏量</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {completeAnalysisResult?.avgInteractionRate || '-'}%
                    </div>
                    <div className="text-sm text-gray-600">平均互动率</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {historyRecord.result_summary?.originalRate || '-'}%
                    </div>
                    <div className="text-sm text-gray-600">原创率</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 分析结果展示 */}
        {completeAnalysisResult && (
          <ErrorBoundary>
            <XiaohongshuAnalysisResultDisplay
              completeAnalysisResult={completeAnalysisResult}
              notes={notes}
              showAllArticles={true}
            />
          </ErrorBoundary>
        )}

        {/* 如果没有分析结果，显示基础信息 */}
        {!completeAnalysisResult && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileTextIcon className="w-6 h-6 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">基础信息</h3>
            </div>
            <div className="text-gray-600">
              <p>该历史记录暂时没有详细的分析结果数据。</p>
              <p className="mt-2">您可以点击"重新分析"按钮来重新生成完整的分析结果。</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}