
"use client"

import { useEffect, useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Target,
  Activity,
  Download,
  Filter,
  RefreshCw,
  Clock,
  Trophy,
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  ChartContainer, 
  SimpleBarChart, 
  SimpleLineChart, 
  SimplePieChart,
  SimpleAreaChart
} from '@/components/common/chart-container'
import { StatCard } from '@/components/common/stat-card'
import { LoadingState } from '@/components/common/status-message'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface AnalyticsData {
  overview: {
    totalRevenue: number
    monthlyRevenue: number
    revenueGrowth: number
    totalClients: number
    activeClients: number
    clientGrowth: number
    totalSessions: number
    averageSessionsPerClient: number
    retentionRate: number
    averageRevenuePerClient: number
  }
  revenueChart: Array<{
    month: string
    revenue: number
    clients: number
    sessions: number
  }>
  clientEngagement: Array<{
    week: string
    newClients: number
    activeClients: number
    sessionsBooked: number
  }>
  packageDistribution: Array<{
    name: string
    value: number
    color: string
    revenue: number
  }>
  exercisePopularity: Array<{
    name: string
    usage: number
    category: string
  }>
  hourlyBookings: Array<{
    hour: string
    bookings: number
  }>
  clientRetention: Array<{
    cohort: string
    month1: number
    month3: number
    month6: number
    month12: number
  }>
  topPerformers: Array<{
    name: string
    sessions: number
    revenue: number
    growth: number
  }>
}

