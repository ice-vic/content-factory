// 小红书相关类型定义

export interface XiaohongshuNote {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    followers?: number;
  };
  publishTime: number;
  url: string;
  images: {
    url: string;
    width?: number;
    height?: number;
    alt?: string;
  }[];
  metrics: {
    likes: number;
    collects: number;
    comments: number;
    shares: number;
  };
  tags: string[];
  topic?: string;
  type: 'image' | 'video';
  video?: {
    url: string;
    duration?: number;
    cover?: string;
  };
  location?: string;
}

export interface XiaohongshuSearchResponse {
  success: boolean;
  data: XiaohongshuNote[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  message?: string;
}

export interface XiaohongshuAnalysisResult {
  // 基础统计
  totalNotes: number;
  avgLikes: number;
  avgCollects: number;
  avgComments: number;
  avgShares: number;
  avgInteractionRate: number;

  // 内容形式分布
  contentType: {
    image: number;
    video: number;
    percentage: {
      image: number;
      video: number;
    };
  };

  // 热门标签
  popularTags: Array<{
    tag: string;
    count: number;
    avgLikes: number;
    avgCollects: number;
  }>;

  // 发布时间分析
  publishTimeDistribution: Array<{
    hour: number;
    count: number;
    avgInteraction: number;
  }>;

  // 地理位置分析
  locationAnalysis: Array<{
    location: string;
    count: number;
    avgInteraction: number;
  }>;

  // 互动量分布
  interactionDistribution: {
    high: number;      // 高互动 (>5%)
    medium: number;    // 中等互动 (1-5%)
    low: number;       // 低互动 (<1%)
  };

  // TOP笔记
  topLikedNotes: XiaohongshuNote[];
  topCollectedNotes: XiaohongshuNote[];
  topCommentedNotes: XiaohongshuNote[];
  topInteractionNotes: XiaohongshuNote[];

  // 词云数据
  wordCloud: Array<{
    word: string;
    count: number;
    type: 'title' | 'content' | 'tag';
  }>;

  // 趋势分析
  trends: {
    risingTags: string[];
    decliningTags: string[];
    popularTopics: string[];
  };
}

export interface XiaohongshuSearchParams {
  keyword: string;
  sortType?: 'time' | 'popularity' | 'likes' | 'collects';
  contentType?: 'all' | 'image' | 'video';
  timeRange?: 1 | 7 | 30; // 天数
  minLikes?: number;
  maxResults?: number;
  page?: number;
}

export interface XiaohongshuStructuredTopicInsight {
  id: string;
  title: string;
  coreFinding: string;
  recommendedTopics: string[];
  targetAudience: string[];
  contentStrategy: string[];
  hashtagStrategy: string[];
  bestPostTime: string[];
  contentTypeRecommendation: {
    type: 'image' | 'video';
    reasoning: string;
  };
  trendAnalysis: {
    currentTrend: string;
    predictedTrend: string;
    confidence: number;
  };
}

export interface XiaohongshuCompleteAnalysisResult extends XiaohongshuAnalysisResult {
  keyword: string;
  processedNotes: number;

  // 结构化选题洞察
  structuredTopicInsights: XiaohongshuStructuredTopicInsight[];

  // AI分析结果
  aiInsights: string[];
  contentRecommendations: string[];

  // 元数据
  metadata: {
    searchTime: Date;
    analysisTime: number;
    modelUsed: string;
    version: string;
  };
}

// 分析进度类型
export interface XiaohongshuAnalysisProgress {
  phase: 'fetching' | 'analyzing' | 'completed' | 'error';
  message: string;
  current: number;
  total: number;
  aiStep?: string;
  currentArticle?: string;
  estimatedTime?: number;
}

// 计算互动率的工具函数
export function calculateXiaohongshuInteractionRate(note: XiaohongshuNote): number {
  const totalInteractions = note.metrics.likes + note.metrics.collects + note.metrics.comments + note.metrics.shares;
  // 小红书的互动率基准按总互动量计算（因为没有像公众号的阅读量数据）
  return totalInteractions > 0 ? Math.min((totalInteractions / (note.metrics.likes + 1)) * 100, 100) : 0;
}

// 搜索参数默认值
export const DEFAULT_SEARCH_PARAMS: Partial<XiaohongshuSearchParams> = {
  sortType: 'popularity',
  contentType: 'all',
  timeRange: 7,
  minLikes: 10,
  maxResults: 30,
  page: 1
};