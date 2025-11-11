import {
  ArticleSummary,
  StructuredInfo,
  AIInsight,
  RuleBasedInsight,
  CompleteAnalysisResult,
  EnhancedAnalysisProgress,
  TopArticleInsight,
  StructuredTopicInsight
} from '@/types';
import {
  WechatArticle,
  getTopLikedArticles,
  getTopInteractionArticles,
  generateWordCloud,
  calculateInteractionRate
} from './wechatService';
import {
  generateBatchSummaries,
  extractStructuredInfo,
  generateAIInsights,
  checkAIServiceAvailability,
  estimateAnalysisCost,
  analyzeTopArticles,
  generateStructuredTopicInsights
} from './aiService';

// 进度回调类型
export type ProgressCallback = (progress: EnhancedAnalysisProgress) => void;

// 分析编排器 - 协调整个分析流程
export class AnalysisOrchestrator {
  private progressCallbacks: ProgressCallback[] = [];

  // 添加进度监听器
  addProgressCallback(callback: ProgressCallback) {
    this.progressCallbacks.push(callback);
  }

  // 通知进度更新
  private notifyProgress(progress: EnhancedAnalysisProgress) {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('进度回调执行失败:', error);
      }
    });
  }

  // 执行完整分析流程
  async performCompleteAnalysis(
    articles: WechatArticle[],
    keyword: string
  ): Promise<CompleteAnalysisResult> {
    const startTime = Date.now();
    const totalArticles = articles.length;

    // 第一步：数据筛选
    this.notifyProgress({
      phase: 'filtering',
      message: '正在筛选高质量文章...',
      current: 0,
      total: totalArticles,
      aiStep: '数据质量评估'
    });

    const filteredArticles = this.filterTopArticles(articles);
    const processedCount = Math.min(filteredArticles.length, 8); // 最多处理8篇

    this.notifyProgress({
      phase: 'filtering',
      message: `已筛选出${processedCount}篇高质量文章进行AI分析`,
      current: totalArticles,
      total: totalArticles,
      aiStep: '筛选完成'
    });

    // 第二步：基础统计
    const basicStats = this.calculateBasicStats(articles);

    // 第三步：词云生成
    const wordCloud = generateWordCloud(articles);

    // 第四步：TOP文章和AI分析
    let aiSummaries: ArticleSummary[] = [];
    let structuredInfo: StructuredInfo | null = null;
    let aiInsights: AIInsight[] = [];
    let topArticleInsights: TopArticleInsight[] = [];
    let structuredTopicInsights: StructuredTopicInsight[] = [];

    const aiServiceStatus = checkAIServiceAvailability();

    if (aiServiceStatus.available) {
      try {
        // 步骤4.1: 筛选TOP文章（点赞TOP5 + 互动率TOP5）
        const topLikedArticles = getTopLikedArticles(articles, 5);
        const topInteractionArticles = getTopInteractionArticles(articles, 5);

        // 合并并去重
        const articleMap = new Map<string, WechatArticle>()
        topLikedArticles.forEach(article => articleMap.set(article.title, article))
        topInteractionArticles.forEach(article => articleMap.set(article.title, article))
        const allTopArticles = Array.from(articleMap.values()).slice(0, 10); // 最多10篇

        // 步骤4.2: TOP文章深度分析
        if (allTopArticles.length > 0) {
          this.notifyProgress({
            phase: 'analyzing',
            message: '正在深度分析TOP文章...',
            current: 0,
            total: 100,
            aiStep: 'TOP文章AI分析'
          });

          topArticleInsights = await analyzeTopArticles(
            allTopArticles,
            (phase, progress) => {
              this.notifyProgress({
                phase: 'analyzing',
                message: phase,
                current: progress,
                total: 100,
                aiStep: 'TOP文章分析中'
              });
            }
          );

          // 步骤4.3: 生成结构化选题洞察
          this.notifyProgress({
            phase: 'generating',
            message: '正在生成结构化选题洞察...',
            current: 0,
            total: 100,
            aiStep: '选题洞察分析'
          });

          structuredTopicInsights = await generateStructuredTopicInsights(
            topArticleInsights,
            keyword,
            (phase, progress) => {
              this.notifyProgress({
                phase: 'generating',
                message: phase,
                current: progress,
                total: 100,
                aiStep: '选题洞察生成中'
              });
            }
          );
        }

        // 步骤4.4: 传统AI分析（保持向后兼容）
        if (processedCount > 0) {
          // AI摘要生成
          this.notifyProgress({
            phase: 'summarizing',
            message: '正在生成文章摘要...',
            current: 0,
            total: processedCount,
            aiStep: 'AI文本分析'
          });

          aiSummaries = await generateBatchSummaries(filteredArticles.slice(0, processedCount));

          this.notifyProgress({
            phase: 'summarizing',
            message: `已完成${aiSummaries.length}篇文章的AI摘要`,
            current: processedCount,
            total: processedCount,
            aiStep: '摘要生成完成'
          });

          // 结构化信息提取
          this.notifyProgress({
            phase: 'extracting',
            message: '正在提取结构化信息...',
            current: 0,
            total: 1,
            aiStep: '信息结构化分析'
          });

          structuredInfo = await extractStructuredInfo(aiSummaries);

          this.notifyProgress({
            phase: 'extracting',
            message: '结构化信息提取完成',
            current: 1,
            total: 1,
            aiStep: '信息提取完成'
          });

          // AI洞察生成
          this.notifyProgress({
            phase: 'generating',
            message: '正在生成传统AI洞察...',
            current: 0,
            total: 1,
            aiStep: '深度洞察分析'
          });

          aiInsights = await generateAIInsights(structuredInfo);

          this.notifyProgress({
            phase: 'generating',
            message: `已生成${aiInsights.length}条传统AI洞察`,
            current: 1,
            total: 1,
            aiStep: '传统洞察生成完成'
          });
        }
      } catch (error) {
        console.error('❌ AI分析失败:', error);
        console.error('❌ 错误详情:', {
          message: error instanceof Error ? error.message : '未知错误',
          stack: error instanceof Error ? error.stack : '无堆栈信息',
          allTopArticlesCount: allTopArticles?.length || 0,
          keyword: keyword
        });
        this.notifyProgress({
          phase: 'error',
          message: `AI分析失败: ${error instanceof Error ? error.message : '未知错误'}`,
          current: 0,
          total: 1,
          aiStep: 'AI分析异常'
        });
      }
    }

    // 第五步：规则分析（始终执行）
    const ruleInsights = this.generateRuleBasedInsights(articles, keyword);

    // 计算处理时间
    const processingTime = Math.round((Date.now() - startTime) / 1000);

    // 构建最终结果
    const result: CompleteAnalysisResult = {
      keyword,
      totalArticles: articles.length,
      processedArticles: processedCount,
      basicStats,
      wordCloud,
      topArticleInsights,
      structuredTopicInsights,
      aiSummaries,
      structuredInfo: structuredInfo || {
        keywords: [],
        topics: [],
        arguments: [],
        uniqueAngles: [],
        targetAudience: [],
        contentGaps: [],
        trendingTopics: []
      },
      aiInsights,
      ruleInsights,
      metadata: {
        modelUsed: process.env.OPENAI_MODEL || 'rule-based',
        processingTime,
        analysisVersion: '1.0',
        timestamp: new Date()
      }
    };

    this.notifyProgress({
      phase: 'completed',
      message: '分析完成！',
      current: totalArticles,
      total: totalArticles,
      aiStep: '全部流程完成'
    });

    return result;
  }

  // 筛选高质量文章
  private filterTopArticles(articles: WechatArticle[]): WechatArticle[] {
    // 计算平均指标
    const avgRead = articles.reduce((sum, a) => sum + (a.read || 0), 0) / articles.length;
    const avgInteraction = articles.reduce((sum, a) => sum + calculateInteractionRate(a), 0) / articles.length;

    return articles
      .filter(article => {
        // 质量筛选条件
        const readOk = !article.read || article.read > avgRead * 0.5; // 阅读量不要太低
        const interactionOk = calculateInteractionRate(article) > avgInteraction * 0.3; // 互动率不要太低
        const hasContent = article.title && article.title.length > 10; // 标题要有意义

        return readOk && interactionOk && hasContent;
      })
      .sort((a, b) => {
        // 按综合评分排序（阅读量70% + 互动率30%）
        const scoreA = (a.read || 0) * 0.7 + calculateInteractionRate(a) * 1000 * 0.3;
        const scoreB = (b.read || 0) * 0.7 + calculateInteractionRate(b) * 1000 * 0.3;
        return scoreB - scoreA;
      });
  }

  // 计算基础统计
  private calculateBasicStats(articles: WechatArticle[]) {
    const avgRead = Math.round(articles.reduce((sum, article) => sum + (article.read || 0), 0) / articles.length);
    const avgLike = Math.round(articles.reduce((sum, article) => sum + (article.praise || 0), 0) / articles.length);
    const originalRate = Math.round((articles.filter(article => article.is_original === 1).length / articles.length) * 100);
    const avgInteraction = articles.reduce((sum, article) => sum + calculateInteractionRate(article), 0) / articles.length;

    return {
      avgRead,
      avgLike,
      originalRate,
      avgInteraction
    };
  }

  // 生成基于规则的洞察
  private generateRuleBasedInsights(articles: WechatArticle[], keyword: string): RuleBasedInsight[] {
    const insights: RuleBasedInsight[] = [];

    // 1. 基础统计洞察
    const avgRead = Math.round(articles.reduce((sum, a) => sum + (a.read || 0), 0) / articles.length);
    const avgLike = Math.round(articles.reduce((sum, a) => sum + (a.praise || 0), 0) / articles.length);
    const originalRate = Math.round((articles.filter(a => a.is_original === 1).length / articles.length) * 100);

    insights.push({
      id: 'basic_stats',
      title: '基础数据概览',
      description: `关于"${keyword}"话题的${articles.length}篇文章中，平均阅读量为${avgRead.toLocaleString()}，平均点赞量为${avgLike.toLocaleString()}，原创内容占比${originalRate}%`,
      type: 'statistics',
      metric: '基础指标',
      value: `${articles.length}篇文章`,
      details: [
        `平均阅读量: ${avgRead.toLocaleString()}`,
        `平均点赞量: ${avgLike.toLocaleString()}`,
        `原创率: ${originalRate}%`
      ]
    });

    // 2. 热门公众号洞察
    const wxGroups = articles.reduce((acc, article) => {
      if (!acc[article.wx_name]) {
        acc[article.wx_name] = { count: 0, totalRead: 0, totalLike: 0 };
      }
      acc[article.wx_name].count++;
      acc[article.wx_name].totalRead += article.read || 0;
      acc[article.wx_name].totalLike += article.praise || 0;
      return acc;
    }, {} as Record<string, { count: number; totalRead: number; totalLike: number }>);

    const topWx = Object.entries(wxGroups)
      .sort((a, b) => b[1].totalRead - a[1].totalRead)
      .slice(0, 3);

    if (topWx.length > 0) {
      insights.push({
        id: 'top_accounts',
        title: '活跃公众号排行',
        description: `"${topWx[0][0]}"是该话题最活跃的公众号，共发布${topWx[0][1].count}篇文章`,
        type: 'ranking',
        metric: '公众号活跃度',
        value: topWx.length,
        details: topWx.map(([name, data], index) =>
          `${index + 1}. ${name}: ${data.count}篇, 总阅读${data.totalRead.toLocaleString()}`
        )
      });
    }

    // 3. 时间趋势洞察
    const recentArticles = articles.filter(article => {
      const publishTime = article.publish_time * 1000;
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return publishTime > weekAgo;
    });

    if (recentArticles.length > 0) {
      insights.push({
        id: 'recent_trend',
        title: '近期发布趋势',
        description: `最近7天有${recentArticles.length}篇相关文章发布，该话题热度较高`,
        type: 'timing',
        metric: '近期文章数',
        value: recentArticles.length,
        details: [
          `7天内发布: ${recentArticles.length}篇`,
          `占比: ${Math.round((recentArticles.length / articles.length) * 100)}%`,
          '趋势: 活跃上升'
        ]
      });
    }

    // 4. 内容质量洞察
    const highQualityArticles = articles.filter(article => {
      const interactionRate = calculateInteractionRate(article);
      return interactionRate > 0.05; // 互动率超过5%
    });

    if (highQualityArticles.length > 0) {
      insights.push({
        id: 'content_quality',
        title: '内容质量评估',
        description: `${highQualityArticles.length}篇文章互动率超过5%，内容质量较高`,
        type: 'quality',
        metric: '高质量文章',
        value: highQualityArticles.length,
        details: [
          `高质量文章: ${highQualityArticles.length}篇`,
          `占比: ${Math.round((highQualityArticles.length / articles.length) * 100)}%`,
          '标准: 互动率>5%'
        ]
      });
    }

    // 5. 热门文章排行
    const topArticles = getTopLikedArticles(articles, 3);
    if (topArticles.length > 0) {
      insights.push({
        id: 'top_articles',
        title: '热门文章排行',
        description: '以下文章在该话题中获得最高关注度和互动',
        type: 'ranking',
        metric: 'TOP文章',
        value: topArticles.length,
        details: topArticles.map((article, index) =>
          `${index + 1}. ${article.title.substring(0, 20)}... (阅读${article.read?.toLocaleString()})`
        )
      });
    }

    return insights;
  }
}

