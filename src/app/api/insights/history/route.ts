import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // 获取12小时前的时间戳
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    // 从数据库获取12小时内的分析记录
    const recentHistories = await prisma.searchHistory.findMany({
      where: {
        searchTime: {
          gte: twelveHoursAgo
        },
        status: 'completed'
      },
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