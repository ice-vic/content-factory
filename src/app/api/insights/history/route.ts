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
      if (history.analysisResult?.aiGeneratedInsights) {
        try {
          const insights = JSON.parse(history.analysisResult.aiGeneratedInsights);
          structuredTopicInsightsCount = Array.isArray(insights) ? insights.length : 0;
        } catch (error) {
          console.error('解析洞察数据失败:', error);
        }
      }

      return {
        id: history.id.toString(),
        keyword: history.keyword,
        createdAt: history.searchTime.toISOString(),
        completedAt: history.searchTime.toISOString(),
        status: history.status,
        totalArticles: history.articleCount || 0,
        structuredTopicInsightsCount
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