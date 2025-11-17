import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// 创建全局Prisma实例，避免重复创建连接
let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['warn', 'error'],
      errorFormat: 'minimal'
    });
  }
  return prisma;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  let client = getPrismaClient();

  try {
    console.log(`🔍 开始获取洞察详情 ID: ${params.id}`);

    const id = parseInt(params.id);

    if (isNaN(id)) {
      console.log(`❌ 无效的ID: ${params.id}`);
      return NextResponse.json(
        { success: false, error: '无效的ID' },
        { status: 400 }
      );
    }

    // 设置查询超时
    const queryTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('查询超时')), 10000); // 10秒超时
    });

    // 获取历史记录和分析结果，添加超时处理
    const historyPromise = client.searchHistory.findUnique({
      where: { id },
      include: {
        analysisResult: true
      }
    });

    const history = await Promise.race([historyPromise, queryTimeout]) as any;

    if (!history || !history.analysisResult) {
      console.log(`❌ 未找到洞察数据 ID: ${id}`);
      return NextResponse.json(
        { success: false, error: '未找到该洞察数据' },
        { status: 404 }
      );
    }

    console.log(`✅ 找到洞察数据: ${history.keyword}`);

    const analysisResult = history.analysisResult;

    // 提取结构化选题洞察数据
    let structuredTopicInsights: any[] = [];
    try {
      // 尝试解析新字段
      if (analysisResult.structuredTopicInsights) {
        const parsed = JSON.parse(analysisResult.structuredTopicInsights);
        structuredTopicInsights = Array.isArray(parsed) ? parsed : [];
      } else if (analysisResult.aiGeneratedInsights) {
        // 向后兼容：如果新字段不存在，使用旧字段
        const parsed = JSON.parse(analysisResult.aiGeneratedInsights);
        structuredTopicInsights = Array.isArray(parsed) ? parsed : [];
      }

      // 数据完整性验证和修复
      structuredTopicInsights = structuredTopicInsights.map((insight: any, index: number) => ({
        id: insight.id || `insight_${Date.now()}_${index}`,
        title: insight.title || '未命名洞察',
        coreFinding: insight.coreFinding || '暂无核心发现',
        difficulty: insight.difficulty || 'medium',
        confidence: insight.confidence || 0.8,
        recommendedTopics: Array.isArray(insight.recommendedTopics) ? insight.recommendedTopics : [],
        keywordAnalysis: {
          highFrequency: Array.isArray(insight.keywordAnalysis?.highFrequency) ? insight.keywordAnalysis.highFrequency : [],
          missingKeywords: Array.isArray(insight.keywordAnalysis?.missingKeywords) ? insight.keywordAnalysis.missingKeywords : []
        },
        contentStrategy: Array.isArray(insight.contentStrategy) ? insight.contentStrategy : [],
        targetAudience: Array.isArray(insight.targetAudience) ? insight.targetAudience : [],
        dataSupport: Array.isArray(insight.dataSupport) ? insight.dataSupport : []
      }));

      console.log(`✅ 解析了 ${structuredTopicInsights.length} 个洞察`);

    } catch (error) {
      console.error('❌ 解析结构化洞察数据失败:', error);
      structuredTopicInsights = [];
    }

    const topArticleInsights: any[] = []; // 这里可以从其他数据源获取，暂时为空

    const basicStats = {
      avgRead: history.avgRead || 0,
      avgLike: history.avgLike || 0,
      originalRate: history.originalRate || 0,
      avgInteraction: 0 // 这个字段在历史记录中没有，需要计算
    };

    // 提取所有关键词用于用户选择
    const allKeywords = structuredTopicInsights.flatMap((insight: any) =>
      [
        ...insight.keywordAnalysis?.highFrequency || [],
        ...insight.keywordAnalysis?.missingKeywords || []
      ]
    ).filter((keyword: string, index: number, arr: string[]) => arr.indexOf(keyword) === index);

    const responseTime = Date.now() - startTime;
    console.log(`✅ 洞察详情获取成功，耗时: ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      data: {
        id,
        keyword: history.keyword,
        structuredTopicInsights,
        topArticleInsights,
        basicStats,
        allKeywords
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`💥 获取洞察详情失败 (耗时: ${responseTime}ms):`, {
      error: error instanceof Error ? error.message : '未知错误',
      id: params.id,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: '获取洞察详情失败',
        details: {
          id: params.id,
          timestamp: new Date().toISOString(),
          responseTime: `${responseTime}ms`
        }
      },
      { status: 500 }
    );
  }
  // 注意：不再在这里断开连接，让全局连接保持活跃
}