'use client';

import { useState, useEffect } from 'react';
import { EyeIcon, TrendingUpIcon, TargetIcon, LightbulbIcon } from 'lucide-react';

interface KeywordInsightViewerProps {
  insightDetail: any;
  selectedInsightId: string;
  onInsightSelect: (insight: any) => void;
}

export default function KeywordInsightViewer({
  insightDetail,
  selectedInsightId,
  onInsightSelect
}: KeywordInsightViewerProps) {
  const [selectedInsightIndex, setSelectedInsightIndex] = useState(0);

  // 当洞察详情变化时，重置选中的索引并通知父组件
  useEffect(() => {
    if (insightDetail?.structuredTopicInsights?.length > 0) {
      setSelectedInsightIndex(0);
      onInsightSelect(insightDetail.structuredTopicInsights[0]);
    }
  }, [insightDetail?.structuredTopicInsights]); // 只依赖洞察数据本身，不依赖函数

  if (!insightDetail?.structuredTopicInsights?.length) {
    return (
      <div className="card p-6">
        <div className="text-center text-gray-500">
          <LightbulbIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>暂无关键词洞察数据</p>
        </div>
      </div>
    );
  }

  const insights = insightDetail.structuredTopicInsights;
  const currentInsight = insights[selectedInsightIndex];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'low':
        return '低难度';
      case 'medium':
        return '中等难度';
      case 'high':
        return '高难度';
      default:
        return '未知';
    }
  };

  return (
    <div className="space-y-6">
      {/* 洞察选择标签 */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {insights.map((insight: any, index: number) => (
          <button
            key={insight.id}
            onClick={() => {
              setSelectedInsightIndex(index);
              onInsightSelect(insight);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedInsightIndex === index
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {insight.title.length > 15 ? insight.title.substring(0, 15) + '...' : insight.title}
          </button>
        ))}
      </div>

      {/* 当前洞察详情 */}
      <div className="card p-6">
        {/* 洞察标题和难度 */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{currentInsight.title}</h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentInsight.difficulty)}`}>
              {getDifficultyText(currentInsight.difficulty)}
            </span>
            {currentInsight.confidence && (
              <span className="text-sm text-gray-500">
                置信度: {Math.round(currentInsight.confidence * 100)}%
              </span>
            )}
          </div>
        </div>

        {/* 核心发现 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <LightbulbIcon className="w-4 h-4 mr-1" />
            核心发现
          </h4>
          <p className="text-gray-600 leading-relaxed">{currentInsight.coreFinding}</p>
        </div>

        {/* 推荐选题方向 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <TargetIcon className="w-4 h-4 mr-1" />
            推荐选题方向
          </h4>
          <div className="space-y-2">
            {currentInsight.recommendedTopics?.map((topic: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">{topic}</span>
              </div>
            )) || <div className="text-gray-500 text-sm">暂无推荐选题方向</div>}
          </div>
        </div>

        {/* 关键词分析 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <TrendingUpIcon className="w-4 h-4 mr-1" />
            关键词分析
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-medium text-gray-600 mb-2">高频关键词</h5>
              <div className="flex flex-wrap gap-1">
                {currentInsight.keywordAnalysis?.highFrequency?.map((keyword: string, index: number) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {keyword}
                  </span>
                )) || <div className="text-gray-500 text-sm">暂无高频关键词</div>}
              </div>
            </div>
            <div>
              <h5 className="text-xs font-medium text-gray-600 mb-2">机会关键词</h5>
              <div className="flex flex-wrap gap-1">
                {currentInsight.keywordAnalysis?.missingKeywords?.map((keyword: string, index: number) => (
                  <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    {keyword}
                  </span>
                )) || <div className="text-gray-500 text-sm">暂无机会关键词</div>}
              </div>
            </div>
          </div>
        </div>

        {/* 内容策略 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">内容策略建议</h4>
          <div className="space-y-2">
            {currentInsight.contentStrategy?.map((strategy: string, index: number) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                <span className="text-gray-600 text-sm">{strategy}</span>
              </div>
            )) || <div className="text-gray-500 text-sm">暂无内容策略建议</div>}
          </div>
        </div>

        {/* 目标受众 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">目标受众</h4>
          <div className="flex flex-wrap gap-2">
            {currentInsight.targetAudience?.map((audience: string, index: number) => (
              <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                {audience}
              </span>
            )) || <div className="text-gray-500 text-sm">暂无目标受众信息</div>}
          </div>
        </div>

        {/* 数据支撑 */}
        {currentInsight.dataSupport && currentInsight.dataSupport.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <EyeIcon className="w-4 h-4 mr-1" />
              数据支撑
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              {currentInsight.dataSupport.map((data: any, index: number) => (
                <div key={index} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{data.metric}</span>
                    <span className="text-sm font-semibold text-blue-600">{data.value}</span>
                  </div>
                  <p className="text-xs text-gray-500">{data.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 洞察切换导航 */}
      {insights.length > 1 && (
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => {
              const newIndex = selectedInsightIndex > 0 ? selectedInsightIndex - 1 : insights.length - 1;
              setSelectedInsightIndex(newIndex);
              onInsightSelect(insights[newIndex]);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← 上一个洞察
          </button>
          <span className="text-sm text-gray-500">
            {selectedInsightIndex + 1} / {insights.length}
          </span>
          <button
            onClick={() => {
              const newIndex = selectedInsightIndex < insights.length - 1 ? selectedInsightIndex + 1 : 0;
              setSelectedInsightIndex(newIndex);
              onInsightSelect(insights[newIndex]);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            下一个洞察 →
          </button>
        </div>
      )}
    </div>
  );
}