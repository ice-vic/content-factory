import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 安全的UTF-8字符串处理函数
const processUTF8String = (text: string): string => {
  if (!text || typeof text !== 'string') return text

  try {
    // 使用TextEncoder和TextDecoder验证和处理UTF-8
    const encoder = new TextEncoder()
    const decoder = new TextDecoder('utf-8', { fatal: false })
    const encoded = encoder.encode(text)
    const decoded = decoder.decode(encoded)

    if (text === decoded) {
      return text
    } else {
      // 尝试修复已知的编码问题
      const fixedText = text
        .replace(/С����/g, '内容创作')
        .replace(/Ã©/g, '创')
        .replace(/Â/g, '')
        .replace(/Ã/g, '')

      return fixedText
    }
  } catch (error) {
    console.warn('UTF-8处理失败:', error)
    return text
  }
}

// 递归处理对象中的所有字符串字段
const processObjectUTF8 = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(processObjectUTF8)
  }

  const processedObj: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      processedObj[key] = processUTF8String(value)
    } else if (typeof value === 'object' && value !== null) {
      processedObj[key] = processObjectUTF8(value)
    } else {
      processedObj[key] = value
    }
  }

  return processedObj
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 收到保存请求')

    // 确保请求使用正确的编码读取
    const body = await request.json()

    console.log('🔍 原始请求数据:', {
      keyword: body.keyword,
      type: body.type,
      articleCount: body.articleCount
    })

    // 处理所有文本字面的UTF-8编码
    const processedBody = processObjectUTF8(body)

    console.log('🔧 处理后数据:', {
      keyword: processedBody.keyword,
      type: processedBody.type,
      articleCount: processedBody.articleCount
    })

    const {
      keyword,
      articleCount,
      avgRead,
      avgLike,
      avgCollects,
      originalRate,
      interactionRate,
      type, // 移除默认值，必须明确指定类型
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
      // 结构化选题洞察
      structuredTopicInsights,
      metadata,
      duration
    } = processedBody

    // 验证必需字段
    if (!keyword || !articles) {
      return NextResponse.json(
        { error: '缺少必需字段: keyword, articles' },
        { status: 400 }
      )
    }

    // 验证类型字段
    if (!type || !['wechat', 'xiaohongshu'].includes(type)) {
      return NextResponse.json(
        { error: '无效或缺少type字段，必须是 wechat 或 xiaohongshu' },
        { status: 400 }
      )
    }

    // 验证structuredTopicInsights数据格式
    let validatedStructuredTopicInsights = [];
    if (structuredTopicInsights && Array.isArray(structuredTopicInsights)) {
      validatedStructuredTopicInsights = structuredTopicInsights.filter(insight =>
        insight && typeof insight === 'object' && insight.title && insight.coreFinding
      );
      console.log(`验证结构化洞察数据: ${structuredTopicInsights.length} -> ${validatedStructuredTopicInsights.length}`);
    } else if (structuredTopicInsights) {
      console.warn('structuredTopicInsights不是数组格式:', typeof structuredTopicInsights);
    }

    // 最终编码检查 - 确保保存到数据库的数据是正确的UTF-8
    const finalKeyword = processUTF8String(keyword)
    console.log('🔍 最终保存的关键词:', finalKeyword)
    console.log('🔍 关键词字符码:', Array.from(finalKeyword).map(c => c.charCodeAt(0)))

    // 创建搜索历史记录
    const searchHistory = await prisma.searchHistory.create({
      data: {
        keyword: finalKeyword,
        articleCount,
        avgRead,
        avgLike,
        originalRate,
        type: type, // 支持公众号和小红书类型
        duration,
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
        structuredTopicInsights: validatedStructuredTopicInsights.length > 0 ? JSON.stringify(validatedStructuredTopicInsights) : null,

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