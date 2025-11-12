// 公众号文章API相关类型定义

export interface WechatArticleResponse {
  code: number;
  cost_money: number;
  cut_words: string;
  data: WechatArticle[];
  data_number: number;
  msg: string;
  page: number;
  remain_money: number;
  total: number;
  total_page: number;
  [property: string]: any;
}

export interface WechatArticle {
  /**
   * 封面
   */
  avatar: string;
  /**
   * 分类
   */
  classify: string;
  /**
   * 正文
   */
  content: string;
  /**
   * 原始id
   */
  ghid: string;
  /**
   * 发布地址
   */
  ip_wording: string;
  /**
   * 是否原创
   */
  is_original: number;
  /**
   * 再看数
   */
  looking: number;
  /**
   * 点赞数
   */
  praise: number;
  /**
   * 发布时间
   */
  publish_time: number;
  publish_time_str: string;
  /**
   * 阅读数
   */
  read: number;
  /**
   * 文章原始短链接
   */
  short_link: string;
  /**
   * 文章标题
   */
  title: string;
  /**
   * 更新时间
   */
  update_time: number;
  update_time_str: string;
  /**
   * 文章长连接
   */
  url: string;
  /**
   * wxid
   */
  wx_id: string;
  /**
   * 公众号名字
   */
  wx_name: string;
  [property: string]: any;
}

export interface SearchParams {
  kw: string;          // 关键词
  sort_type?: number;  // 排序类型 1:最新 2:最热
  mode?: number;       // 模式 1:精确 2:模糊
  period?: number;     // 时间范围（天）
  page?: number;       // 页码
  key?: string;        // API密钥
  any_kw?: string;     // 包含任意关键词
  ex_kw?: string;      // 排除关键词
  verifycode?: string; // 验证码
  type?: number;       // 类型 1:文章 2:视频
}

// API调用配置
const API_CONFIG = {
  baseURL: 'https://www.dajiala.com/fbmain/monitor/v3',
  apiKey: 'JZL3729556ba1f901a2'
}

/**
 * 搜索公众号文章
 * @param params 搜索参数
 * @returns 文章搜索结果
 */
export async function searchWechatArticles(params: SearchParams): Promise<WechatArticleResponse> {
  try {
    const searchParams = {
      kw: params.kw,
      sort_type: params.sort_type || 1,
      mode: params.mode || 1,
      period: params.period || 7,
      page: params.page || 1,
      key: params.key || API_CONFIG.apiKey,
      any_kw: params.any_kw || '',
      ex_kw: params.ex_kw || '',
      verifycode: params.verifycode || '',
      type: params.type || 1
    }

    const response = await fetch(`${API_CONFIG.baseURL}/kw_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchParams),
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
    }

    const data: WechatArticleResponse = await response.json()

    if (data.code !== 0) {
      throw new Error(`API返回错误: ${data.msg}`)
    }

    return data
  } catch (error) {
    console.error('搜索公众号文章失败:', error)
    throw error
  }
}

/**
 * 格式化发布时间
 * @param timestamp 时间戳
 * @returns 格式化后的时间字符串
 */
export function formatPublishTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes <= 1 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

/**
 * 计算互动率
 * @param article 文章数据
 * @returns 互动率百分比
 */
export function calculateInteractionRate(article: WechatArticle): number {
  if (article.read === 0) return 0

  const totalInteractions = article.praise + article.looking
  return Number(((totalInteractions / article.read) * 100).toFixed(1))
}

/**
 * 按点赞数排序文章
 * @param articles 文章列表
 * @param limit 限制数量
 * @returns 排序后的文章列表
 */
export function getTopLikedArticles(articles: WechatArticle[], limit: number = 5): WechatArticle[] {
  return articles
    .sort((a, b) => b.praise - a.praise)
    .slice(0, limit)
}

/**
 * 按互动率排序文章
 * @param articles 文章列表
 * @param limit 限制数量
 * @returns 排序后的文章列表
 */
export function getTopInteractionArticles(articles: WechatArticle[], limit: number = 5): WechatArticle[] {
  return articles
    .sort((a, b) => calculateInteractionRate(b) - calculateInteractionRate(a))
    .slice(0, limit)
}

/**
 * 生成词云数据
 * @param articles 文章列表
 * @returns 词云数据
 */
export function generateWordCloud(articles: WechatArticle[]): Array<{ word: string; count: number }> {
  const wordCount = new Map<string, number>()

  // 从标题中提取关键词
  articles.forEach(article => {
    // 更好的中文分词逻辑
    let cleanedTitle = article.title
      .replace(/[，。！？；：""''（）【｜｜]/g, ' ')  // 替换标点符号为空格
      .replace(/[a-zA-Z0-9]/g, ' ')  // 替换英文数字为空格，专注于中文
      .replace(/\s+/g, ' ')  // 合并多个空格
      .trim()

    // 提取2-4字的中文词汇
    const words: string[] = []
    for (let i = 0; i < cleanedTitle.length; i++) {
      // 尝试不同长度的词汇，优先长词
      for (let len = 4; len >= 2; len--) {
        if (i + len <= cleanedTitle.length) {
          const word = cleanedTitle.substring(i, i + len)
          // 只保留中文字符
          if (/^[\u4e00-\u9fa5]+$/.test(word)) {
            words.push(word)
            i += len - 1  // 跳过已处理的字符
            break
          }
        }
      }
    }

    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })
  })

  // 排序并返回前20个高频词
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }))
}