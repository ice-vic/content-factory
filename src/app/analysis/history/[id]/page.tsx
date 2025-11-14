'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { AnalysisResultDisplay } from '@/components/AnalysisResultDisplay'
import { CompleteAnalysisResult } from '@/types'
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
  LightbulbIcon
} from 'lucide-react'
import { WechatArticle } from '@/services/wechatService'

export default function HistoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const recordId = params.id as string

  const [historyRecord, setHistoryRecord] = useState<any>(null)
  const [articles, setArticles] = useState<WechatArticle[]>([])
  const [completeAnalysisResult, setCompleteAnalysisResult] = useState<CompleteAnalysisResult | null>(null)
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
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (!isMounted) return

        if (data.success) {
          const record = data.data
          setHistoryRecord(record)

          // 如果有分析结果数据，重建分析结果
          if (record.analysisResult) {
            try {
              // 直接使用API转换好的CompleteAnalysisResult格式
              const analysisData = record.analysisResult

              // 验证分析结果数据结构
              if (!analysisData || typeof analysisData !== 'object') {
                throw new Error('分析结果数据格式不正确')
              }

              if (!isMounted) return
              setCompleteAnalysisResult(analysisData)

              // 如果有文章数据，重建文章列表
              if (analysisData.allArticles && Array.isArray(analysisData.allArticles)) {
                if (!isMounted) return
                setArticles(analysisData.allArticles.slice(0, 30)) // 限制显示数量
              } else {
                console.warn('未找到文章数据或数据格式不正确')
                if (!isMounted) return
                setArticles([])
              }

              // 检查数据完整性
              console.log('📊 历史数据分析:', {
                hasStructuredTopicInsights: !!(analysisData.structuredTopicInsights?.length),
                hasAiSummaries: !!(analysisData.aiSummaries?.length),
                hasAiInsights: !!(analysisData.aiInsights?.length),
                hasWordCloud: !!(analysisData.wordCloud?.length),
                articlesCount: analysisData.allArticles?.length || 0,
                modelUsed: analysisData.metadata?.modelUsed
              })
            } catch (parseError) {
              console.error('解析分析结果失败:', parseError)
              if (isMounted) {
                setError('分析结果数据解析失败')
              }
            }
          } else {
            console.warn('该历史记录没有分析结果数据')
            if (isMounted) {
              setError('该历史记录没有完整的分析结果')
            }
          }
        } else {
          if (isMounted) {
            setError(data.error || '获取历史记录详情失败')
          }
        }
      } catch (err) {
        console.error('获取历史记录详情异常:', err)
        if (isMounted) {
          setError('网络错误，请稍后重试')
        }
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

  // 返回列表页
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/analysis')
    }
  }

  // 重新分析
  const handleReanalyze = () => {
    if (historyRecord?.keyword) {
      router.push(`/analysis?keyword=${encodeURIComponent(historyRecord.keyword)}&return=true`)
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCwIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">加载历史记录详情中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircleIcon className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  返回
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!historyRecord) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-gray-600">未找到该历史记录</p>
              <button
                onClick={handleBack}
                className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                返回
              </button>
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
        {/* 页面标题和返回按钮 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>返回</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">历史分析详情</h1>
                <p className="text-gray-600 mt-1">
                  关键词：{historyRecord.keyword}
                </p>
              </div>
            </div>
            <button
              onClick={handleReanalyze}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCwIcon className="w-4 h-4" />
              <span>重新分析</span>
            </button>
          </div>
        </div>

        {/* 历史记录信息卡片 */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">分析信息</h2>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              <CheckIcon className="w-3 h-3" />
              <span>{historyRecord.status === 'completed' ? '已完成' : historyRecord.status}</span>
            </div>
          </div>

          {/* 数据完整性状态 */}
          {historyRecord?.analysisResult && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">数据完整性状态</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  {historyRecord.analysisResult.structuredTopicInsights?.length > 0 ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">AI洞察 ({historyRecord.analysisResult.structuredTopicInsights.length})</span>
                    </>
                  ) : (
                    <>
                      <AlertCircleIcon className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700">AI洞察缺失</span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {historyRecord.analysisResult.aiSummaries?.length > 0 ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">AI摘要 ({historyRecord.analysisResult.aiSummaries.length})</span>
                    </>
                  ) : (
                    <>
                      <AlertCircleIcon className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700">AI摘要缺失</span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {historyRecord.analysisResult.wordCloud?.length > 0 ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">词云数据</span>
                    </>
                  ) : (
                    <>
                      <AlertCircleIcon className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700">词云缺失</span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {historyRecord.analysisResult.allArticles?.length > 0 ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">文章数据 ({historyRecord.analysisResult.allArticles.length})</span>
                    </>
                  ) : (
                    <>
                      <AlertCircleIcon className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700">文章缺失</span>
                    </>
                  )}
                </div>
              </div>
              {(!historyRecord.analysisResult.structuredTopicInsights?.length || !historyRecord.analysisResult.aiSummaries?.length) && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ 部分AI分析数据缺失，建议点击"重新分析"按钮获取完整分析结果
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">分析时间</div>
              <div className="text-lg font-medium text-gray-900">
                {formatDate(historyRecord.createdAt)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">文章数量</div>
              <div className="text-lg font-medium text-gray-900">
                {historyRecord.articleCount || 0} 篇
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">分析耗时</div>
              <div className="text-lg font-medium text-gray-900">
                {historyRecord.duration || 0} 秒
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">平均阅读量</div>
              <div className="text-lg font-medium text-gray-900">
                {historyRecord.avgRead || 0}
              </div>
            </div>
          </div>

          {/* 分析参数 */}
          {historyRecord.params && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">分析参数</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  排序: {historyRecord.params.sort_type === 1 ? '最新' : '综合'}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  范围: {historyRecord.params.period || 7}天
                </span>
                {historyRecord.params.min_read && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    最少阅读: {historyRecord.params.min_read}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

  
        {/* 分析结果 - 使用统一的展示组件 */}
        <AnalysisResultDisplay
          completeAnalysisResult={completeAnalysisResult}
          articles={articles}
          showAllArticles={true}
        />

        {/* 分析元数据 */}
        {completeAnalysisResult && (
          <div className="card p-4 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                分析时间: {formatDate(historyRecord.createdAt)} |
                记录ID: {historyRecord.id} |
                模型: {completeAnalysisResult.metadata.modelUsed} |
                版本: {completeAnalysisResult.metadata.analysisVersion}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleReanalyze}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  重新分析
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}