'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { InsightList } from '@/components/InsightCard'
import ArticleList from '@/components/ArticleList'
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
  CloudIcon
} from 'lucide-react'
import {
  searchWechatArticles,
  WechatArticle
} from '@/services/wechatService'
import {
  analyzeArticlesWithAI,
  getAnalysisEstimate,
  CompleteAnalysisResult,
  EnhancedAnalysisProgress
} from '@/services/insightService'
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
  const [isClient, setIsClient] = useState(false)

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

    setIsClient(true)
    fetchAIStatus()
  }, [])

  // 计算进度百分比
  const getProgressPercentage = (progress: EnhancedAnalysisProgress): number => {
    return Math.round((progress.current / progress.total) * 100)
  }

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

      // 获取多页数据来凑足30篇文章
      let allArticles: WechatArticle[] = []
      let currentPage = 1
      const targetCount = 30

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
          aiSummaries: analysisResult.aiSummaries,
          structuredInfo: analysisResult.structuredInfo,
          aiInsights: analysisResult.aiInsights,
          ruleInsights: analysisResult.ruleInsights,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI增强选题分析</h1>
          <p className="text-gray-600">基于公众号数据，结合GPT-4o深度分析，提供智能洞察和创作建议</p>

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
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  placeholder="输入关键词进行分析，如：AI创业、内容营销..."
                  className="input pl-10 w-full"
                  onKeyDown={(e) => e.key === 'Enter' && handleStartAnalysis()}
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

          {/* 历史记录 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">热门搜索：</span>
            <div className="flex flex-wrap gap-2">
              {recentKeywords.map((kw, index) => (
                <button
                  key={index}
                  onClick={() => setKeyword(kw)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {kw}
                </button>
              ))}
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
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${getProgressPercentage(analysisProgress)}%` }}
                />
              </div>

              {/* 当前步骤 */}
              <div className="flex items-center space-x-3 mb-2">
                {analysisProgress.phase === 'fetching' && <SearchIcon2 className="w-5 h-5 text-blue-600" />}
                {analysisProgress.phase === 'filtering' && <FilterIcon className="w-5 h-5 text-blue-600" />}
                {analysisProgress.phase === 'summarizing' && <BrainIcon className="w-5 h-5 text-purple-600" />}
                {analysisProgress.phase === 'extracting' && <ZapIcon className="w-5 h-5 text-purple-600" />}
                {analysisProgress.phase === 'generating' && <LightbulbIcon className="w-5 h-5 text-purple-600" />}
                {analysisProgress.phase === 'completed' && <CheckIcon className="w-5 h-5 text-green-600" />}
                {analysisProgress.phase === 'error' && <AlertCircleIcon className="w-5 h-5 text-red-600" />}

                <div>
                  <p className="font-medium text-gray-900">{analysisProgress.message}</p>
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
                  {articles
                    .sort((a, b) => b.like_num - a.like_num)
                    .slice(0, 5)
                    .map((article, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{article.title}</h4>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <span>❤️</span>
                                <span>{(article.like_num || article.praise || 0).toLocaleString()}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <span>👁️</span>
                                <span>{(article.read_num || article.read || 0).toLocaleString()}</span>
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
                            >
                              <span>查看原文</span>
                              <ExternalLinkIcon className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
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
                  {articles
                    .map(article => ({
                      ...article,
                      interactionRate: article.read_num > 0 ? ((article.like_num + (article.comment_num || article.looking || 0)) / article.read_num * 100) : 0
                    }))
                    .sort((a, b) => b.interactionRate - a.interactionRate)
                    .slice(0, 5)
                    .map((article, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{article.title}</h4>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <span>📊</span>
                                <span>互动率 {article.interactionRate.toFixed(1)}%</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <span>💬</span>
                                <span>{article.comment_num || article.looking || 0} 评论</span>
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
                            >
                              <span>查看原文</span>
                              <ExternalLinkIcon className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* 高频词云展示 */}
            {completeAnalysisResult.wordCloud && completeAnalysisResult.wordCloud.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CloudIcon className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">高频词云</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {completeAnalysisResult.wordCloud.map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                      style={{
                        fontSize: `${Math.max(12, Math.min(20, item.count / 2))}px`,
                        opacity: Math.max(0.6, Math.min(1, item.count / 50))
                      }}
                      title={`出现次数: ${item.count}`}
                    >
                      {item.word} ({item.count})
                    </span>
                  ))}
                </div>
              </div>
            )}

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

            {/* AI洞察展示 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* AI洞察 */}
              {completeAnalysisResult.aiInsights.length > 0 && (
                <div>
                  <InsightList
                    insights={completeAnalysisResult.aiInsights}
                    title={`🤖 AI深度洞察 (${completeAnalysisResult.aiInsights.length}条)`}
                    maxItems={5}
                  />
                </div>
              )}

              {/* 规则洞察 */}
              {completeAnalysisResult.ruleInsights.length > 0 && (
                <div>
                  <InsightList
                    insights={completeAnalysisResult.ruleInsights}
                    title={`📊 数据分析洞察 (${completeAnalysisResult.ruleInsights.length}条)`}
                    maxItems={5}
                  />
                </div>
              )}
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
    </div>
  )
}