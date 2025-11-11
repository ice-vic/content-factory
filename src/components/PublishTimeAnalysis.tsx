import React from 'react'
import { WechatArticle } from '@/services/wechatService'

interface PublishTimeAnalysisProps {
  articles: WechatArticle[]
}

export function PublishTimeAnalysis({ articles }: PublishTimeAnalysisProps) {
  // 计算时间段分布
  const calculateTimeDistribution = () => {
    const timeSlots = [
      { label: '早上', range: [6, 12], icon: '🌅', count: 0 },
      { label: '中午', range: [12, 18], icon: '☀️', count: 0 },
      { label: '晚上', range: [18, 24], icon: '🌆', count: 0 },
      { label: '深夜', range: [0, 6], icon: '🌙', count: 0 }
    ]

    articles.forEach(article => {
      const date = new Date(article.publish_time * 1000)
      const hour = date.getHours()

      const slot = timeSlots.find(s => hour >= s.range[0] && hour < s.range[1])
      if (slot) {
        slot.count++
      }
    })

    return timeSlots
  }

  // 计算最近7天发布趋势
  const calculateWeeklyTrend = () => {
    const days = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayArticles = articles.filter(article => {
        const publishDate = new Date(article.publish_time * 1000)
        return publishDate >= date && publishDate < nextDate
      })

      days.push({
        date,
        label: i === 0 ? '今天' : i === 1 ? '昨天' : `${i}天前`,
        count: dayArticles.length,
        avgRead: dayArticles.length > 0
          ? Math.round(dayArticles.reduce((sum, a) => sum + (a.read || 0), 0) / dayArticles.length)
          : 0
      })
    }

    return days
  }

  const timeDistribution = calculateTimeDistribution()
  const weeklyTrend = calculateWeeklyTrend()
  const maxTimeCount = Math.max(...timeDistribution.map(d => d.count))
  const maxTrendCount = Math.max(...weeklyTrend.map(d => d.count))

  return (
    <div className="card p-6">
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <span className="text-orange-600">🕒</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">发布时间分析</h3>
      </div>

      <div className="space-y-6">
        {/* 时间段分布 */}
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-4">发布时间段分布</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {timeDistribution.map((slot, index) => (
              <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">{slot.icon}</div>
                <div className="text-lg font-semibold text-gray-900">
                  {slot.count}
                </div>
                <div className="text-sm text-gray-600">{slot.label}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {maxTimeCount > 0 ? Math.round((slot.count / maxTimeCount) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7天发布趋势 */}
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-4">近7天发布趋势</h4>
          <div className="space-y-3">
            <div className="flex items-end justify-between h-32">
              {weeklyTrend.map((day, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="w-full max-w-12 flex flex-col items-center">
                    {day.count > 0 && (
                      <span className="text-xs font-medium text-gray-700 mb-1">
                        {day.count}
                      </span>
                    )}
                    <div
                      className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t transition-all duration-500 hover:from-orange-600 hover:to-orange-500"
                      style={{
                        height: `${maxTrendCount > 0 ? (day.count / maxTrendCount) * 80 : 0}px`,
                        minHeight: day.count > 0 ? '3px' : '0'
                      }}
                      title={`${day.label}: ${day.count}篇文章`}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-2 text-center">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 发布习惯洞察 */}
        <div className="border-t pt-4">
          <h4 className="text-md font-medium text-gray-800 mb-3">发布习惯洞察</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
              <span className="text-blue-600">⏰</span>
              <span className="text-gray-700">
                最活跃时段: {timeDistribution.reduce((max, slot) => slot.count > max.count ? slot : max).label}
              </span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-green-50 rounded">
              <span className="text-green-600">📈</span>
              <span className="text-gray-700">
                7天发文: {weeklyTrend.reduce((sum, day) => sum + day.count, 0)}篇
              </span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded">
              <span className="text-purple-600">🎯</span>
              <span className="text-gray-700">
                日均发文: {Math.round(weeklyTrend.reduce((sum, day) => sum + day.count, 0) / 7)}篇
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}