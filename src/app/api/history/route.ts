import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const keyword = searchParams.get('keyword') || ''

    const skip = (page - 1) * limit

    // 构建查询条件
    const where = keyword
      ? {
          keyword: {
            contains: keyword,
            mode: 'insensitive' as const
          }
        }
      : {}

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
      keyword: history.keyword,
      searchTime: history.searchTime,
      articleCount: history.articleCount,
      avgRead: history.avgRead,
      avgLike: history.avgLike,
      originalRate: history.originalRate,
      status: history.status,
      errorMessage: history.errorMessage,
      hasAnalysisResult: !!history.analysisResult
    }))

    return NextResponse.json({
      success: true,
      data: {
        histories: formattedHistories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('获取历史记录失败:', error)
    return NextResponse.json(
      { error: '获取历史记录失败' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}