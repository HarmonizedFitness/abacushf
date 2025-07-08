
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dumbbell, Target, Users, Plus } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { PageHeader } from '@/components/navigation/page-header'
import Link from 'next/link'

async function ExercisesContent() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  // Mock data for now - in a real app, this would come from the database
  const exercises = [
    {
      id: 1,
      name: 'Bench Press',
      category: 'CHEST',
      muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
      equipment: 'Barbell',
      instructions: 'Lie on bench, grip barbell, lower to chest, press up'
    },
    {
      id: 2,
      name: 'Deadlift',
      category: 'BACK',
      muscleGroups: ['Back', 'Glutes', 'Hamstrings'],
      equipment: 'Barbell',
      instructions: 'Stand with feet hip-width, grip bar, lift with legs and back'
    },
    {
      id: 3,
      name: 'Squats',
      category: 'LEGS',
      muscleGroups: ['Quadriceps', 'Glutes', 'Calves'],
      equipment: 'Bodyweight',
      instructions: 'Stand with feet shoulder-width, lower hips, return to standing'
    }
  ]

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      CHEST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      BACK: 'bg-green-500/20 text-green-400 border-green-500/30',
      LEGS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      SHOULDERS: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      ARMS: 'bg-red-500/20 text-red-400 border-red-500/30',
      CORE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    }
    return <Badge className={colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>{category}</Badge>
  }



  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <PageHeader 
        title="Exercise Management"
        description="Manage exercise library and workout components"
        showBack={true}
        backHref="/admin/dashboard"
      >
        <Link href="/admin/exercises/new">
          <Button className="btn-gradient">
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6">
        {exercises?.map((exercise) => (
          <Card key={exercise.id} className="bg-hf-card border-hf-card">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-orange rounded-lg flex items-center justify-center">
                    <Dumbbell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-hf-text text-lg">{exercise.name}</CardTitle>
                    <p className="text-hf-text-secondary text-sm">{exercise.equipment}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {getCategoryBadge(exercise.category)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-hf-orange" />
                  <span className="text-hf-text-secondary">
                    {exercise.muscleGroups.join(', ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-hf-orange" />
                  <span className="text-hf-text-secondary">Used by clients</span>
                </div>
              </div>
              
              <p className="text-hf-text-secondary text-sm mb-4">{exercise.instructions}</p>
              
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white">
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white">
                  View Details
                </Button>
                <Button size="sm" variant="outline" className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function AdminExercisesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ExercisesContent />
    </Suspense>
  )
}
