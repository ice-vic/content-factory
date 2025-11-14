'use client'

import { useState } from 'react'
import { XiaohongshuStructuredTopicInsight } from '@/types/xiaohongshu'
import {
  TargetIcon,
  LightbulbIcon,
  TrendingUpIcon,
  ClockIcon,
  PlayIcon,
  Image as ImageIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HashIcon
} from 'lucide-react'

interface XiaohongshuStructuredInsightsProps {
  insights: XiaohongshuStructuredTopicInsight[]
  maxItems?: number
}

export function XiaohongshuStructuredInsights({
  insights,
  maxItems = 10
}: XiaohongshuStructuredInsightsProps) {
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set())
  const displayInsights = insights.slice(0, maxItems)

  const toggleInsight = (insightId: string) => {
    setExpandedInsights(prev => {
      const newSet = new Set(prev)
      if (newSet.has(insightId)) {
        newSet.delete(insightId)
      } else {
        newSet.add(insightId)
      }
      return newSet
    })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return '高'
    if (confidence >= 0.6) return '中'
    return '低'
  }

  return (
    <div className="space-y-6">
      {displayInsights.map((insight, index) => {
        const isExpanded = expandedInsights.has(insight.id)

        return (
          <div key={insight.id} className="card p-6">
            {/* 洞察头部 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">{insight.coreFinding}</p>
              </div>

              <button
                onClick={() => toggleInsight(insight.id)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors ml-4"
              >
                {isExpanded ? (
                  <>
                    <span className="text-sm">收起</span>
                    <ChevronUpIcon className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span className="text-sm">展开</span>
                    <ChevronDownIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* 核心推荐主题 */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <LightbulbIcon className="w-4 h-4" />
                <span>推荐创作主题</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {insight.recommendedTopics.map((topic, topicIndex) => (
                  <div key={topicIndex} className="flex items-center space-x-2 p-2 bg-purple-50 rounded-lg">
                    <CheckCircleIcon className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span className="text-sm text-purple-800">{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 展开的详细内容 */}
            {isExpanded && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                {/* 目标受众 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <TargetIcon className="w-4 h-4" />
                    <span>目标受众</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {insight.targetAudience.map((audience, audienceIndex) => (
                      <span key={audienceIndex} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                        {audience}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 内容策略 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <LightbulbIcon className="w-4 h-4" />
                    <span>内容策略</span>
                  </h4>
                  <ul className="space-y-1">
                    {insight.contentStrategy.map((strategy, strategyIndex) => (
                      <li key={strategyIndex} className="flex items-start space-x-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span className="text-sm text-gray-700">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 标签策略 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <HashIcon className="w-4 h-4" />
                    <span>推荐标签</span>
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {insight.hashtagStrategy.map((hashtag, hashtagIndex) => (
                      <span key={hashtagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {hashtag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 最佳发布时间 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <ClockIcon className="w-4 h-4" />
                    <span>最佳发布时间</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {insight.bestPostTime.map((time, timeIndex) => (
                      <span key={timeIndex} className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
                        {time}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 内容形式推荐 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    {insight.contentTypeRecommendation.type === 'video' ? (
                      <PlayIcon className="w-4 h-4" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                    <span>推荐内容形式</span>
                  </h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {insight.contentTypeRecommendation.type === 'video' ? '视频笔记' : '图文笔记'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(insight.trendAnalysis.confidence)}`}>
                        置信度 {getConfidenceText(insight.trendAnalysis.confidence)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{insight.contentTypeRecommendation.reasoning}</p>
                  </div>
                </div>

                {/* 趋势分析 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <TrendingUpIcon className="w-4 h-4" />
                    <span>趋势分析</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm text-green-800">当前趋势</span>
                      <span className="text-sm font-medium text-green-900">{insight.trendAnalysis.currentTrend}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="text-sm text-blue-800">预测趋势</span>
                      <span className="text-sm font-medium text-blue-900">{insight.trendAnalysis.predictedTrend}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {displayInsights.length === 0 && (
        <div className="card p-8 text-center">
          <LightbulbIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">暂无结构化洞察数据</p>
        </div>
      )}
    </div>
  )
}