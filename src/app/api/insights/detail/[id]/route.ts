import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的ID' },
        { status: 400 }
      );
    }

    // 获取历史记录和分析结果
    const history = await prisma.searchHistory.findUnique({
      where: { id },
      include: {
        analysisResult: true
      }
    });

    if (!history || !history.analysisResult) {
      return NextResponse.json(
        { success: false, error: '未找到该洞察数据' },
        { status: 404 }
      );
    }

    const analysisResult = history.analysisResult;

    // 提取结构化选题洞察数据
    const structuredTopicInsights = analysisResult.aiGeneratedInsights
      ? JSON.parse(analysisResult.aiGeneratedInsights)
      : [];

    const topArticleInsights = []; // 这里可以从其他数据源获取，暂时为空

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
    console.error('获取洞察详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取洞察详情失败' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}