

"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { RoleGuard } from '@/components/layout/role-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/navigation/page-header'
import Link from 'next/link'

interface WorkoutSession {
  id: string
  date: string
  duration: number
  notes?: string
  status: string
  user: {
    id: string
    name: string
    email: string
  }
}

export default function AdminWorkoutEditPage() {
  const params = useParams()
  const router = useRouter()
  const workoutId = params.id as string
  
  const [workout, setWorkout] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    duration: '',
    notes: '',
    status: 'PLANNED'
  })
  
  const { toast } = useToast()

  useEffect(() => {
    if (workoutId) {
      fetchWorkout()
    }
  }, [workoutId])

  const fetchWorkout = async () => {
    try {
      const response = await fetch(`/api/workouts/${workoutId}`)
      const data = await response.json()

      if (data.success) {
        setWorkout(data.data)
        setFormData({
          date: data.data.date.split('T')[0],
          duration: data.data.duration.toString(),
          notes: data.data.notes || '',
          status: data.data.status
        })
      } else {
        throw new Error(data.error || 'Workout not found')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load workout details.',
        variant: 'destructive',
      })
      router.push('/admin/workouts')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formData.date,
          duration: parseInt(formData.duration),
          notes: formData.notes,
          status: formData.status
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Workout updated',
          description: 'The workout has been successfully updated.',
        })
        router.push(`/admin/workouts/${workoutId}`)
      } else {
        throw new Error(data.error || 'Failed to update workout')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update workout. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/admin/workouts/${workoutId}`)
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <RoleGuard allowedRoles={['ADMIN']}>
          <LoadingState message="Loading workout details..." />
        </RoleGuard>
      </ProtectedLayout>
    )
  }

  if (!workout) {
    return (
      <ProtectedLayout>
        <RoleGuard allowedRoles={['ADMIN']}>
          <EmptyState
            title="Workout not found"
            description="The workout you're looking for doesn't exist."
            action={
              <Button asChild className="btn-gradient">
                <Link href="/admin/workouts">Back to Workouts</Link>
              </Button>
            }
          />
        </RoleGuard>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <RoleGuard allowedRoles={['ADMIN']}>
        <div className="space-y-6">
          {/* Header */}
          <PageHeader
            title="Edit Workout"
            description={`Editing workout for ${workout.user.name}`}
            showHome={true}
            showBack={true}
            backHref={`/admin/workouts/${workoutId}`}
          >
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="btn-gradient"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                onClick={handleCancel}
                variant="outline"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </PageHeader>

          {/* Edit Form */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text">Workout Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="300"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="SKIPPED">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any notes about this workout..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Client Info (Read-only) */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text">Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <Label className="text-hf-text-secondary">Client Name</Label>
                  <p className="text-hf-text font-medium">{workout.user.name}</p>
                </div>
                <div>
                  <Label className="text-hf-text-secondary">Email</Label>
                  <p className="text-hf-text">{workout.user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    </ProtectedLayout>
  )
}

