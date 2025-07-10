
"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Calendar,
  Clock,
  Dumbbell,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, Column } from '@/components/common/data-table'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { ConfirmationDialog } from '@/components/common/confirmation-dialog'
import { formatDate, formatDuration, getTotalExerciseCount, getAllExercises } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/navigation/page-header'
import Link from 'next/link'

interface WorkoutSession {
  id: string
  date: string
  duration: number
  status: string
  notes?: string
  groups: Array<{
    id: string
    name?: string
    type: string
    order: number
    rounds?: number
    restBetweenRounds?: number
    exercises: Array<{
      id: string
      exerciseId: string
      order: number
      orderInGroup: number
      notes?: string
      exercise: {
        id: string
        name: string
        category: string
        muscleGroups: string[]
      }
      sets: Array<{
        id: string
        setNumber: number
        reps?: number
        weight?: number
        duration?: number
        restTime?: number
        notes?: string
        isDropSet: boolean
      }>
    }>
  }>
  exercises: Array<{
    id: string
    exerciseId: string
    order: number
    notes?: string
    exercise: {
      id: string
      name: string
      category: string
      muscleGroups: string[]
    }
    sets: Array<{
      id: string
      setNumber: number
      reps?: number
      weight?: number
      duration?: number
      restTime?: number
      notes?: string
      isDropSet: boolean
    }>
  }>
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; workoutId: string }>({
    open: false,
    workoutId: '',
  })
  const [deleting, setDeleting] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    fetchWorkouts()
  }, [searchQuery, statusFilter])

  const fetchWorkouts = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      
      const response = await fetch(`/api/workouts?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setWorkouts(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch workouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWorkout = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/workouts/${deleteDialog.workoutId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Workout deleted',
          description: 'The workout has been successfully deleted.',
        })
        fetchWorkouts()
      } else {
        throw new Error('Failed to delete workout')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete workout. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setDeleteDialog({ open: false, workoutId: '' })
    }
  }

  const columns: Column<WorkoutSession>[] = [
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      render: (value) => (
        <div>
          <p className="font-medium text-hf-text">{formatDate(value)}</p>
          <p className="text-xs text-hf-text-secondary">
            {new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
          </p>
        </div>
      ),
    },
    {
      key: 'exercises',
      title: 'Exercises',
      render: (_, workout) => {
        const totalExercises = getTotalExerciseCount(workout)
        const allExercises = getAllExercises(workout)
        
        return (
          <div className="space-y-1">
            <p className="text-sm text-hf-text">{totalExercises} exercises</p>
            <div className="flex flex-wrap gap-1">
              {allExercises?.slice(0, 2).map((ex: any) => (
                <Badge key={ex.id} variant="secondary" className="text-xs">
                  {ex.exercise?.name}
                </Badge>
              ))}
              {totalExercises > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{totalExercises - 2}
                </Badge>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'duration',
      title: 'Duration',
      sortable: true,
      render: (value) => (
        <div className="flex items-center text-hf-text">
          <Clock className="h-4 w-4 mr-1 text-hf-text-secondary" />
          {formatDuration(value)}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      filterable: true,
      render: (value) => {
        const statusColors = {
          COMPLETED: 'bg-hf-success/10 text-hf-success border-hf-success/20',
          IN_PROGRESS: 'bg-hf-orange/10 text-hf-orange border-hf-orange/20',
          PLANNED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          SKIPPED: 'bg-hf-error/10 text-hf-error border-hf-error/20',
        }
        
        return (
          <Badge className={statusColors[value as keyof typeof statusColors] || 'bg-gray-500/10 text-gray-400'}>
            {value}
          </Badge>
        )
      },
    },
  ]

  const filteredWorkouts = workouts.filter((workout) => {
    const allExercises = getAllExercises(workout)
    const matchesSearch = allExercises?.some((ex) =>
      ex.exercise?.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || workout.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || workout.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <ProtectedLayout>
        <LoadingState message="Loading your workouts..." />
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title={isAdmin ? 'Client Workouts' : 'Workout History'}
          description={isAdmin ? 'Track and manage client training sessions' : 'View your completed training sessions'}
          showHome={true}
          showBack={false}
        >
          {isAdmin && (
            <Button asChild className="btn-gradient">
              <Link href="/workouts/new">
                <Plus className="h-4 w-4 mr-2" />
                Log Workout
              </Link>
            </Button>
          )}
        </PageHeader>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-hf-text-secondary" />
            <Input
              placeholder="Search workouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="PLANNED">Planned</SelectItem>
              <SelectItem value="SKIPPED">Skipped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Workouts List */}
        {filteredWorkouts.length === 0 && !loading ? (
          <EmptyState
            icon={Dumbbell}
            title="No workouts found"
            description={
              searchQuery || statusFilter !== 'all'
                ? "No workouts match your current filters"
                : isAdmin
                  ? "Start logging workouts for your clients"
                  : "Your trainer will log workouts during your training sessions"
            }
            action={
              isAdmin ? (
                <Button asChild className="btn-gradient">
                  <Link href="/workouts/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Log Your First Workout
                  </Link>
                </Button>
              ) : (
                <Button asChild className="btn-gradient">
                  <Link href="/schedule">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book a Session
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          <DataTable
            data={filteredWorkouts}
            columns={columns}
            searchable={false}
            filterable={false}
            actions={(workout) => (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Link href={`/workouts/${workout.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </Button>
                {isAdmin && (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Link href={`/workouts/${workout.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-hf-error hover:text-hf-error"
                    onClick={() => setDeleteDialog({ open: true, workoutId: workout.id })}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </>
            )}
          />
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-hf-text-secondary">
                Total Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hf-text">{workouts.length}</div>
              <p className="text-xs text-hf-text-secondary">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-hf-text-secondary">
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hf-text">
                {workouts.filter(w => {
                  const workoutDate = new Date(w.date)
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return workoutDate >= weekAgo
                }).length}
              </div>
              <p className="text-xs text-hf-text-secondary">Workouts completed</p>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-hf-text-secondary">
                Average Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hf-text">
                {workouts.length > 0
                  ? Math.round(workouts.reduce((acc, w) => acc + w.duration, 0) / workouts.length)
                  : 0}
                <span className="text-sm text-hf-text-secondary ml-1">min</span>
              </div>
              <p className="text-xs text-hf-text-secondary">Per session</p>
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open, workoutId: '' })}
          title="Delete Workout"
          description="Are you sure you want to delete this workout? This action cannot be undone."
          confirmText="Delete"
          variant="destructive"
          onConfirm={handleDeleteWorkout}
          loading={deleting}
        />
      </div>
    </ProtectedLayout>
  )
}
