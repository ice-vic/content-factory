'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import { AnalysisResultDisplay } from '@/components/AnalysisResultDisplay'
import { HistoryModal } from '@/components/HistoryModal'
import { StructuredTopicInsights } from '@/components/StructuredTopicInsights'
import { InsightList } from '@/components/InsightCard'
import ArticleList from '@/components/ArticleList'
import { ReadDistributionChart } from '@/components/ReadDistributionChart'
import { PublishTimeAnalysis } from '@/components/PublishTimeAnalysis'
import {
  SearchIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CheckIcon,
  BrainIcon,
  ClockIcon,
  ZapIcon,
  FilterIcon,
  LightbulbIcon,
  SearchIcon as SearchIcon2,
  ExternalLinkIcon,
  CloudIcon,
  HistoryIcon
} from 'lucide-react'
import {
  searchWechatArticles,
  WechatArticle,
  calculateInteractionRate
} from '@/services/wechatService'
import {
  analyzeArticlesWithAI,
  getAnalysisEstimate
} from '@/services/insightService'
import {
  CompleteAnalysisResult,
  EnhancedAnalysisProgress
} from '@/types'
import {
  checkAIServiceAvailability,
  getAIConfig
} from '@/services/aiService'

export default function AnalysisPage() {
  const [keyword, setKeyword] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [articles, setArticles] = useState<WechatArticle[]>([])
  const [completeAnalysisResult, setCompleteAnalysisResult] = useState<CompleteAnalysisResult | null>(null)
  const [analysisProgress, setAnalysisProgress] = useState<EnhancedAnalysisProgress | null>(null)
    const [aiServiceStatus, setAiServiceStatus] = useState<{available: boolean; error?: string; configured: boolean}>({available: false, configured: false})
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [maxResults, setMaxResults] = useState(15) // 默认15篇文章

  const recentKeywords = ['AI创业', '内容营销', '小红书运营', '数字化转型']

  // 在客户端挂载后设置状态
  useEffect(() => {
    const fetchAIStatus = async () => {
      try {
        const response = await fetch('/api/ai/status')
        const data = await response.json()
        if (data.success) {
          setAiServiceStatus(data.status)
        } else {
          setAiServiceStatus({
            available: false,
            error: data.error || '获取AI状态失败',
            configured: false
          })
        }
      } catch (error) {
        setAiServiceStatus({
          available: false,
          error: '网络错误：无法获取AI状态',
          configured: false
        })
      }
    }

    // 检查是否从历史记录页面跳转过来
    const urlParams = new URLSearchParams(window.location.search)
    const historyId = urlParams.get('historyId')

    if (historyId) {
      // 从历史记录加载数据
      const loadHistoryData = async () => {
        try {
          console.log('🔄 从历史记录加载数据:', historyId)
          const response = await fetch(`/api/history/${historyId}`)
          const result = await response.json()

          if (result.success && result.data) {
            const historyData = result.data
            console.log('📊 历史数据:', {
              hasKeyword: !!historyData.keyword,
              hasArticles: !!(historyData.analysisResult?.allArticles?.length),
              articleCount: historyData.analysisResult?.allArticles?.length || 0,
              hasStructuredInsights: !!(historyData.analysisResult?.structuredTopicInsights?.length),
              insightsCount: historyData.analysisResult?.structuredTopicInsights?.length || 0
            })

            // 设置页面状态
            setKeyword(historyData.keyword || '')
            setArticles(historyData.analysisResult?.allArticles || [])
            setShowResults(true)

            // 构建完整分析结果对象
            if (historyData.analysisResult) {
              const completeResult: CompleteAnalysisResult = {
                keyword: historyData.keyword || '',
                totalArticles: historyData.articleCount || 0,
                processedArticles: historyData.articleCount || 0,

                // 基础统计
                basicStats: {
                  avgRead: historyData.avgRead || 0,
                  avgLike: historyData.avgLike || 0,
                  originalRate: historyData.originalRate || 0,
                  avgInteraction: 0 // 可以计算得出
                },

                // 词云数据
                wordCloud: historyData.analysisResult.wordCloud || [],

                // TOP文章AI分析结果
                topArticleInsights: [], // 可以从aiSummaries转换

                // 结构化选题洞察
                structuredTopicInsights: historyData.analysisResult.structuredTopicInsights || [],

                // AI分析结果（保持向后兼容）
                aiSummaries: historyData.analysisResult.aiSummaries || [],
                structuredInfo: historyData.analysisResult.structuredInfo || {
                  trendingTopics: [],
                  contentGaps: [],
                  popularFormats: [],
                  engagementPatterns: []
                },
                aiInsights: historyData.analysisResult.aiInsights || [],

                // 规则分析结果
                ruleInsights: historyData.analysisResult.insights || [],

                // 元数据
                metadata: historyData.analysisResult.metadata || {
                  modelUsed: 'rule-based',
                  processingTime: 0,
                  analysisVersion: 'unknown',
                  timestamp: historyData.analysisResult.createdAt || new Date()
                }
              }

              console.log('✅ 构建的完整分析结果:', {
                hasStructuredTopicInsights: !!completeResult.structuredTopicInsights.length,
                insightsCount: completeResult.structuredTopicInsights.length,
                modelUsed: completeResult.metadata.modelUsed
              })

              setCompleteAnalysisResult(completeResult)
            }
          } else {
            console.error('❌ 加载历史记录失败:', result.error)
            setError(result.error || '加载历史记录失败')
          }
        } catch (error) {
          console.error('❌ 加载历史记录异常:', error)
          setError('加载历史记录时发生错误')
        }
      }

      loadHistoryData()
    }

    setIsClient(true)
    fetchAIStatus()
  }, [])

  // 计算进度百分比 - 使用useCallback优化
  const getProgressPercentage = useCallback((progress: EnhancedAnalysisProgress): number => {
    return Math.round((progress.current / progress.total) * 100)
  }, [])

  const handleStartAnalysis = async () => {
    if (!keyword.trim()) return

    setIsAnalyzing(true)
    setShowResults(false)
    setError(null)
    setArticles([])
    setCompleteAnalysisResult(null)
    setAnalysisProgress(null)

    try {
      // 步骤1: 获取数据
      setAnalysisProgress({
        phase: 'fetching',
        message: '正在获取公众号文章数据...',
        current: 0,
        total: 100,
        aiStep: '连接数据源'
      })

      // 获取多页数据来凑足用户选择的文章数量
      let allArticles: WechatArticle[] = []
      let currentPage = 1
      const targetCount = maxResults || 15

      while (allArticles.length < targetCount && currentPage <= 5) { // 最多获取5页
        const searchResponse = await searchWechatArticles({
          kw: keyword.trim(),
          sort_type: 1,
          mode: 1,
          period: 7,
          page: currentPage
        })

        if (searchResponse.data.length === 0) {
          break // 没有更多数据了
        }

        allArticles = [...allArticles, ...searchResponse.data]
        currentPage++

        // 更新进度
        setAnalysisProgress({
          phase: 'fetching',
          message: `正在获取第${currentPage}页数据...`,
          current: allArticles.length,
          total: targetCount,
          aiStep: `已获取 ${allArticles.length} 篇文章`
        })
      }

      // 只取前30篇
      allArticles = allArticles.slice(0, targetCount)

      if (allArticles.length === 0) {
        throw new Error(`未找到关于"${keyword}"的相关文章`)
      }

      setArticles(allArticles)

      // 步骤2: AI增强分析
      const analysisResult = await analyzeArticlesWithAI(
        allArticles,
        keyword.trim(),
        (progress) => {
          setAnalysisProgress(progress)
        }
      )

      setCompleteAnalysisResult(analysisResult)

      // 步骤3: 保存分析结果
      try {
        await saveAnalysisResult({
          keyword: keyword.trim(),
          articleCount: allArticles.length,
          avgRead: analysisResult.basicStats.avgRead,
          avgLike: analysisResult.basicStats.avgLike,
          originalRate: analysisResult.basicStats.originalRate,
          articles: allArticles,
          wordCloud: analysisResult.wordCloud,
          topLikedArticles: analysisResult.topArticleInsights?.map(insight =>
            allArticles.find(article => article.id === insight.articleId)
          ).filter(Boolean) || [],
          topInteractionArticles: [], // 可以从analysisResult中计算
          aiSummaries: analysisResult.aiSummaries,
          structuredInfo: analysisResult.structuredInfo,
          aiInsights: analysisResult.aiInsights,
          ruleInsights: analysisResult.ruleInsights,
          structuredTopicInsights: analysisResult.structuredTopicInsights,
          metadata: analysisResult.metadata
        })
      } catch (saveError) {
        console.error('保存分析结果失败:', saveError)
        // 保存失败不影响正常分析流程
      }

      setIsAnalyzing(false)
      setShowResults(true)

    } catch (err) {
      console.error('分析失败:', err)
      setError(err instanceof Error ? err.message : '分析过程中发生错误')
      setIsAnalyzing(false)

      // 设置错误状态
      setAnalysisProgress({
        phase: 'error',
        message: err instanceof Error ? err.message : '分析过程中发生错误',
        current: 0,
        total: 1,
        aiStep: '分析失败'
      })
    }
  }

  const saveAnalysisResult = async (analysisData: any) => {
    try {
      const response = await fetch('/api/analysis/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '保存失败')
      }

      return result.data
    } catch (error) {
      console.error('保存分析结果失败:', error)
      throw error
    }
  }

  const handleClear = () => {
    setKeyword('')
    setShowResults(false)
    setAnalysisProgress(null)
    setError(null)
    setArticles([])
    setCompleteAnalysisResult(null)
  }

  // 获取分析预估
  const handleKeywordChange = (value: string) => {
    setKeyword(value)
    // 这里可以根据需要添加预估逻辑
  }

  // 优化排序计算 - 使用useMemo避免重复排序
  const topLikedArticles = useMemo(() => {
    return articles
      .slice()
      .sort((a, b) => b.praise - a.praise)
      .slice(0, 5)
  }, [articles])

  const topInteractionArticles = useMemo(() => {
    return articles
      .slice()
      .map(article => ({
        ...article,
        interactionRate: calculateInteractionRate(article)
      }))
      .sort((a, b) => b.interactionRate - a.interactionRate)
      .slice(0, 5)
  }, [articles])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">AI增强选题分析</h1>
              <p className="text-gray-600">基于公众号数据，结合GPT-4o深度分析，提供智能洞察和创作建议</p>
            </div>

            {/* 历史记录按钮 */}
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <HistoryIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">查询历史记录</span>
            </button>
          </div>

          {/* AI服务状态 */}
          {isClient && (
            <div className="flex items-center space-x-4 mt-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                aiServiceStatus.available
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              }`}>
                {aiServiceStatus.available ? (
                  <>
                    <BrainIcon className="w-4 h-4" />
                    <span>AI分析可用</span>
                  </>
                ) : (
                  <>
                    <AlertCircleIcon className="w-4 h-4" />
                    <span>AI分析不可用</span>
                  </>
                )}
              </div>

              {aiServiceStatus.available && (
                <div className="text-sm text-gray-500">
                  模型: {getAIConfig().model} | 温度: {getAIConfig().temperature}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                <label htmlFor="keyword-input" className="sr-only">搜索关键词</label>
                <input
                  id="keyword-input"
                  type="text"
                  value={keyword}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  placeholder="输入关键词进行分析，如：AI创业、内容营销..."
                  className="input pl-10 w-full"
                  onKeyDown={(e) => e.key === 'Enter' && handleStartAnalysis()}
                  aria-describedby="search-help"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleStartAnalysis}
                disabled={!keyword.trim() || isAnalyzing}
                className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCwIcon className="w-4 h-4 animate-spin" />
                    <span>分析中...</span>
                  </>
                ) : (
                  <>
                    <BrainIcon className="w-4 h-4" />
                    <span>AI分析</span>
                  </>
                )}
              </button>
              <button
                onClick={handleClear}
                className="btn btn-secondary"
              >
                清空
              </button>
            </div>
          </div>

          {/* 热门搜索 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">热门搜索：</span>
            <div id="popular-keywords" className="flex flex-wrap gap-2">
              {recentKeywords.map((kw, index) => (
                <button
                  key={`popular-keyword-${index}`}
                  onClick={() => setKeyword(kw)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  aria-label={`搜索关键词: ${kw}`}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* 滑动条 - 文章数量 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              分析文章数量 <span className="text-orange-600 font-bold">({maxResults}篇文章)</span>
            </label>
            <div className="relative">
              <style jsx>{`
                .article-slider {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 100%;
                  height: 8px;
                  border-radius: 5px;
                  background: linear-gradient(to right, #f97316, #dc2626);
                  outline: none;
                  opacity: 0.9;
                  transition: opacity 0.2s;
                }

                .article-slider:hover {
                  opacity: 1;
                }

                .article-slider::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: #3b82f6;
                  cursor: pointer;
                  border: 3px solid white;
                  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                  transition: all 0.2s;
                }

                .article-slider::-webkit-slider-thumb:hover {
                  transform: scale(1.1);
                  box-shadow: 0 0 15px rgba(59, 130, 246, 0.7);
                }

                .article-slider::-moz-range-thumb {
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: #3b82f6;
                  cursor: pointer;
                  border: 3px solid white;
                  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                  transition: all 0.2s;
                }

                .article-slider::-moz-range-thumb:hover {
                  transform: scale(1.1);
                  box-shadow: 0 0 15px rgba(59, 130, 246, 0.7);
                }

                .article-slider:disabled {
                  opacity: 0.5;
                  cursor: not-allowed;
                }

                .article-slider:disabled::-webkit-slider-thumb {
                  cursor: not-allowed;
                  transform: scale(1);
                }

                .article-slider:disabled::-moz-range-thumb {
                  cursor: not-allowed;
                  transform: scale(1);
                }
              `}</style>
              <input
                type="range"
                min="5"
                max="30"
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value))}
                className="article-slider"
                disabled={isAnalyzing}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-3">
                <span className="font-medium">5篇</span>
                <span className="font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  快速分析
                </span>
                <span className="font-medium">15篇</span>
                <span className="font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  推荐
                </span>
                <span className="font-medium">22篇</span>
                <span className="font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  全面分析
                </span>
                <span className="font-medium">30篇</span>
              </div>
            </div>
          </div>
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

        {/* 增强的分析进度 */}
        {isAnalyzing && analysisProgress && (
          <div className="card p-6 mb-8">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">分析进度</h3>
                <span className="text-sm text-gray-500">
                  {getProgressPercentage(analysisProgress)}%
                </span>
              </div>

              {/* 进度条 */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4" role="progressbar"
                   aria-valuenow={getProgressPercentage(analysisProgress)}
                   aria-valuemin={0}
                   aria-valuemax={100}
                   aria-label="分析进度">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${getProgressPercentage(analysisProgress)}%` }}
                />
              </div>

              {/* 当前步骤 */}
              <div className="flex items-center space-x-3 mb-2">
                {analysisProgress.phase === 'fetching' && <SearchIcon2 className="w-5 h-5 text-blue-600" aria-hidden="true" />}
                {analysisProgress.phase === 'filtering' && <FilterIcon className="w-5 h-5 text-blue-600" aria-hidden="true" />}
                {analysisProgress.phase === 'summarizing' && <BrainIcon className="w-5 h-5 text-purple-600" aria-hidden="true" />}
                {analysisProgress.phase === 'extracting' && <ZapIcon className="w-5 h-5 text-purple-600" aria-hidden="true" />}
                {analysisProgress.phase === 'generating' && <LightbulbIcon className="w-5 h-5 text-purple-600" aria-hidden="true" />}
                {analysisProgress.phase === 'completed' && <CheckIcon className="w-5 h-5 text-green-600" aria-hidden="true" />}
                {analysisProgress.phase === 'error' && <AlertCircleIcon className="w-5 h-5 text-red-600" aria-hidden="true" />}

                <div>
                  <p className="font-medium text-gray-900" role="status" aria-live="polite">{analysisProgress.message}</p>
                  {analysisProgress.aiStep && (
                    <p className="text-sm text-gray-600">{analysisProgress.aiStep}</p>
                  )}
                </div>
              </div>

              {/* 当前处理的文章 */}
              {analysisProgress.currentArticle && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">当前处理:</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{analysisProgress.currentArticle}</p>
                </div>
              )}

              {/* 预估剩余时间 */}
              {analysisProgress.estimatedTime && (
                <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                  <ClockIcon className="w-4 h-4" />
                  <span>预计剩余时间: {Math.ceil(analysisProgress.estimatedTime / 60)}分钟</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 分析结果展示 */}
        {showResults && completeAnalysisResult && (
          <div className="space-y-8">
            {/* 基础统计概览 */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">数据概览</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {completeAnalysisResult.totalArticles.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">分析文章数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {completeAnalysisResult.basicStats.avgRead.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">平均阅读量</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {completeAnalysisResult.basicStats.avgLike.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">平均点赞量</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {completeAnalysisResult.basicStats.originalRate}%
                  </div>
                  <div className="text-sm text-gray-600">原创内容率</div>
                </div>
              </div>
            </div>

            {/* TOP文章展示 */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* 点赞TOP5 */}
              <div className="card p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600">❤️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">点赞量最高的5篇文章</h3>
                </div>
                <div className="space-y-3">
                  {topLikedArticles
                    .map((article, index) => (
                      <article key={`top-like-${article.publish_time}-${index}`} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-medium" aria-label={`排名第${index + 1}`}>
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{article.title}</h4>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center space-x-1" aria-label={`点赞数: ${(article.praise || 0).toLocaleString()}`}>
                                <span aria-hidden="true">❤️</span>
                                <span>{(article.praise || 0).toLocaleString()}</span>
                              </span>
                              <span className="flex items-center space-x-1" aria-label={`阅读量: ${(article.read || 0).toLocaleString()}`}>
                                <span aria-hidden="true">👁️</span>
                                <span>{(article.read || 0).toLocaleString()}</span>
                              </span>
                              {article.is_original === 1 && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">原创</span>
                              )}
                            </div>
                            {/* 查看原文链接 */}
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                              aria-label={`查看原文: ${article.title}`}
                            >
                              <span>查看原文</span>
                              <ExternalLinkIcon className="w-3 h-3" aria-hidden="true" />
                            </a>
                          </div>
                        </div>
                      </article>
                    ))}
                </div>
              </div>

              {/* 互动率TOP5 */}
              <div className="card p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600">💬</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">互动率最高的5篇文章</h3>
                </div>
                <div className="space-y-3">
                  {topInteractionArticles
                    .map((article, index) => (
                      <article key={`top-interaction-${article.publish_time}-${index}`} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium" aria-label={`排名第${index + 1}`}>
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{article.title}</h4>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center space-x-1" aria-label={`互动率: ${article.interactionRate.toFixed(1)}%`}>
                                <span aria-hidden="true">📊</span>
                                <span>互动率 {article.interactionRate.toFixed(1)}%</span>
                              </span>
                              <span className="flex items-center space-x-1" aria-label={`在看数: ${article.looking || 0}`}>
                                <span aria-hidden="true">💬</span>
                                <span>{article.looking || 0} 在看</span>
                              </span>
                              {article.is_original === 1 && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">原创</span>
                              )}
                            </div>
                            {/* 查看原文链接 */}
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                              aria-label={`查看原文: ${article.title}`}
                            >
                              <span>查看原文</span>
                              <ExternalLinkIcon className="w-3 h-3" aria-hidden="true" />
                            </a>
                          </div>
                        </div>
                      </article>
                    ))}
                </div>
              </div>
            </div>

            {/* 高频词云展示 */}
            {articles.length > 0 && (
              <section className="card p-6" aria-labelledby="wordcloud-heading">
                <div className="flex items-center space-x-2 mb-4">
                  <CloudIcon className="w-5 h-5 text-blue-500" aria-hidden="true" />
                  <h3 id="wordcloud-heading" className="text-lg font-semibold text-gray-900">高频词云</h3>
                </div>
                {completeAnalysisResult.wordCloud && completeAnalysisResult.wordCloud.length > 0 ? (
                  <div className="flex flex-wrap gap-2" role="list" aria-label="关键词词云">
                    {completeAnalysisResult.wordCloud.map((item: { word: string; count: number }, index: number) => (
                      <span
                        key={`wordcloud-${item.word}-${index}`}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                        style={{
                          fontSize: `${Math.max(12, Math.min(20, item.count / 2))}px`,
                          opacity: Math.max(0.6, Math.min(1, item.count / 50))
                        }}
                        title={`出现次数: ${item.count}`}
                        role="listitem"
                        aria-label={`关键词: ${item.word}, 出现次数: ${item.count}`}
                      >
                        {item.word} ({item.count})
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CloudIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                    <p className="text-gray-500">词云数据生成中...</p>
                    <p className="text-sm text-gray-400 mt-2">
                      基于 {articles.length} 篇文章的标题分析关键词
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* 数据分析板块 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 阅读量分布柱状图 */}
              <ReadDistributionChart articles={articles} />

              {/* 发布时间分析 */}
              <PublishTimeAnalysis articles={articles} />
            </div>

            {/* 选题洞察分析 */}
            <div className="space-y-8">
              {/* 结构化选题洞察（优先展示） */}
              {(() => {
                console.log('🔍 检查结构化选题洞察:', {
                  hasStructuredTopicInsights: !!completeAnalysisResult.structuredTopicInsights,
                  length: completeAnalysisResult.structuredTopicInsights?.length || 0,
                  aiAvailable: completeAnalysisResult.metadata?.modelUsed !== 'rule-based',
                  modelUsed: completeAnalysisResult.metadata?.modelUsed,
                  topArticleInsightsCount: completeAnalysisResult.topArticleInsights?.length || 0
                });
                return completeAnalysisResult.structuredTopicInsights && completeAnalysisResult.structuredTopicInsights.length > 0;
              })() && (
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600">🎯</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      AI结构化选题洞察 ({completeAnalysisResult.structuredTopicInsights.length}条)
                    </h3>
                  </div>
                  <StructuredTopicInsights
                    insights={completeAnalysisResult.structuredTopicInsights}
                    maxItems={10}
                  />
                </div>
              )}

              {/* 传统洞察展示（作为补充） */}
              {(completeAnalysisResult.aiInsights.length > 0 || completeAnalysisResult.ruleInsights.length > 0) && (
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600">📊</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      传统分析洞察
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* AI洞察 */}
                    {completeAnalysisResult.aiInsights.length > 0 && (
                      <div>
                        <InsightList
                          insights={completeAnalysisResult.aiInsights}
                          title={`🤖 AI深度洞察 (${completeAnalysisResult.aiInsights.length}条)`}
                          maxItems={7}
                        />
                      </div>
                    )}

                    {/* 规则洞察 */}
                    {completeAnalysisResult.ruleInsights.length > 0 && (
                      <div>
                        <InsightList
                          insights={completeAnalysisResult.ruleInsights}
                          title={`📈 数据分析洞察 (${completeAnalysisResult.ruleInsights.length}条)`}
                          maxItems={5}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 完整文章列表展示 */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600">📄</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">全部文章列表 ({articles.length}篇)</h3>
                </div>
              </div>
              <ArticleList
                articles={articles}
                title=""
                maxArticles={articles.length}
                showMetrics="all"
              />
            </div>

            {/* 分析元数据 */}
            <div className="card p-4 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  分析模型: {completeAnalysisResult.metadata.modelUsed} |
                  处理时间: {completeAnalysisResult.metadata.processingTime}秒 |
                  版本: {completeAnalysisResult.metadata.analysisVersion}
                </div>
                <div>
                  {new Date(completeAnalysisResult.metadata.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 历史记录弹窗 */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        type="wechat"
      />
    </div>
  )
}