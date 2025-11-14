import { NextRequest, NextResponse } from 'next/server'
import type {
  XiaohongshuApiResponse,
  XiaohongshuApiItem,
  XiaohongshuNoteCard,
  XiaohongshuInteractInfo,
  XiaohongshuUser,
  XiaohongshuCover,
  XiaohongshuImageList
} from '@/types/xiaohongshu-api'
import { XiaohongshuNote } from '@/types/xiaohongshu'

// API配置
const API_URL = 'https://www.dajiala.com/fbmain/monitor/v3/xhs'
const API_KEY = 'JZL3729556ba1f901a2'

// 请求参数接口
interface SearchRequest {
  key: string
  type: number
  keyword: string
  page: number
  sort: string
  note_type: string
  note_time: string
  note_range: string
  proxy: string
}

// 数据转换函数
function convertApiDataToXiaohongshuNote(
  apiItem: XiaohongshuApiItem,
  index: number
): XiaohongshuNote {
  const noteCard = apiItem.note_card!
  const interactInfo = noteCard.interact_info
  const user = noteCard.user

  // 转换图片数据
  const images: XiaohongshuNote['images'] = []

  // 添加封面图
  if (noteCard.cover) {
    images.push({
      url: noteCard.cover.url_default,
      width: noteCard.cover.width,
      height: noteCard.cover.height,
      alt: noteCard.display_title || user.nickname + '的小红书笔记'
    })
  }

  // 添加图片列表
  if (noteCard.image_list && noteCard.image_list.length > 0) {
    noteCard.image_list.forEach((imageList: XiaohongshuImageList) => {
      imageList.info_list.forEach((info) => {
        images.push({
          url: info.url,
          width: imageList.width,
          height: imageList.height,
          alt: noteCard.display_title || user.nickname + '的小红书笔记'
        })
      })
    })
  }

  // 转换互动数据
  const metrics = {
    likes: parseInt(interactInfo.liked_count) || 0,
    collects: parseInt(interactInfo.collected_count) || 0,
    comments: parseInt(interactInfo.comment_count) || 0,
    shares: parseInt(interactInfo.shared_count) || 0
  }

  // 确定内容类型
  const contentType = noteCard.type === 'video' ? 'video' : 'image'

  // 生成小红书笔记URL（模拟）
  const xhsUrl = `https://www.xiaohongshu.com/explore/${apiItem.id}`

  // 提取标签（从corner_tag_info中获取）
  const tags: string[] = []
  if (noteCard.corner_tag_info && noteCard.corner_tag_info.length > 0) {
    noteCard.corner_tag_info.forEach(tag => {
      if (tag.text && !tags.includes(tag.text)) {
        tags.push(tag.text)
      }
    })
  }

  // 模拟发布时间（API返回中没有，使用当前时间减去随机天数）
  const now = Date.now()
  const randomDays = Math.floor(Math.random() * 30) // 0-30天内
  const publishTime = now - (randomDays * 24 * 60 * 60 * 1000)

  return {
    id: apiItem.id,
    title: noteCard.display_title || `${user.nick_name}的分享`,
    content: noteCard.display_title || `${user.nick_name}分享了一篇小红书笔记`,
    author: {
      name: user.nick_name || user.nickname,
      avatar: user.avatar,
      followers: Math.floor(Math.random() * 10000) + 100 // 模拟粉丝数
    },
    publishTime,
    url: xhsUrl,
    images: images.slice(0, 9), // 最多9张图片
    metrics,
    tags: tags.length > 0 ? tags : ['小红书', '分享'],
    type: contentType,
    video: contentType === 'video' ? {
      url: '', // API中没有视频URL
      duration: 0,
      cover: noteCard.cover?.url_default || ''
    } : undefined,
    location: '' // API中没有位置信息
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keyword, sort_type = 'general', content_type = 'all', time_range = '7', page = 1 } = body

    console.log('📥 收到前端请求参数:', {
      keyword,
      sort_type,
      content_type,
      time_range,
      page
    })

    if (!keyword) {
      return NextResponse.json({
        success: false,
        error: '关键词不能为空'
      }, { status: 400 })
    }

    // 构建API请求参数
    const searchParams: SearchRequest = {
      key: API_KEY,
      type: 1,
      keyword: keyword.trim(),
      page: page || 1,
      sort: sort_type === 'popularity' ? 'general' : sort_type,
      note_type: content_type === 'all' ? 'image' : content_type === 'video' ? 'video' : 'image',
      note_time: time_range === '1' ? '1天内' : time_range === '7' ? '7天内' : '30天内',
      note_range: '不限',
      proxy: ''
    }

    console.log('🔍 发起小红书搜索API请求:', {
      keyword: searchParams.keyword,
      page: searchParams.page,
      sort: searchParams.sort,
      note_type: searchParams.note_type
    })

    // 调用外部API
    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchParams),
      // 设置超时时间
      signal: AbortSignal.timeout(30000) // 30秒超时
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('小红书API调用失败:', {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        errorText
      })

      return NextResponse.json({
        success: false,
        error: `API调用失败: ${apiResponse.status} ${apiResponse.statusText}`
      }, { status: apiResponse.status })
    }

    const apiData: XiaohongshuApiResponse = await apiResponse.json()

    console.log('✅ 小红书API响应:', {
      code: apiData.code,
      cost: apiData.cost,
      itemsCount: apiData.items?.length || 0,
      hasMore: apiData.has_more,
      remainMoney: apiData.remain_money
    })

    // 检查API响应是否成功
    if (apiData.code !== 0) {
      console.warn('⚠️ 小红书API返回错误，使用模拟数据:', {
        code: apiData.code,
        error: apiData.error || '未知错误'
      })

      // 当API不可用时，返回模拟数据作为降级方案
      const mockData = getMockXiaohongshuData({
        keyword,
        sort_type,
        content_type,
        time_range,
        page
      })

      return NextResponse.json({
        success: true,
        data: mockData.data,
        total: mockData.total,
        page: page || 1,
        pageSize: mockData.pageSize,
        hasMore: false,
        isFallback: true,
        message: `API暂时不可用，使用模拟数据 (${apiData.code})`
      })
    }

    // 转换数据格式
    const notes: XiaohongshuNote[] = []
    if (apiData.items && Array.isArray(apiData.items)) {
      apiData.items.forEach((apiItem: XiaohongshuApiItem, index: number) => {
        if (apiItem.note_card) {
          try {
            const note = convertApiDataToXiaohongshuNote(apiItem, index)
            notes.push(note)
          } catch (error) {
            console.error('转换笔记数据失败:', error, apiItem)
          }
        }
      })
    }

    console.log(`📝 成功转换 ${notes.length} 条小红书笔记`)

    // 返回结果
    return NextResponse.json({
      success: true,
      data: notes,
      total: notes.length,
      page: page || 1,
      pageSize: notes.length,
      hasMore: apiData.has_more || false,
      apiInfo: {
        cost: apiData.cost,
        remainMoney: apiData.remain_money
      }
    })

  } catch (error) {
    console.error('小红书搜索API调用异常:', error)

    // 网络错误时也返回模拟数据
    const mockData = getMockXiaohongshuData({
      keyword,
      sort_type,
      content_type,
      time_range,
      page
    })

    return NextResponse.json({
      success: true,
      data: mockData.data,
      total: mockData.total,
      page: page || 1,
      pageSize: mockData.pageSize,
      hasMore: false,
      isFallback: true,
      message: `网络异常，使用模拟数据 (${error instanceof Error ? error.message : '未知错误'})`
    })
  }
}

