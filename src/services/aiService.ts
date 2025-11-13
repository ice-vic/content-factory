import { OpenAIResponse, ArticleSummary, TopArticleInsight, StructuredTopicInsight } from '@/types';
import { WechatArticle } from './wechatService';

// AI配置 - 使用环境变量
const AI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY || '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',
  baseURL: process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1',
  model: process.env.OPENAI_MODEL || 'openai/gpt-4o-mini',
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

// 安全的JSON解析 - 处理markdown格式
function safeJsonParse(jsonString: string): any {
  try {
    // 首先尝试直接解析
    return JSON.parse(jsonString);
  } catch (error) {
    // 如果失败，尝试移除markdown代码块
    const cleanedJson = jsonString
      .replace(/```json\s*/g, '')  // 移除开头的```json
      .replace(/```\s*/g, '')     // 移除结尾的```
      .trim();

    try {
      return JSON.parse(cleanedJson);
    } catch (secondError) {
      // 如果还是失败，尝试提取花括号内的内容
      const match = cleanedJson.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw secondError;
    }
  }
}

// 重试机制 - 优化重试策略
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 2000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;

      // 对于网络错误或4xx错误，不重试
      if (error instanceof AIServiceError && (
        error.message.includes('网络连接失败') ||
        error.message.includes('API密钥无效') ||
        error.statusCode === 401 ||
        error.statusCode === 400
      )) {
        throw error;
      }

      // 指数退避，但基础延迟更长
      const waitTime = delay * Math.pow(2, i) + Math.random() * 1000; // 添加随机延迟
      console.log(`⏳ AI服务调用失败，${Math.round(waitTime)}ms后重试 (${i + 1}/${maxRetries}) - ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('重试次数已用完');
}

// 调用OpenAI API（支持消息数组，返回OpenAIResponse）
export async function callOpenAIWithMessages(messages: Array<{ role: string; content: string }>): Promise<OpenAIResponse> {
  if (!AI_CONFIG.apiKey || AI_CONFIG.apiKey === 'your_openai_api_key_here') {
    throw new AIServiceError('请配置OPENAI_API_KEY环境变量');
  }

  console.log('🌐 开始AI API调用:', {
    baseURL: AI_CONFIG.baseURL,
    model: AI_CONFIG.model,
    messageCount: messages.length
  });

  try {
    const response = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'HTTP-Referer': 'https://localhost:3000',
        'X-Title': 'Content Factory AI Analysis',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages,
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.maxTokens
      }),
      // 添加超时控制
      signal: AbortSignal.timeout(60000) // 60秒超时
    });

    console.log('📡 AI API响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ AI API错误响应:', errorData);

      // 特殊错误处理
      if (response.status === 429) {
        throw new AIServiceError('API调用频率过高，请稍后重试', 429);
      } else if (response.status === 401) {
        throw new AIServiceError('API密钥无效或已过期', 401);
      } else if (response.status >= 500) {
        throw new AIServiceError('AI服务暂时不可用，已切换到备用分析模式', response.status);
      }

      throw new AIServiceError(
        errorData.error?.message || `API调用失败: ${response.statusText}`,
        response.status
      );
    }

    const data: OpenAIResponse = await response.json();
    console.log('✅ AI API调用成功:', {
      id: data.id,
      model: data.model,
      usage: data.usage
    });

    return data;
  } catch (error) {
    console.error('🚨 AI API调用异常:', {
      error: error instanceof Error ? error.message : error,
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof AIServiceError) {
      throw error;
    }

    // 网络错误特殊处理
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AIServiceError('AI服务响应超时，已切换到备用分析模式');
    }

    if (error instanceof Error && (
      error.message.includes('Failed to fetch') ||
      error.message.includes('ERR_CONNECTION') ||
      error.message.includes('NetworkError')
    )) {
      throw new AIServiceError('网络连接失败，已切换到备用分析模式');
    }

    throw new AIServiceError(`OpenAI API调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
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
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'HTTP-Referer': 'https://localhost:3000',
        'X-Title': 'Content Factory AI Analysis'
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
    const parsed = safeJsonParse(response);
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
    return safeJsonParse(response);
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
    const insights = safeJsonParse(response);
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
  // 使用当前配置
  const apiKey = AI_CONFIG.apiKey;
  const baseURL = AI_CONFIG.baseURL;
  const model = AI_CONFIG.model;

  console.log('🔍 检查AI服务配置:', {
    apiKeyLength: apiKey ? apiKey.length : 0,
    baseURL: baseURL,
    model: model,
    hasApiKey: !!apiKey
  });

  // 检查必要配置
  if (!apiKey || apiKey === 'your_openai_api_key_here' || !apiKey.startsWith('sk-')) {
    console.log('❌ AI服务不可用：API密钥未配置或格式错误');
    return {
      available: false,
      error: 'API密钥未配置或格式错误',
      configured: false
    };
  }

  if (!baseURL) {
    console.log('❌ AI服务不可用：Base URL未配置');
    return {
      available: false,
      error: 'Base URL未配置',
      configured: false
    };
  }

  if (!model) {
    console.log('❌ AI服务不可用：模型未配置');
    return {
      available: false,
      error: '模型未配置',
      configured: false
    };
  }

  // 检查AI分析是否启用 - 在客户端中检查NEXT_PUBLIC_开头的变量或默认启用
  const aiAnalysisEnabled = process.env.AI_ANALYSIS_ENABLED === 'true' ||
                           process.env.NEXT_PUBLIC_AI_ANALYSIS_ENABLED === 'true' ||
                           process.env.AI_ANALYSIS_ENABLED !== 'false'; // 默认启用
  if (!aiAnalysisEnabled) {
    console.log('❌ AI服务不可用：AI分析功能已禁用');
    return {
      available: false,
      error: 'AI分析功能已禁用',
      configured: true
    };
  }

  console.log('✅ AI服务配置正常');
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

// 分析TOP文章并生成深度洞察
export async function analyzeTopArticles(
  articles: WechatArticle[],
  onProgress?: (phase: string, progress: number) => void
): Promise<TopArticleInsight[]> {
  const insights: TopArticleInsight[] = [];

  onProgress?.('开始分析TOP文章...', 0);

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];

    onProgress?.(`正在分析第${i + 1}/${articles.length}篇TOP文章...`, Math.round((i / articles.length) * 50));

    try {
      const prompt = `请对以下这篇文章进行深度分析，提取关键信息：

文章标题：${article.title}
文章内容：${article.content || '无正文内容'}
阅读量：${article.read || 0}
点赞数：${article.praise || 0}
在看数：${article.looking || 0}

请按照以下JSON格式返回分析结果：
{
  "summary": "文章核心摘要（100-150字）",
  "keyArguments": ["核心论点1", "核心论点2", "核心论点3"],
  "dataPoints": ["数据支撑1", "数据支撑2", "数据支撑3"],
  "uniqueAngles": ["独特角度1", "独特角度2", "独特角度3"],
  "targetAudience": ["目标受众1", "目标受众2", "目标受众3"],
  "contentGaps": ["内容空白点1", "内容空白点2", "内容空白点3"],
  "successFactors": ["成功因素1", "成功因素2", "成功因素3"],
  "interactionPattern": {
    "readEngagement": "high/medium/low",
    "commentEngagement": "high/medium/low",
    "sharePotential": "high/medium/low"
  }
}

请确保返回的是有效的JSON格式。`;

      const response = await callOpenAIWithMessages([
        { role: 'system', content: '你是一个专业的内容分析师，擅长深度分析文章内容、提取核心观点和洞察用户需求。' },
        { role: 'user', content: prompt }
      ]);

      const analysis = safeJsonParse(response.choices[0].message.content);

      insights.push({
        articleId: `${article.publish_time}_${article.wx_id}`,
        title: article.title,
        summary: analysis.summary || '',
        keyArguments: analysis.keyArguments || [],
        dataPoints: analysis.dataPoints || [],
        uniqueAngles: analysis.uniqueAngles || [],
        targetAudience: analysis.targetAudience || [],
        contentGaps: analysis.contentGaps || [],
        successFactors: analysis.successFactors || [],
        interactionPattern: analysis.interactionPattern || {
          readEngagement: 'medium',
          commentEngagement: 'medium',
          sharePotential: 'medium'
        }
      });

    } catch (error) {
      console.error(`分析文章失败: ${article.title}`, error);
      // 添加基础分析作为fallback
      insights.push({
        articleId: `${article.publish_time}_${article.wx_id}`,
        title: article.title,
        summary: `文章《${article.title}》获得了${article.read || 0}次阅读和${article.praise || 0}个点赞，显示了良好的用户关注度。`,
        keyArguments: [article.title.split('？')[0] || '主要论点'],
        dataPoints: [`阅读量: ${article.read || 0}`, `点赞数: ${article.praise || 0}`],
        uniqueAngles: [],
        targetAudience: ['对相关话题感兴趣的读者'],
        contentGaps: [],
        successFactors: ['话题相关性强'],
        interactionPattern: {
          readEngagement: article.read && article.read > 5000 ? 'high' : 'medium',
          commentEngagement: article.looking && article.looking > 50 ? 'high' : 'medium',
          sharePotential: article.praise && article.praise > 100 ? 'high' : 'medium'
        }
      });
    }
  }

  onProgress?.('TOP文章分析完成', 100);
  return insights;
}

// 基于TOP文章洞察生成结构化选题洞察
export async function generateStructuredTopicInsights(
  topArticleInsights: TopArticleInsight[],
  keyword: string,
  onProgress?: (phase: string, progress: number) => void
): Promise<StructuredTopicInsight[]> {
  onProgress?.('开始生成选题洞察...', 0);

  try {
    // 构建分析摘要
    const insightsSummary = topArticleInsights.map(insight => ({
      title: insight.title,
      summary: insight.summary,
      keyArguments: insight.keyArguments,
      contentGaps: insight.contentGaps,
      targetAudience: insight.targetAudience,
      successFactors: insight.successFactors
    }));

    const prompt = `基于以下TOP文章的深度分析结果，请为"${keyword}"这个话题生成5-8个结构化的选题洞察。

TOP文章分析结果：
${JSON.stringify(insightsSummary, null, 2)}

请按照以下JSON格式返回洞察结果：
{
  "insights": [
    {
      "title": "洞察标题",
      "coreFinding": "核心发现描述",
      "dataSupport": [
        {
          "metric": "数据指标",
          "value": "数值/百分比",
          "description": "数据说明"
        }
      ],
      "keywordAnalysis": {
        "highFrequency": ["高频词1", "高频词2", "高频词3"],
        "missingKeywords": ["缺失词1", "缺失词2", "缺失词3"]
      },
      "recommendedTopics": [
        "推荐选题方向1",
        "推荐选题方向2",
        "推荐选题方向3"
      ],
      "contentStrategy": [
        "内容策略1",
        "内容策略2",
        "内容策略3"
      ],
      "targetAudience": ["目标受众1", "目标受众2"],
      "difficulty": "low/medium/high",
      "estimatedImpact": "预估影响描述",
      "relatedArticles": ["相关文章ID1", "相关文章ID2"],
      "confidence": 0.85
    }
  ]
}

要求：
1. 每个洞察都要基于具体的数据支撑
2. 推荐的选题要具有可操作性
3. 分析当前内容市场中存在的空白点
4. 提供具体的内容策略建议
5. 确保返回有效的JSON格式

请确保返回的是完整的JSON格式，包含insights数组。`;

    onProgress?.('正在调用AI生成选题洞察...', 50);

    console.log('开始调用AI生成选题洞察，模型:', AI_CONFIG.model);
    const response = await callOpenAIWithMessages([
      {
        role: 'system',
        content: '你是一个资深的选题策略分析师，擅长基于内容数据分析发现市场机会和内容空白点。'
      },
      { role: 'user', content: prompt }
    ]);

    console.log('AI响应状态:', response.choices?.length || 0);
    console.log('AI响应内容:', response.choices?.[0]?.message?.content?.substring(0, 200) || 'No content');

    const result = safeJsonParse(response.choices[0].message.content);
    console.log('解析后的洞察数量:', result.insights?.length || 0);

    onProgress?.('选题洞察生成完成', 100);

    const insights: StructuredTopicInsight[] = result.insights.map((insight: any, index: number) => ({
      id: `insight_${Date.now()}_${index}`,
      title: insight.title || `选题洞察 ${index + 1}`,
      coreFinding: insight.coreFinding || '',
      dataSupport: insight.dataSupport || [],
      keywordAnalysis: insight.keywordAnalysis || { highFrequency: [], missingKeywords: [] },
      recommendedTopics: insight.recommendedTopics || [],
      contentStrategy: insight.contentStrategy || [],
      targetAudience: insight.targetAudience || [],
      difficulty: insight.difficulty || 'medium',
      estimatedImpact: insight.estimatedImpact || '',
      relatedArticles: insight.relatedArticles || [],
      confidence: typeof insight.confidence === 'number' ? insight.confidence : 0.7
    }));

    return insights;

  } catch (error) {
    console.error('生成选题洞察失败:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      topArticlesCount: topArticleInsights.length
    });
    onProgress?.('选题洞察生成失败，使用备用方案', 100);

    // 返回基础的洞察作为fallback
    return [{
      id: `fallback_insight_${Date.now()}`,
      title: `关于"${keyword}"的基础选题洞察`,
      coreFinding: `基于TOP文章分析，"${keyword}"话题具有较高的用户关注度，但内容深度有待加强。`,
      dataSupport: [
        { metric: '分析文章数', value: topArticleInsights.length.toString(), description: '参与分析的TOP文章数量' },
        { metric: '平均互动率', value: '较高', description: '用户参与度表现良好' }
      ],
      keywordAnalysis: {
        highFrequency: [keyword, '分析', '内容'],
        missingKeywords: ['深度分析', '实战经验', '案例研究']
      },
      recommendedTopics: [
        `${keyword}深度解析`,
        `${keyword}实战指南`,
        `${keyword}案例研究`
      ],
      contentStrategy: ['加强深度分析', '增加实战案例', '提供具体解决方案'],
      targetAudience: ['对相关话题感兴趣的用户', '寻求深度内容的读者'],
      difficulty: 'medium',
      estimatedImpact: '中等',
      relatedArticles: topArticleInsights.slice(0, 3).map(insight => insight.articleId),
      confidence: 0.6
    }];
  }
}