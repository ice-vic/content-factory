'use client';

import React, { useState } from 'react';
import { AIInsight, RuleBasedInsight } from '@/types';

// 洞察卡片属性
interface InsightCardProps {
  insight: AIInsight | RuleBasedInsight;
  isAIGenerated?: boolean;
  compact?: boolean;
  onExpand?: () => void;
}

// 获取洞察类型显示名称
function getInsightCategoryName(category: string): string {
  const categoryMap: Record<string, string> = {
    'trend': '趋势分析',
    'gap': '内容空白',
    'audience': '受众分析',
    'competition': '竞争分析',
    'innovation': '创新建议',
    'statistics': '数据统计',
    'ranking': '排行榜',
    'timing': '时间分析',
    'quality': '质量评估'
  };
  return categoryMap[category] || '综合分析';
}

// 获取洞察类型颜色
function getInsightCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'trend': 'bg-blue-100 text-blue-800 border-blue-200',
    'gap': 'bg-green-100 text-green-800 border-green-200',
    'audience': 'bg-purple-100 text-purple-800 border-purple-200',
    'competition': 'bg-orange-100 text-orange-800 border-orange-200',
    'innovation': 'bg-pink-100 text-pink-800 border-pink-200',
    'statistics': 'bg-gray-100 text-gray-800 border-gray-200',
    'ranking': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'timing': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'quality': 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };
  return colorMap[category] || 'bg-slate-100 text-slate-800 border-slate-200';
}

// 获取难度显示颜色
function getDifficultyColor(difficulty: string): string {
  const colorMap: Record<string, string> = {
    'low': 'bg-green-100 text-green-700',
    'medium': 'bg-yellow-100 text-yellow-700',
    'high': 'bg-red-100 text-red-700'
  };
  return colorMap[difficulty] || 'bg-gray-100 text-gray-700';
}

// 获取难度显示名称
function getDifficultyName(difficulty: string): string {
  const nameMap: Record<string, string> = {
    'low': '低难度',
    'medium': '中等难度',
    'high': '高难度'
  };
  return nameMap[difficulty] || '未知';
}

// 获取置信度显示
function getConfidenceDisplay(confidence: number): { color: string; text: string } {
  if (confidence >= 0.8) {
    return { color: 'text-green-600', text: '高置信度' };
  } else if (confidence >= 0.6) {
    return { color: 'text-yellow-600', text: '中等置信度' };
  } else {
    return { color: 'text-gray-600', text: '低置信度' };
  }
}

