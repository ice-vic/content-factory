// 小红书分析结果保存服务
import { XiaohongshuNote, XiaohongshuCompleteAnalysisResult } from '@/types/xiaohongshu'

// 安全的UTF-8字符串验证函数
const validateUTF8String = (text: string): string => {
  if (!text || typeof text !== 'string') return text

  try {
    // 验证字符串是否为有效的UTF-8
    const encoder = new TextEncoder()
    const decoder = new TextDecoder('utf-8', { fatal: false })
    const encoded = encoder.encode(text)
    const decoded = decoder.decode(encoded)

    if (text === decoded) {
      console.log('✅ UTF-8验证通过:', text)
      return text
    } else {
      console.warn('⚠️ UTF-8验证失败，尝试修复:', text)

      // 尝试修复常见的编码问题
      const fixedText = text
        .replace(/С����/g, '内容创作')
        .replace(/Ã©/g, '创')
        .replace(/Â/g, '')
        .replace(/Ã/g, '')

      console.log('🔧 修复后的文本:', fixedText)
      return fixedText
    }
  } catch (error) {
    console.error('❌ UTF-8验证错误:', error)
    return text
  }
}

// 安全的JSON序列化函数
const safeJSONStringify = (obj: any): string => {
  try {
    const jsonString = JSON.stringify(obj, null, 2)

    // 验证序列化后的JSON是否包含有效的UTF-8字符
    const isValidJSON = (str: string): boolean => {
      try {
        const parsed = JSON.parse(str)
        return true
      } catch {
        return false
      }
    }

    if (isValidJSON(jsonString)) {
      console.log('✅ JSON序列化成功，长度:', jsonString.length)
      return jsonString
    } else {
      console.warn('⚠️ JSON序列化失败，使用基础序列化')
      return JSON.stringify(obj)
    }
  } catch (error) {
    console.error('❌ JSON序列化失败:', error)
    return '{}'
  }
}

// 递归修复对象中的中文文本
const fixEncodingInObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(fixEncodingInObject)
  }

  const fixedObj: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      fixedObj[key] = validateUTF8String(value)
    } else if (typeof value === 'object' && value !== null) {
      fixedObj[key] = fixEncodingInObject(value)
    } else {
      fixedObj[key] = value
    }
  }

  return fixedObj
}

// 保存小红书分析结果到数据库
export async function saveXiaohongshuAnalysisResult(analysisData: {
  keyword: string
  notes: XiaohongshuNote[]
  completeAnalysisResult: XiaohongshuCompleteAnalysisResult
  duration?: number
}) {
  try {
    console.log('🔍 开始保存小红书分析结果')
    console.log('🔍 原始关键词:', analysisData.keyword)

    // 验证和修复关键词
    const safeKeyword = validateUTF8String(analysisData.keyword)
    console.log('🔧 修复后关键词:', safeKeyword)

    // 修复笔记数据中的中文文本
    const fixedNotes = analysisData.notes.map(note => ({
      ...note,
      title: validateUTF8String(note.title),
      content: validateUTF8String(note.content),
      author: {
        ...note.author,
        name: validateUTF8String(note.author.name)
      },
      tags: note.tags.map(tag => validateUTF8String(tag))
    }))

    // 修复分析结果中的中文文本
    const fixedAnalysisResult = fixEncodingInObject(analysisData.completeAnalysisResult)

    // 构建要保存的数据对象
    const saveData = {
      // 基础信息
      keyword: safeKeyword,
      articleCount: fixedNotes.length,
      type: 'xiaohongshu', // 明确指定为小红书类型
      duration: analysisData.duration,

      // 小红书特有的统计数据（从completeAnalysisResult中提取）
      avgRead: Math.round(fixedAnalysisResult.avgLikes * 5), // 估算阅读数（点赞数的5倍）
      avgLike: Math.round(fixedAnalysisResult.avgLikes),
      avgCollects: Math.round(fixedAnalysisResult.avgCollects),
      interactionRate: fixedAnalysisResult.avgInteractionRate,
      originalRate: 85, // 小红书原创率较高，设置一个合理的默认值

      // 小红书文章数据
      articles: fixedNotes,

      // AI分析结果
      wordCloud: fixedAnalysisResult.wordCloud,
      structuredTopicInsights: fixedAnalysisResult.structuredTopicInsights,

      // 元数据
      metadata: {
        modelUsed: fixedAnalysisResult.metadata.modelUsed,
        analysisTime: fixedAnalysisResult.metadata.analysisTime,
        analysisVersion: fixedAnalysisResult.metadata.version,
        timestamp: new Date().toISOString()
      }
    }

    console.log('🔍 准备保存的数据:', {
      keyword: saveData.keyword,
      articleCount: saveData.articleCount,
      insightCount: saveData.structuredTopicInsights?.length || 0
    })

    // 安全序列化数据
    const requestBody = safeJSONStringify(saveData)

    console.log('📤 发送保存请求，数据长度:', requestBody.length)

    const response = await fetch('/api/analysis/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: requestBody,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || '保存失败')
    }

    console.log('✅ 小红书分析结果保存成功')
    return result.data
  } catch (error) {
    console.error('❌ 保存小红书分析结果失败:', error)
    throw error
  }
}

// 转换小红书数据为保存格式
export function convertXiaohongshuDataForSave(
  notes: XiaohongshuNote[],
  completeAnalysisResult: XiaohongshuCompleteAnalysisResult
) {
  // 计算统计数据
  const totalLikes = notes.reduce((sum, note) => sum + note.metrics.likes, 0)
  const totalCollects = notes.reduce((sum, note) => sum + note.metrics.collects, 0)
  const totalComments = notes.reduce((sum, note) => sum + note.metrics.comments, 0)

  const avgLikes = Math.round(totalLikes / notes.length)
  const avgCollects = Math.round(totalCollects / notes.length)
  const avgComments = Math.round(totalComments / notes.length)
  const interactionRate = Number(((avgLikes + avgComments) / (avgLikes * 10 + 1) * 100).toFixed(1))

  return {
    articleCount: notes.length,
    avgLikes,
    avgCollects,
    avgComments,
    interactionRate,
    totalLikes,
    totalCollects,
    totalComments
  }
}