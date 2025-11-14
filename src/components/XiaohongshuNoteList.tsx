'use client'

import { useState } from 'react'
import {
  XiaohongshuNote,
  calculateXiaohongshuInteractionRate
} from '@/types/xiaohongshu'
import {
  HeartIcon,
  BookmarkIcon,
  MessageCircleIcon,
  ShareIcon,
  PlayIcon,
  Image as ImageIcon,
  ExternalLinkIcon,
  UserIcon
} from 'lucide-react'

interface XiaohongshuNoteListProps {
  notes: XiaohongshuNote[]
  title?: string
  maxNotes?: number
  showMetrics?: 'basic' | 'detailed' | 'all'
}

export function XiaohongshuNoteList({
  notes,
  title = '',
  maxNotes,
  showMetrics = 'basic'
}: XiaohongshuNoteListProps) {
  const [showAll, setShowAll] = useState(false)
  const displayNotes = maxNotes && !showAll ? notes.slice(0, maxNotes) : notes

  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}w`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const formatTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}天前`
    }
    if (hours > 0) {
      return `${hours}小时前`
    }
    return '刚刚'
  }

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {maxNotes && notes.length > maxNotes && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showAll ? '收起' : `查看全部(${notes.length})`}
            </button>
          )}
        </div>
      )}

      <div className="grid gap-4">
        {displayNotes.map((note, index) => (
          <article
            key={`xiaohongshu-note-${note.id}-${index}`}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex gap-4">
              {/* 左侧：图片/视频预览 */}
              <div className="flex-shrink-0">
                {note.type === 'video' && note.video ? (
                  <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={note.video.cover || 'https://via.placeholder.com/96x96/F3F4F6/9CA3AF?text=视频'}
                      alt="视频封面"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <PlayIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : note.images.length > 0 ? (
                  <img
                    src={note.images[0].url}
                    alt={note.images[0].alt || note.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* 右侧：内容信息 */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* 标题 */}
                <h4 className="font-medium text-gray-900 line-clamp-2">
                  {note.title}
                </h4>

                {/* 内容预览 */}
                {showMetrics === 'detailed' && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {note.content}
                  </p>
                )}

                {/* 作者和时间 */}
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <UserIcon className="w-4 h-4" />
                    <span>{note.author.name}</span>
                  </div>
                  <span>{formatTime(note.publishTime)}</span>
                  {note.type === 'video' && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      视频
                    </span>
                  )}
                </div>

                {/* 标签 */}
                {showMetrics === 'all' && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{note.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* 互动数据 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <HeartIcon className="w-4 h-4" />
                      <span>{formatNumber(note.metrics.likes)}</span>
                    </span>
                    {(showMetrics === 'detailed' || showMetrics === 'all') && (
                      <>
                        <span className="flex items-center space-x-1">
                          <BookmarkIcon className="w-4 h-4" />
                          <span>{formatNumber(note.metrics.collects)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircleIcon className="w-4 h-4" />
                          <span>{formatNumber(note.metrics.comments)}</span>
                        </span>
                      </>
                    )}
                    {showMetrics === 'all' && (
                      <>
                        <span className="flex items-center space-x-1">
                          <ShareIcon className="w-4 h-4" />
                          <span>{formatNumber(note.metrics.shares)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span>📊</span>
                          <span>{calculateXiaohongshuInteractionRate(note).toFixed(1)}%</span>
                        </span>
                      </>
                    )}
                  </div>

                  {/* 查看原文链接 */}
                  <a
                    href={note.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                  >
                    <span>查看原文</span>
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {displayNotes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>暂无相关笔记</p>
        </div>
      )}
    </div>
  )
}