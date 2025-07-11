
'use client'

import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Edit, 
  CreditCard, 
  Activity, 
  Target,
  Calendar,
  Shield,
  TrendingUp,
  Plus,
  Trophy,
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { StatCard } from '@/components/common/stat-card'
import { AccountSettings } from '@/components/common/account-settings'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { useEffect, useState } from 'react'
import { formatDate, formatTime, formatRelativeTime, formatPRDisplay, formatPRDisplayWithHighlight } from '@/lib/utils'

interface DashboardData {
  remainingCredits: number
  upcomingBookings: any[]
  recentWorkouts: any[]
  personalRecords: any[]
  totalWorkouts: number
  totalPRs: number
  thisWeekExercises: number
  profile: any
}

export default function AdminClientDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchDashboardData()
    }
  }, [params.id])

  const fetchDashboardData = async () => {
    try {
      // Get start of current week (Monday)
      const now = new Date()
      const startOfWeek = new Date(now)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
      startOfWeek.setDate(diff)
      startOfWeek.setHours(0, 0, 0, 0)

      // Fetch using the same endpoints as clients but with admin permissions
      const [clientRes, bookingsRes, workoutsRes, recordsRes, weekWorkoutsRes] = await Promise.all([
        fetch(`/api/admin/clients/${params.id}`),
        fetch(`/api/admin/clients/${params.id}/bookings?limit=3&status=CONFIRMED`),
        fetch(`/api/admin/clients/${params.id}/workouts?limit=3`),
        fetch(`/api/admin/clients/${params.id}/records?limit=5&calculate=true`),
        fetch(`/api/admin/clients/${params.id}/workouts?from=${startOfWeek.toISOString()}&detailed=true`),
      ])

      const [clientData, bookingsData, workoutsData, recordsData, weekWorkoutsData] = await Promise.all([
        clientRes.json(),
        bookingsRes.json(),
        workoutsRes.json(),
        recordsRes.json(),
        weekWorkoutsRes.json(),
      ])

      if (clientData.success) {
        // Calculate this week's exercises
        let thisWeekExercises = 0
        if (weekWorkoutsData.success && weekWorkoutsData.data) {
          thisWeekExercises = weekWorkoutsData.data.reduce((total: number, workout: any) => {
            // FIXED: Count both individual exercises and exercises within groups
            const individualExercises = workout.exercises?.length || 0
            const groupExercises = workout.groups?.reduce((groupTotal: number, group: any) => {
              return groupTotal + (group.exercises?.length || 0)
            }, 0) || 0
            return total + individualExercises + groupExercises
          }, 0)
        }

        setDashboardData({
          profile: clientData.data,
          remainingCredits: clientData.data?.remainingCredits || 0,
          upcomingBookings: bookingsData.data || [],
          recentWorkouts: workoutsData.data || [],
          personalRecords: recordsData.data || [],
          totalWorkouts: workoutsData.pagination?.total || 0,
          totalPRs: recordsData.pagination?.total || 0,
          thisWeekExercises,
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch client details',
          variant: 'destructive',
        })
        router.push('/admin/clients')
      }
    } catch (error) {
      console.error('Failed to fetch client data:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch client details',
        variant: 'destructive',
      })
      router.push('/admin/clients')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedLayout requireRole="ADMIN">
        <LoadingState message="Loading client dashboard..." />
      </ProtectedLayout>
    )
  }

  if (!dashboardData?.profile) {
    return (
      <ProtectedLayout requireRole="ADMIN">
        <EmptyState
          title="Client not found"
          description="The client you're looking for doesn't exist."
          action={
            <Button asChild>
              <Link href="/admin/clients">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Link>
            </Button>
          }
        />
      </ProtectedLayout>
    )
  }

  const { profile } = dashboardData

  return (
    <ProtectedLayout requireRole="ADMIN">
      <div className="space-y-8">
        {/* Header - Admin viewing client */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild size="sm">
                <Link href="/admin/clients">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Clients
                </Link>
              </Button>
              <Shield className="h-5 w-5 text-hf-orange" />
              <span className="text-sm text-hf-text-secondary">Admin View</span>
            </div>
            <h1 className="text-3xl font-bold text-hf-text">
              {profile.name}'s Dashboard 👋
            </h1>
            <p className="text-hf-text-secondary">
              Viewing {profile.name}'s fitness journey and progress
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild variant="outline">
              <Link href={`/admin/clients/${profile.id}/credits`}>
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Credits
              </Link>
            </Button>
            <Button asChild className="btn-gradient">
              <Link href={`/admin/workouts/new?clientId=${profile.id}`}>
                <Plus className="h-4 w-4 mr-2" />
                Log Workout
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid - Same as client dashboard but with admin context */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Remaining Credits"
            value={dashboardData.remainingCredits || 0}
            description="Available for booking sessions"
            icon={CreditCard}
          />
          <StatCard
            title="Total Workouts"
            value={dashboardData.totalWorkouts || 0}
            description="Completed training sessions"
            icon={Target}
          />
          <StatCard
            title="Personal Records"
            value={dashboardData.totalPRs || 0}
            description="Achievements unlocked"
            icon={Trophy}
          />
          <StatCard
            title="This Week"
            value={dashboardData.thisWeekExercises || 0}
            description="Exercises completed"
            icon={TrendingUp}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Admin Actions - Similar to client quick actions but with admin capabilities */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <Shield className="h-5 w-5 mr-2 text-hf-orange" />
                Admin Actions for {profile.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full btn-gradient justify-start">
                <Link href={`/admin/workouts/new?clientId=${profile.id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log New Workout
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start border-hf-card">
                <Link href={`/admin/clients/${profile.id}/workouts`}>
                  <Target className="h-4 w-4 mr-2" />
                  View Full Workout History
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start border-hf-card">
                <Link href={`/admin/clients/${profile.id}/records`}>
                  <Trophy className="h-4 w-4 mr-2" />
                  Manage Personal Records
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start border-hf-card">
                <Link href={`/admin/clients/${profile.id}/progress`}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Progress Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start border-hf-card">
                <Link href={`/admin/clients/${profile.id}/credits`}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Credits
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Sessions - Same as client view */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-hf-text flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-hf-orange" />
                  Upcoming Sessions
                </CardTitle>
                <p className="text-hf-text-secondary text-sm">
                  {profile.name}'s scheduled training sessions
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/admin/bookings?clientId=${profile.id}`}>
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {dashboardData.upcomingBookings?.length === 0 ? (
                <EmptyState
                  title="No upcoming sessions"
                  description="This client has no scheduled sessions"
                />
              ) : (
                <div className="space-y-4">
                  {dashboardData.upcomingBookings?.slice(0, 3).map((booking: any) => (
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
          {/* Recent Workouts - Same layout as client view */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-hf-text flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-hf-orange" />
                  Recent Workouts
                </CardTitle>
                <p className="text-hf-text-secondary text-sm">
                  {profile.name}'s latest training sessions
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/admin/clients/${profile.id}/workouts`}>
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {dashboardData.recentWorkouts?.length === 0 ? (
                <EmptyState
                  title="No workouts logged"
                  description="No workouts have been logged for this client yet"
                  action={
                    <Button asChild className="btn-gradient">
                      <Link href={`/admin/workouts/new?clientId=${profile.id}`}>
                        Log First Workout
                      </Link>
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {dashboardData.recentWorkouts?.map((workout: any) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between p-4 bg-hf-dark rounded-lg border border-hf-card hover:bg-hf-card/50 transition-colors cursor-pointer"
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
                        <Edit className="h-4 w-4 text-hf-text-secondary mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Records - Same layout as client view */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-hf-text flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-hf-orange" />
                  Personal Records
                </CardTitle>
                <p className="text-hf-text-secondary text-sm">
                  {profile.name}'s latest achievements
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/admin/clients/${profile.id}/records`}>
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {dashboardData.personalRecords?.length === 0 ? (
                <EmptyState
                  title="No personal records yet"
                  description="Complete training sessions to start setting records"
                  action={
                    <Button asChild className="btn-gradient">
                      <Link href={`/admin/workouts/new?clientId=${profile.id}`}>
                        Log a Workout
                      </Link>
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {dashboardData.personalRecords?.map((record: any) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 bg-hf-dark rounded-lg border border-hf-card hover:bg-hf-card/50 transition-colors cursor-pointer"
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
                        {(() => {
                          const prDisplay = formatPRDisplayWithHighlight(
                            { weight: record.weight, reps: record.reps, duration: record.duration }, 
                            record.isBodyweight, 
                            'weight'
                          )
                          return (
                            <p className={`font-bold ${prDisplay.isWeightPR ? 'text-hf-orange font-extrabold' : 'text-hf-orange'}`}>
                              {prDisplay.text}
                            </p>
                          )
                        })()}
                        <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">
                          {record.isBodyweight ? 'BW PR' : 'Weight PR'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Client Profile Settings - Using unified component with admin context */}
        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <CardTitle className="text-hf-text flex items-center">
              <Shield className="h-5 w-5 mr-2 text-hf-orange" />
              Client Profile Settings
            </CardTitle>
            <p className="text-hf-text-secondary">
              Edit {profile.name}'s account information and preferences
            </p>
          </CardHeader>
          <CardContent>
            <AccountSettings
              clientId={profile.id}
              isAdminViewing={true}
              showClientFeatures={true}
            />
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  )
}
