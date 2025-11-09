'use client';

import React, { useState } from 'react';
import { WechatArticle, ArticleSummary } from '@/types';

// 文章分析卡片属性
interface ArticleAnalysisCardProps {
  article: WechatArticle;
  aiSummary?: ArticleSummary;
  showFullSummary?: boolean;
  compact?: boolean;
}

// 格式化数字显示
function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return num.toLocaleString();
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}周前`;
  } else {
    return date.toLocaleDateString();
  }
}

// 获取情感倾向颜色
function getSentimentColor(sentiment?: string): string {
  switch (sentiment) {
    case 'positive':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'negative':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

// 获取情感倾向名称
function getSentimentName(sentiment?: string): string {
  switch (sentiment) {
    case 'positive':
      return '积极';
    case 'negative':
      return '消极';
    default:
      return '中性';
  }
}

// 主组件
export default function ArticleAnalysisCard({
  article,
  aiSummary,
  showFullSummary = false,
  compact = false
}: ArticleAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 防护性检查：如果article为null或undefined，显示加载状态
  if (article === null || article === undefined) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg ${compact ? 'p-4' : 'p-6'}`}>
        <div className="text-center py-8 text-gray-400">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // 计算互动率
  const interactionRate = article.read ? ((article.praise || 0) + (article.looking || 0)) / article.read : 0;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 ${
      compact ? 'p-4' : 'p-6'
    }`}>
      {/* 文章头部信息 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {/* 标题 */}
          <h3 className={`font-semibold text-gray-900 mb-2 line-clamp-2 ${
            compact ? 'text-base' : 'text-lg'
          }`}>
            {article.title}
          </h3>

          {/* 公众号信息 */}
          <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
            <div className="flex items-center space-x-1">
              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">{article.wx_name}</span>
            </div>

            <span className="text-gray-400">•</span>

            <span className="text-gray-500">
              {formatTime(article.publish_time)}
            </span>

            {/* 原创标识 */}
            {article.is_original === 1 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                原创
              </span>
            )}
          </div>
        </div>

        {/* 数据指标 */}
        <div className="flex flex-col items-end space-y-1 ml-4">
          {/* 阅读量 */}
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">
              {formatNumber(article.read || 0)}
            </span>
          </div>

          {/* 点赞量 */}
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">
              {formatNumber(article.praise || 0)}
            </span>
          </div>

          {/* 互动率 */}
          {interactionRate > 0 && (
            <div className="text-xs text-gray-500">
              {`${(interactionRate * 100).toFixed(1)}%`}
            </div>
          )}
        </div>
      </div>

      {/* AI摘要部分 */}
      {aiSummary && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          {/* AI摘要标识 */}
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">AI摘要</span>
            </div>

            {/* 情感倾向 */}
            {aiSummary.sentiment && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSentimentColor(aiSummary.sentiment)}`}>
                {getSentimentName(aiSummary.sentiment)}
              </span>
            )}
          </div>

          {/* 摘要内容 */}
          <div className={`text-gray-700 text-sm leading-relaxed mb-3 ${
            !showFullSummary && !isExpanded ? 'line-clamp-3' : ''
          }`}>
            {aiSummary.summary}
          </div>

          {/* 关键信息 */}
          <div className={`space-y-3 ${!isExpanded ? 'max-h-0 overflow-hidden' : ''}`}>
            {/* 关键观点 */}
            {aiSummary.keyPoints && aiSummary.keyPoints.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">关键观点</span>
                </div>
                <ul className="space-y-1 ml-6">
                  {aiSummary.keyPoints.map((point, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 数据点 */}
            {aiSummary.dataPoints && aiSummary.dataPoints.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">数据支撑</span>
                </div>
                <ul className="space-y-1 ml-6">
                  {aiSummary.dataPoints.map((dataPoint, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      {dataPoint}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 文章亮点 */}
            {aiSummary.highlights && aiSummary.highlights.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">文章亮点</span>
                </div>
                <div className="flex flex-wrap gap-1 ml-6">
                  {aiSummary.highlights.map((highlight, index) => (
                    <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 展开/收起按钮 */}
          {!showFullSummary && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3 transition-colors"
            >
              <span>{isExpanded ? '收起' : '展开详情'}</span>
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* 无AI摘要时的占位 */}
      {!aiSummary && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="text-center py-3 text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm">暂无AI分析</p>
          </div>
        </div>
      )}
    </div>
  );
}

// 文章分析列表组件
interface ArticleAnalysisListProps {
  articles: WechatArticle[];
  aiSummaries?: ArticleSummary[];
  title?: string;
  compact?: boolean;
  maxItems?: number;
}

export function ArticleAnalysisList({
  articles,
  aiSummaries = [],
  title,
  compact = false,
  maxItems = 8
}: ArticleAnalysisListProps) {
  const displayArticles = maxItems ? articles.slice(0, maxItems) : articles;

  // 创建文章ID到摘要的映射
  const summaryMap = new Map<string, ArticleSummary>();
  aiSummaries.forEach(summary => {
    summaryMap.set(summary.articleId, summary);
  });

  if (articles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p>暂无文章数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500">
            TOP {displayArticles.length} 篇文章
            {aiSummaries.length > 0 && ` (${aiSummaries.length}篇已AI分析)`}
          </span>
        </div>
      )}

      <div className="grid gap-4">
        {displayArticles.map((article, index) => (
          <div key={article.id || article.content_id || index} className="relative">
            {/* 排名标识 */}
            <div className="absolute -left-3 -top-2 z-10">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                index === 0 ? 'bg-yellow-500' :
                index === 1 ? 'bg-gray-400' :
                index === 2 ? 'bg-orange-500' :
                'bg-gray-300'
              }`}>
                {index + 1}
              </div>
            </div>

            <ArticleAnalysisCard
              article={article}
              aiSummary={summaryMap.get(article.id || article.content_id || `${index}`)}
              compact={compact}
            />
          </div>
        ))}
      </div>

      {maxItems && articles.length > maxItems && (
        <div className="text-center">
          <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            查看更多 {articles.length - maxItems} 篇文章
          </button>
        </div>
      )}
    </div>
  );
}