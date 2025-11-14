'use client'

import React from 'react'
import { XiaohongshuNoteList } from '@/components/XiaohongshuNoteList'
import { XiaohongshuStructuredInsights } from '@/components/XiaohongshuStructuredInsights'
import {
  CheckIcon,
  BrainIcon,
  ClockIcon,
  ExternalLinkIcon,
  BarChart3Icon,
  FileTextIcon,
  LightbulbIcon,
  AlertCircleIcon,
  HeartIcon,
  BookmarkIcon,
  MessageCircleIcon,
  ShareIcon,
  HashIcon
} from 'lucide-react'
import { XiaohongshuCompleteAnalysisResult } from '@/types/xiaohongshu'
import { XiaohongshuNote } from '@/types/xiaohongshu'

interface XiaohongshuAnalysisResultDisplayProps {
  completeAnalysisResult: XiaohongshuCompleteAnalysisResult | null
  notes: XiaohongshuNote[]
  showAllArticles?: boolean
}

export function XiaohongshuAnalysisResultDisplay({
  completeAnalysisResult,
  notes,
  showAllArticles = false
}: XiaohongshuAnalysisResultDisplayProps) {
  // 计算TOP笔记
  const topLikedNotes = notes
    .slice()
    .sort((a, b) => b.metrics.likes - a.metrics.likes)
    .slice(0, 5)

  const topCollectedNotes = notes
    .slice()
    .sort((a, b) => b.metrics.collects - a.metrics.collects)
    .slice(0, 5)

  const topCommentedNotes = notes
    .slice()
    .sort((a, b) => b.metrics.comments - a.metrics.comments)
    .slice(0, 5)

  if (!completeAnalysisResult) {
    return (
      <div className="text-center py-12">
        <AlertCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">暂无分析结果</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 数据概览 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <BarChart3Icon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">数据概览</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {completeAnalysisResult.totalNotes || 0}
            </div>
            <div className="text-sm text-gray-600">分析笔记数</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-1">
              {completeAnalysisResult.avgLikes ?
                (completeAnalysisResult.avgLikes >= 10000 ? `${(completeAnalysisResult.avgLikes/10000).toFixed(1)}w` :
                 completeAnalysisResult.avgLikes >= 1000 ? `${(completeAnalysisResult.avgLikes/1000).toFixed(1)}k` :
                 completeAnalysisResult.avgLikes.toString()) :
                '0'}
            </div>
            <div className="text-sm text-gray-600">平均点赞量</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {completeAnalysisResult.avgCollects ?
                (completeAnalysisResult.avgCollects >= 10000 ? `${(completeAnalysisResult.avgCollects/10000).toFixed(1)}w` :
                 completeAnalysisResult.avgCollects >= 1000 ? `${(completeAnalysisResult.avgCollects/1000).toFixed(1)}k` :
                 completeAnalysisResult.avgCollects.toString()) :
                '0'}
            </div>
            <div className="text-sm text-gray-600">平均收藏量</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {completeAnalysisResult.avgInteractionRate ?? '0'}%
            </div>
            <div className="text-sm text-gray-600">平均互动率</div>
          </div>
        </div>
      </div>

      {/* TOP内容展示 */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* 点赞TOP5 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <HeartIcon className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">点赞量TOP5</h3>
          </div>
          <XiaohongshuNoteList
            notes={topLikedNotes}
            showMetrics="detailed"
            maxNotes={5}
          />
        </div>

        {/* 收藏TOP5 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <BookmarkIcon className="w-4 h-4 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">收藏量TOP5</h3>
          </div>
          <XiaohongshuNoteList
            notes={topCollectedNotes}
            showMetrics="detailed"
            maxNotes={5}
          />
        </div>

        {/* 评论TOP5 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageCircleIcon className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">评论量TOP5</h3>
          </div>
          <XiaohongshuNoteList
            notes={topCommentedNotes}
            showMetrics="detailed"
            maxNotes={5}
          />
        </div>
      </div>

      {/* 热门标签云 */}
      {completeAnalysisResult.wordCloud && Array.isArray(completeAnalysisResult.wordCloud) && completeAnalysisResult.wordCloud.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <HashIcon className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">热门标签云</h3>
          </div>
          <div className="flex flex-wrap gap-2" role="list" aria-label="热门标签">
            {completeAnalysisResult.wordCloud.map((item, index) => (
              <span
                key={`tagcloud-${(item?.word || 'unknown')}-${index}`}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors cursor-pointer"
                style={{
                  fontSize: `${Math.max(12, Math.min(18, (item?.count || 1) / 3))}px`,
                  opacity: Math.max(0.7, Math.min(1, (item?.count || 1) / 20))
                }}
                title={`出现次数: ${item?.count || 0}`}
                role="listitem"
              >
                #{item?.word || 'unknown'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 结构化选题洞察 */}
      {completeAnalysisResult.structuredTopicInsights && Array.isArray(completeAnalysisResult.structuredTopicInsights) && completeAnalysisResult.structuredTopicInsights.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <LightbulbIcon className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              AI结构化选题洞察 ({completeAnalysisResult.structuredTopicInsights.length}条)
            </h3>
          </div>
          <XiaohongshuStructuredInsights
            insights={completeAnalysisResult.structuredTopicInsights}
            maxItems={showAllArticles ? undefined : 10}
          />
        </div>
      )}

      {/* 全部笔记列表 */}
      {showAllArticles && notes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileTextIcon className="w-4 h-4 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">全部笔记列表 ({notes.length}篇)</h3>
            </div>
          </div>
          <XiaohongshuNoteList
            notes={notes}
            showMetrics="all"
          />
        </div>
      )}

      {/* 分析元数据 */}
      {completeAnalysisResult.metadata && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              分析模型: {completeAnalysisResult.metadata.modelUsed || '未知'} |
              处理时间: {completeAnalysisResult.metadata.analysisTime || 0}秒 |
              版本: {completeAnalysisResult.metadata.version || '1.0'}
            </div>
            <div>
              {new Date(completeAnalysisResult.metadata.searchTime || Date.now()).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}