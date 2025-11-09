'use client'

import {
  WechatArticle,
  formatPublishTime,
  calculateInteractionRate
} from '@/services/wechatService'
import {
  ExternalLinkIcon,
  HeartIcon,
  EyeIcon,
  MessageCircleIcon,
  TrendingUpIcon,
  ClockIcon,
  UserIcon,
  TagIcon
} from 'lucide-react'

interface ArticleListProps {
  articles: WechatArticle[]
  title: string
  showMetrics?: 'likes' | 'interaction' | 'all'
  maxArticles?: number
}

export default function ArticleList({
  articles,
  title,
  showMetrics = 'all',
  maxArticles = articles.length
}: ArticleListProps) {
  const displayArticles = articles.slice(0, maxArticles)

  const getInteractionIcon = () => {
    switch (showMetrics) {
      case 'likes':
        return HeartIcon
      case 'interaction':
        return TrendingUpIcon
      default:
        return HeartIcon
    }
  }

  const getInteractionColor = () => {
    switch (showMetrics) {
      case 'likes':
        return 'text-red-500'
      case 'interaction':
        return 'text-blue-500'
      default:
        return 'text-primary-500'
    }
  }

  const getInteractionLabel = () => {
    switch (showMetrics) {
      case 'likes':
        return '点赞量'
      case 'interaction':
        return '互动率'
      default:
        return '数据指标'
    }
  }

  const Icon = getInteractionIcon()
  const colorClass = getInteractionColor()

  return (
    <div className="card p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Icon className={`w-5 h-5 ${colorClass}`} />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="space-y-4">
        {displayArticles.map((article, index) => {
          const interactionRate = calculateInteractionRate(article)

          return (
            <div
              key={`${article.wx_id}-${article.short_link}`}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* 排名标签 */}
              {maxArticles <= 10 && (
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex items-center justify-center w-6 h-6 ${
                    index < 3 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                  } rounded-full text-xs font-medium`}>
                    {index + 1}
                  </span>

                  {article.is_original === 1 && (
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      原创
                    </span>
                  )}
                </div>
              )}

              {/* 文章标题 */}
              <div className="mb-3">
                <h4 className="font-medium text-gray-900 mb-2 line-clamp-2 leading-tight">
                  {article.title}
                </h4>

                {/* 公众号信息 */}
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                  <span className="flex items-center space-x-1">
                    <UserIcon className="w-3 h-3" />
                    <span>{article.wx_name}</span>
                  </span>

                  {article.classify && (
                    <span className="flex items-center space-x-1">
                      <TagIcon className="w-3 h-3" />
                      <span>{article.classify}</span>
                    </span>
                  )}

                  <span className="flex items-center space-x-1">
                    <ClockIcon className="w-3 h-3" />
                    <span>{formatPublishTime(article.publish_time)}</span>
                  </span>
                </div>
              </div>

              {/* 数据指标 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {/* 点赞数 */}
                  {(showMetrics === 'all' || showMetrics === 'likes') && (
                    <span className="flex items-center space-x-1">
                      <HeartIcon className="w-4 h-4" />
                      <span>{article.praise.toLocaleString()}</span>
                    </span>
                  )}

                  {/* 阅读数 */}
                  {(showMetrics === 'all' || showMetrics === 'interaction') && (
                    <span className="flex items-center space-x-1">
                      <EyeIcon className="w-4 h-4" />
                      <span>{article.read.toLocaleString()}</span>
                    </span>
                  )}

                  {/* 再看数 */}
                  {showMetrics === 'all' && article.looking > 0 && (
                    <span className="flex items-center space-x-1">
                      <MessageCircleIcon className="w-4 h-4" />
                      <span>{article.looking.toLocaleString()}</span>
                    </span>
                  )}

                  {/* 互动率 */}
                  {(showMetrics === 'all' || showMetrics === 'interaction') && (
                    <span className={`flex items-center space-x-1 ${colorClass}`}>
                      <TrendingUpIcon className="w-4 h-4" />
                      <span>{interactionRate}%</span>
                    </span>
                  )}
                </div>

                {/* 查看原文链接 */}
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
                >
                  <span>查看原文</span>
                  <ExternalLinkIcon className="w-3 h-3" />
                </a>
              </div>

              {/* 文章内容摘要（可选显示） */}
              {article.content && article.content.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {article.content
                      .replace(/<[^>]*>/g, '') // 移除HTML标签
                      .replace(/\s+/g, ' ') // 合并空白字符
                      .trim()}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 显示更多提示 */}
      {articles.length > maxArticles && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            还有 {articles.length - maxArticles} 篇相关文章
          </p>
        </div>
      )}

      {/* 空状态 */}
      {displayArticles.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">暂无相关文章</p>
        </div>
      )}
    </div>
  )
}