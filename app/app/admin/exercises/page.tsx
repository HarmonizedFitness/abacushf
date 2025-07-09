
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { PageHeader } from '@/components/navigation/page-header'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { ExerciseLibraryClient } from './exercise-library-client'

async function ExercisesContent() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  // Fetch exercises from the database
  let exercises: any[] = []
  try {
    exercises = await prisma.exercise.findMany({
      where: {
        isActive: true,
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            favoritedBy: true,
            workoutExercises: true,
          },
        },
      },
    })
  } catch (error) {
    console.error('Failed to fetch exercises:', error)
    exercises = []
  }


  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <PageHeader 
        title="Exercise Library"
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

      <ExerciseLibraryClient exercises={exercises} />
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
