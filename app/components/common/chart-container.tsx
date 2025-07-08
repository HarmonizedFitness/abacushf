
"use client"

import { useState, useEffect } from 'react'
import { LoadingState } from './loading-spinner'

// Simple hook to load recharts components
function useRecharts() {
  const [components, setComponents] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    
    const loadRecharts = async () => {
      try {
        const recharts = await import('recharts')
        if (mounted) {
          setComponents(recharts)
        }
      } catch (error) {
        console.error('Failed to load recharts:', error)
      }
    }

    loadRecharts()

    return () => {
      mounted = false
    }
  }, [])

  return components
}

// Create wrapper components
const ResponsiveContainer = (props: any) => {
  const recharts = useRecharts()
  if (!recharts) return <div className="w-full h-full flex items-center justify-center">Loading chart...</div>
  return <recharts.ResponsiveContainer {...props} />
}

const LineChart = (props: any) => {
  const recharts = useRecharts()
  if (!recharts) return null
  return <recharts.LineChart {...props} />
}

const BarChart = (props: any) => {
  const recharts = useRecharts()
  if (!recharts) return null
  return <recharts.BarChart {...props} />
}

const PieChart = (props: any) => {
  const recharts = useRecharts()
  if (!recharts) return null
  return <recharts.PieChart {...props} />
}

const AreaChart = (props: any) => {
  const recharts = useRecharts()
  if (!recharts) return null
  return <recharts.AreaChart {...props} />
}

const Line = (props: any) => {
  const recharts = useRecharts()
  if (!recharts) return null
  return <recharts.Line {...props} />
}

const Bar = (props: any) => {
  const recharts = useRecharts()
  if (!recharts) return null
  return <recharts.Bar {...props} />
}

const Area = (props: any) => {
  const recharts = useRecharts()
  if (!recharts) return null
  return <recharts.Area {...props} />
}

const Pie = (props: any) => {
  const recharts = useRecharts()
  if (!recharts) return null
  return <recharts.Pie {...props} />
}

const Cell = (props: any) => {
  const recharts = useRecharts()
  if (!recharts) return null
  return <recharts.Cell {...props} />
}

const XAxis = (props: any) => {
  const recharts = useRecharts()
  if (!recharts) return null
  return <recharts.XAxis {...props} />
}

const YAxis = (props: any) => {
  const recharts = useRecharts()
  if (!recharts) return null
  return <recharts.YAxis {...props} />
}

const Tooltip = (props: any) => {
  const recharts = useRecharts()
  if (!recharts) return null
  return <recharts.Tooltip {...props} />
}

const Legend = (props: any) => {
  const recharts = useRecharts()
  if (!recharts) return null
  return <recharts.Legend {...props} />
}

interface ChartContainerProps {
  children: React.ReactNode
  height?: number
  className?: string
}

function ChartContainer({ children, height = 300, className }: ChartContainerProps) {
  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as any}
      </ResponsiveContainer>
    </div>
  )
}

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
}