// 模拟数据生成函数
function getMockXiaohongshuData(params: any): XiaohongshuSearchResponse {
  const mockNotes: XiaohongshuNote[] = [
    {
      id: 'xhs_mock_001',
      title: `关于${params.keyword}的超实用分享！`,
      content: `今天来分享一下关于${params.keyword}的心得体会，希望对大家有帮助。经过长时间的实践和总结，我发现...`,
      author: {
        name: '生活小达人',
        avatar: 'https://via.placeholder.com/50',
        followers: 15234
      },
      publishTime: Date.now() - 2 * 24 * 60 * 60 * 1000,
      url: 'https://www.xiaohongshu.com/explore/mock_001',
      images: [
        {
          url: 'https://picsum.photos/300/400?random=1',
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
      type: 'image'
    },
    {
      id: 'xhs_mock_002',
      title: `${params.keyword}测评，真实体验分享`,
      content: `最近尝试了很多关于${params.keyword}的产品/方法，今天来做一期真实的测评分享...`,
      author: {
        name: '测评小能手',
        avatar: 'https://via.placeholder.com/50',
        followers: 28756
      },
      publishTime: Date.now() - 5 * 24 * 60 * 60 * 1000,
      url: 'https://www.xiaohongshu.com/explore/mock_002',
      images: [
        {
          url: 'https://picsum.photos/300/400?random=2',
          width: 300,
          height: 400,
          alt: '测评图片1'
        }
      ],
      metrics: {
        likes: 28934,
        collects: 15672,
        comments: 2891,
        shares: 892
      },
      tags: [params.keyword, '测评', '真实体验', '分享'],
      type: 'image'
    }
  ];

  return {
    success: true,
    data: mockNotes,
    total: mockNotes.length,
    page: params.page || 1,
    pageSize: mockNotes.length,
    hasMore: false
  };
}