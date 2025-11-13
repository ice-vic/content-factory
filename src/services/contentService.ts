// 内容创作相关服务

export interface InsightHistory {
  id: string;
  keyword: string;
  createdAt: string;
  completedAt: string;
  status: string;
  totalArticles: number;
  structuredTopicInsightsCount: number;
}

export interface InsightDetail {
  id: string;
  keyword: string;
  structuredTopicInsights: Array<{
    id: string;
    title: string;
    coreFinding: string;
    recommendedTopics: string[];
    targetAudience: string[];
    contentStrategy: string[];
    keywordAnalysis: {
      highFrequency: string[];
      missingKeywords: string[];
    };
  }>;
  topArticleInsights: any[];
  basicStats: any;
  allKeywords: string[];
}

export interface GenerationParameters {
  style: 'professional' | 'casual' | 'humorous';
  length: 'short' | 'medium' | 'long';
  platforms: {
    wechat: boolean;
    xiaohongshu: boolean;
  };
  customInstructions?: string;
}

export interface GeneratedArticle {
  title: string;
  content: string;
  sections: string[];
  estimatedReadingTime: number;
}

// 获取12小时内的历史洞察
export async function getRecentInsightHistory(): Promise<InsightHistory[]> {
  try {
    const response = await fetch('/api/insights/history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // 避免缓存问题
    });

    if (!response.ok) {
      console.warn('洞察历史API响应错误:', response.status, response.statusText);
      return []; // 返回空数组而不是抛出错误
    }

    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      return result.data;
    } else {
      console.warn('洞察历史API响应格式异常:', result);
      return [];
    }
  } catch (error) {
    console.error('获取洞察历史失败:', error);
    return []; // 确保总是返回数组
  }
}

// 获取特定洞察的详细信息
export async function getInsightDetail(id: string): Promise<InsightDetail | null> {
  try {
    const response = await fetch(`/api/insights/detail/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('获取洞察详情失败');
    }

    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('获取洞察详情失败:', error);
    return null;
  }
}

// 生成文章
export async function generateArticle(
  topic: string,
  insight?: InsightDetail['structuredTopicInsights'][0],
  parameters: GenerationParameters = {
    style: 'professional',
    length: 'medium',
    platforms: { wechat: true, xiaohongshu: true }
  }
): Promise<{ success: boolean; article?: GeneratedArticle; error?: string }> {
  try {
    const response = await fetch('/api/content/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        insight,
        parameters,
      }),
    });

    if (!response.ok) {
      throw new Error('文章生成失败');
    }

    const result = await response.json();
    return {
      success: result.success,
      article: result.success ? result.data.article : undefined,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    console.error('文章生成失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

// 根据洞察推荐创作参数
export function recommendParameters(insight?: InsightDetail['structuredTopicInsights'][0]): Partial<GenerationParameters> {
  if (!insight) {
    return {};
  }

  const recommendations: Partial<GenerationParameters> = {};

  // 根据目标受众推荐风格
  if (insight.targetAudience?.some(audience =>
    audience.includes('专业') || audience.includes('企业') || audience.includes('技术')
  )) {
    recommendations.style = 'professional';
  } else if (insight.targetAudience?.some(audience =>
    audience.includes('年轻') || audience.includes('学生') || audience.includes('大众')
  )) {
    recommendations.style = 'casual';
  } else if (insight.targetAudience?.some(audience =>
    audience.includes('娱乐') || audience.includes('趣味')
  )) {
    recommendations.style = 'humorous';
  }

  // 根据内容复杂度推荐长度
  if (insight.contentStrategy?.some(strategy =>
    strategy.includes('深度') || strategy.includes('详细') || strategy.includes('全面')
  )) {
    recommendations.length = 'long';
  } else if (insight.contentStrategy?.some(strategy =>
    strategy.includes('简洁') || strategy.includes('快速') || strategy.includes('精要')
  )) {
    recommendations.length = 'short';
  } else {
    recommendations.length = 'medium';
  }

  // 根据内容类型推荐平台
  recommendations.platforms = {
    wechat: true,
    xiaohongshu: insight.targetAudience?.some(audience =>
      audience.includes('年轻') || audience.includes('女性') || audience.includes('生活')
    ) || false
  };

  return recommendations;
}

// 删除历史洞察记录
export async function deleteInsightHistory(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/insights/history/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('删除失败');
    }

    const result = await response.json();
    return {
      success: result.success,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    console.error('删除洞察历史失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除失败'
    };
  }
}

// 更新洞察记录（重命名等）
export async function updateInsightHistory(
  id: string,
  updates: { keyword?: string; notes?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/insights/history/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('更新失败');
    }

    const result = await response.json();
    return {
      success: result.success,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    console.error('更新洞察历史失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新失败'
    };
  }
}