import { OpenAIResponse, ArticleSummary } from '@/types';

// AI配置
const AI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  model: process.env.OPENAI_MODEL || 'gpt-4o',
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
  batchSize: parseInt(process.env.AI_BATCH_SIZE || '3')
};

// 错误处理
class AIServiceError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// 重试机制
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;

      // 指数退避
      const waitTime = delay * Math.pow(2, i);
      console.log(`AI服务调用失败，${waitTime}ms后重试 (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('重试次数已用完');
}

// 调用OpenAI API
async function callOpenAI(prompt: string): Promise<string> {
  if (!AI_CONFIG.apiKey || AI_CONFIG.apiKey === 'your_openai_api_key_here') {
    throw new AIServiceError('请配置OPENAI_API_KEY环境变量');
  }

  const messages = [
    {
      role: 'system',
      content: '你是一个专业的内容分析师，擅长分析文章内容、提取关键信息并生成有价值的洞察。请用中文回答，保持专业性和准确性。'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    const response = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages,
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.maxTokens
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AIServiceError(
        errorData.error?.message || `API调用失败: ${response.statusText}`,
        response.status
      );
    }

    const data: OpenAIResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new AIServiceError('API返回空响应');
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }
    throw new AIServiceError(`网络错误: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 文章摘要生成的提示词模板
function generateSummaryPrompt(article: any): string {
  return `请为以下微信公众号文章生成一个简洁的分析摘要：

文章标题：${article.title}
公众号：${article.wx_name}
发布时间：${new Date(article.publish_time * 1000).toLocaleDateString()}
阅读量：${article.read?.toLocaleString() || '未知'}
点赞量：${article.praise?.toLocaleString() || '未知'}

请按以下格式输出JSON：
{
  "summary": "150字以内的文章摘要",
  "keyPoints": ["关键观点1", "关键观点2", "关键观点3"],
  "dataPoints": ["重要数据或事实1", "重要数据或事实2"],
  "highlights": ["文章亮点1", "文章亮点2", "文章亮点3"],
  "sentiment": "positive/neutral/negative"
}

要求：
1. 摘要要准确概括文章核心内容
2. 关键观点要突出文章的独特见解
3. 数据点要提取文章中的具体数字、统计等
4. 亮点要突出文章的创新点或价值点
5. 情感倾向基于文章的整体基调判断`;
}

// 结构化信息提取的提示词模板
function generateStructuredPrompt(summaries: ArticleSummary[]): string {
  const summariesText = summaries.map((s, i) =>
    `文章${i + 1}摘要：${s.summary}\n关键观点：${s.keyPoints.join('；')}`
  ).join('\n\n');

  return `基于以下${summaries.length}篇文章的AI摘要，请提取结构化信息：

${summariesText}

请按以下格式输出JSON：
{
  "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"],
  "topics": ["主题分类1", "主题分类2", "主题分类3"],
  "arguments": [
    {
      "claim": "主要论点1",
      "evidence": ["证据1", "证据2"],
      "confidence": 0.9
    }
  ],
  "uniqueAngles": ["独特角度1", "独特角度2"],
  "targetAudience": ["目标受众1", "目标受众2"],
  "contentGaps": ["内容空白点1", "内容空白点2"],
  "trendingTopics": ["趋势话题1", "趋势话题2"]
}

要求：
1. 关键词要具有代表性和搜索价值
2. 主题分类要准确反映内容领域
3. 论点结构要包含主张和证据支撑
4. 独特角度要识别创新的视角
5. 内容空白点要指出当前内容稀缺但有价值的角度`;
}

// AI洞察生成的提示词模板
function generateInsightsPrompt(structuredInfo: any): string {
  return `基于以下结构化分析结果，请生成5-8条深度的选题洞察：

结构化信息：
${JSON.stringify(structuredInfo, null, 2)}

请按以下格式输出JSON：
[
  {
    "id": "insight_1",
    "title": "洞察标题",
    "description": "详细描述洞察内容，包含分析和建议",
    "opportunity": "具体的机会点分析",
    "difficulty": "low/medium/high",
    "targetKeywords": ["关键词1", "关键词2"],
    "suggestedFormat": "建议的内容形式（如：教程、案例分析、观点文章）",
    "dataSupport": [
      {
        "source": "数据来源说明",
        "metric": "衡量指标",
        "value": "具体数值"
      }
    ],
    "confidence": 0.85,
    "category": "trend/gap/audience/competition/innovation"
  }
]

洞察类型要求：
1. 趋势分析 (trend)：识别当前趋势和未来发展方向
2. 内容空白 (gap)：发现内容稀缺但需求大的角度
3. 受众分析 (audience)：分析目标受众的偏好和需求
4. 竞争分析 (competition)：分析竞争格局和差异化机会
5. 创新建议 (innovation)：提出创新的内容角度或形式

每条洞察都要：
- 基于数据支撑，有理有据
- 具有可操作性和实用价值
- 难度评估要合理
- 提供具体的创作建议`;
}

// 生成单篇文章的AI摘要
export async function generateArticleSummary(article: any): Promise<ArticleSummary> {
  const prompt = generateSummaryPrompt(article);

  const response = await retryWithBackoff(() => callOpenAI(prompt));

  try {
    const parsed = JSON.parse(response);
    return {
      articleId: article.id || article.content_id || `${Date.now()}_${Math.random()}`,
      ...parsed
    };
  } catch (error) {
    console.error('AI摘要解析失败:', error);
    throw new AIServiceError('AI摘要格式解析失败');
  }
}

// 批量生成文章摘要
export async function generateBatchSummaries(articles: any[]): Promise<ArticleSummary[]> {
  const results: ArticleSummary[] = [];

  for (let i = 0; i < articles.length; i += AI_CONFIG.batchSize) {
    const batch = articles.slice(i, i + AI_CONFIG.batchSize);

    const batchPromises = batch.map(article =>
      generateArticleSummary(article).catch(error => {
        console.error(`文章摘要生成失败: ${article.title}`, error);
        return null;
      })
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter(Boolean) as ArticleSummary[]);

    // 避免API调用过于频繁
    if (i + AI_CONFIG.batchSize < articles.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// 提取结构化信息
export async function extractStructuredInfo(summaries: ArticleSummary[]): Promise<any> {
  if (summaries.length === 0) {
    throw new AIServiceError('没有可分析的文章摘要');
  }

  const prompt = generateStructuredPrompt(summaries);
  const response = await retryWithBackoff(() => callOpenAI(prompt));

  try {
    return JSON.parse(response);
  } catch (error) {
    console.error('结构化信息解析失败:', error);
    throw new AIServiceError('结构化信息格式解析失败');
  }
}

// 生成AI洞察
export async function generateAIInsights(structuredInfo: any): Promise<any[]> {
  const prompt = generateInsightsPrompt(structuredInfo);
  const response = await retryWithBackoff(() => callOpenAI(prompt));

  try {
    const insights = JSON.parse(response);
    if (!Array.isArray(insights)) {
      throw new Error('洞察格式应为数组');
    }
    return insights;
  } catch (error) {
    console.error('AI洞察解析失败:', error);
    throw new AIServiceError('AI洞察格式解析失败');
  }
}

// 检查AI服务是否可用
export function checkAIServiceAvailability(): {
  available: boolean;
  error?: string;
  configured: boolean;
} {
  if (!process.env.AI_ANALYSIS_ENABLED || process.env.AI_ANALYSIS_ENABLED !== 'true') {
    return {
      available: false,
      error: 'AI分析功能已禁用',
      configured: false
    };
  }

  if (!AI_CONFIG.apiKey || AI_CONFIG.apiKey === 'your_openai_api_key_here') {
    return {
      available: false,
      error: '请配置OPENAI_API_KEY环境变量',
      configured: false
    };
  }

  return { available: true, configured: true };
}

// 获取AI配置信息
export function getAIConfig() {
  return {
    model: AI_CONFIG.model,
    temperature: AI_CONFIG.temperature,
    maxTokens: AI_CONFIG.maxTokens,
    batchSize: AI_CONFIG.batchSize,
    baseURL: AI_CONFIG.baseURL.replace(/\/api\/key\/[^\/]+/, '/api/...') // 隐藏API密钥
  };
}

// 估算AI分析成本（基于token使用量）
export function estimateAnalysisCost(articleCount: number): {
  estimatedTokens: number;
  estimatedCost: number;
  currency: string;
} {
  // 粗略估算：每篇文章摘要约800 tokens，结构化分析约1200 tokens，洞察生成约1500 tokens
  const tokensPerArticle = 800;
  const baseTokens = 1200 + 1500; // 结构化分析 + 洞察生成
  const totalTokens = articleCount * tokensPerArticle + baseTokens;

  // GPT-4o定价（示例）: $0.05 per 1K input tokens, $0.15 per 1K output tokens
  const inputCost = (totalTokens * 0.7) * 0.05 / 1000; // 70%输入
  const outputCost = (totalTokens * 0.3) * 0.15 / 1000; // 30%输出
  const totalCost = inputCost + outputCost;

  return {
    estimatedTokens: totalTokens,
    estimatedCost: Math.round(totalCost * 100) / 100,
    currency: 'USD'
  };
}