import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      keyword,
      articleCount,
      avgRead,
      avgLike,
      originalRate,
      articles,
      insights,
      wordCloud,
      topLikedArticles,
      topInteractionArticles,
      // 新增AI分析字段
      aiSummaries,
      structuredInfo,
      aiInsights,
      ruleInsights,
      metadata
    } = body

    // 验证必需字段
    if (!keyword || !articles) {
      return NextResponse.json(
        { error: '缺少必需字段: keyword, articles' },
        { status: 400 }
      )
    }

    // 创建搜索历史记录
    const searchHistory = await prisma.searchHistory.create({
      data: {
        keyword,
        articleCount,
        avgRead,
        avgLike,
        originalRate,
        status: 'completed'
      }
    })

    // 分离AI洞察和规则洞察
    const aiGeneratedInsights = aiInsights ? JSON.stringify(aiInsights) : null
    const ruleBasedInsights = ruleInsights ? JSON.stringify(ruleInsights) : null
    const combinedInsights = insights ? JSON.stringify(insights) : null

    // 创建分析结果
    const analysisResult = await prisma.analysisResult.create({
      data: {
        searchHistoryId: searchHistory.id,
        insights: combinedInsights || '[]', // 保持向后兼容
        wordCloud: JSON.stringify(wordCloud || []),
        topLikedArticles: JSON.stringify(topLikedArticles || []),
        topInteractionArticles: JSON.stringify(topInteractionArticles || []),
        allArticles: JSON.stringify(articles),

        // 新增AI分析相关字段
        aiSummaries: aiSummaries ? JSON.stringify(aiSummaries) : null,
        structuredInfo: structuredInfo ? JSON.stringify(structuredInfo) : null,
        aiInsights: aiInsights ? JSON.stringify(aiInsights) : null,

        // 洞察分类追踪
        ruleBasedInsights: ruleBasedInsights,
        aiGeneratedInsights: aiGeneratedInsights,

        // 元数据
        analysisVersion: metadata?.analysisVersion || '1.0',
        aiModelUsed: metadata?.modelUsed || 'unknown',
        processingTime: metadata?.processingTime || null,
        aiAnalysisStatus: metadata ? 'completed' : null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        searchHistoryId: searchHistory.id,
        analysisResultId: analysisResult.id,
        message: 'AI增强分析结果保存成功',
        metadata: {
          hasAISummaries: !!aiSummaries,
          hasAIInsights: !!aiInsights,
          hasRuleInsights: !!ruleInsights,
          totalInsights: (aiInsights?.length || 0) + (ruleInsights?.length || 0)
        }
      }
    })

  } catch (error) {
    console.error('保存分析结果失败:', error)
    return NextResponse.json(
      {
        error: '保存分析结果失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}