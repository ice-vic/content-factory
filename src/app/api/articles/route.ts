import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const platform = searchParams.get('platform') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // 构建查询条件
    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { plainContent: { contains: search } }
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (platform && platform !== 'all') {
      if (platform === 'multi') {
        // 多平台筛选：目标平台包含多个平台
        where.targetPlatforms = {
          contains: '"wechat","xiaohongshu"'
        }
      } else {
        // 单平台筛选
        where.OR = [
          { platform: platform },
          { targetPlatforms: { contains: `"${platform}"` } }
        ]
      }
    }

    // 获取总数
    const total = await prisma.article.count({ where })

    // 获取文章列表
    const articles = await prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        publishRecords: {
          select: {
            platform: true,
            status: true,
            publishedAt: true,
            withdrawnAt: true
          }
        }
      }
    })

    // 格式化数据，匹配前端期望的结构
    const formattedArticles = articles.map(article => {
      const targetPlatforms = JSON.parse(article.targetPlatforms || '[]')

      // 生成缩略图URL（这里先使用占位图，后续可以优化）
      const thumbnail = article.hasImages ?
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=100&fit=crop' :
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=100&fit=crop'

      return {
        id: article.id.toString(),
        title: article.title,
        createdAt: article.createdAt.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).replace(/\//g, '-'),
        status: article.status,
        targetPlatforms,
        thumbnail,
        publishRecords: article.publishRecords.map(record => ({
          platform: record.platform,
          status: record.status,
          publishedAt: record.publishedAt,
          withdrawnAt: record.withdrawnAt
        })),
        // 额外信息供后续功能使用
        content: article.content,
        htmlContent: article.htmlContent,
        platform: article.platform,
        style: article.style,
        length: article.length,
        hasImages: article.hasImages,
        estimatedReadingTime: article.estimatedReadingTime,
        sections: article.sections ? JSON.parse(article.sections) : []
      }
    })

    const totalPages = Math.ceil(total / limit)

    console.log('📋 获取文章列表:', {
      total,
      page,
      totalPages,
      articlesCount: formattedArticles.length,
      filters: { search, status, platform }
    })

    return NextResponse.json({
      success: true,
      articles: formattedArticles,
      total,
      page,
      totalPages
    })

  } catch (error) {
    console.error('💥 获取文章列表失败:', error)

    return NextResponse.json({
      success: false,
      error: '获取文章列表失败',
      articles: [],
      total: 0,
      page: 1,
      totalPages: 0
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}