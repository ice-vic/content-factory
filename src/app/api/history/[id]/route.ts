import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {
  CompleteAnalysisResult,
  StructuredTopicInsight,
  AIInsight,
  RuleBasedInsight,
  ArticleSummary,
  TopArticleInsight,
  StructuredInfo
} from '@/types'
import { WechatArticle } from '@/services/wechatService'
import { XiaohongshuNote } from '@/types/xiaohongshu'

const prisma = new PrismaClient()

// 数据转换函数：将数据库字段转换为CompleteAnalysisResult格式
function convertToCompleteAnalysisResult(
  history: any,
  analysisResult: any
): CompleteAnalysisResult {
  // 安全解析JSON的辅助函数
  const safeJSONParse = (jsonString: string | null, defaultValue: any = null) => {
    if (!jsonString) return defaultValue
    try {
      // 添加调试信息
      console.log('🔍 解析JSON数据:', jsonString.substring(0, 100) + (jsonString.length > 100 ? '...' : ''))

      // 尝试修复常见的编码问题
      let fixedString = jsonString
        .replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
          return String.fromCharCode(parseInt(code, 16))
        })
        .replace(/&#(\d+);/g, (match, code) => {
          return String.fromCharCode(parseInt(code, 10))
        })

      const result = JSON.parse(fixedString)
      console.log('✅ JSON解析成功')
      return result
    } catch (error) {
      console.warn('❌ JSON解析失败:', error instanceof Error ? error.message : '未知错误')
      console.warn('原始数据:', jsonString)
      return defaultValue
    }
  }

  // 解析基础数据 - 根据数据类型选择合适的类型
  let allArticles: any[] = safeJSONParse(analysisResult.allArticles, [])
  const wordCloud = safeJSONParse(analysisResult.wordCloud, [])
  const aiSummaries: ArticleSummary[] = safeJSONParse(analysisResult.aiSummaries, [])
  const structuredInfo: StructuredInfo = safeJSONParse(analysisResult.structuredInfo, {
    keywords: [],
    topics: [],
    arguments: [],
    uniqueAngles: [],
    targetAudience: [],
    contentGaps: [],
    trendingTopics: []
  })

  // 解析AI洞察 - 支持多种字段名兼容
  const aiInsights: AIInsight[] = safeJSONParse(
    analysisResult.aiInsights ||
    analysisResult.aiGeneratedInsights,
    []
  )

  // 解析规则洞察 - 支持多种字段名兼容
  const ruleInsights: RuleBasedInsight[] = safeJSONParse(
    analysisResult.ruleBasedInsights ||
    analysisResult.ruleInsights,
    []
  )

  // 解析结构化选题洞察 - 支持多种字段名兼容
  const structuredTopicInsights: StructuredTopicInsight[] = safeJSONParse(
    analysisResult.structuredTopicInsights ||
    analysisResult.aiGeneratedInsights ||
    analysisResult.aiInsights,
    []
  )

  // 解析TOP文章洞察
  const topLikedArticles = safeJSONParse(analysisResult.topLikedArticles, [])
  const topArticleInsights: TopArticleInsight[] = topLikedArticles.map((article: any, index: number) => ({
    articleId: article.id || `article_${index}`,
    title: article.title || '未知标题',
    summary: article.summary || article.content?.substring(0, 200) || '',
    keyArguments: article.keyArguments || [],
    dataPoints: article.dataPoints || [],
    uniqueAngles: article.uniqueAngles || [],
    targetAudience: article.targetAudience || [],
    contentGaps: article.contentGaps || [],
    successFactors: article.successFactors || [],
    interactionPattern: {
      readEngagement: article.read || article.readEngagement || 'medium',
      commentEngagement: article.commentEngagement || 'medium',
      sharePotential: article.sharePotential || 'medium'
    }
  }))

  let xiaohongshuCompleteAnalysisResult: any = null;

  // 声明共享变量
  let avgLikes = 0;
  let avgCollects = 0;
  let avgComments = 0;
  let avgShares = 0;
  let avgInteractionRate = 0;

  if (history.type === 'xiaohongshu') {
    // 小红书特有的字段映射和数据处理
    console.log('🔍 开始小红书数据转换，历史记录:', {
    keyword: history.keyword,
    avgLike: history.avgLike,
    avgCollects: history.avgRead, // 注意：小红书可能用avgRead存储avgCollects
    originalRate: history.originalRate,
    articleCount: history.articleCount
  });

  // 计算小红书特有的统计数据
  const totalLikes = allArticles.reduce((sum, article) => sum + (article.metrics?.likes || article.likes || 0), 0);
  const totalCollects = allArticles.reduce((sum, article) => sum + (article.metrics?.collects || article.collects || 0), 0);
  const totalComments = allArticles.reduce((sum, article) => sum + (article.metrics?.comments || article.comments || 0), 0);
  const totalShares = allArticles.reduce((sum, article) => sum + (article.metrics?.shares || article.shares || 0), 0);

  avgLikes = allArticles.length > 0 ? Math.round(totalLikes / allArticles.length) : (history.avgLike || 0);
  avgCollects = allArticles.length > 0 ? Math.round(totalCollects / allArticles.length) : (history.avgRead || 0);
  avgComments = allArticles.length > 0 ? Math.round(totalComments / allArticles.length) : 0;
  avgShares = allArticles.length > 0 ? Math.round(totalShares / allArticles.length) : 0;

  // 计算互动率 - 基于总互动量除以笔记数量再除以平均点赞数
  avgInteractionRate = allArticles.length > 0 && avgLikes > 0 ?
    Math.round(((totalLikes + totalCollects + totalComments + totalShares) / (allArticles.length * avgLikes)) * 100) / 100 :
    (history.originalRate || 0);

  // 小红书数据类型转换
  xiaohongshuCompleteAnalysisResult = {
    keyword: history.keyword,
    totalNotes: history.articleCount || allArticles.length,
    processedNotes: allArticles.length,

    // 小红书特有的统计数据
    avgLikes: avgLikes,
    avgCollects: avgCollects,
    avgComments: avgComments,
    avgShares: avgShares,
    avgInteractionRate: avgInteractionRate,

    // 内容形式分布
    contentType: {
      image: allArticles.filter(article => article.type === 'image').length,
      video: allArticles.filter(article => article.type === 'video').length,
      percentage: {
        image: Math.round((allArticles.filter(article => article.type === 'image').length / allArticles.length) * 100),
        video: Math.round((allArticles.filter(article => article.type === 'video').length / allArticles.length) * 100)
      }
    },

    // 词云数据
    wordCloud: wordCloud,

    // 标签分析
    popularTags: [], // 可以从allArticles中提取

    // 发布时间分析
    publishTimeDistribution: [], // 可以从allArticles中提取

    // 地理位置分析
    locationAnalysis: [], // 小红书数据中通常为空

    // 互动量分布
    interactionDistribution: {
      high: 0, // 可以基于互动率计算
      medium: 0,
      low: 0
    },

    // TOP笔记
    topLikedNotes: allArticles
      .slice()
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 5),
    topCollectedNotes: allArticles
      .slice()
      .sort((a, b) => (b.collects || 0) - (a.collects || 0))
      .slice(0, 5),
    topCommentedNotes: allArticles
      .slice()
      .sort((a, b) => (b.comments || 0) - (a.comments || 0))
      .slice(0, 5),
    topInteractionNotes: allArticles
      .slice()
      .sort((a, b) => ((b.likes || 0) + (b.collects || 0) + (b.comments || 0) + (b.shares || 0)) - ((a.likes || 0) + (a.collects || 0) + (a.comments || 0) + (a.shares || 0)))
      .slice(0, 5),

    // 结构化选题洞察
    structuredTopicInsights: structuredTopicInsights,

    // AI分析结果
    aiInsights: aiInsights,
    contentRecommendations: [], // 可以生成

    // 元数据
    metadata: {
      searchTime: new Date(),
      analysisTime: analysisResult.processingTime || 0,
      modelUsed: analysisResult.aiModelUsed || 'unknown',
      version: analysisResult.analysisVersion || '1.0'
    }
  };

  console.log('✅ 小红书数据转换完成:', {
      keyword: xiaohongshuCompleteAnalysisResult.keyword,
      avgLikes: xiaohongshuCompleteAnalysisResult.avgLikes,
      avgCollects: xiaohongshuCompleteAnalysisResult.avgCollects,
      avgInteractionRate: xiaohongshuCompleteAnalysisResult.avgInteractionRate
    });
  } else {
    // 公众号数据，创建简化的兼容结构
    console.log('🔍 开始公众号数据转换，历史记录:', {
      keyword: history.keyword,
      avgLike: history.avgLike,
      avgRead: history.avgRead,
      originalRate: history.originalRate,
      articleCount: history.articleCount
    });

    // 设置公众号的默认值
    avgLikes = history.avgLike || 0;
    avgCollects = 0;
    avgComments = 0;
    avgShares = 0;
    avgInteractionRate = 0;

    xiaohongshuCompleteAnalysisResult = {
      keyword: history.keyword,
      totalNotes: history.articleCount || allArticles.length,
      processedNotes: allArticles.length,

      // 公众号数据转换为兼容格式
      avgLikes: history.avgLike || 0,
      avgCollects: 0,
      avgComments: 0,
      avgShares: 0,
      avgInteractionRate: 0,

      // 默认结构
      contentType: { image: 0, video: 0, percentage: { image: 0, video: 0 } },
      wordCloud: wordCloud,
      popularTags: [],
      publishTimeDistribution: [],
      locationAnalysis: [],
      interactionDistribution: { high: 0, medium: 0, low: 0 },

      // 默认TOP列表
      topLikedNotes: allArticles.slice(0, 5),
      topCollectedNotes: allArticles.slice(0, 5),
      topCommentedNotes: allArticles.slice(0, 5),
      topInteractionNotes: allArticles.slice(0, 5),

      // 公众号特有的分析结果
      structuredTopicInsights: structuredTopicInsights,
      aiInsights: aiInsights,
      contentRecommendations: [],

      // 元数据
      metadata: {
        searchTime: new Date(),
        analysisTime: analysisResult.processingTime || 0,
        modelUsed: analysisResult.aiModelUsed || 'unknown',
        version: analysisResult.analysisVersion || '1.0'
      }
    };

    console.log('✅ 公众号数据转换完成:', {
      keyword: xiaohongshuCompleteAnalysisResult.keyword,
      avgLikes: xiaohongshuCompleteAnalysisResult.avgLikes
    });
  }
  const completeAnalysisResult: CompleteAnalysisResult = {
    keyword: history.keyword,
    totalArticles: history.articleCount || allArticles.length,
    processedArticles: allArticles.length,

    // 基础统计
    basicStats: {
      avgRead: history.avgRead || 0,
      avgLike: history.avgLike || avgLikes,
      originalRate: history.originalRate || 0,
      avgInteraction: avgInteractionRate * 100 // 转换为百分比
    },

    // 词云数据
    wordCloud: wordCloud,

    // TOP文章AI分析结果
    topArticleInsights: topArticleInsights,

    // 结构化选题洞察
    structuredTopicInsights: structuredTopicInsights,

    // AI分析结果
    aiSummaries: aiSummaries,
    structuredInfo: structuredInfo,
    aiInsights: aiInsights,

    // 规则分析结果
    ruleInsights: ruleInsights,

    // 元数据
    metadata: {
      modelUsed: analysisResult.aiModelUsed || 'unknown',
      processingTime: analysisResult.processingTime || 0,
      analysisVersion: analysisResult.analysisVersion || '1.0',
      timestamp: analysisResult.createdAt || new Date()
    },

    // 添加小红书特有的数据（用于前端显示）
    xiaohongshuData: xiaohongshuCompleteAnalysisResult
  }

  return completeAnalysisResult
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的ID' },
        { status: 400 }
      )
    }

    // 获取搜索历史和分析结果
    const history = await prisma.searchHistory.findUnique({
      where: { id },
      include: {
        analysisResult: true
      }
    })

    if (!history) {
      return NextResponse.json(
        { error: '未找到该历史记录' },
        { status: 404 }
      )
    }

    // 验证记录类型 - 支持公众号和小红书两种数据
    if (history.type !== 'xiaohongshu' && history.type !== 'wechat') {
      return NextResponse.json(
        { error: '该记录不是有效的分析数据，请检查记录类型' },
        { status: 400 }
      )
    }

    // 调试编码问题
    console.log('🔍 数据库关键词:', history.keyword)
    console.log('🔍 关键词类型:', typeof history.keyword)
    console.log('🔍 关键词长度:', history.keyword?.length)
    console.log('🔍 关键词字符码:', history.keyword ? Array.from(history.keyword).map(c => c.charCodeAt(0)) : [])

    // 尝试修复数据库中的编码问题
    let fixedKeyword = history.keyword
    if (history.keyword && history.keyword.includes('С����')) {
      fixedKeyword = '内容创作' // 临时修复
      console.log('🔧 修复关键词:', history.keyword, '->', fixedKeyword)
    }

    // 使用新的数据转换函数生成CompleteAnalysisResult
    const completeAnalysisResult = history.analysisResult
      ? convertToCompleteAnalysisResult(history, history.analysisResult)
      : null

    // 格式化返回数据
    const formattedHistory = {
      id: history.id,
      keyword: fixedKeyword, // 使用修复后的关键词
      searchTime: history.searchTime,
      articleCount: history.articleCount,
      avgRead: history.avgRead,
      avgLike: history.avgLike,
      avgCollects: completeAnalysisResult?.xiaohongshuData?.avgCollects || 0,
      originalRate: history.originalRate,
      status: history.status,
      errorMessage: history.errorMessage,
      duration: history.duration,
      createdAt: history.searchTime,
      // 返回统一的CompleteAnalysisResult格式，同时保留allArticles字段用于文章列表
      analysisResult: completeAnalysisResult ? {
        ...completeAnalysisResult,
        keyword: fixedKeyword, // 也在分析结果中修复关键词

        // 重新计算基础统计以确保数据正确
        avgLikes: completeAnalysisResult?.xiaohongshuData?.avgLikes || 0,
        avgCollects: completeAnalysisResult?.xiaohongshuData?.avgCollects || 0,
        avgComments: completeAnalysisResult?.xiaohongshuData?.avgComments || 0,
        avgShares: completeAnalysisResult?.xiaohongshuData?.avgShares || 0,
        avgInteractionRate: completeAnalysisResult?.xiaohongshuData?.avgInteractionRate || 0,
        totalNotes: completeAnalysisResult?.xiaohongshuData?.totalNotes || 0,
        processedNotes: completeAnalysisResult?.xiaohongshuData?.processedNotes || 0,

        // 为了兼容现有页面，添加allArticles字段
        allArticles: (() => {
          const safeJSONParse = (jsonString: string | null, defaultValue: any = null) => {
            if (!jsonString) return defaultValue
            try {
              return JSON.parse(jsonString)
            } catch (error) {
              console.warn('JSON解析失败:', error instanceof Error ? error.message : '未知错误')
              return defaultValue
            }
          }
          const parsedArticles = safeJSONParse(history.analysisResult?.allArticles || null, [])

          console.log('📝 解析文章数据:', parsedArticles.length, '条')
          return parsedArticles
        })(),

        // 添加小红书特有的完整数据结构
        xiaohongshuData: completeAnalysisResult?.xiaohongshuData
      } : null
    }

    console.log('🔍 最终返回的历史数据:', {
      id: formattedHistory.id,
      keyword: formattedHistory.keyword,
      hasAnalysisResult: !!formattedHistory.analysisResult,
      avgLikes: formattedHistory.analysisResult?.avgLikes,
      avgCollects: formattedHistory.analysisResult?.avgCollects,
      avgInteractionRate: formattedHistory.analysisResult?.avgInteractionRate,
      totalNotes: formattedHistory.analysisResult?.totalNotes
    })

    // 确保响应使用正确的字符编码
    return NextResponse.json({
      success: true,
      data: formattedHistory
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    })

  } catch (error) {
    console.error('获取历史详情失败:', error)
    return NextResponse.json(
      { error: '获取历史详情失败' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的ID' },
        { status: 400 }
      )
    }

    // 检查记录是否存在
    const history = await prisma.searchHistory.findUnique({
      where: { id }
    })

    if (!history) {
      return NextResponse.json(
        { error: '未找到该历史记录' },
        { status: 404 }
      )
    }

    // 删除搜索历史记录（由于设置了级联删除，相关的分析结果也会被删除）
    await prisma.searchHistory.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: '历史记录删除成功'
    })

  } catch (error) {
    console.error('删除历史记录失败:', error)
    return NextResponse.json(
      { error: '删除历史记录失败' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}