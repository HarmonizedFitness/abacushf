
"use client"

import { useEffect, useState } from 'react'
import {
  Users,
  TrendingUp,
  Calendar,
  CreditCard,
  DollarSign,
  Activity,
  Target,
  Clock,
  ArrowRight,
  Plus,
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { StatCard } from '@/components/common/stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, SimpleBarChart, SimpleLineChart, SimplePieChart } from '@/components/common/chart-container'
import { LoadingState } from '@/components/common/status-message'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'

interface AdminDashboardData {
  stats: {
    totalRevenue: number
    totalClients: number
    activeClients: number
    totalBookings: number
    upcomingBookings: number
    totalCreditsActive: number
    monthlyRevenue: number
    revenueGrowth: number
  }
  recentBookings: any[]
  topExercises: any[]
  revenueChart: any[]
  clientActivityChart: any[]
  revenueByPackage: any[]
}

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // In a real app, you'd fetch this from /api/admin/dashboard
      // For now, we'll simulate the data
      const mockData: AdminDashboardData = {
        stats: {
          totalRevenue: 12450,
          totalClients: 45,
          activeClients: 32,
          totalBookings: 168,
          upcomingBookings: 24,
          totalCreditsActive: 287,
          monthlyRevenue: 3200,
          revenueGrowth: 12.5,
        },
        recentBookings: [
          {
            id: '1',
            user: { name: 'Alice Johnson', email: 'alice@fitness.com' },
            startTime: new Date(Date.now() + 86400000).toISOString(),
            endTime: new Date(Date.now() + 90000000).toISOString(),
            status: 'CONFIRMED',
            notes: 'Focus on upper body strength',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            user: { name: 'Bob Smith', email: 'bob@fitness.com' },
            startTime: new Date(Date.now() + 172800000).toISOString(),
            endTime: new Date(Date.now() + 176400000).toISOString(),
            status: 'CONFIRMED',
            notes: 'Leg day workout',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
        topExercises: [
          { name: 'Bench Press', count: 45 },
          { name: 'Squats', count: 38 },
          { name: 'Deadlift', count: 32 },
          { name: 'Pull-ups', count: 28 },
          { name: 'Shoulder Press', count: 24 },
        ],
        revenueChart: [
          { month: 'Jan', revenue: 2400, clients: 28 },
          { month: 'Feb', revenue: 2800, clients: 32 },
          { month: 'Mar', revenue: 3100, clients: 35 },
          { month: 'Apr', revenue: 2900, clients: 33 },
          { month: 'May', revenue: 3400, clients: 38 },
          { month: 'Jun', revenue: 3200, clients: 36 },
        ],
        clientActivityChart: [
          { day: 'Mon', sessions: 12 },
          { day: 'Tue', sessions: 15 },
          { day: 'Wed', sessions: 18 },
          { day: 'Thu', sessions: 14 },
          { day: 'Fri', sessions: 20 },
          { day: 'Sat', sessions: 8 },
          { day: 'Sun', sessions: 5 },
        ],
        revenueByPackage: [
          { name: 'Regular', value: 45, color: '#FF8C42' },
          { name: 'Committed', value: 30, color: '#D65A31' },
          { name: 'Champion', value: 15, color: '#4FD1C5' },
          { name: 'Starter', value: 10, color: '#60B5FF' },
        ],
      }

      setDashboardData(mockData)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedLayout requireRole="ADMIN">
        <LoadingState message="Loading admin dashboard..." />
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout requireRole="ADMIN">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-hf-text">Admin Dashboard</h1>
            <p className="text-hf-text-secondary">
              Overview of your fitness business performance
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="border-hf-card">
              <Link href="/admin/clients">
                <Users className="h-4 w-4 mr-2" />
                Manage Clients
              </Link>
            </Button>
            <Button asChild className="btn-gradient">
              <Link href="/admin/analytics">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(dashboardData?.stats.totalRevenue || 0)}
            description="All time earnings"
            icon={DollarSign}
            trend={{
              value: dashboardData?.stats.revenueGrowth || 0,
              label: 'vs last month',
              isPositive: true,
            }}
          />
          <StatCard
            title="Active Clients"
            value={`${dashboardData?.stats.activeClients || 0}/${dashboardData?.stats.totalClients || 0}`}
            description="Currently training"
            icon={Users}
            trend={{
              value: 8,
              label: 'vs last month',
              isPositive: true,
            }}
          />
          <StatCard
            title="This Month"
            value={formatCurrency(dashboardData?.stats.monthlyRevenue || 0)}
            description="Revenue generated"
            icon={TrendingUp}
            trend={{
              value: dashboardData?.stats.revenueGrowth || 0,
              label: 'vs last month',
              isPositive: true,
            }}
          />
          <StatCard
            title="Active Credits"
            value={dashboardData?.stats.totalCreditsActive || 0}
            description="Unused client credits"
            icon={CreditCard}
            trend={{
              value: 15,
              label: 'vs last month',
              isPositive: true,
            }}
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-hf-orange" />
                Revenue Trends
              </CardTitle>
              <CardDescription className="text-hf-text-secondary">
                Monthly revenue and client growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer height={300}>
                <SimpleLineChart
                  data={dashboardData?.revenueChart?.map(item => ({
                    name: item.month,
                    value: item.revenue
                  })) || []}
                  showTrend={true}
                />
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Weekly Activity */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <Activity className="h-5 w-5 mr-2 text-hf-orange" />
                Weekly Activity
              </CardTitle>
              <CardDescription className="text-hf-text-secondary">
                Sessions booked by day of week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer height={300}>
                <SimpleBarChart
                  data={dashboardData?.clientActivityChart?.map(item => ({
                    name: item.day,
                    value: item.sessions
                  })) || []}
                />
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue by Package */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <Target className="h-5 w-5 mr-2 text-hf-orange" />
                Revenue by Package
              </CardTitle>
              <CardDescription className="text-hf-text-secondary">
                Distribution of credit package sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer height={250}>
                <SimplePieChart
                  data={dashboardData?.revenueByPackage?.map(item => ({
                    name: item.name,
                    value: item.value,
                    color: item.color
                  })) || []}
                />
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card className="bg-hf-card border-hf-card lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-hf-text flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-hf-orange" />
                  Recent Bookings
                </CardTitle>
                <CardDescription className="text-hf-text-secondary">
                  Latest session bookings from clients
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/bookings">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recentBookings?.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-hf-dark rounded-lg border border-hf-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-hf-text">{booking.user.name}</p>
                        <Badge className="bg-hf-success/10 text-hf-success border-hf-success/20">
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-hf-text-secondary mb-1">
                        {booking.user.email}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-hf-text-secondary">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(booking.startTime)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(booking.startTime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      {booking.notes && (
                        <p className="text-xs text-hf-text-secondary mt-2 italic">
                          "{booking.notes}"
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-hf-text-secondary">
                      {formatRelativeTime(booking.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Exercises */}
        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <CardTitle className="text-hf-text flex items-center">
              <Target className="h-5 w-5 mr-2 text-hf-orange" />
              Most Popular Exercises
            </CardTitle>
            <CardDescription className="text-hf-text-secondary">
              Exercises most frequently used by clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              {dashboardData?.topExercises?.map((exercise, index) => (
                <div
                  key={exercise.name}
                  className="flex items-center justify-between p-4 bg-hf-dark rounded-lg border border-hf-card"
                >
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="text-lg font-bold text-hf-orange mr-2">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium text-hf-text">
                        {exercise.name}
                      </span>
                    </div>
                    <div className="text-xs text-hf-text-secondary">
                      {exercise.count} uses
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <CardTitle className="text-hf-text">Quick Actions</CardTitle>
            <CardDescription className="text-hf-text-secondary">
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button asChild className="btn-gradient justify-start h-auto p-4">
                <Link href="/admin/clients/new">
                  <div className="flex flex-col items-start">
                    <div className="flex items-center mb-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Client
                    </div>
                    <span className="text-xs opacity-80">Create new client account</span>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="border-hf-card justify-start h-auto p-4">
                <Link href="/admin/bookings">
                  <div className="flex flex-col items-start">
                    <div className="flex items-center mb-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      Manage Schedule
                    </div>
                    <span className="text-xs text-hf-text-secondary">View all bookings</span>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="border-hf-card justify-start h-auto p-4">
                <Link href="/admin/exercises">
                  <div className="flex flex-col items-start">
                    <div className="flex items-center mb-1">
                      <Target className="h-4 w-4 mr-2" />
                      Manage Exercises
                    </div>
                    <span className="text-xs text-hf-text-secondary">Add/edit exercises</span>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="border-hf-card justify-start h-auto p-4">
                <Link href="/admin/analytics">
                  <div className="flex flex-col items-start">
                    <div className="flex items-center mb-1">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Reports
                    </div>
                    <span className="text-xs text-hf-text-secondary">Detailed analytics</span>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  )
}
