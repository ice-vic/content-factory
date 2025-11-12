const { analyzeArticlesWithAI } = require('./src/services/insightService.ts');

// Test data
const testArticles = [
  {
    title: "AI创业指南：从0到1构建AI应用",
    content: "本文详细介绍了如何从零开始构建AI应用程序的完整流程...",
    wx_name: "AI技术分享",
    publish_time: Math.floor(Date.now() / 1000) - 86400,
    read: 5000,
    praise: 120,
    looking: 30,
    is_original: 1
  },
  {
    title: "深度学习的最新发展趋势",
    content: "深度学习技术在近年来取得了巨大进步，本文探讨了最新的发展方向...",
    wx_name: "技术前沿",
    publish_time: Math.floor(Date.now() / 1000) - 172800,
    read: 3000,
    praise: 80,
    looking: 20,
    is_original: 1
  }
];

async function testAIAnalysis() {
  try {
    console.log('🧪 开始测试AI分析流程...');

    const result = await analyzeArticlesWithAI(testArticles, 'AI创业', (progress) => {
      console.log('⏳ 进度更新:', progress);
    });

    console.log('✅ AI分析完成!');
    console.log('结构化选题洞察数量:', result.structuredTopicInsights?.length || 0);
    console.log('TOP文章洞察数量:', result.topArticleInsights?.length || 0);

    if (result.structuredTopicInsights && result.structuredTopicInsights.length > 0) {
      console.log('📋 第一条洞察:', result.structuredTopicInsights[0]);
    }

  } catch (error) {
    console.error('❌ AI分析失败:', error);
  }
}

testAIAnalysis();