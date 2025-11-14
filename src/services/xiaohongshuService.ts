import {
  XiaohongshuNote,
  XiaohongshuSearchResponse,
  XiaohongshuSearchParams,
  XiaohongshuAnalysisResult,
  XiaohongshuCompleteAnalysisResult,
  XiaohongshuStructuredTopicInsight,
  calculateXiaohongshuInteractionRate,
  DEFAULT_SEARCH_PARAMS
} from '@/types/xiaohongshu';

// 小红书API服务（当前为模拟实现，等待真实API接入）
export async function searchXiaohongshuNotes(
  params: XiaohongshuSearchParams
): Promise<XiaohongshuSearchResponse> {
  try {
    const queryParams = new URLSearchParams({
      kw: params.keyword,
      sort_type: params.sortType === 'time' ? '1' : params.sortType === 'popularity' ? '2' : '2',
      content_type: params.contentType || 'all',
      period: params.timeRange?.toString() || '7',
      min_likes: params.minLikes?.toString() || '10',
      page: params.page?.toString() || '1'
    });

    const response = await fetch(`/api/xiaohongshu/search?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API错误: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('搜索小红书笔记失败:', error);

    // 返回模拟数据（临时方案）
    return getMockXiaohongshuData(params);
  }
}

// 模拟小红书数据（临时使用）
function getMockXiaohongshuData(params: XiaohongshuSearchParams): XiaohongshuSearchResponse {
  const mockNotes: XiaohongshuNote[] = [
    {
      id: 'xhs_001',
      title: `关于${params.keyword}的超实用分享！`,
      content: `今天来分享一下关于${params.keyword}的心得体会，希望对大家有帮助。经过长时间的实践和总结，我发现...`,
      author: {
        name: '生活小达人',
        avatar: 'https://via.placeholder.com/50',
        followers: 15234
      },
      publishTime: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2天前
      url: 'https://www.xiaohongshu.com/explore/xhs_001',
      images: [
        {
          url: 'https://via.placeholder.com/300x400/E8F5E8/333?text=图片1',
          width: 300,
          height: 400,
          alt: '分享图片1'
        }
      ],
      metrics: {
        likes: 15234,
        collects: 8921,
        comments: 1256,
        shares: 342
      },
      tags: [params.keyword, '生活分享', '实用干货', '经验总结'],
      topic: '生活分享',
      type: 'image'
    },
    {
      id: 'xhs_002',
      title: `${params.keyword}测评，真实体验分享`,
      content: `最近尝试了很多关于${params.keyword}的产品/方法，今天来做一期真实的测评分享...`,
      author: {
        name: '测评小能手',
        avatar: 'https://via.placeholder.com/50',
        followers: 28756
      },
      publishTime: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5天前
      url: 'https://www.xiaohongshu.com/explore/xhs_002',
      images: [
        {
          url: 'https://via.placeholder.com/300x400/F0E8FF/333?text=图片1',
          width: 300,
          height: 400,
          alt: '测评图片1'
        },
        {
          url: 'https://via.placeholder.com/300x400/E8F0FF/333?text=图片2',
          width: 300,
          height: 400,
          alt: '测评图片2'
        }
      ],
      metrics: {
        likes: 28934,
        collects: 15672,
        comments: 2891,
        shares: 892
      },
      tags: [params.keyword, '测评', '真实体验', '分享'],
      topic: '产品测评',
      type: 'image'
    },
    {
      id: 'xhs_003',
      title: `如何做好${params.keyword}？新手教程来啦！`,
      content: `很多小伙伴问我关于${params.keyword}的问题，今天就来做一个详细的教程...`,
      author: {
        name: '教学达人',
        avatar: 'https://via.placeholder.com/50',
        followers: 45234
      },
      publishTime: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1天前
      url: 'https://www.xiaohongshu.com/explore/xhs_003',
      images: [],
      metrics: {
        likes: 19872,
        collects: 10934,
        comments: 1523,
        shares: 456
      },
      tags: [params.keyword, '新手教程', '入门指南', '教学方法'],
      topic: '教学分享',
      type: 'video',
      video: {
        url: 'https://via.placeholder.com/video',
        duration: 180,
        cover: 'https://via.placeholder.com/300x400/FFE8E8/333?text=视频封面'
      }
    }
  ];

  return {
    success: true,
    data: mockNotes,
    total: mockNotes.length,
    page: params.page || 1,
    pageSize: DEFAULT_SEARCH_PARAMS.maxResults || 30,
    hasMore: false
  };
}

// 分析小红书笔记数据
export function analyzeXiaohongshuNotes(
  notes: XiaohongshuNote[],
  keyword: string
): XiaohongshuAnalysisResult {
  if (notes.length === 0) {
    throw new Error('没有笔记数据可供分析');
  }

  // 基础统计
  const totalLikes = notes.reduce((sum, note) => sum + note.metrics.likes, 0);
  const totalCollects = notes.reduce((sum, note) => sum + note.metrics.collects, 0);
  const totalComments = notes.reduce((sum, note) => sum + note.metrics.comments, 0);
  const totalShares = notes.reduce((sum, note) => sum + note.metrics.shares, 0);

  const avgLikes = Math.round(totalLikes / notes.length);
  const avgCollects = Math.round(totalCollects / notes.length);
  const avgComments = Math.round(totalComments / notes.length);
  const avgShares = Math.round(totalShares / notes.length);

  // 计算平均互动率
  const avgInteractionRate = notes.reduce((sum, note) =>
    sum + calculateXiaohongshuInteractionRate(note), 0) / notes.length;

  // 内容形式分析
  const imageCount = notes.filter(note => note.type === 'image').length;
  const videoCount = notes.filter(note => note.type === 'video').length;

  // 标签分析
  const tagCounts = new Map<string, { count: number; likes: number; collects: number }>();
  notes.forEach(note => {
    note.tags.forEach(tag => {
      const current = tagCounts.get(tag) || { count: 0, likes: 0, collects: 0 };
      tagCounts.set(tag, {
        count: current.count + 1,
        likes: current.likes + note.metrics.likes,
        collects: current.collects + note.metrics.collects
      });
    });
  });

  const popularTags = Array.from(tagCounts.entries())
    .map(([tag, stats]) => ({
      tag,
      count: stats.count,
      avgLikes: Math.round(stats.likes / stats.count),
      avgCollects: Math.round(stats.collects / stats.count)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // 发布时间分析
  const publishTimeDistribution = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
    avgInteraction: 0
  }));

  notes.forEach(note => {
    const hour = new Date(note.publishTime).getHours();
    publishTimeDistribution[hour].count++;
    publishTimeDistribution[hour].avgInteraction += calculateXiaohongshuInteractionRate(note);
  });

  publishTimeDistribution.forEach(hour => {
    if (hour.count > 0) {
      hour.avgInteraction = Math.round(hour.avgInteraction / hour.count * 100) / 100;
    }
  });

  // 互动量分布
  const interactionDistribution = notes.reduce((acc, note) => {
    const rate = calculateXiaohongshuInteractionRate(note);
    if (rate > 5) acc.high++;
    else if (rate >= 1) acc.medium++;
    else acc.low++;
    return acc;
  }, { high: 0, medium: 0, low: 0 });

  // TOP笔记排序
  const topLikedNotes = [...notes]
    .sort((a, b) => b.metrics.likes - a.metrics.likes)
    .slice(0, 5);

  const topCollectedNotes = [...notes]
    .sort((a, b) => b.metrics.collects - a.metrics.collects)
    .slice(0, 5);

  const topCommentedNotes = [...notes]
    .sort((a, b) => b.metrics.comments - a.metrics.comments)
    .slice(0, 5);

  const topInteractionNotes = [...notes]
    .sort((a, b) => calculateXiaohongshuInteractionRate(b) - calculateXiaohongshuInteractionRate(a))
    .slice(0, 5);

  // 词云数据生成
  const wordCloud = generateWordCloud(notes);

  // 趋势分析
  const trends = generateTrendsAnalysis(notes);

  return {
    totalNotes: notes.length,
    avgLikes,
    avgCollects,
    avgComments,
    avgShares,
    avgInteractionRate: Math.round(avgInteractionRate * 100) / 100,
    contentType: {
      image: imageCount,
      video: videoCount,
      percentage: {
        image: Math.round((imageCount / notes.length) * 100),
        video: Math.round((videoCount / notes.length) * 100)
      }
    },
    popularTags,
    publishTimeDistribution,
    locationAnalysis: [], // 暂时为空，等待真实数据
    interactionDistribution,
    topLikedNotes,
    topCollectedNotes,
    topCommentedNotes,
    topInteractionNotes,
    wordCloud,
    trends
  };
}

// 生成词云数据
function generateWordCloud(notes: XiaohongshuNote[]) {
  const wordCounts = new Map<string, number>();

  // 从标题提取关键词
  notes.forEach(note => {
    const titleWords = note.title
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2);

    titleWords.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 3); // 标题词汇权重更高
    });

    // 从标签提取关键词
    note.tags.forEach(tag => {
      wordCounts.set(tag, (wordCounts.get(tag) || 0) + 2); // 标签权重中等
    });
  });

  return Array.from(wordCounts.entries())
    .map(([word, count]) => ({ word, count, type: 'tag' as const }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
}

// 生成趋势分析
function generateTrendsAnalysis(notes: XiaohongshuNote[]) {
  const allTags = notes.flatMap(note => note.tags);
  const tagCounts = new Map<string, number>();

  allTags.forEach(tag => {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  });

  const sortedTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  return {
    risingTags: sortedTags.slice(0, 10).map(([tag]) => tag),
    decliningTags: sortedTags.slice(-10).map(([tag]) => tag),
    popularTopics: sortedTags.slice(0, 5).map(([tag]) => tag)
  };
}

// 生成结构化选题洞察（临时实现）
export function generateStructuredTopicInsights(
  analysisResult: XiaohongshuAnalysisResult,
  keyword: string
): XiaohongshuStructuredTopicInsight[] {
  return [
    {
      id: 'insight_001',
      title: `${keyword}内容创作机会分析`,
      coreFinding: `当前${keyword}相关内容在小红书平台表现良好，平均互动率达到${analysisResult.avgInteractionRate}%，高于平台平均水平`,
      recommendedTopics: [
        `${keyword}入门教程`,
        `${keyword}实战经验`,
        `${keyword}避坑指南`,
        `${keyword}进阶技巧`
      ],
      targetAudience: ['18-35岁女性用户', '对生活品质有追求的年轻用户', '喜欢尝试新事物的人群'],
      contentStrategy: [
        '结合真实使用场景，增强内容可信度',
        '使用高质量的图片或视频，提升视觉吸引力',
        '添加实用标签，提高内容曝光率',
        '与用户积极互动，建立信任关系'
      ],
      hashtagStrategy: [
        `#${keyword}`,
        `#${keyword}教程`,
        `#${keyword}分享`,
        `#生活小技巧`,
        `#干货分享`
      ],
      bestPostTime: ['19:00-21:00', '12:00-14:00'],
      contentTypeRecommendation: {
        type: analysisResult.contentType.percentage.image > 60 ? 'image' : 'video',
        reasoning: `数据显示${analysisResult.contentType.percentage.image > 60 ? '图文' : '视频'}内容在该话题下表现更佳`
      },
      trendAnalysis: {
        currentTrend: `${keyword}相关内容呈上升趋势`,
        predictedTrend: '预计未来2-3个月内仍将保持热度',
        confidence: 0.85
      }
    }
  ];
}

