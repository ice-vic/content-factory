'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import ArticleList from '@/components/ArticleList'
import { StructuredTopicInsights } from '@/components/StructuredTopicInsights'
import {
  ArrowLeftIcon,
  CalendarIcon,
  FileTextIcon,
  EyeIcon,
  HeartIcon,
  BarChart3Icon,
  CloudIcon,
  LightbulbIcon,
  PlayIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  RefreshCwIcon,
  ArrowRightIcon,
  BrainIcon
} from 'lucide-react'

interface WechatArticle {
  avatar: string
  classify: string
  content: string
  ghid: string
  ip_wording: string
  is_original: number
  looking: number
  praise: number
  publish_time: number
  publish_time_str: string
  read: number
  short_link: string
  title: string
  update_time: number
  update_time_str: string
  url: string
  wx_id: string
  wx_name: string
}

interface HistoryDetail {
  id: number
  keyword: string
  searchTime: string
  articleCount?: number
  avgRead?: number
  avgLike?: number
  originalRate?: number
  status: string
  errorMessage?: string
  analysisResult?: {
    id: number
    insights: string[]
    wordCloud: Array<{ word: string; count: number }>
    topLikedArticles: WechatArticle[]
    topInteractionArticles: WechatArticle[]
    allArticles: WechatArticle[]
    // AI分析相关字段
    aiSummaries?: any[]
    structuredInfo?: any
    aiInsights?: any[]
    // AI结构化洞察 - 这是最重要的字段
    structuredTopicInsights?: Array<{
      title: string
      coreFinding: string
      dataSupport: {
        avgRead: number
        avgLike: number
        likeRate: number
        sampleSize: number
      }
      keywordAnalysis: {
        highFrequency: string[]
        opportunity: string[]
      }
      recommendedTopics: string[]
      contentStrategy: string[]
      targetAudience: string
      confidenceScore: number
    }>
    // 元数据
    metadata?: {
      analysisVersion: string
      modelUsed: string
      processingTime: number
      timestamp: string
    }
    createdAt: string
  }
}

