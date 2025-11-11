// 文章状态
export type ArticleStatus = 'draft' | 'pending' | 'published' | 'withdrawn';

// 发布平台
export type Platform = 'wechat' | 'xiaohongshu';

// 原始文章数据
export interface SourceArticle {
  id: string;
  title: string;
  content: string;
  readCount: number;
  likeCount: number;
  viewCount: number;
  sourceUrl?: string;
  createdAt: Date;
}

// 洞察报告数据
export interface InsightReport {
  id: string;
  keyword: string;
  topLikedArticles: SourceArticle[];
  topInteractionArticles: SourceArticle[];
  wordCloud: Array<{ word: string; count: number }>;
  insights: string[];
  createdAt: Date;
}

// 文章
export interface Article {
  id: string;
  title: string;
  content: string;
  images: string[];
  status: ArticleStatus;
  targetPlatforms: Platform[];
  createdAt: Date;
  updatedAt: Date;
  insightId?: string;
}

// 发布记录
export interface PublishRecord {
  id: string;
  articleId: string;
  platform: Platform;
  platformId?: string;
  status: 'pending' | 'success' | 'failed';
  publishedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

// 分析进度
export interface AnalysisProgress {
  phase: 'fetching' | 'analyzing' | 'generating' | 'completed' | 'error';
  message: string;
  current: number;
  total: number;
}

// 内容创作参数
export interface CreationParams {
  insightPoint?: string;
  customTopic?: string;
  style: 'professional' | 'casual' | 'humorous';
  length: 'short' | 'medium' | 'long';
  targetPlatforms: Platform[];
}

// AI分析相关类型定义

// AI文章摘要
export interface ArticleSummary {
  articleId: string;
  summary: string;        // AI生成的摘要
  keyPoints: string[];    // 关键观点
  dataPoints: string[];   // 数据支撑点
  highlights: string[];   // 文章亮点
  sentiment?: 'positive' | 'neutral' | 'negative';  // 情感倾向
}

// 结构化信息
export interface StructuredInfo {
  keywords: string[];           // 关键词
  topics: string[];            // 主题分类
  arguments: {                 // 论点结构
    claim: string;
    evidence: string[];
    confidence: number;        // 置信度
  }[];
  uniqueAngles: string[];       // 独特角度
  targetAudience: string[];     // 目标受众
  contentGaps: string[];        // 内容空白点
  trendingTopics: string[];     // 趋势话题
}

// AI洞察
export interface AIInsight {
  id: string;
  title: string;               // 洞察标题
  description: string;         // 详细描述
  opportunity: string;         // 机会点分析
  difficulty: 'low' | 'medium' | 'high';  // 难度评估
  targetKeywords: string[];    // 目标关键词
  suggestedFormat: string;     // 建议的内容形式
  dataSupport: {               // 数据支撑
    source: string;
    metric: string;
    value: string;
  }[];
  relatedArticles: string[];   // 相关文章ID
  confidence: number;          // 洞察置信度
  category: 'trend' | 'gap' | 'audience' | 'competition' | 'innovation'; // 洞察分类
}

// 规则洞察
export interface RuleBasedInsight {
  id: string;
  title: string;
  description: string;
  type: 'statistics' | 'ranking' | 'timing' | 'quality';
  metric: string;
  value: string | number;
  details: string[];
}

// 扩展分析进度
export interface EnhancedAnalysisProgress {
  phase: 'fetching' | 'filtering' | 'summarizing' | 'extracting' | 'analyzing' | 'generating' | 'completed' | 'error';
  message: string;
  current: number;
  total: number;
  currentArticle?: string;     // 当前处理的文章标题
  aiStep?: string;             // AI处理步骤描述
  estimatedTime?: number;      // 预估剩余时间(秒)
}

// AI分析状态
export interface AIAnalysisStatus {
  stage: 'preparing' | 'summarizing' | 'structuring' | 'insight_generation' | 'completed' | 'error';
  articlesProcessed: number;
  totalArticles: number;
  currentOperation: string;
  errors?: string[];
}

// OpenAI API 响应类型
export interface OpenAIChoice {
  index: number;
  message: {
    role: 'assistant';
    content: string;
  };
  finish_reason: string;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// AI分析配置
export interface AIAnalysisConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topArticles: number;
  batchSize: number;
}

// TOP文章AI分析结果
export interface TopArticleInsight {
  articleId: string;
  title: string;
  summary: string;           // AI生成的文章摘要
  keyArguments: string[];    // 核心论点
  dataPoints: string[];      // 数据支撑
  uniqueAngles: string[];    // 独特角度
  targetAudience: string[];  // 目标受众
  contentGaps: string[];     // 内容空白点
  successFactors: string[];  // 成功因素
  interactionPattern: {      // 互动模式分析
    readEngagement: 'high' | 'medium' | 'low';
    commentEngagement: 'high' | 'medium' | 'low';
    sharePotential: 'high' | 'medium' | 'low';
  };
}

// 结构化选题洞察
export interface StructuredTopicInsight {
  id: string;
  title: string;              // 洞察标题
  coreFinding: string;        // 核心发现
  dataSupport: {              // 数据支撑
    metric: string;
    value: string;
    description: string;
  }[];
  keywordAnalysis: {          // 关键词分析
    highFrequency: string[];   // 高频词
    missingKeywords: string[]; // 缺失词/机会词
  };
  recommendedTopics: string[]; // 推荐选题方向
  contentStrategy: string[];   // 内容策略
  targetAudience: string[];   // 目标受众
  difficulty: 'low' | 'medium' | 'high';  // 难度评估
  estimatedImpact: string;    // 预估影响
  relatedArticles: string[];  // 相关文章ID
  confidence: number;         // 洞察置信度 (0-1)
}

// 完整分析结果
export interface CompleteAnalysisResult {
  keyword: string;
  totalArticles: number;
  processedArticles: number;

  // 基础统计
  basicStats: {
    avgRead: number;
    avgLike: number;
    originalRate: number;
    avgInteraction: number;
  };

  // 词云数据
  wordCloud: Array<{ word: string; count: number }>;

  // TOP文章AI分析结果
  topArticleInsights: TopArticleInsight[];

  // 结构化选题洞察
  structuredTopicInsights: StructuredTopicInsight[];

  // AI分析结果（保持向后兼容）
  aiSummaries: ArticleSummary[];
  structuredInfo: StructuredInfo;
  aiInsights: AIInsight[];

  // 规则分析结果
  ruleInsights: RuleBasedInsight[];

  // 元数据
  metadata: {
    modelUsed: string;
    processingTime: number;
    analysisVersion: string;
    timestamp: Date;
  };
}