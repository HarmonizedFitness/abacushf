
"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { RoleGuard } from '@/components/layout/role-guard'
import { LoadingState } from '@/components/common/status-message'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/navigation/page-header'
import { AdvancedWorkoutForm } from '@/components/workouts/advanced-workout-form'
import { ExerciseSelectionDialog } from '@/components/workouts/exercise-selection-dialog'

interface Client {
  id: string
  name: string
  email: string
}

interface Exercise {
  id: string
  name: string
  category: string
  muscleGroups: string[]
  equipment?: string
}

export default function NewWorkoutPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([fetchClients(), fetchExercises()])
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients')
      const data = await response.json()
      if (data.success) {
        setClients(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
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

  const handleSubmit = async (formData: any) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Advanced Workout logged successfully! 🎉',
          description: `The workout has been saved with ${data.data.workout.groups?.length || 0} groups and personal records updated.`,
        })
        router.push('/admin/workouts')
      } else {
        throw new Error(data.error || 'Failed to log workout')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log workout. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <RoleGuard allowedRoles={['ADMIN']}>
          <LoadingState message="Loading advanced workout form..." />
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
            title="Advanced Workout Logging"
            description="Create workouts with supersets, circuits, and detailed set tracking"
            showBack={true}
            backHref="/admin/workouts"
            backLabel="Back to Workouts"
          />

          {/* Advanced Workout Form */}
          <AdvancedWorkoutForm
            onSubmit={handleSubmit}
            submitting={submitting}
            clients={clients}
            exercises={exercises}
          />
        </div>
      </RoleGuard>
    </ProtectedLayout>
  )
}
