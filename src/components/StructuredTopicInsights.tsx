import React, { useState, useMemo, useCallback } from 'react'
import { StructuredTopicInsight } from '@/types'
import {
  TrendingUpIcon,
  TargetIcon,
  LightbulbIcon,
  BarChart3Icon,
  UsersIcon,
  AlertCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from 'lucide-react'

interface StructuredTopicInsightsProps {
  insights: StructuredTopicInsight[]
  maxItems?: number
}

export const StructuredTopicInsights = React.memo(function StructuredTopicInsights({ insights, maxItems = 10 }: StructuredTopicInsightsProps) {
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set())

  const toggleInsight = useCallback((insightId: string) => {
    setExpandedInsights(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(insightId)) {
        newExpanded.delete(insightId)
      } else {
        newExpanded.add(insightId)
      }
      return newExpanded
    })
  }, [])

  const displayInsights = useMemo(() => insights.slice(0, maxItems), [insights, maxItems])

  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const getDifficultyText = useCallback((difficulty: string) => {
    switch (difficulty) {
      case 'low': return '低难度'
      case 'medium': return '中等难度'
      case 'high': return '高难度'
      default: return '未知'
    }
  }, [])

  const getConfidenceColor = useCallback((confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }, [])

  if (displayInsights.length === 0) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <AlertCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无结构化选题洞察</h3>
          <p className="text-gray-500">请先确保AI分析功能正常配置并运行分析</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {displayInsights.map((insight, index) => {
        const isExpanded = expandedInsights.has(insight.id)

        return (
          <div key={insight.id} className="card p-6 hover:shadow-lg transition-shadow">
            {/* 洞察头部 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                    {insight.title}
                  </h3>
                </div>

                {/* 核心发现 */}
                <p className="text-gray-700 mb-3 leading-relaxed">
                  {insight.coreFinding}
                </p>

                {/* 标签和指标 */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(insight.difficulty)}`}>
                    {getDifficultyText(insight.difficulty)}
                  </span>

                  <span className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                    置信度: {Math.round(insight.confidence * 100)}%
                  </span>

                  {insight.estimatedImpact && (
                    <span className="text-gray-500 text-xs">
                      预估影响: {insight.estimatedImpact}
                    </span>
                  )}
                </div>
              </div>

              {/* 展开/收起按钮 */}
              <button
                onClick={() => toggleInsight(insight.id)}
                className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={isExpanded ? '收起详情' : '展开详情'}
              >
                {isExpanded ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>

            {/* 详细信息（可展开） */}
            {isExpanded && (
              <div className="border-t pt-4 mt-4 space-y-4">
                {/* 数据支撑 */}
                {insight.dataSupport && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart3Icon className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-gray-900">数据支撑</h4>
                    </div>
                    {Array.isArray(insight.dataSupport) ? (
                      // 如果是数组格式
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {insight.dataSupport.map((data, dataIndex) => (
                          <div key={`data-${insight.id}-${dataIndex}`} className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-blue-900">{data.metric}</span>
                              <span className="text-sm font-bold text-blue-700">{data.value}</span>
                            </div>
                            <p className="text-xs text-blue-700">{data.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // 如果是对象格式（历史记录中的格式）
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-blue-900">平均阅读量</span>
                            <span className="text-sm font-bold text-blue-700">{insight.dataSupport.avgRead || 0}</span>
                          </div>
                          <p className="text-xs text-blue-700">文章平均阅读次数</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-blue-900">平均点赞数</span>
                            <span className="text-sm font-bold text-blue-700">{insight.dataSupport.avgLike || 0}</span>
                          </div>
                          <p className="text-xs text-blue-700">文章平均点赞次数</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-blue-900">点赞率</span>
                            <span className="text-sm font-bold text-blue-700">{insight.dataSupport.likeRate || 0}%</span>
                          </div>
                          <p className="text-xs text-blue-700">点赞与阅读比率</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-blue-900">样本数量</span>
                            <span className="text-sm font-bold text-blue-700">{insight.dataSupport.sampleSize || 0}</span>
                          </div>
                          <p className="text-xs text-blue-700">分析的文章总数</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 关键词分析 */}
                {insight.keywordAnalysis && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insight.keywordAnalysis.highFrequency && insight.keywordAnalysis.highFrequency.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUpIcon className="w-4 h-4 text-green-600" />
                          <h4 className="font-medium text-gray-900">高频词</h4>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {insight.keywordAnalysis.highFrequency.map((word, wordIndex) => (
                            <span key={`hf-${insight.id}-${wordIndex}`} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(insight.keywordAnalysis.missingKeywords || insight.keywordAnalysis.opportunity) &&
                     (insight.keywordAnalysis.missingKeywords || insight.keywordAnalysis.opportunity).length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <TargetIcon className="w-4 h-4 text-orange-600" />
                          <h4 className="font-medium text-gray-900">机会关键词</h4>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(insight.keywordAnalysis.missingKeywords || insight.keywordAnalysis.opportunity || []).map((word, wordIndex) => (
                            <span key={`mk-${insight.id}-${wordIndex}`} className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 推荐选题 */}
                {insight.recommendedTopics && insight.recommendedTopics.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <LightbulbIcon className="w-4 h-4 text-purple-600" />
                      <h4 className="font-medium text-gray-900">推荐选题方向</h4>
                    </div>
                    <ul className="space-y-1">
                      {insight.recommendedTopics.map((topic, topicIndex) => (
                        <li key={`topic-${insight.id}-${topicIndex}`} className="flex items-start space-x-2">
                          <span className="text-purple-600 mt-1">•</span>
                          <span className="text-sm text-gray-700">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 内容策略 */}
                {insight.contentStrategy && insight.contentStrategy.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <TargetIcon className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-medium text-gray-900">内容策略</h4>
                    </div>
                    <ul className="space-y-1">
                      {insight.contentStrategy.map((strategy, strategyIndex) => (
                        <li key={`strategy-${insight.id}-${strategyIndex}`} className="flex items-start space-x-2">
                          <span className="text-indigo-600 mt-1">•</span>
                          <span className="text-sm text-gray-700">{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 目标受众 */}
                {insight.targetAudience && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <UsersIcon className="w-4 h-4 text-cyan-600" />
                      <h4 className="font-medium text-gray-900">目标受众</h4>
                    </div>
                    {typeof insight.targetAudience === 'string' ? (
                      <div className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs">
                        {insight.targetAudience}
                      </div>
                    ) : insight.targetAudience.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {insight.targetAudience.map((audience, audienceIndex) => (
                          <span key={`audience-${insight.id}-${audienceIndex}`} className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs">
                            {audience}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* 相关文章 */}
                {insight.relatedArticles && insight.relatedArticles.length > 0 && (
                  <div className="text-xs text-gray-500">
                    <strong>相关文章数:</strong> {insight.relatedArticles.length}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* 显示更多提示 */}
      {insights.length > maxItems && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            还有 {insights.length - maxItems} 条洞察未显示
          </p>
        </div>
      )}
    </div>
  )
})