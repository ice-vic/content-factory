import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // 格式化返回数据
    const formattedHistory = {
      id: history.id,
      keyword: history.keyword,
      searchTime: history.searchTime,
      articleCount: history.articleCount,
      avgRead: history.avgRead,
      avgLike: history.avgLike,
      originalRate: history.originalRate,
      status: history.status,
      errorMessage: history.errorMessage,
      analysisResult: history.analysisResult ? {
        id: history.analysisResult.id,
        insights: JSON.parse(history.analysisResult.insights),
        wordCloud: JSON.parse(history.analysisResult.wordCloud),
        topLikedArticles: JSON.parse(history.analysisResult.topLikedArticles),
        topInteractionArticles: JSON.parse(history.analysisResult.topInteractionArticles),
        allArticles: JSON.parse(history.analysisResult.allArticles),
        // AI分析相关字段
        aiSummaries: history.analysisResult.aiSummaries ? JSON.parse(history.analysisResult.aiSummaries) : null,
        structuredInfo: history.analysisResult.structuredInfo ? JSON.parse(history.analysisResult.structuredInfo) : null,
        aiInsights: history.analysisResult.aiInsights ? JSON.parse(history.analysisResult.aiInsights) : null,
        // AI结构化洞察 - 这是最重要的字段
        structuredTopicInsights: history.analysisResult.aiGeneratedInsights ? JSON.parse(history.analysisResult.aiGeneratedInsights) : null,
        // 元数据
        metadata: {
          analysisVersion: history.analysisResult.analysisVersion,
          modelUsed: history.analysisResult.aiModelUsed,
          processingTime: history.analysisResult.processingTime,
          timestamp: history.analysisResult.createdAt
        },
        createdAt: history.analysisResult.createdAt
      } : null
    }

    return NextResponse.json({
      success: true,
      data: formattedHistory
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