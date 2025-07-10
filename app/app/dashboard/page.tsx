
"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Calendar,
  Trophy,
  Target,
  CreditCard,
  TrendingUp,
  Clock,
  Dumbbell,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { StatCard } from '@/components/common/stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { formatDate, formatTime, formatRelativeTime, formatPRDisplay } from '@/lib/utils'
import Link from 'next/link'

interface DashboardData {
  remainingCredits: number
  upcomingBookings: any[]
  recentWorkouts: any[]
  personalRecords: any[]
  totalWorkouts: number
  totalPRs: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [creditsRes, bookingsRes, workoutsRes, recordsRes] = await Promise.all([
        fetch('/api/credits'),
        fetch('/api/bookings?limit=3&status=CONFIRMED'),
        fetch('/api/workouts?limit=3'),
        fetch('/api/personal-records?limit=5&calculate=true'),
      ])

      const [creditsData, bookingsData, workoutsData, recordsData] = await Promise.all([
        creditsRes.json(),
        bookingsRes.json(),
        workoutsRes.json(),
        recordsRes.json(),
      ])

      setDashboardData({
        remainingCredits: creditsData.data?.remainingCredits || 0,
        upcomingBookings: bookingsData.data || [],
        recentWorkouts: workoutsData.data || [],
        personalRecords: recordsData.data || [],
        totalWorkouts: workoutsData.pagination?.total || 0,
        totalPRs: recordsData.pagination?.total || 0,
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <LoadingState message="Loading your dashboard..." />
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-hf-text">
            Welcome back, {session?.user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-hf-text-secondary">
            Ready to crush your fitness goals today?
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Remaining Credits"
            value={dashboardData?.remainingCredits || 0}
            description="Available for booking sessions"
            icon={CreditCard}
            trend={{
              value: 12,
              label: 'vs last month',
              isPositive: true,
            }}
          />
          <StatCard
            title="Total Workouts"
            value={dashboardData?.totalWorkouts || 0}
            description="Completed training sessions"
            icon={Target}
            trend={{
              value: 8,
              label: 'vs last month',
              isPositive: true,
            }}
          />
          <StatCard
            title="Personal Records"
            value={dashboardData?.totalPRs || 0}
            description="Achievements unlocked"
            icon={Trophy}
            trend={{
              value: 25,
              label: 'vs last month',
              isPositive: true,
            }}
          />
          <StatCard
            title="This Week"
            value="3"
            description="Workouts completed"
            icon={TrendingUp}
            trend={{
              value: 50,
              label: 'vs last week',
              isPositive: true,
            }}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <Target className="h-5 w-5 mr-2 text-hf-orange" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-hf-text-secondary">
                Get started with your fitness journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full btn-gradient justify-start">
                <Link href="/schedule">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book a Training Session
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start border-hf-card">
                <Link href="/workouts">
                  <Target className="h-4 w-4 mr-2" />
                  View Workout History
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start border-hf-card">
                <Link href="/personal-records">
                  <Trophy className="h-4 w-4 mr-2" />
                  View Personal Records
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start border-hf-card">
                <Link href="/progress">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Progress Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start border-hf-card">
                <Link href="/credits">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Purchase Credits
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-hf-text flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-hf-orange" />
                  Upcoming Sessions
                </CardTitle>
                <CardDescription className="text-hf-text-secondary">
                  Your scheduled training sessions
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/schedule">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {dashboardData?.upcomingBookings?.length === 0 ? (
                <EmptyState
                  title="No upcoming sessions"
                  description="Book your next training session to get started"
                  action={
                    <Button asChild className="btn-gradient">
                      <Link href="/schedule">Book Now</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {dashboardData?.upcomingBookings?.slice(0, 3).map((booking: any) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-hf-dark rounded-lg border border-hf-card"
                    >
                      <div>
                        <p className="font-medium text-hf-text">
                          {formatDate(booking.startTime)}
                        </p>
                        <p className="text-sm text-hf-text-secondary">
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </p>
                        {booking.notes && (
                          <p className="text-xs text-hf-text-secondary mt-1">
                            {booking.notes}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-hf-success/10 text-hf-success">
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Workouts */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-hf-text flex items-center">
                  <Dumbbell className="h-5 w-5 mr-2 text-hf-orange" />
                  Recent Workouts
                </CardTitle>
                <CardDescription className="text-hf-text-secondary">
                  Your latest training sessions
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/workouts">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {dashboardData?.recentWorkouts?.length === 0 ? (
                <EmptyState
                  title="No workouts logged"
                  description="Your trainer will log workouts during your training sessions"
                  action={
                    <Button asChild className="btn-gradient">
                      <Link href="/schedule">Book a Session</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {dashboardData?.recentWorkouts?.map((workout: any) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between p-4 bg-hf-dark rounded-lg border border-hf-card"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-hf-text">
                          {formatDate(workout.date)}
                        </p>
                        <p className="text-sm text-hf-text-secondary">
                          {workout.exercises?.length || 0} exercises • {workout.duration} min
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {workout.exercises?.slice(0, 3).map((ex: any) => (
                            <Badge key={ex.id} variant="secondary" className="text-xs">
                              {ex.exercise?.name}
                            </Badge>
                          ))}
                          {(workout.exercises?.length || 0) > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(workout.exercises?.length || 0) - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-hf-orange/10 text-hf-orange border-hf-orange/20">
                          {workout.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Records */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-hf-text flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-hf-orange" />
                  Personal Records
                </CardTitle>
                <CardDescription className="text-hf-text-secondary">
                  Your latest achievements
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/personal-records">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {dashboardData?.personalRecords?.length === 0 ? (
                <EmptyState
                  title="No personal records yet"
                  description="Complete training sessions to start setting records"
                  action={
                    <Button asChild className="btn-gradient">
                      <Link href="/schedule">Book a Session</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {dashboardData?.personalRecords?.map((record: any) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 bg-hf-dark rounded-lg border border-hf-card"
                    >
                      <div>
                        <p className="font-medium text-hf-text">
                          {record.exercise?.name}
                        </p>
                        <p className="text-sm text-hf-text-secondary">
                          {formatRelativeTime(record.achievedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-hf-orange">
                          {formatPRDisplay({ weight: record.weight, reps: record.reps, duration: record.duration }, record.isBodyweight)}
                        </p>
                        <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">
                          {record.isBodyweight ? 'BW PR' : 'PR'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>


      </div>
    </ProtectedLayout>
  )
}