// 创建分析器实例
export const analysisOrchestrator = new AnalysisOrchestrator();

// 便捷函数：分析文章并生成洞察
export async function analyzeArticlesWithAI(
  articles: WechatArticle[],
  keyword: string,
  onProgress?: ProgressCallback
): Promise<CompleteAnalysisResult> {
  if (onProgress) {
    analysisOrchestrator.addProgressCallback(onProgress);
  }

  // 估算分析成本
  const costEstimate = estimateAnalysisCost(Math.min(articles.length, 8));
  console.log(`预估分析成本: $${costEstimate.estimatedCost} (${costEstimate.estimatedTokens} tokens)`);

  return analysisOrchestrator.performCompleteAnalysis(articles, keyword);
}

// 获取分析预估信息
export function getAnalysisEstimate(articleCount: number): {
  processingTime: { min: number; max: number };
  cost: { estimatedCost: number; currency: string };
  articlesToProcess: number;
  aiAvailable: boolean;
} {
  const aiServiceStatus = checkAIServiceAvailability();
  const articlesToProcess = Math.min(articleCount, 8);
  const costEstimate = estimateAnalysisCost(articlesToProcess);

  // 时间估算：每篇文章约30秒处理时间
  const minTime = articlesToProcess * 20;
  const maxTime = articlesToProcess * 45;

  return {
    processingTime: { min: minTime, max: maxTime },
    cost: {
      estimatedCost: costEstimate.estimatedCost,
      currency: costEstimate.currency
    },
    articlesToProcess,
    aiAvailable: aiServiceStatus.available
  };
}