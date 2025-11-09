import {
  ClockIcon,
  CheckIcon,
  XIcon,
  AlertCircleIcon
} from 'lucide-react'

interface StatusBadgeProps {
  status: 'draft' | 'pending' | 'published' | 'withdrawn' | 'error'
  className?: string
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig = {
    draft: {
      color: 'bg-gray-100 text-gray-700',
      icon: ClockIcon,
      label: '草稿'
    },
    pending: {
      color: 'bg-yellow-100 text-yellow-700',
      icon: ClockIcon,
      label: '待发布'
    },
    published: {
      color: 'bg-green-100 text-green-700',
      icon: CheckIcon,
      label: '已发布'
    },
    withdrawn: {
      color: 'bg-red-100 text-red-700',
      icon: XIcon,
      label: '已撤回'
    },
    error: {
      color: 'bg-red-100 text-red-700',
      icon: AlertCircleIcon,
      label: '错误'
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  )
}