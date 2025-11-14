'use client'

import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import { XiaohongshuNoteList } from '@/components/XiaohongshuNoteList'
// import { XiaohongshuAnalytics } from '@/components/XiaohongshuAnalytics'
import { XiaohongshuStructuredInsights } from '@/components/XiaohongshuStructuredInsights'
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
  HeartIcon,
  BookmarkIcon,
  MessageCircleIcon,
  PlayIcon,
  Image as ImageIcon,
  HashIcon
} from 'lucide-react'
import {
  searchXiaohongshuNotes,
  analyzeWithAI,
  XiaohongshuNote,
  XiaohongshuSearchParams,
  XiaohongshuCompleteAnalysisResult,
  XiaohongshuAnalysisProgress
} from '@/services/xiaohongshuService'
import {
  checkAIServiceAvailability,
  getAIConfig
} from '@/services/aiService'

export default function XiaohongshuAnalysisPage() {
  const [keyword, setKeyword] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<XiaohongshuNote[]>([])
  const [completeAnalysisResult, setCompleteAnalysisResult] = useState<XiaohongshuCompleteAnalysisResult | null>(null)
  const [analysisProgress, setAnalysisProgress] = useState<XiaohongshuAnalysisProgress | null>(null)
  const [aiServiceStatus, setAiServiceStatus] = useState<{available: boolean; error?: string; configured: boolean}>({available: false, configured: false})
  const [isClient, setIsClient] = useState(false)
  const [searchParams, setSearchParams] = useState<XiaohongshuSearchParams>({
    keyword: '',
    sortType: 'popularity',
    contentType: 'all',
    timeRange: 7,
    minLikes: 10,
    maxResults: 30,
    page: 1
  })

  const recentKeywords = ['护肤分享', '穿搭推荐', '美食测评', '家居好物', '旅行攻略', '学习笔记']

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
  const getProgressPercentage = useCallback((progress: XiaohongshuAnalysisProgress): number => {
    return Math.round((progress.current / progress.total) * 100)
  }, [])

  const handleStartAnalysis = async () => {
    if (!keyword.trim()) return

    setIsAnalyzing(true)
    setShowResults(false)
    setError(null)
    setNotes([])
    setCompleteAnalysisResult(null)
    setAnalysisProgress(null)

    try {
      // 更新搜索参数
      const finalSearchParams: XiaohongshuSearchParams = {
        ...searchParams,
        keyword: keyword.trim()
      }
      setSearchParams(finalSearchParams)

      // 步骤1: 获取数据
      setAnalysisProgress({
        phase: 'fetching',
        message: '正在获取小红书笔记数据...',
        current: 0,
        total: 100,
        aiStep: '连接数据源'
      })

      // 获取多页数据来凑足目标数量
      let allNotes: XiaohongshuNote[] = []
      let currentPage = 1
      const targetCount = finalSearchParams.maxResults || 30

      while (allNotes.length < targetCount && currentPage <= 3) { // 最多获取3页
        const searchResponse = await searchXiaohongshuNotes({
          ...finalSearchParams,
          page: currentPage
        })

        if (searchResponse.data.length === 0) {
          break // 没有更多数据了
        }

        allNotes = [...allNotes, ...searchResponse.data]
        currentPage++

        // 更新进度
        setAnalysisProgress({
          phase: 'fetching',
          message: `正在获取第${currentPage}页数据...`,
          current: allNotes.length,
          total: targetCount,
          aiStep: `已获取 ${allNotes.length} 篇笔记`
        })
      }

      // 只取前目标数量
      allNotes = allNotes.slice(0, targetCount)

      if (allNotes.length === 0) {
        throw new Error(`未找到关于"${keyword}"的相关笔记`)
      }

      setNotes(allNotes)

      // 步骤2: AI增强分析
      const analysisResult = await analyzeWithAI(
        allNotes,
        keyword.trim(),
        (progress) => {
          setAnalysisProgress(progress)
        }
      )

      setCompleteAnalysisResult(analysisResult)

      // 步骤3: 保存分析结果（可选）
      // TODO: 实现保存功能

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

  const handleClear = () => {
    setKeyword('')
    setShowResults(false)
    setAnalysisProgress(null)
    setError(null)
    setNotes([])
    setCompleteAnalysisResult(null)
  }

  const handleKeywordChange = (value: string) => {
    setKeyword(value)
    setSearchParams(prev => ({ ...prev, keyword: value }))
  }

  // 计算TOP笔记
  const topLikedNotes = notes
    .slice()
    .sort((a, b) => b.metrics.likes - a.metrics.likes)
    .slice(0, 5)

  const topCollectedNotes = notes
    .slice()
    .sort((a, b) => b.metrics.collects - a.metrics.collects)
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">小红书选题分析</h1>
          <p className="text-gray-600">基于小红书数据，结合GPT-4o深度分析，提供智能洞察和创作建议</p>

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
                  placeholder="输入关键词进行分析，如：护肤分享、穿搭推荐..."
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

          {/* 搜索选项 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序方式</label>
              <select
                value={searchParams.sortType}
                onChange={(e) => setSearchParams(prev => ({ ...prev, sortType: e.target.value as any }))}
                className="input text-sm"
                disabled={isAnalyzing}
              >
                <option value="popularity">综合热度</option>
                <option value="likes">点赞最多</option>
                <option value="collects">收藏最多</option>
                <option value="time">最新发布</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">内容类型</label>
              <select
                value={searchParams.contentType}
                onChange={(e) => setSearchParams(prev => ({ ...prev, contentType: e.target.value as any }))}
                className="input text-sm"
                disabled={isAnalyzing}
              >
                <option value="all">全部类型</option>
                <option value="image">图文笔记</option>
                <option value="video">视频笔记</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">时间范围</label>
              <select
                value={searchParams.timeRange}
                onChange={(e) => setSearchParams(prev => ({ ...prev, timeRange: parseInt(e.target.value) as any }))}
                className="input text-sm"
                disabled={isAnalyzing}
              >
                <option value={1}>最近1天</option>
                <option value={7}>最近7天</option>
                <option value={30}>最近30天</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最少点赞</label>
              <input
                type="number"
                value={searchParams.minLikes}
                onChange={(e) => setSearchParams(prev => ({ ...prev, minLikes: parseInt(e.target.value) || 0 }))}
                className="input text-sm"
                min="0"
                disabled={isAnalyzing}
              />
            </div>
          </div>

          {/* 热门关键词 */}
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

        {/* 分析进度 */}
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
                  className="bg-gradient-to-r from-pink-500 to-red-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${getProgressPercentage(analysisProgress)}%` }}
                />
              </div>

              {/* 当前步骤 */}
              <div className="flex items-center space-x-3 mb-2">
                {analysisProgress.phase === 'fetching' && <SearchIcon2 className="w-5 h-5 text-pink-600" aria-hidden="true" />}
                {analysisProgress.phase === 'analyzing' && <BrainIcon className="w-5 h-5 text-red-600" aria-hidden="true" />}
                {analysisProgress.phase === 'completed' && <CheckIcon className="w-5 h-5 text-green-600" aria-hidden="true" />}
                {analysisProgress.phase === 'error' && <AlertCircleIcon className="w-5 h-5 text-red-600" aria-hidden="true" />}

                <div>
                  <p className="font-medium text-gray-900" role="status" aria-live="polite">{analysisProgress.message}</p>
                  {analysisProgress.aiStep && (
                    <p className="text-sm text-gray-600">{analysisProgress.aiStep}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 分析结果展示 */}
        {showResults && completeAnalysisResult && (
          <div className="space-y-8">
            {/* 基础数据概览 */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">数据概览</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {completeAnalysisResult.totalNotes}
                  </div>
                  <div className="text-sm text-gray-600">分析笔记数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {completeAnalysisResult.avgLikes >= 10000 ? `${(completeAnalysisResult.avgLikes/10000).toFixed(1)}w` :
                     completeAnalysisResult.avgLikes >= 1000 ? `${(completeAnalysisResult.avgLikes/1000).toFixed(1)}k` :
                     completeAnalysisResult.avgLikes.toString()}
                  </div>
                  <div className="text-sm text-gray-600">平均点赞量</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-1">
                    {completeAnalysisResult.avgCollects >= 10000 ? `${(completeAnalysisResult.avgCollects/10000).toFixed(1)}w` :
                     completeAnalysisResult.avgCollects >= 1000 ? `${(completeAnalysisResult.avgCollects/1000).toFixed(1)}k` :
                     completeAnalysisResult.avgCollects.toString()}
                  </div>
                  <div className="text-sm text-gray-600">平均收藏量</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {completeAnalysisResult.avgInteractionRate}%
                  </div>
                  <div className="text-sm text-gray-600">平均互动率</div>
                </div>
              </div>
            </div>

            {/* TOP内容展示 */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* 点赞TOP5 */}
              <div className="card p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <HeartIcon className="w-4 h-4 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">点赞量最高的5篇笔记</h3>
                </div>
                <XiaohongshuNoteList
                  notes={topLikedNotes}
                  showMetrics="detailed"
                />
              </div>

              {/* 收藏TOP5 */}
              <div className="card p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <BookmarkIcon className="w-4 h-4 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">收藏量最高的5篇笔记</h3>
                </div>
                <XiaohongshuNoteList
                  notes={topCollectedNotes}
                  showMetrics="detailed"
                />
              </div>
            </div>

            {/* 热门标签云 */}
            {completeAnalysisResult.wordCloud.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <HashIcon className="w-5 h-5 text-green-500" aria-hidden="true" />
                  <h3 className="text-lg font-semibold text-gray-900">热门标签云</h3>
                </div>
                <div className="flex flex-wrap gap-2" role="list" aria-label="热门标签">
                  {completeAnalysisResult.wordCloud.map((item, index) => (
                    <span
                      key={`tagcloud-${item.word}-${index}`}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
                      style={{
                        fontSize: `${Math.max(12, Math.min(18, item.count / 3))}px`,
                        opacity: Math.max(0.7, Math.min(1, item.count / 20))
                      }}
                      title={`出现次数: ${item.count}`}
                      role="listitem"
                    >
                      #{item.word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 结构化选题洞察 */}
            {completeAnalysisResult.structuredTopicInsights.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600">🎯</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    AI结构化选题洞察 ({completeAnalysisResult.structuredTopicInsights.length}条)
                  </h3>
                </div>
                <XiaohongshuStructuredInsights
                  insights={completeAnalysisResult.structuredTopicInsights}
                  maxItems={10}
                />
              </div>
            )}

            {/* 全部笔记列表 */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600">📝</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">全部笔记列表 ({notes.length}篇)</h3>
                </div>
              </div>
              <XiaohongshuNoteList
                notes={notes}
                showMetrics="all"
              />
            </div>

            {/* 分析元数据 */}
            <div className="card p-4 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  分析模型: {completeAnalysisResult.metadata.modelUsed} |
                  处理时间: {completeAnalysisResult.metadata.analysisTime}秒 |
                  版本: {completeAnalysisResult.metadata.version}
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