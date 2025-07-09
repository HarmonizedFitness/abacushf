
"use client"

import { useEffect, useState } from 'react'
import {
  Users,
  TrendingUp,
  Calendar,
  Target,
  ArrowRight,
  Plus,
  Clock,
  Trophy,
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/common/status-message'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'

interface AdminDashboardData {
  recentBookings: any[]
  topExercises: any[]
  topPerformers: any[]
}

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      const data = await response.json()
      
      // Extract only the data we need for the dashboard
      const dashboardData: AdminDashboardData = {
        recentBookings: data.recentBookings || [],
        topExercises: data.topExercises || [],
        topPerformers: data.topPerformers || []
      }

      setDashboardData(dashboardData)
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
              Quick access to key business actions and insights
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

        {/* Most Popular Exercises - Moved to top */}
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
            {dashboardData?.topExercises?.length ? (
              <div className="grid gap-4 md:grid-cols-5">
                {dashboardData.topExercises.map((exercise, index) => (
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
                        {exercise.usage} uses
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto mb-4 text-hf-text-secondary" />
                <p className="text-hf-text-secondary">No exercise data available</p>
              </div>
            )}
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

        {/* Top Performers */}
        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <CardTitle className="text-hf-text flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-hf-orange" />
              Top Performing Clients
            </CardTitle>
            <CardDescription className="text-hf-text-secondary">
              Clients with highest engagement and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.topPerformers?.length ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {dashboardData.topPerformers.map((performer, index) => (
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
                          ${performer.revenue || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-hf-text-secondary" />
                <p className="text-hf-text-secondary">No client performance data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card className="bg-hf-card border-hf-card">
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
            {dashboardData?.recentBookings?.length ? (
              <div className="space-y-4">
                {dashboardData.recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-hf-dark rounded-lg border border-hf-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-hf-text">{booking.user?.name || 'Unknown'}</p>
                        <Badge className="bg-hf-success/10 text-hf-success border-hf-success/20">
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-hf-text-secondary mb-1">
                        {booking.user?.email || 'No email'}
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
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-hf-text-secondary" />
                <p className="text-hf-text-secondary">No recent bookings</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  )
}
