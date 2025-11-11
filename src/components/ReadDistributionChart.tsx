import React from 'react'
import { WechatArticle } from '@/services/wechatService'

interface ReadDistributionChartProps {
  articles: WechatArticle[]
}

export function ReadDistributionChart({ articles }: ReadDistributionChartProps) {
  // 计算阅读量分布
  const calculateDistribution = () => {
    const ranges = [
      { label: '0-1k', min: 0, max: 1000, count: 0 },
      { label: '1k-5k', min: 1000, max: 5000, count: 0 },
      { label: '5k-10k', min: 5000, max: 10000, count: 0 },
      { label: '10k-20k', min: 10000, max: 20000, count: 0 },
      { label: '20k+', min: 20000, max: Infinity, count: 0 }
    ]

    articles.forEach(article => {
      const readCount = article.read || 0
      const range = ranges.find(r => readCount >= r.min && readCount < r.max)
      if (range) {
        range.count++
      }
    })

    return ranges
  }

  const distribution = calculateDistribution()
  const maxCount = Math.max(...distribution.map(d => d.count))

  return (
    <div className="card p-6">
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <span className="text-green-600">📊</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">阅读量分布</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between h-48">
          {distribution.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="w-full max-w-20 flex flex-col items-center">
                <span className="text-sm font-medium text-gray-700 mb-2">
                  {item.count}
                </span>
                <div
                  className="w-full bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600"
                  style={{
                    height: `${maxCount > 0 ? (item.count / maxCount) * 120 : 0}px`,
                    minHeight: item.count > 0 ? '4px' : '0'
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 mt-2 text-center">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {articles.filter(a => (a.read || 0) < 1000).length}
              </div>
              <div className="text-gray-500">低于1k</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-600">
                {articles.filter(a => (a.read || 0) >= 5000).length}
              </div>
              <div className="text-gray-500">高于5k</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-blue-600">
                {Math.round(articles.reduce((sum, a) => sum + (a.read || 0), 0) / articles.length).toLocaleString()}
              </div>
              <div className="text-gray-500">平均阅读</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-purple-600">
                {Math.max(...articles.map(a => a.read || 0)).toLocaleString()}
              </div>
              <div className="text-gray-500">最高阅读</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}