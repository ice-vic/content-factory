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

  // 解析基础数据
  const allArticles: WechatArticle[] = safeJSONParse(analysisResult.allArticles, [])
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

  // 构建CompleteAnalysisResult
  const completeAnalysisResult: CompleteAnalysisResult = {
    keyword: history.keyword,
    totalArticles: history.articleCount || allArticles.length,
    processedArticles: allArticles.length,

    // 基础统计
    basicStats: {
      avgRead: history.avgRead || 0,
      avgLike: history.avgLike || 0,
      originalRate: history.originalRate || 0,
      avgInteraction: 0 // 可以根据需要计算
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
    }
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

    // 验证记录类型 - 确保是小红书数据
    if (history.type !== 'xiaohongshu') {
      return NextResponse.json(
        { error: '该记录不是小红书分析数据，请检查记录类型' },
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
      originalRate: history.originalRate,
      status: history.status,
      errorMessage: history.errorMessage,
      duration: history.duration,
      createdAt: history.searchTime,
      // 返回统一的CompleteAnalysisResult格式，同时保留allArticles字段用于文章列表
      analysisResult: completeAnalysisResult ? {
        ...completeAnalysisResult,
        keyword: fixedKeyword, // 也在分析结果中修复关键词
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
          return safeJSONParse(history.analysisResult?.allArticles || null, [])
        })()
      } : null
    }

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