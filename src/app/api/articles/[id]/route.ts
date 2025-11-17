import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// 全局Prisma实例，避免重复创建
let prisma: PrismaClient

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    })
  }
  return prisma
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 开始获取文章详情，ID:', params.id)

    const articleId = parseInt(params.id)
    console.log('🔢 解析后的文章ID:', articleId)

    if (isNaN(articleId)) {
      console.log('❌ 无效的文章ID:', params.id)
      return NextResponse.json({
        success: false,
        error: '无效的文章ID'
      }, { status: 400 })
    }

    const prismaClient = getPrismaClient()
    console.log('📊 开始查询数据库...')

    const article = await prismaClient.article.findUnique({
      where: { id: articleId },
      include: {
        publishRecords: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    console.log('📝 查询结果:', article ? '找到文章' : '未找到文章')

    if (!article) {
      console.log('❌ 文章不存在，ID:', articleId)
      return NextResponse.json({
        success: false,
        error: '文章不存在'
      }, { status: 404 })
    }

    console.log('✅ 文章查询成功，开始格式化数据...')
    // 格式化数据
    const formattedArticle = {
      id: article.id.toString(),
      title: article.title,
      content: article.content,
      htmlContent: article.htmlContent,
      platform: article.platform,
      style: article.style,
      length: article.length,
      targetPlatforms: JSON.parse(article.targetPlatforms || '[]'),
      customInstructions: article.customInstructions,
      insightId: article.insightId,
      topicDirection: article.topicDirection,
      hasImages: article.hasImages,
      imageConfig: article.imageConfig ? JSON.parse(article.imageConfig) : null,
      status: article.status,
      estimatedReadingTime: article.estimatedReadingTime,
      sections: article.sections ? JSON.parse(article.sections) : [],
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      publishRecords: article.publishRecords.map(record => ({
        id: record.id,
        platform: record.platform,
        status: record.status,
        publishedUrl: record.publishedUrl,
        publishedAt: record.publishedAt,
        withdrawnAt: record.withdrawnAt,
        errorMessage: record.errorMessage,
        retryCount: record.retryCount,
        platformData: record.platformData ? JSON.parse(record.platformData) : null,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }))
    }

    console.log('🎯 文章格式化完成，准备返回响应')

    return NextResponse.json({
      success: true,
      article: formattedArticle
    })

  } catch (error) {
    console.error('💥 获取文章详情失败:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      articleId: params.id
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取文章详情失败',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error instanceof Error ? error.stack : undefined
      } : undefined
    }, { status: 500 })
  }
  // 移除 finally 块中的 prisma.$disconnect()，因为我们使用全局实例
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = parseInt(params.id)

    if (isNaN(articleId)) {
      return NextResponse.json({
        success: false,
        error: '无效的文章ID'
      }, { status: 400 })
    }

    const body = await request.json()
    const {
      title,
      content,
      htmlContent,
      status,
      customInstructions
    } = body

    // 构建更新数据
    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (content !== undefined) {
      updateData.content = content
      // 如果有HTML内容，同时更新纯文本内容
      if (htmlContent) {
        updateData.htmlContent = htmlContent
        updateData.plainContent = htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
      } else {
        updateData.plainContent = content.replace(/\s+/g, ' ').trim()
      }
    }
    if (status !== undefined) updateData.status = status
    if (customInstructions !== undefined) updateData.customInstructions = customInstructions

    const prismaClient = getPrismaClient()
    const article = await prismaClient.article.update({
      where: { id: articleId },
      data: updateData
    })

    console.log('✅ 文章更新成功:', {
      articleId: article.id,
      title: article.title,
      status: article.status
    })

    return NextResponse.json({
      success: true,
      article: {
        id: article.id.toString(),
        title: article.title,
        content: article.content,
        htmlContent: article.htmlContent,
        status: article.status,
        updatedAt: article.updatedAt
      },
      message: '文章更新成功'
    })

} catch (error) {
    console.error('💥 更新文章失败:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      articleId: params.id
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '更新文章失败'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = parseInt(params.id)

    if (isNaN(articleId)) {
      return NextResponse.json({
        success: false,
        error: '无效的文章ID'
      }, { status: 400 })
    }

    // 检查文章是否存在
    const prismaClient = getPrismaClient()
    const article = await prismaClient.article.findUnique({
      where: { id: articleId }
    })

    if (!article) {
      return NextResponse.json({
        success: false,
        error: '文章不存在'
      }, { status: 404 })
    }

    // 删除文章（级联删除发布记录）
    await prismaClient.article.delete({
      where: { id: articleId }
    })

    console.log('✅ 文章删除成功:', {
      articleId,
      title: article.title
    })

    return NextResponse.json({
      success: true,
      message: '文章删除成功'
    })

  } catch (error) {
    console.error('💥 删除文章失败:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      articleId: params.id
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '删除文章失败'
    }, { status: 500 })
  }
}