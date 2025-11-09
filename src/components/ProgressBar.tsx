interface ProgressBarProps {
  progress: number
  className?: string
  showPercentage?: boolean
  color?: 'primary' | 'green' | 'yellow' | 'red'
}

export default function ProgressBar({
  progress,
  className = '',
  showPercentage = true,
  color = 'primary'
}: ProgressBarProps) {
  const colorClasses = {
    primary: 'bg-primary-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600'
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1" hidden={!showPercentage}>
        <span className="text-sm text-gray-600">进度</span>
        <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
}