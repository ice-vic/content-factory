// 修复数据库中现有乱码数据的脚本
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 修复编码的函数
const fixStringEncoding = (text) => {
  if (!text || typeof text !== 'string') return text;

  return text
    .replace(/С����/g, '内容创作')
    .replace(/Ã©/g, '创')
    .replace(/Â/g, '')
    .replace(/Ã/g, '')
    .replace(/Ã/g, '')
    .replace(/©/g, '©')
    .replace(/®/g, '®');
};

// 递归修复对象中的所有字符串
const fixObjectEncoding = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(fixObjectEncoding);
  }

  const fixedObj = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      fixedObj[key] = fixStringEncoding(value);
    } else if (typeof value === 'object' && value !== null) {
      fixedObj[key] = fixObjectEncoding(value);
    } else {
      fixedObj[key] = value;
    }
  }

  return fixedObj;
};

async function fixDatabaseEncoding() {
  try {
    console.log('🔍 开始修复数据库中的编码问题...');

    // 获取所有小红书类型的搜索历史
    const xiaohongshuRecords = await prisma.searchHistory.findMany({
      where: {
        type: 'xiaohongshu'
      },
      include: {
        analysisResult: true
      }
    });

    console.log(`📊 找到 ${xiaohongshuRecords.length} 条小红书记录`);

    for (const record of xiaohongshuRecords) {
      console.log(`🔧 处理记录 ${record.id}: "${record.keyword}"`);

      // 修复关键词
      const fixedKeyword = fixStringEncoding(record.keyword);

      // 修复分析结果
      let fixedAnalysisResult = null;
      if (record.analysisResult) {
        const analysisData = {
          structuredTopicInsights: null,
          allArticles: null,
          wordCloud: null
        };

        // 安全解析JSON字段
        try {
          if (record.analysisResult.structuredTopicInsights) {
            analysisData.structuredTopicInsights = JSON.parse(record.analysisResult.structuredTopicInsights);
          }
        } catch (e) {
          console.warn(`解析structuredTopicInsights失败:`, e.message);
        }

        try {
          if (record.analysisResult.allArticles) {
            analysisData.allArticles = JSON.parse(record.analysisResult.allArticles);
          }
        } catch (e) {
          console.warn(`解析allArticles失败:`, e.message);
        }

        try {
          if (record.analysisResult.wordCloud) {
            analysisData.wordCloud = JSON.parse(record.analysisResult.wordCloud);
          }
        } catch (e) {
          console.warn(`解析wordCloud失败:`, e.message);
        }

        // 修复编码
        const fixedData = fixObjectEncoding(analysisData);

        fixedAnalysisResult = {
          ...record.analysisResult,
          structuredTopicInsights: fixedData.structuredTopicInsights ? JSON.stringify(fixedData.structuredTopicInsights) : null,
          allArticles: fixedData.allArticles ? JSON.stringify(fixedData.allArticles) : null,
          wordCloud: fixedData.wordCloud ? JSON.stringify(fixedData.wordCloud) : null
        };
      }

      // 更新数据库记录
      await prisma.searchHistory.update({
        where: { id: record.id },
        data: {
          keyword: fixedKeyword,
          analysisResult: fixedAnalysisResult ? {
            update: fixedAnalysisResult
          } : undefined
        }
      });

      console.log(`✅ 修复完成: "${record.keyword}" -> "${fixedKeyword}"`);
    }

    console.log('🎉 数据库编码修复完成！');

  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行修复脚本
if (require.main === module) {
  fixDatabaseEncoding();
}

module.exports = { fixDatabaseEncoding };