export default function HistoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [history, setHistory] = useState<HistoryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistoryDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/history/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setHistory(data.data)
      } else {
        setError(data.error || '获取历史详情失败')
      }
    } catch (err) {
      console.error('获取历史详情失败:', err)
      setError('获取历史详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchHistoryDetail()
    }
  }, [params.id])

  const handleReAnalyze = () => {
    if (history?.keyword) {
      router.push(`/analysis?keyword=${encodeURIComponent(history.keyword)}`)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card p-8 text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">加载历史详情中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !history) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card p-8">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircleIcon className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error || '历史记录不存在'}</p>
            </div>
            <Link href="/history" className="btn btn-secondary">
              返回历史列表
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按钮和标题 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/history"
              className="btn btn-secondary flex items-center space-x-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>返回历史</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                分析详情: {history.keyword}
              </h1>
              <p className="text-gray-600 mt-1">
                分析时间: {formatDate(history.searchTime)}
              </p>
            </div>
          </div>
        </div>

        {/* 错误信息 */}
        {history.status === 'failed' && history.errorMessage && (
          <div className="card p-4 mb-8 border-red-200 bg-red-50">
            <div className="flex items-center space-x-2">
              <AlertCircleIcon className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{history.errorMessage}</p>
            </div>
          </div>
        )}

        {history.analysisResult ? (
          <>
            {/* 基本信息概览 */}
            <div className="card p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">基本信息</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {formatNumber(history.articleCount)}
                  </div>
                  <div className="text-sm text-gray-600">分析文章</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(history.avgRead)}
                  </div>
                  <div className="text-sm text-gray-600">平均阅读</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formatNumber(history.avgLike)}
                  </div>
                  <div className="text-sm text-gray-600">平均点赞</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {history.originalRate ? `${history.originalRate}%` : '0%'}
                  </div>
                  <div className="text-sm text-gray-600">原创占比</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(history.analysisResult.allArticles.length)}
                  </div>
                  <div className="text-sm text-gray-600">总文章数</div>
                </div>
              </div>
            </div>

            {/* 数据榜单 */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <ArticleList
                articles={history.analysisResult.topLikedArticles}
                title="点赞量最高的文章"
                showMetrics="likes"
                maxArticles={5}
              />

              <ArticleList
                articles={history.analysisResult.topInteractionArticles}
                title="互动率最高的文章"
                showMetrics="interaction"
                maxArticles={5}
              />
            </div>

            {/* 词云和洞察 */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* 词云 */}
              <div className="card p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CloudIcon className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-semibold text-gray-900">高频词云</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.analysisResult.wordCloud && history.analysisResult.wordCloud.length > 0 ? (
                    history.analysisResult.wordCloud.map((item, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                        style={{
                          fontSize: `${Math.max(12, Math.min(20, item.count / 2))}px`,
                          opacity: Math.max(0.6, Math.min(1, item.count / 50))
                        }}
                      >
                        {item.word} ({item.count})
                      </span>
                    ))
                  ) : (
                    <div className="w-full py-8 text-center text-gray-500">
                      <CloudIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>暂无词云数据</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 选题洞察 */}
              <div className="card p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <LightbulbIcon className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-gray-900">选题洞察</h3>
                </div>
                <div className="space-y-3">
                  {history.analysisResult.insights && history.analysisResult.insights.length > 0 ? (
                    history.analysisResult.insights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <p className="text-gray-700">{insight}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      <LightbulbIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>暂无传统选题洞察</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI结构化选题洞察 */}
            {history.analysisResult.structuredTopicInsights && history.analysisResult.structuredTopicInsights.length > 0 && (
              <div className="card p-6 mb-8">
                <div className="flex items-center space-x-2 mb-6">
                  <BrainIcon className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    AI结构化选题洞察 ({history.analysisResult.structuredTopicInsights.length}条)
                  </h3>
                  {history.analysisResult.metadata?.modelUsed && (
                    <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                      AI模型: {history.analysisResult.metadata.modelUsed}
                    </span>
                  )}
                </div>
                <StructuredTopicInsights
                  insights={history.analysisResult.structuredTopicInsights}
                  maxItems={10}
                />
              </div>
            )}

            {/* 所有文章列表 */}
            <div className="card p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <EyeIcon className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    所有相关文章 ({history.analysisResult.allArticles.length}篇)
                  </h3>
                </div>
              </div>

              <div className="grid gap-4">
                {history.analysisResult.allArticles.map((article, index) => (
                  <div
                    key={`${article.wx_id}-${article.short_link}`}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {article.avatar && (
                          <img
                            src={article.avatar}
                            alt={article.wx_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{article.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                            <span>{article.wx_name}</span>
                            <span>{article.publish_time_str}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <EyeIcon className="w-4 h-4" />
                              <span>{article.read.toLocaleString()}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <HeartIcon className="w-4 h-4" />
                              <span>{article.praise.toLocaleString()}</span>
                            </span>
                            {article.looking > 0 && (
                              <span className="flex items-center space-x-1">
                                <TrendingUpIcon className="w-4 h-4" />
                                <span>{article.looking.toLocaleString()}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 查看原文链接 */}
                      <div className="ml-4">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          <span>查看原文</span>
                          <ArrowRightIcon className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-center space-x-4">
              <button className="btn btn-primary flex items-center space-x-2">
                <PlayIcon className="w-4 h-4" />
                <span>基于洞察生成新文章</span>
              </button>
              <button
                onClick={handleReAnalyze}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <RefreshCwIcon className="w-4 h-4" />
                <span>重新分析</span>
              </button>
            </div>
          </>
        ) : (
          /* 没有分析结果的情况 */
          <div className="card p-8 text-center">
            <AlertCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">该历史记录没有分析结果</p>
            <button
              onClick={handleReAnalyze}
              className="btn btn-primary flex items-center space-x-2 mx-auto"
            >
              <RefreshCwIcon className="w-4 h-4" />
              <span>重新分析</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}