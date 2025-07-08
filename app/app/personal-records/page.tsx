
"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Trophy,
  Medal,
  Target,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Plus,
  Award
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, Column } from '@/components/common/data-table'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/navigation/page-header'
import Link from 'next/link'

interface PersonalRecord {
  id: string
  exerciseId: string
  weight?: number
  reps?: number
  duration?: number
  volume?: number
  notes?: string
  achievedAt: string
  exercise: {
    id: string
    name: string
    category: string
    muscleGroups: string[]
    imageUrl?: string
  }
}

interface Exercise {
  id: string
  name: string
  category: string
  muscleGroups: string[]
}

export default function PersonalRecordsPage() {
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // New PR form
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [weight, setWeight] = useState<number | ''>('')
  const [reps, setReps] = useState<number | ''>('')
  const [duration, setDuration] = useState<number | ''>('')
  const [notes, setNotes] = useState('')

  const { toast } = useToast()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    Promise.all([fetchPersonalRecords(), fetchExercises()])
  }, [categoryFilter])

  const fetchPersonalRecords = async () => {
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      
      const response = await fetch(`/api/personal-records?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setPersonalRecords(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch personal records:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/exercises?limit=100')
      const data = await response.json()
      if (data.success) {
        setExercises(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error)
    }
  }

  const handleSubmitPR = async () => {
    if (!selectedExerciseId) {
      toast({
        title: 'Error',
        description: 'Please select an exercise.',
        variant: 'destructive',
      })
      return
    }

    if (!weight && !duration) {
      toast({
        title: 'Error',
        description: 'Please enter either weight or duration.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/personal-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId: selectedExerciseId,
          weight: weight || null,
          reps: reps || null,
          duration: duration || null,
          notes: notes || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Personal Record Updated! 🎉',
          description: 'Your new PR has been successfully recorded.',
        })
        
        // Reset form
        setSelectedExerciseId('')
        setWeight('')
        setReps('')
        setDuration('')
        setNotes('')
        setDialogOpen(false)
        
        // Refresh data
        fetchPersonalRecords()
      } else {
        throw new Error(data.error || 'Failed to update personal record')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update personal record. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const columns: Column<PersonalRecord>[] = [
    {
      key: 'exercise',
      title: 'Exercise',
      render: (exercise) => (
        <div>
          <p className="font-medium text-hf-text">{exercise?.name}</p>
          <p className="text-xs text-hf-text-secondary">{exercise?.category}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {exercise?.muscleGroups?.slice(0, 2).map((muscle: string) => (
              <Badge key={muscle} variant="secondary" className="text-xs">
                {muscle}
              </Badge>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'weight',
      title: 'Weight',
      sortable: true,
      render: (weight, record) => (
        <div className="text-center">
          {weight ? (
            <div>
              <span className="text-lg font-bold text-hf-orange">{weight} lbs</span>
              {record.reps && (
                <p className="text-xs text-hf-text-secondary">× {record.reps} reps</p>
              )}
            </div>
          ) : (
            <span className="text-hf-text-secondary">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'volume',
      title: 'Volume',
      sortable: true,
      render: (volume) => (
        <div className="text-center">
          {volume ? (
            <span className="font-medium text-hf-text">{Number(volume).toLocaleString()} lbs</span>
          ) : (
            <span className="text-hf-text-secondary">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'duration',
      title: 'Duration',
      render: (duration) => (
        <div className="text-center">
          {duration ? (
            <span className="font-medium text-hf-text">{duration}s</span>
          ) : (
            <span className="text-hf-text-secondary">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'achievedAt',
      title: 'Achieved',
      sortable: true,
      render: (value) => (
        <div>
          <p className="text-sm text-hf-text">{formatDate(value)}</p>
          <p className="text-xs text-hf-text-secondary">{formatRelativeTime(value)}</p>
        </div>
      ),
    },
  ]

  const filteredRecords = personalRecords.filter((record) => {
    const matchesSearch = record.exercise?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getStatsData = () => {
    const totalPRs = personalRecords.length
    const thisMonth = personalRecords.filter(pr => {
      const prDate = new Date(pr.achievedAt)
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return prDate >= monthAgo
    }).length
    
    const categories = [...new Set(personalRecords.map(pr => pr.exercise?.category))].length
    
    const totalVolume = personalRecords.reduce((sum, pr) => {
      return sum + (Number(pr.volume) || 0)
    }, 0)

    return { totalPRs, thisMonth, categories, totalVolume }
  }

  const stats = getStatsData()

  if (loading) {
    return (
      <ProtectedLayout>
        <LoadingState message="Loading your personal records..." />
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Personal Records"
          description={isAdmin ? 'Track client achievements and milestones' : 'View your achievements and milestones'}
          showHome={true}
          showBack={false}
        >
          {isAdmin && (
            <Button 
              onClick={() => setDialogOpen(true)}
              className="btn-gradient"
            >
              <Plus className="h-4 w-4 mr-2" />
              Record New PR
            </Button>
          )}
        </PageHeader>

        {/* Dialog component */}
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="bg-hf-card border-hf-card">
              <DialogHeader>
                <DialogTitle className="text-hf-text">Record Personal Record</DialogTitle>
                <DialogDescription className="text-hf-text-secondary">
                  Log a new personal record for any exercise
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-hf-text">Exercise</Label>
                  <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an exercise..." />
                    </SelectTrigger>
                    <SelectContent>
                      {exercises.map((exercise) => (
                        <SelectItem key={exercise.id} value={exercise.id}>
                          {exercise.name} - {exercise.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-hf-text">Weight (lbs)</Label>
                    <Input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                      placeholder="0"
                      min={0}
                      step={0.5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-hf-text">Reps</Label>
                    <Input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(e.target.value ? Number(e.target.value) : '')}
                      placeholder="0"
                      min={1}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-hf-text">Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : '')}
                    placeholder="For time-based exercises"
                    min={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-hf-text">Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How did it feel? Any observations..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleSubmitPR} 
                  disabled={submitting}
                  className="w-full btn-gradient"
                >
                  {submitting ? 'Recording...' : 'Record PR'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-hf-text-secondary flex items-center">
                <Trophy className="h-4 w-4 mr-2" />
                Total PRs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hf-text">{stats.totalPRs}</div>
              <p className="text-xs text-hf-text-secondary">Personal records set</p>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-hf-text-secondary flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hf-text">{stats.thisMonth}</div>
              <p className="text-xs text-hf-text-secondary">New records</p>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-hf-text-secondary flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hf-text">{stats.categories}</div>
              <p className="text-xs text-hf-text-secondary">Exercise types</p>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-hf-text-secondary flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Total Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hf-text">
                {Math.round(stats.totalVolume / 1000)}k
                <span className="text-sm text-hf-text-secondary ml-1">lbs</span>
              </div>
              <p className="text-xs text-hf-text-secondary">Lifetime volume</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-hf-text-secondary" />
            <Input
              placeholder="Search exercises or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Chest">Chest</SelectItem>
              <SelectItem value="Back">Back</SelectItem>
              <SelectItem value="Legs">Legs</SelectItem>
              <SelectItem value="Shoulders">Shoulders</SelectItem>
              <SelectItem value="Arms">Arms</SelectItem>
              <SelectItem value="Core">Core</SelectItem>
              <SelectItem value="Cardio">Cardio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Personal Records Table */}
        {filteredRecords.length === 0 && !loading ? (
          <EmptyState
            icon={Trophy}
            title="No personal records found"
            description={
              searchQuery || categoryFilter !== 'all'
                ? "No records match your current filters"
                : isAdmin
                  ? "Start logging workouts for clients to set personal records"
                  : "Complete training sessions to set your first personal records"
            }
            action={
              isAdmin ? (
                <div className="flex gap-2">
                  <Button asChild className="btn-gradient">
                    <Link href="/workouts/new">
                      <Target className="h-4 w-4 mr-2" />
                      Log a Workout
                    </Link>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-hf-card">
                        <Plus className="h-4 w-4 mr-2" />
                        Record PR Manually
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-hf-card border-hf-card">
                      <DialogHeader>
                        <DialogTitle className="text-hf-text">Record Personal Record</DialogTitle>
                      </DialogHeader>
                      {/* Same form content as above */}
                    </DialogContent>
                  </Dialog>
                </div>
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
            data={filteredRecords}
            columns={columns}
            searchable={false}
            filterable={false}
          />
        )}

        {/* Achievement Highlights */}
        {personalRecords.length > 0 && (
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <Award className="h-5 w-5 mr-2 text-hf-orange" />
                Recent Achievements
              </CardTitle>
              <CardDescription className="text-hf-text-secondary">
                Your latest personal records and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {personalRecords
                  .sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())
                  .slice(0, 6)
                  .map((record) => (
                    <div key={record.id} className="p-4 bg-hf-dark rounded-lg border border-hf-card">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-hf-text">{record.exercise?.name}</h4>
                        <Medal className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="space-y-1">
                        {record.weight && (
                          <p className="text-lg font-bold text-hf-orange">
                            {record.weight} lbs
                            {record.reps && ` × ${record.reps}`}
                          </p>
                        )}
                        {record.duration && (
                          <p className="text-lg font-bold text-hf-orange">
                            {record.duration}s
                          </p>
                        )}
                        <p className="text-xs text-hf-text-secondary">
                          {formatRelativeTime(record.achievedAt)}
                        </p>
                        {record.notes && (
                          <p className="text-xs text-hf-text-secondary line-clamp-2">
                            {record.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedLayout>
  )
}