export default function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('6months')
  const [refreshing, setRefreshing] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    try {
      setRefreshing(true)
      
      // In a real app, you'd fetch from /api/admin/analytics
      // For now, we'll simulate comprehensive analytics data
      const mockData: AnalyticsData = {
        overview: {
          totalRevenue: 48750,
          monthlyRevenue: 8200,
          revenueGrowth: 15.3,
          totalClients: 127,
          activeClients: 89,
          clientGrowth: 12.8,
          totalSessions: 342,
          averageSessionsPerClient: 2.7,
          retentionRate: 78.5,
          averageRevenuePerClient: 384,
        },
        revenueChart: [
          { month: 'Jan', revenue: 5200, clients: 45, sessions: 58 },
          { month: 'Feb', revenue: 6100, clients: 52, sessions: 67 },
          { month: 'Mar', revenue: 5800, clients: 48, sessions: 63 },
          { month: 'Apr', revenue: 7200, clients: 61, sessions: 78 },
          { month: 'May', revenue: 8400, clients: 68, sessions: 89 },
          { month: 'Jun', revenue: 8200, clients: 72, sessions: 85 },
        ],
        clientEngagement: [
          { week: 'Week 1', newClients: 5, activeClients: 67, sessionsBooked: 23 },
          { week: 'Week 2', newClients: 8, activeClients: 72, sessionsBooked: 28 },
          { week: 'Week 3', newClients: 3, activeClients: 69, sessionsBooked: 25 },
          { week: 'Week 4', newClients: 6, activeClients: 74, sessionsBooked: 31 },
        ],
        packageDistribution: [
          { name: 'Regular (10 credits)', value: 45, color: '#FF8C42', revenue: 36000 },
          { name: 'Committed (15 credits)', value: 30, color: '#D65A31', revenue: 33750 },
          { name: 'Champion (25 credits)', value: 15, color: '#4FD1C5', revenue: 24375 },
          { name: 'Starter (4 credits)', value: 10, color: '#60B5FF', revenue: 13600 },
        ],
        exercisePopularity: [
          { name: 'Bench Press', usage: 156, category: 'Chest' },
          { name: 'Squats', usage: 142, category: 'Legs' },
          { name: 'Deadlift', usage: 128, category: 'Back' },
          { name: 'Pull-ups', usage: 98, category: 'Back' },
          { name: 'Shoulder Press', usage: 87, category: 'Shoulders' },
          { name: 'Lunges', usage: 76, category: 'Legs' },
          { name: 'Plank', usage: 65, category: 'Core' },
          { name: 'Burpees', usage: 54, category: 'Cardio' },
        ],
        hourlyBookings: [
          { hour: '6 AM', bookings: 8 },
          { hour: '7 AM', bookings: 15 },
          { hour: '8 AM', bookings: 22 },
          { hour: '9 AM', bookings: 18 },
          { hour: '10 AM', bookings: 12 },
          { hour: '11 AM', bookings: 14 },
          { hour: '12 PM', bookings: 16 },
          { hour: '1 PM', bookings: 10 },
          { hour: '2 PM', bookings: 8 },
          { hour: '3 PM', bookings: 11 },
          { hour: '4 PM', bookings: 19 },
          { hour: '5 PM', bookings: 25 },
          { hour: '6 PM', bookings: 28 },
          { hour: '7 PM', bookings: 20 },
        ],
        clientRetention: [
          { cohort: 'Q1 2024', month1: 100, month3: 85, month6: 72, month12: 65 },
          { cohort: 'Q2 2024', month1: 100, month3: 88, month6: 76, month12: 0 },
          { cohort: 'Q3 2024', month1: 100, month3: 91, month6: 0, month12: 0 },
          { cohort: 'Q4 2024', month1: 100, month3: 0, month6: 0, month12: 0 },
        ],
        topPerformers: [
          { name: 'Alice Johnson', sessions: 24, revenue: 1920, growth: 28 },
          { name: 'Michael Chen', sessions: 22, revenue: 1760, growth: 15 },
          { name: 'Sarah Davis', sessions: 20, revenue: 1600, growth: 42 },
          { name: 'David Wilson', sessions: 18, revenue: 1440, growth: 33 },
        ],
      }

      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load analytics data.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const exportData = () => {
    toast({
      title: 'Export Started',
      description: 'Your analytics report is being prepared for download.',
    })
  }

  if (loading) {
    return (
      <ProtectedLayout requireRole="ADMIN">
        <LoadingState message="Loading analytics..." />
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout requireRole="ADMIN">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-hf-text">Business Analytics</h1>
            <p className="text-hf-text-secondary">
              Comprehensive insights into your fitness business performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchAnalyticsData}
              disabled={refreshing}
              className="border-hf-card"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={exportData} className="btn-gradient">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(analyticsData?.overview.totalRevenue || 0)}
            description="All time earnings"
            icon={DollarSign}
            trend={{
              value: analyticsData?.overview.revenueGrowth || 0,
              label: 'vs last period',
              isPositive: true,
            }}
          />
          <StatCard
            title="Active Clients"
            value={`${analyticsData?.overview.activeClients}/${analyticsData?.overview.totalClients}`}
            description="Currently training"
            icon={Users}
            trend={{
              value: analyticsData?.overview.clientGrowth || 0,
              label: 'vs last period',
              isPositive: true,
            }}
          />
          <StatCard
            title="Avg Revenue/Client"
            value={formatCurrency(analyticsData?.overview.averageRevenuePerClient || 0)}
            description="Per client lifetime"
            icon={TrendingUp}
            trend={{
              value: 8.3,
              label: 'vs last period',
              isPositive: true,
            }}
          />
          <StatCard
            title="Retention Rate"
            value={`${analyticsData?.overview.retentionRate || 0}%`}
            description="Client retention"
            icon={Target}
            trend={{
              value: 2.1,
              label: 'vs last period',
              isPositive: true,
            }}
          />
        </div>

        {/* Revenue and Client Trends */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-hf-orange" />
                Revenue Trends
              </CardTitle>
              <CardDescription className="text-hf-text-secondary">
                Monthly revenue and growth patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer height={300}>
                <SimpleAreaChart
                  data={analyticsData?.revenueChart?.map(item => ({
                    name: item.month,
                    value: item.revenue
                  })) || []}
                />
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <Users className="h-5 w-5 mr-2 text-hf-orange" />
                Client Engagement
              </CardTitle>
              <CardDescription className="text-hf-text-secondary">
                Weekly client activity and growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer height={300}>
                <SimpleBarChart
                  data={analyticsData?.clientEngagement?.map(item => ({
                    name: item.week,
                    value: item.sessionsBooked
                  })) || []}
                />
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="text-hf-text-secondary">
                    <span className="text-hf-orange">●</span> Sessions Booked
                  </div>
                  <div className="text-hf-text-secondary">
                    <span className="text-hf-success">●</span> New Clients (see table below)
                  </div>
                </div>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Package Performance and Exercise Analytics */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-hf-orange" />
                Package Distribution
              </CardTitle>
              <CardDescription className="text-hf-text-secondary">
                Revenue by credit packages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer height={250}>
                <SimplePieChart
                  data={analyticsData?.packageDistribution?.map(item => ({
                    name: item.name,
                    value: item.value,
                    color: item.color
                  })) || []}
                />
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <Target className="h-5 w-5 mr-2 text-hf-orange" />
                Exercise Popularity
              </CardTitle>
              <CardDescription className="text-hf-text-secondary">
                Most frequently used exercises
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer height={250}>
                <SimpleBarChart
                  data={analyticsData?.exercisePopularity?.slice(0, 6)?.map(item => ({
                    name: item.name,
                    value: item.usage
                  })) || []}
                />
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Booking Patterns and Client Retention */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <Clock className="h-5 w-5 mr-2 text-hf-orange" />
                Peak Booking Hours
              </CardTitle>
              <CardDescription className="text-hf-text-secondary">
                Session bookings by time of day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer height={300}>
                <SimpleBarChart
                  data={analyticsData?.hourlyBookings?.map(item => ({
                    name: item.hour,
                    value: item.bookings
                  })) || []}
                />
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-hf-orange" />
                Client Retention Cohorts
              </CardTitle>
              <CardDescription className="text-hf-text-secondary">
                Retention rates by client cohorts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer height={300}>
                <SimpleLineChart
                  data={analyticsData?.clientRetention?.map(item => ({
                    name: item.cohort,
                    value: item.month1
                  })) || []}
                  showTrend={true}
                />
                <div className="mt-4 text-xs text-hf-text-secondary">
                  Showing Month 1 retention rates. Additional cohort data available in detailed reports.
                </div>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <CardTitle className="text-hf-text flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-hf-orange" />
              Top Performing Clients
            </CardTitle>
            <CardDescription className="text-hf-text-secondary">
              Clients with highest engagement and revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {analyticsData?.topPerformers?.map((performer, index) => (
                <div
                  key={performer.name}
                  className="p-4 bg-hf-dark rounded-lg border border-hf-card"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-lg font-bold text-hf-orange">#{index + 1}</div>
                    <Badge className="bg-hf-success/10 text-hf-success border-hf-success/20">
                      +{performer.growth}%
                    </Badge>
                  </div>
                  <h3 className="font-medium text-hf-text mb-2">{performer.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-hf-text-secondary">Sessions:</span>
                      <span className="text-hf-text font-medium">{performer.sessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hf-text-secondary">Revenue:</span>
                      <span className="text-hf-text font-medium">
                        {formatCurrency(performer.revenue)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Business Insights */}
        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <CardTitle className="text-hf-text flex items-center">
              <Activity className="h-5 w-5 mr-2 text-hf-orange" />
              Business Insights
            </CardTitle>
            <CardDescription className="text-hf-text-secondary">
              Key recommendations based on your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-lg border border-green-500/20">
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-4 w-4 text-green-400 mr-2" />
                  <span className="font-medium text-green-400">Revenue Growth</span>
                </div>
                <p className="text-sm text-hf-text-secondary">
                  Your revenue has grown by 15.3% this period. Regular package sales are driving growth.
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center mb-2">
                  <Users className="h-4 w-4 text-blue-400 mr-2" />
                  <span className="font-medium text-blue-400">Client Retention</span>
                </div>
                <p className="text-sm text-hf-text-secondary">
                  78.5% retention rate is excellent. Focus on Month 3-6 engagement to improve further.
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-lg border border-orange-500/20">
                <div className="flex items-center mb-2">
                  <Calendar className="h-4 w-4 text-orange-400 mr-2" />
                  <span className="font-medium text-orange-400">Peak Hours</span>
                </div>
                <p className="text-sm text-hf-text-secondary">
                  Evening slots (5-7 PM) are most popular. Consider expanding evening availability.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  )
}