// 主组件
export default function InsightCard({
  insight,
  isAIGenerated = false,
  compact = false,
  onExpand
}: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    if (onExpand) {
      onExpand();
    }
  };

  // 判断是否为AI洞察
  const isAIInsight = 'confidence' in insight;
  const aiInsight = insight as AIInsight;
  const ruleInsight = insight as RuleBasedInsight;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 ${compact ? 'p-4' : 'p-6'}`}>
      {/* 卡片头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {/* 图标 */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isAIGenerated ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-gray-500 to-gray-700'
          }`}>
            {isAIGenerated ? (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )}
          </div>

          {/* 标题 */}
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">
            {insight.title}
          </h3>
        </div>

        {/* 标识标签 */}
        <div className="flex items-center space-x-2">
          {/* AI/规则标识 */}
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            isAIGenerated ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {isAIGenerated ? 'AI生成' : '规则分析'}
          </span>

          {/* 类别标签 */}
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
            getInsightCategoryColor(isAIInsight ? aiInsight.category : ruleInsight.type)
          }`}>
            {getInsightCategoryName(isAIInsight ? aiInsight.category : ruleInsight.type)}
          </span>
        </div>
      </div>

      {/* 主要描述 */}
      <p className="text-gray-700 mb-4 leading-relaxed">
        {isAIInsight ? aiInsight.description : ruleInsight.description}
      </p>

      {/* AI洞察特有信息 */}
      {isAIInsight && (
        <div className={`space-y-3 ${!isExpanded && 'max-h-0 overflow-hidden'}`}>
          {/* 机会点分析 */}
          {aiInsight.opportunity && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
              <div className="flex items-center mb-1">
                <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-blue-800">机会点分析</span>
              </div>
              <p className="text-sm text-blue-700 ml-6">{aiInsight.opportunity}</p>
            </div>
          )}

          {/* 目标关键词 */}
          {aiInsight.targetKeywords && aiInsight.targetKeywords.length > 0 && (
            <div>
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">目标关键词</span>
              </div>
              <div className="flex flex-wrap gap-1 ml-6">
                {aiInsight.targetKeywords.map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 建议形式 */}
          {aiInsight.suggestedFormat && (
            <div>
              <div className="flex items-center mb-1">
                <svg className="w-4 h-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">建议形式</span>
              </div>
              <p className="text-sm text-gray-600 ml-6">{aiInsight.suggestedFormat}</p>
            </div>
          )}

          {/* 数据支撑 */}
          {aiInsight.dataSupport && aiInsight.dataSupport.length > 0 && (
            <div>
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6m12 0v-1m-6 0h6" />
                </svg>
                <span className="text-sm font-medium text-gray-700">数据支撑</span>
              </div>
              <div className="space-y-1 ml-6">
                {aiInsight.dataSupport.map((data, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    <span className="font-medium">{data.metric}:</span> {data.value}
                    {data.source && <span className="text-gray-500"> (来源: {data.source})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 规则洞察特有信息 */}
      {!isAIInsight && (
        <div className={`space-y-3 ${!isExpanded && 'max-h-0 overflow-hidden'}`}>
          {/* 详细信息 */}
          {ruleInsight.details && ruleInsight.details.length > 0 && (
            <div>
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">详细信息</span>
              </div>
              <ul className="space-y-1 ml-6">
                {ruleInsight.details.map((detail, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 指标值 */}
          {ruleInsight.metric && ruleInsight.value !== undefined && (
            <div className="bg-gray-50 p-3 rounded">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{ruleInsight.metric}</span>
                <span className="text-lg font-bold text-gray-900">
                  {typeof ruleInsight.value === 'number' ? ruleInsight.value.toLocaleString() : ruleInsight.value}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 底部信息 */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        {/* 左侧信息 */}
        <div className="flex items-center space-x-4">
          {/* AI洞察的难度和置信度 */}
          {isAIInsight && (
            <>
              {/* 难度 */}
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">难度:</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${getDifficultyColor(aiInsight.difficulty)}`}>
                  {getDifficultyName(aiInsight.difficulty)}
                </span>
              </div>

              {/* 置信度 */}
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">置信度:</span>
                <span className={`text-xs font-medium ${getConfidenceDisplay(aiInsight.confidence).color}`}>
                  {getConfidenceDisplay(aiInsight.confidence).text} ({Math.round(aiInsight.confidence * 100)}%)
                </span>
              </div>
            </>
          )}

          {/* 规则洞察的指标 */}
          {!isAIInsight && ruleInsight.metric && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">类型:</span>
              <span className="text-xs font-medium text-gray-700">{ruleInsight.metric}</span>
            </div>
          )}
        </div>

        {/* 展开/收起按钮 */}
        {(isAIInsight || (ruleInsight.details && ruleInsight.details.length > 0)) && (
          <button
            onClick={handleExpand}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            <span>{isExpanded ? '收起' : '展开'}</span>
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
    </div>
  );
}

// 洞察列表组件
interface InsightListProps {
  insights: (AIInsight | RuleBasedInsight)[];
  title?: string;
  compact?: boolean;
  maxItems?: number;
}

export function InsightList({ insights, title, compact = false, maxItems }: InsightListProps) {
  const [showAll, setShowAll] = React.useState(false);
  const displayInsights = (maxItems && !showAll) ? insights.slice(0, maxItems) : insights;

  if (insights.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p>暂无洞察数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500">{insights.length} 条洞察</span>
        </div>
      )}

      <div className="grid gap-4">
        {displayInsights.map((insight, index) => {
          const isAIGenerated = 'confidence' in insight;
          return (
            <InsightCard
              key={`${isAIGenerated ? 'ai' : 'rule'}_${insight.id || index}`}
              insight={insight}
              isAIGenerated={isAIGenerated}
              compact={compact}
            />
          );
        })}
      </div>

      {maxItems && insights.length > maxItems && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            {showAll ? '收起洞察' : `查看更多 ${insights.length - maxItems} 条洞察`}
          </button>
        </div>
      )}
    </div>
  );
}