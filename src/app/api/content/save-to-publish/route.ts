import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      title,
      content,
      htmlContent,
      platform,
      style,
      length,
      targetPlatforms,
      insightId,
      topicDirection,
      hasImages,
      imageConfig,
      estimatedReadingTime,
      sections
    } = body

    // 验证必填字段
    if (!title || !content || !platform || !style) {
      return NextResponse.json({
        success: false,
        error: '标题、内容、平台和风格为必填字段'
      }, { status: 400 })
    }

    // 生成纯文本内容（用于搜索）
    const plainContent = htmlContent ?
      htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() :
      content.replace(/\s+/g, ' ').trim()

    // 创建文章记录
    const article = await prisma.article.create({
      data: {
        title,
        content,
        htmlContent,
        plainContent,
        platform,
        style,
        length: length || 'medium',
        targetPlatforms: JSON.stringify(targetPlatforms || []),
        customInstructions: body.customInstructions || null,
        insightId,
        topicDirection,
        hasImages: hasImages || false,
        imageConfig: imageConfig ? JSON.stringify(imageConfig) : null,
        status: 'pending', // 保存到发布管理时状态为 pending
        estimatedReadingTime,
        sections: sections ? JSON.stringify(sections) : null
      }
    })

    console.log('✅ 文章已保存到发布管理:', {
      articleId: article.id,
      title: article.title,
      status: article.status
    })

    return NextResponse.json({
      success: true,
      articleId: article.id,
      message: '文章已成功保存到发布管理'
    })

  } catch (error) {
    console.error('💥 保存文章失败:', error)

    return NextResponse.json({
      success: false,
      error: '保存文章失败，请稍后重试'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}