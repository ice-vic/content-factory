import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'wechat' | 'xiaohongshu' | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const keyword = searchParams.get('keyword') || ''

    const skip = (page - 1) * limit

    // 验证类型参数
    if (type && !['wechat', 'xiaohongshu'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: '无效的查询类型，必须是 wechat 或 xiaohongshu'
      }, { status: 400 })
    }

    // 构建查询条件
    const where: any = {}

    if (keyword) {
      where.keyword = {
        contains: keyword,
        mode: 'insensitive' as const
      }
    }

    if (type) {
      where.type = type
    }

    // 获取搜索历史列表
    const [histories, total] = await Promise.all([
      prisma.searchHistory.findMany({
        where,
        include: {
          analysisResult: true
        },
        orderBy: {
          searchTime: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.searchHistory.count({ where })
    ])

    // 格式化返回数据
    const formattedHistories = histories.map(history => ({
      id: history.id,
      type: history.type,
      keyword: history.keyword,
      searchTime: history.searchTime,
      articleCount: history.articleCount,
      avgRead: history.avgRead,
      avgLike: history.avgLike,
      originalRate: history.originalRate,
      status: history.status,
      errorMessage: history.errorMessage,
      duration: history.duration,
      hasAnalysisResult: !!history.analysisResult,
      result_summary: history.analysisResult ? {
        totalArticles: history.articleCount,
        avgLikes: history.avgLike,
        avgRead: history.avgRead,
        originalRate: history.originalRate
      } : null
    }))

    return NextResponse.json({
      success: true,
      data: formattedHistories,
      total,
      hasMore: skip + limit < total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total
      }
    })

  } catch (error) {
    console.error('获取历史记录失败:', error)
    return NextResponse.json(
      { success: false, error: '获取历史记录失败' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}