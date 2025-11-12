import { NextRequest, NextResponse } from 'next/server'
import { analyzeArticlesWithAI } from '@/services/insightService'
import { WechatArticle } from '@/services/wechatService'

export async function POST() {
  try {
    console.log('🧪 开始测试AI分析流程...')

    // Test data
    const testArticles: WechatArticle[] = [
      {
        title: "AI创业指南：从0到1构建AI应用",
        content: "本文详细介绍了如何从零开始构建AI应用程序的完整流程，包括技术选型、团队组建、产品定位等关键环节。AI创业者需要关注的不仅是技术实现，更重要的是市场需求和用户体验。",
        url: "https://example.com/ai-startup-guide",
        short_link: "https://example.com/ai-startup",
        avatar: "",
        publish_time: Math.floor(Date.now() / 1000) - 86400,
        publish_time_str: new Date(Date.now() - 86400000).toISOString(),
        update_time: Math.floor(Date.now() / 1000),
        update_time_str: new Date().toISOString(),
        wx_name: "AI技术分享",
        wx_id: "test_ai_tech",
        ghid: "test_ghid",
        read: 5000,
        praise: 120,
        looking: 30,
        ip_wording: "北京",
        classify: "科技",
        is_original: 1
      },
      {
        title: "深度学习的最新发展趋势",
        content: "深度学习技术在近年来取得了巨大进步，本文探讨了最新的发展方向，包括大语言模型、多模态学习、自监督学习等前沿技术。这些技术突破正在改变各个行业的应用场景。",
        url: "https://example.com/deep-learning-trends",
        short_link: "https://example.com/dl-trends",
        avatar: "",
        publish_time: Math.floor(Date.now() / 1000) - 172800,
        publish_time_str: new Date(Date.now() - 172800000).toISOString(),
        update_time: Math.floor(Date.now() / 1000),
        update_time_str: new Date().toISOString(),
        wx_name: "技术前沿",
        wx_id: "test_tech_frontier",
        ghid: "test_ghid2",
        read: 3000,
        praise: 80,
        looking: 20,
        ip_wording: "上海",
        classify: "科技",
        is_original: 1
      }
    ]

    const result = await analyzeArticlesWithAI(testArticles, 'AI创业', (progress) => {
      console.log('⏳ 进度更新:', progress);
    });

    console.log('✅ AI分析完成!');
    console.log('结构化选题洞察数量:', result.structuredTopicInsights?.length || 0);
    console.log('TOP文章洞察数量:', result.topArticleInsights?.length || 0);

    const response = {
      success: true,
      message: 'AI分析测试成功',
      results: {
        hasStructuredTopicInsights: !!(result.structuredTopicInsights && result.structuredTopicInsights.length > 0),
        structuredTopicInsightsCount: result.structuredTopicInsights?.length || 0,
        topArticleInsightsCount: result.topArticleInsights?.length || 0,
        aiModelUsed: result.metadata?.modelUsed || 'unknown',
        processingTime: result.metadata?.processingTime || 0,
        sampleInsight: result.structuredTopicInsights?.[0] || null
      }
    };

    console.log('📊 测试结果:', response.results);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ AI分析测试失败:', error);
    return NextResponse.json({
      success: false,
      error: 'AI分析测试失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}