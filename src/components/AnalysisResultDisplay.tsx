'use client'

import React from 'react'
import { InsightList } from './InsightCard'
import ArticleList from './ArticleList'
import { ReadDistributionChart } from './ReadDistributionChart'
import { PublishTimeAnalysis } from './PublishTimeAnalysis'
import { StructuredTopicInsights } from './StructuredTopicInsights'
import {
  CheckIcon,
  BrainIcon,
  ClockIcon,
  ExternalLinkIcon,
  BarChart3Icon,
  FileTextIcon,
  LightbulbIcon,
  AlertCircleIcon
} from 'lucide-react'
import {
  CompleteAnalysisResult,
  WechatArticle
} from '@/types'

interface AnalysisResultDisplayProps {
  completeAnalysisResult: CompleteAnalysisResult | null
  articles: WechatArticle[]
  showAllArticles?: boolean
}

export function AnalysisResultDisplay({
  completeAnalysisResult,
  articles,
  showAllArticles = false
}: AnalysisResultDisplayProps) {
  if (!completeAnalysisResult) {
    return null
  }

  return (
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

      {/* 结构化选题洞察 */}
      {completeAnalysisResult.structuredTopicInsights && completeAnalysisResult.structuredTopicInsights.length > 0 ? (
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <LightbulbIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              结构化选题洞察 ({completeAnalysisResult.structuredTopicInsights.length}条)
            </h2>
          </div>
          <StructuredTopicInsights
            insights={completeAnalysisResult.structuredTopicInsights}
            maxItems={10}
          />
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <LightbulbIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">结构化选题洞察</h2>
          </div>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LightbulbIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">该分析缺少结构化选题洞察数据</p>
            <p className="text-sm text-gray-400">建议重新分析以获取完整的结构化洞察</p>
          </div>
        </div>
      )}

      {/* AI洞察摘要 */}
      {completeAnalysisResult.aiSummaries && completeAnalysisResult.aiSummaries.length > 0 ? (
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BrainIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              AI洞察摘要 ({completeAnalysisResult.aiSummaries.length}条)
            </h2>
          </div>
          <div className="space-y-4">
            {completeAnalysisResult.aiSummaries.slice(0, 3).map((summary, index) => (
              <div key={index} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="font-medium text-gray-900 mb-2">文章摘要 {index + 1}</div>
                <div className="text-sm text-gray-700">{summary.summary || '暂无内容'}</div>
                {summary.keyPoints && summary.keyPoints.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium text-gray-800">关键观点:</div>
                    <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                      {summary.keyPoints.map((point, pointIndex) => (
                        <li key={pointIndex}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BrainIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">AI洞察摘要</h2>
          </div>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BrainIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">该分析缺少AI洞察摘要数据</p>
            <p className="text-sm text-gray-400">建议重新分析以获取完整的AI分析结果</p>
          </div>
        </div>
      )}

      {/* 发布时间分析 */}
      {articles && articles.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ClockIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">发布时间分析</h2>
          </div>
          <PublishTimeAnalysis articles={articles} />
        </div>
      )}

      {/* 阅读分布图 */}
      {articles && articles.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3Icon className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">阅读量分布</h2>
          </div>
          <ReadDistributionChart articles={articles} />
        </div>
      )}

      {/* 洞察列表 */}
      {(completeAnalysisResult.aiInsights && completeAnalysisResult.aiInsights.length > 0) ||
       (completeAnalysisResult.ruleInsights && completeAnalysisResult.ruleInsights.length > 0) ? (
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ExternalLinkIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">数据洞察</h2>
          </div>
          <InsightList
            insights={[
              ...(completeAnalysisResult.aiInsights || []),
              ...(completeAnalysisResult.ruleInsights || [])
            ]}
          />
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ExternalLinkIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">数据洞察</h2>
          </div>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLinkIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">该分析缺少数据洞察信息</p>
            <p className="text-sm text-gray-400">数据洞察可能在分析时未生成或已丢失</p>
          </div>
        </div>
      )}

      {/* 文章列表 */}
      {showAllArticles && articles && articles.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileTextIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                文章列表 ({articles.length} 篇)
              </h2>
            </div>
          </div>
          <ArticleList articles={articles} title="分析文章列表" />
        </div>
      )}
    </div>
  )
}