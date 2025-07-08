
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// Simple data visualization components using HTML/CSS

interface ChartContainerProps {
  children: React.ReactNode
  height?: number
  className?: string
}

function ChartContainer({ children, height = 300, className }: ChartContainerProps) {
  return (
    <div className={`${className} w-full rounded-lg border border-hf-card bg-hf-card`} style={{ minHeight: height }}>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

// Simple bar chart using CSS
interface SimpleBarChartProps {
  data: Array<{ name: string; value: number }>
  title?: string
  className?: string
}

function SimpleBarChart({ data, title, className }: SimpleBarChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-hf-text-secondary">No data available</div>
  }

  const maxValue = Math.max(...data.map(item => item.value))

  return (
    <div className={className}>
      {title && <h3 className="text-lg font-semibold text-hf-text mb-4">{title}</h3>}
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-20 text-sm text-hf-text-secondary truncate">{item.name}</div>
            <div className="flex-1 bg-hf-dark rounded-full h-2 relative">
              <div
                className="bg-gradient-orange h-2 rounded-full transition-all duration-300"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <div className="w-12 text-sm text-hf-text text-right">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Simple pie chart using CSS
interface SimplePieChartProps {
  data: Array<{ name: string; value: number; color?: string }>
  title?: string
  className?: string
}

function SimplePieChart({ data, title, className }: SimplePieChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-hf-text-secondary">No data available</div>
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className={className}>
      {title && <h3 className="text-lg font-semibold text-hf-text mb-4">{title}</h3>}
      <div className="grid grid-cols-2 gap-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: item.color || CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <div className="flex-1">
              <div className="text-sm text-hf-text">{item.name}</div>
              <div className="text-xs text-hf-text-secondary">
                {item.value} ({Math.round((item.value / total) * 100)}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Simple line chart using CSS
interface SimpleLineChartProps {
  data: Array<{ name: string; value: number }>
  title?: string
  className?: string
  showTrend?: boolean
}

function SimpleLineChart({ data, title, className, showTrend = true }: SimpleLineChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-hf-text-secondary">No data available</div>
  }

  const maxValue = Math.max(...data.map(item => item.value))
  const minValue = Math.min(...data.map(item => item.value))
  const range = maxValue - minValue
  
  // Calculate trend
  const trend = data.length > 1 ? data[data.length - 1].value - data[0].value : 0
  const trendPercent = data.length > 1 ? ((trend / data[0].value) * 100) : 0

  return (
    <div className={className}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-hf-text">{title}</h3>
          {showTrend && (
            <div className="flex items-center gap-1">
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-hf-success" />
              ) : trend < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-hf-text-secondary" />
              )}
              <span className={`text-sm ${trend > 0 ? 'text-hf-success' : trend < 0 ? 'text-red-500' : 'text-hf-text-secondary'}`}>
                {Math.abs(trendPercent).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-hf-text-secondary">{item.name}</span>
            <span className="text-hf-text font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Simple area chart using CSS
interface SimpleAreaChartProps {
  data: Array<{ name: string; value: number }>
  title?: string
  className?: string
}

function SimpleAreaChart({ data, title, className }: SimpleAreaChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-hf-text-secondary">No data available</div>
  }

  const maxValue = Math.max(...data.map(item => item.value))

  return (
    <div className={className}>
      {title && <h3 className="text-lg font-semibold text-hf-text mb-4">{title}</h3>}
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-16 text-sm text-hf-text-secondary">{item.name}</div>
            <div className="flex-1 bg-hf-dark rounded h-6 relative overflow-hidden">
              <div
                className="bg-gradient-to-r from-hf-orange/20 to-hf-orange h-full transition-all duration-300"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <div className="w-12 text-sm text-hf-text text-right">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Placeholder components for compatibility
const ResponsiveContainer = ({ children }: { children: React.ReactNode }) => <>{children}</>
const LineChart = ({ children }: { children: React.ReactNode }) => <div className="text-hf-text-secondary">Chart visualization</div>
const BarChart = ({ children }: { children: React.ReactNode }) => <div className="text-hf-text-secondary">Chart visualization</div>
const PieChart = ({ children }: { children: React.ReactNode }) => <div className="text-hf-text-secondary">Chart visualization</div>
const AreaChart = ({ children }: { children: React.ReactNode }) => <div className="text-hf-text-secondary">Chart visualization</div>
const Line = () => null
const Bar = () => null
const Area = () => null
const Pie = () => null
const Cell = () => null
const XAxis = () => null
const YAxis = () => null
const Tooltip = () => null
const Legend = () => null

// Chart color palette
export const CHART_COLORS = [
  '#FF8C42', // hf-orange
  '#D65A31', // hf-orange-dark
  '#4FD1C5', // hf-success
  '#60B5FF', // blue
  '#FF9149', // light orange
  '#A19AD3', // purple
  '#72BF78', // green
  '#FF9898', // pink
]

export {
  ChartContainer,
  ResponsiveContainer,
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  SimpleBarChart,
  SimplePieChart,
  SimpleLineChart,
  SimpleAreaChart,
}
