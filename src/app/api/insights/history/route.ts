import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const hoursParam = searchParams.get('hours');
    const platformParam = searchParams.get('platform');
    const hours = hoursParam ? parseInt(hoursParam, 10) : 12; // 默认12小时
    const platform = platformParam || null; // 平台筛选: 'wechat', 'xiaohongshu', null表示全部

    // 计算时间范围，hours=0表示获取全部记录
    let whereCondition: any = {
      status: 'completed'
    };

    if (hours > 0) {
      const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
      whereCondition.searchTime = {
        gte: timeAgo
      };
    }

    // 添加平台筛选
    if (platform) {
      whereCondition.type = platform; // 假设数据库中有type字段存储平台类型
    }

    // 从数据库获取分析记录
    const recentHistories = await prisma.searchHistory.findMany({
      where: whereCondition,
      include: {
        analysisResult: true
      },
      orderBy: {
        searchTime: 'desc'
      }
    });

    // 格式化数据
    const formattedInsights = recentHistories.map(history => {
      let structuredTopicInsightsCount = 0;
      let insightsSource = 'none';

      // 按优先级检查不同字段中的洞察数据
      if (history.analysisResult?.structuredTopicInsights) {
        try {
          const insights = JSON.parse(history.analysisResult.structuredTopicInsights);
          structuredTopicInsightsCount = Array.isArray(insights) ? insights.length : 0;
          insightsSource = 'structuredTopicInsights';
          console.log(`🔍 记录${history.id} (${history.keyword}): 从structuredTopicInsights解析出${structuredTopicInsightsCount}个洞察`);
        } catch (error) {
          console.error(`解析structuredTopicInsights失败 (${history.keyword}):`, error);
        }
      }

      if (structuredTopicInsightsCount === 0 && history.analysisResult?.aiGeneratedInsights) {
        try {
          const insights = JSON.parse(history.analysisResult.aiGeneratedInsights);
          structuredTopicInsightsCount = Array.isArray(insights) ? insights.length : 0;
          insightsSource = 'aiGeneratedInsights';
          console.log(`🔍 记录${history.id} (${history.keyword}): 从aiGeneratedInsights解析出${structuredTopicInsightsCount}个洞察`);
        } catch (error) {
          console.error(`解析aiGeneratedInsights失败 (${history.keyword}):`, error);
        }
      }

      if (structuredTopicInsightsCount === 0 && history.analysisResult?.aiInsights) {
        try {
          const insights = JSON.parse(history.analysisResult.aiInsights);
          structuredTopicInsightsCount = Array.isArray(insights) ? insights.length : 0;
          insightsSource = 'aiInsights';
          console.log(`🔍 记录${history.id} (${history.keyword}): 从aiInsights解析出${structuredTopicInsightsCount}个洞察`);
        } catch (error) {
          console.error(`解析aiInsights失败 (${history.keyword}):`, error);
        }
      }

      console.log(`📊 记录${history.id} (${history.keyword}, ${history.type}): 平台=${history.type}, 洞察数量=${structuredTopicInsightsCount}, 数据源=${insightsSource}`);

      return {
        id: history.id.toString(),
        keyword: history.keyword,
        createdAt: history.searchTime.toISOString(),
        completedAt: history.searchTime.toISOString(),
        status: history.status,
        totalArticles: history.articleCount || 0,
        structuredTopicInsightsCount,
        // 添加调试信息
        debugInfo: {
          platform: history.type,
          insightsSource,
          hasStructuredTopicInsights: !!history.analysisResult?.structuredTopicInsights,
          hasAiGeneratedInsights: !!history.analysisResult?.aiGeneratedInsights,
          hasAiInsights: !!history.analysisResult?.aiInsights
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedInsights,
      count: formattedInsights.length
    });

  } catch (error) {
    console.error('获取洞察历史失败:', error);
    return NextResponse.json(
      { success: false, error: '获取洞察历史失败' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}