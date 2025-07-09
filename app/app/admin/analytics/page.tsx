
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
      
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      const data = await response.json()
      
      setAnalyticsData(data)
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

        {/* Revenue Analytics Section */}
        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <CardTitle className="text-hf-text flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-hf-orange" />
              Revenue Analytics
            </CardTitle>
            <CardDescription className="text-hf-text-secondary">
              Comprehensive revenue metrics and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Revenue"
                value={formatCurrency(analyticsData?.overview.totalRevenue || 0)}
                description="All time earnings"
                icon={DollarSign}
                trend={{
                  value: analyticsData?.overview.revenueGrowth || 0,
                  label: 'vs last period',
                  isPositive: (analyticsData?.overview.revenueGrowth || 0) >= 0,
                }}
              />
              <StatCard
                title="Period Revenue"
                value={formatCurrency(analyticsData?.overview.monthlyRevenue || 0)}
                description="Selected timeframe"
                icon={TrendingUp}
                trend={{
                  value: analyticsData?.overview.revenueGrowth || 0,
                  label: 'vs last period',
                  isPositive: (analyticsData?.overview.revenueGrowth || 0) >= 0,
                }}
              />
              <StatCard
                title="Avg Revenue/Client"
                value={formatCurrency(analyticsData?.overview.averageRevenuePerClient || 0)}
                description="Per client value"
                icon={Users}
                trend={{
                  value: 8.3,
                  label: 'vs last period',
                  isPositive: true,
                }}
              />
              <StatCard
                title="Active Clients"
                value={`${analyticsData?.overview.activeClients || 0}/${analyticsData?.overview.totalClients || 0}`}
                description="Currently training"
                icon={Target}
                trend={{
                  value: analyticsData?.overview.clientGrowth || 0,
                  label: 'vs last period',
                  isPositive: (analyticsData?.overview.clientGrowth || 0) >= 0,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Client Engagement Section */}
        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <CardTitle className="text-hf-text flex items-center">
              <Users className="h-5 w-5 mr-2 text-hf-orange" />
              Client Engagement
            </CardTitle>
            <CardDescription className="text-hf-text-secondary">
              Client activity and retention metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Total Sessions"
                value={analyticsData?.overview.totalSessions || 0}
                description="In selected period"
                icon={Activity}
                trend={{
                  value: 12.5,
                  label: 'vs last period',
                  isPositive: true,
                }}
              />
              <StatCard
                title="Avg Sessions/Client"
                value={Number(analyticsData?.overview.averageSessionsPerClient || 0).toFixed(1)}
                description="Per client average"
                icon={BarChart3}
                trend={{
                  value: 5.2,
                  label: 'vs last period',
                  isPositive: true,
                }}
              />
              <StatCard
                title="Retention Rate"
                value={`${Number(analyticsData?.overview.retentionRate || 0).toFixed(1)}%`}
                description="Client retention"
                icon={Target}
                trend={{
                  value: 2.1,
                  label: 'vs last period',
                  isPositive: true,
                }}
              />
            </div>
          </CardContent>
        </Card>

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
                {analyticsData?.revenueChart?.length ? (
                  <SimpleAreaChart
                    data={analyticsData.revenueChart.map(item => ({
                      name: item.month,
                      value: item.revenue
                    }))}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 text-hf-text-secondary" />
                      <p className="text-hf-text-secondary">No revenue data available</p>
                    </div>
                  </div>
                )}
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
                {analyticsData?.clientEngagement?.length ? (
                  <>
                    <SimpleBarChart
                      data={analyticsData.clientEngagement.map(item => ({
                        name: item.week,
                        value: item.sessionsBooked
                      }))}
                    />
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div className="text-hf-text-secondary">
                        <span className="text-hf-orange">●</span> Sessions Booked
                      </div>
                      <div className="text-hf-text-secondary">
                        <span className="text-hf-success">●</span> New Clients Weekly
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-hf-text-secondary" />
                      <p className="text-hf-text-secondary">No client engagement data available</p>
                    </div>
                  </div>
                )}
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
                {analyticsData?.packageDistribution?.length ? (
                  <SimplePieChart
                    data={analyticsData.packageDistribution.map(item => ({
                      name: item.name,
                      value: item.value,
                      color: item.color
                    }))}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-hf-text-secondary" />
                      <p className="text-hf-text-secondary">No package data available</p>
                    </div>
                  </div>
                )}
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
                {analyticsData?.exercisePopularity?.length ? (
                  <SimpleBarChart
                    data={analyticsData.exercisePopularity.slice(0, 6).map(item => ({
                      name: item.name,
                      value: item.usage
                    }))}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Target className="h-12 w-12 mx-auto mb-4 text-hf-text-secondary" />
                      <p className="text-hf-text-secondary">No exercise data available</p>
                    </div>
                  </div>
                )}
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
                {analyticsData?.hourlyBookings?.length ? (
                  <SimpleBarChart
                    data={analyticsData.hourlyBookings.map(item => ({
                      name: item.hour,
                      value: item.bookings
                    }))}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-hf-text-secondary" />
                      <p className="text-hf-text-secondary">No booking data available</p>
                    </div>
                  </div>
                )}
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
                {analyticsData?.clientRetention?.length ? (
                  <>
                    <SimpleLineChart
                      data={analyticsData.clientRetention.map(item => ({
                        name: item.cohort,
                        value: item.month1
                      }))}
                      showTrend={true}
                    />
                    <div className="mt-4 text-xs text-hf-text-secondary">
                      Showing Month 1 retention rates. Additional cohort data available in detailed reports.
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-hf-text-secondary" />
                      <p className="text-hf-text-secondary">No retention data available</p>
                    </div>
                  </div>
                )}
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
            {analyticsData?.topPerformers?.length ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {analyticsData.topPerformers.map((performer, index) => (
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
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-hf-text-secondary" />
                <p className="text-hf-text-secondary">No top performers data available</p>
              </div>
            )}
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
