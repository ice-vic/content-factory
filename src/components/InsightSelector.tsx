'use client';

import { useState, useEffect } from 'react';
import { Wand2Icon, ClockIcon, FileTextIcon, Trash2Icon, HistoryIcon } from 'lucide-react';
import { getRecentInsightHistory, getAllInsightHistory, deleteInsightHistory, updateInsightHistory, type InsightHistory } from '@/services/contentService';

interface InsightSelectorProps {
  selectedInsight: string;
  onInsightSelect: (insightId: string, insightDetail?: any) => void;
  disabled?: boolean;
  platform?: 'wechat' | 'xiaohongshu' | null; // 添加平台参数
  selectedTopicDirection?: string; // 选中的选题方向
  onTopicDirectionSelect?: (topicDirection: string) => void; // 选题方向选择回调
}

export default function InsightSelector({
  selectedInsight,
  onInsightSelect,
  disabled = false,
  platform = null,
  selectedTopicDirection = '',
  onTopicDirectionSelect
}: InsightSelectorProps) {
  const [insights, setInsights] = useState<InsightHistory[]>([]);
  const [loading, setLoading] = useState(true);
  // 移除手动展开控制，改为基于选中状态自动展开
  const [insightDetails, setInsightDetails] = useState<Map<string, any>>(new Map());
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null); // 防止重复加载

  useEffect(() => {
    loadInsightHistory();
  }, [showAllHistory, platform]);

  const loadInsightHistory = async () => {
    try {
      setLoading(true);
      // 构建API URL，添加平台参数
      const params = new URLSearchParams();
      if (!showAllHistory) {
        params.append('hours', '12'); // 默认12小时
      }
      if (platform) {
        params.append('platform', platform);
      }

      const response = await fetch(`/api/insights/history?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`API错误: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setInsights(result.data || []);
      } else {
        throw new Error(result.error || '获取洞察历史失败');
      }
    } catch (error) {
      console.error('加载洞察历史失败:', error);
      // 失败时设置空数组，避免界面卡住
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInsightChange = async (insightId: string) => {
    if (insightId === '') {
      onInsightSelect('');
      // 清空选题方向选择
      onTopicDirectionSelect?.('');
      setLoadingDetail(null);
      return;
    }

    // 如果已经有详情数据，直接使用
    if (insightDetails.has(insightId)) {
      onInsightSelect(insightId, insightDetails.get(insightId));
      return;
    }

    // 防止重复请求
    if (loadingDetail === insightId) {
      return;
    }

    setLoadingDetail(insightId);

    try {
      const response = await fetch(`/api/insights/detail/${insightId}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`API错误: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setInsightDetails(prev => new Map(prev.set(insightId, result.data)));
        onInsightSelect(insightId, result.data);
      } else {
        console.error('洞察详情API返回失败:', result);
        throw new Error(result.error || '获取洞察详情失败');
      }
    } catch (error) {
      console.error('加载洞察详情失败:', error);
      // 可以选择是否要显示错误给用户
      // setErrorMessage('加载洞察详情失败，请重试');
    } finally {
      setLoadingDetail(null);
    }
  };

  const handleTopicDirectionSelect = (topicDirection: string) => {
    onTopicDirectionSelect?.(topicDirection);
  };

  const handleDeleteInsight = async (insightId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!confirm('确定要删除这个洞察记录吗？')) {
      return;
    }

    try {
      const result = await deleteInsightHistory(insightId);
      if (result.success) {
        setInsights(prev => prev.filter(insight => insight.id !== insightId));
        if (selectedInsight === insightId) {
          onInsightSelect('');
        }
      } else {
        alert('删除失败: ' + result.error);
      }
    } catch (error) {
      console.error('删除洞察失败:', error);
      alert('删除失败');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) {
      return '刚刚';
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getSelectedInsightInfo = () => {
    if (!selectedInsight) return null;
    return insights.find(insight => insight.id === selectedInsight);
  };

  const selectedInfo = getSelectedInsightInfo();

  return (
    <div className="space-y-4">
      {/* 洞察选择器 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            选择洞察报告
          </label>
          <button
            onClick={() => setShowAllHistory(!showAllHistory)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
            title={showAllHistory ? "切换到最近12小时" : "显示全部历史记录"}
          >
            <HistoryIcon className="w-4 h-4" />
            <span>{showAllHistory ? '最近12小时' : '全部历史'}</span>
          </button>
        </div>
        <div className="relative">
          <select
            value={selectedInsight}
            onChange={(e) => handleInsightChange(e.target.value)}
            disabled={disabled || loading}
            className="input w-full pr-10"
            title="选择基于分析生成的洞察报告作为创作参考"
          >
            <option value="">选择洞察报告...</option>
            {insights.filter(insight => insight.structuredTopicInsightsCount > 0).map((insight) => (
              <option key={insight.id} value={insight.id}>
                {insight.keyword} ({formatTime(insight.createdAt)}) - {insight.structuredTopicInsightsCount}个洞察
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Wand2Icon className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* 选中洞察的详细信息 */}
      {selectedInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="font-medium text-blue-900">{selectedInfo.keyword}</h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {selectedInfo.structuredTopicInsightsCount}个洞察
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                <div className="flex items-center space-x-1">
                  <FileTextIcon className="w-3 h-3" />
                  <span>{selectedInfo.totalArticles}篇文章</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ClockIcon className="w-3 h-3" />
                  <span>{formatTime(selectedInfo.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-1">
              <button
                onClick={(e) => handleDeleteInsight(selectedInfo.id, e)}
                className="text-red-600 hover:text-red-800 p-2 bg-white rounded-lg"
                title="删除记录"
              >
                <Trash2Icon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 自动展开的详细信息 */}
          {selectedInfo && insightDetails.has(selectedInfo.id) && (
            <div className="mt-4 pt-4 border-t border-blue-200 space-y-6 animate-in slide-in-from-top-2 duration-300">
              {/* 推荐选题方向 - 单选功能 */}
              {onTopicDirectionSelect && (
                <div>
                  <h5 className="font-semibold text-blue-900 mb-4 flex items-center text-base">
                    <span className="text-red-500 mr-2">*</span>
                    选择选题方向
                  </h5>
                  {(() => {
                    const detail = insightDetails.get(selectedInfo.id);
                    const recommendedTopics = detail?.structuredTopicInsights?.[0]?.recommendedTopics ||
                                           detail?.recommendedTopics || [];

                    if (recommendedTopics.length === 0) {
                      return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                          <Wand2Icon className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                          <p className="text-blue-700 text-sm">暂无推荐选题方向</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {recommendedTopics.map((topic: string, index: number) => (
                          <div
                            key={index}
                            onClick={() => handleTopicDirectionSelect(topic)}
                            className={`
                              flex items-start space-x-3 p-4 rounded-lg cursor-pointer transition-all border-2
                              ${selectedTopicDirection === topic
                                ? 'bg-blue-50 border-blue-400 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                              }
                            `}
                          >
                            <input
                              type="radio"
                              name={`topic-direction-${selectedInfo.id}`}
                              value={topic}
                              checked={selectedTopicDirection === topic}
                              onChange={() => handleTopicDirectionSelect(topic)}
                              className="sr-only" // 隐藏radio input，只保留功能
                            />
                            <div className="flex items-center justify-center mt-0.5">
                              {selectedTopicDirection === topic ? (
                                <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-blue-500 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`
                                text-sm leading-relaxed block
                                ${selectedTopicDirection === topic ? 'text-blue-900 font-semibold' : 'text-gray-700'}
                              `}>
                                {topic}
                              </span>
                              {selectedTopicDirection === topic && (
                                <span className="text-xs text-blue-600 mt-1 block">已选择此方向</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {selectedTopicDirection && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-green-800">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <div className="w-2 h-1 bg-white transform rotate-45 translate-y-0.5"></div>
                        </div>
                        <span className="text-sm font-medium">已确认选题方向：{selectedTopicDirection}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 关键词列表 */}
              <div>
                <h5 className="font-semibold text-blue-900 mb-3 text-base flex items-center">
                  <FileTextIcon className="w-4 h-4 mr-2" />
                  分析关键词
                </h5>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {insightDetails.get(selectedInfo.id)?.allKeywords?.slice(0, 15).map((keyword: string, index: number) => (
                      <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs border border-blue-200">
                        {keyword}
                      </span>
                    ))}
                    {insightDetails.get(selectedInfo.id)?.allKeywords?.length > 15 && (
                      <span className="text-xs text-blue-600 px-2 py-1 bg-blue-100 rounded-full">
                        +{insightDetails.get(selectedInfo.id).allKeywords.length - 15}个关键词
                      </span>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    共分析 {insightDetails.get(selectedInfo.id)?.allKeywords?.length || 0} 个相关关键词
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-2">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>加载洞察历史...</span>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!loading && insights.filter(insight => insight.structuredTopicInsightsCount > 0).length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <Wand2Icon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">
            {platform
              ? `${platform === 'wechat' ? '公众号' : '小红书'}平台暂无洞察历史`
              : showAllHistory
              ? '暂无任何可用的洞察历史'
              : '12小时内暂无可用的洞察历史'
            }
          </p>
          <p className="text-xs mt-1">
            {platform
              ? `请先进行${platform === 'wechat' ? '公众号' : '小红书'}分析来生成洞察报告`
              : '请先在选题分析页面生成洞察报告'
            }
          </p>
          {platform && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
              💡 提示：已选择{platform === 'wechat' ? '公众号' : '小红书'}平台，将只显示该平台的数据
            </div>
          )}
        </div>
      )}

      {/* 刷新按钮 */}
      {!loading && insights.filter(insight => insight.structuredTopicInsightsCount > 0).length > 0 && (
        <div className="text-center">
          <button
            onClick={loadInsightHistory}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            刷新列表
          </button>
        </div>
      )}
    </div>
  );
}