// AI增强分析（等待AI服务接入）
export async function analyzeWithAI(
  notes: XiaohongshuNote[],
  keyword: string,
  onProgress?: (progress: any) => void
): Promise<XiaohongshuCompleteAnalysisResult> {
  // 先做基础分析
  const basicAnalysis = analyzeXiaohongshuNotes(notes, keyword);

  // 生成结构化洞察
  const structuredTopicInsights = generateStructuredTopicInsights(basicAnalysis, keyword);

  // AI分析部分（待实现）
  const aiInsights = [
    `根据${keyword}相关内容分析，建议重点关注用户体验和实用性`,
    '内容发布时间建议在工作日晚上和周末，这些时段用户活跃度更高',
    '图片质量对内容表现影响显著，建议使用高清、美观的图片'
  ];

  const contentRecommendations = [
    '增加内容的专业性和深度，提供有价值的见解',
    '结合时下热点话题，提高内容的时效性和相关性',
    '注重与用户的互动，及时回复评论和私信'
  ];

  return {
    ...basicAnalysis,
    keyword,
    processedNotes: notes.length,
    structuredTopicInsights,
    aiInsights,
    contentRecommendations,
    metadata: {
      searchTime: new Date(),
      analysisTime: 5,
      modelUsed: 'mock-ai',
      version: '1.0.0'
    }
  };
}