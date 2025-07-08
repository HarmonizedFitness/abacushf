
"use client"

import { useEffect, useState } from 'react'
import {
  Search,
  Filter,
  Heart,
  Plus,
  Dumbbell,
  Target,
  Users,
  BookOpen,
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { Pagination } from '@/components/common/pagination'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

interface Exercise {
  id: string
  name: string
  description?: string
  category: string
  muscleGroups: string[]
  equipment?: string
  imageUrl?: string
  isFavorite: boolean
  _count: {
    favoritedBy: number
    workoutExercises: number
  }
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const { toast } = useToast()

  const categories = [
    'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio', 'Full Body'
  ]

  const muscleGroups = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
    'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Full Body'
  ]

  useEffect(() => {
    fetchExercises()
  }, [searchQuery, categoryFilter, muscleGroupFilter, showFavoritesOnly, currentPage])

  const fetchExercises = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (muscleGroupFilter !== 'all') params.append('muscleGroup', muscleGroupFilter)
      if (showFavoritesOnly) params.append('favorites', 'true')
      params.append('page', currentPage.toString())
      params.append('limit', '12')

      const response = await fetch(`/api/exercises?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setExercises(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (exerciseId: string, isFavorite: boolean) => {
    try {
      const method = isFavorite ? 'DELETE' : 'POST'
      const response = await fetch(`/api/exercises/${exerciseId}/favorite`, { method })

      if (response.ok) {
        setExercises(exercises.map(ex => 
          ex.id === exerciseId ? { ...ex, isFavorite: !isFavorite } : ex
        ))
        toast({
          title: isFavorite ? 'Removed from favorites' : 'Added to favorites',
          description: `Exercise ${isFavorite ? 'removed from' : 'added to'} your favorites.`,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update favorites. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <LoadingState message="Loading exercises..." />
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-hf-text">Exercise Library</h1>
            <p className="text-hf-text-secondary">
              Discover exercises to enhance your training routine
            </p>
          </div>
          <Button
            variant={showFavoritesOnly ? 'default' : 'outline'}
            onClick={() => {
              setShowFavoritesOnly(!showFavoritesOnly)
              setCurrentPage(1)
            }}
            className={showFavoritesOnly ? 'btn-gradient' : 'border-hf-card'}
          >
            <Heart className={`h-4 w-4 mr-2 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            {showFavoritesOnly ? 'Show All' : 'Favorites Only'}
          </Button>
        </div>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-hf-text-secondary" />
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>
          
          <Select 
            value={categoryFilter} 
            onValueChange={(value) => {
              setCategoryFilter(value)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={muscleGroupFilter} 
            onValueChange={(value) => {
              setMuscleGroupFilter(value)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Muscle Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Muscle Groups</SelectItem>
              {muscleGroups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('')
              setCategoryFilter('all')
              setMuscleGroupFilter('all')
              setShowFavoritesOnly(false)
              setCurrentPage(1)
            }}
            className="border-hf-card"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>

        {/* Exercise Grid */}
        {exercises.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="No exercises found"
            description={
              searchQuery || categoryFilter !== 'all' || muscleGroupFilter !== 'all' || showFavoritesOnly
                ? "No exercises match your current filters"
                : "The exercise library is being updated"
            }
            action={
              <Button
                onClick={() => {
                  setSearchQuery('')
                  setCategoryFilter('all')
                  setMuscleGroupFilter('all')
                  setShowFavoritesOnly(false)
                }}
                className="btn-gradient"
              >
                Clear Filters
              </Button>
            }
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exercises.map((exercise) => (
              <Card key={exercise.id} className="bg-hf-card border-hf-card card-hover">
                <CardHeader className="pb-4">
                  {exercise.imageUrl && (
                    <div className="relative aspect-video bg-hf-dark rounded-lg overflow-hidden mb-4">
                      <Image
                        src={exercise.imageUrl}
                        alt={exercise.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-hf-text text-lg">{exercise.name}</CardTitle>
                      <CardDescription className="text-hf-text-secondary mt-1">
                        {exercise.description || 'No description available'}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(exercise.id, exercise.isFavorite)}
                      className="ml-2 flex-shrink-0"
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          exercise.isFavorite
                            ? 'fill-hf-orange text-hf-orange'
                            : 'text-hf-text-secondary hover:text-hf-orange'
                        }`}
                      />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge className="bg-hf-orange/10 text-hf-orange border-hf-orange/20">
                      {exercise.category}
                    </Badge>
                    {exercise.equipment && (
                      <Badge variant="secondary" className="text-xs">
                        {exercise.equipment}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3">
                    <p className="text-xs text-hf-text-secondary mb-2">Target Muscles:</p>
                    <div className="flex flex-wrap gap-1">
                      {exercise.muscleGroups.map((muscle) => (
                        <Badge key={muscle} variant="outline" className="text-xs border-hf-card text-hf-text-secondary">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-hf-text-secondary mb-4">
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {exercise._count.favoritedBy} favorites
                    </div>
                    <div className="flex items-center">
                      <Target className="h-3 w-3 mr-1" />
                      {exercise._count.workoutExercises} uses
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      asChild
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-hf-card"
                    >
                      <a href={`/exercises/${exercise.id}`}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Details
                      </a>
                    </Button>
                    <Button 
                      asChild
                      size="sm" 
                      className="flex-1 btn-gradient"
                    >
                      <a href={`/workouts/new?exercise=${exercise.id}`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Use
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-hf-text-secondary">
                Total Exercises
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hf-text">
                {exercises.length}
              </div>
              <p className="text-xs text-hf-text-secondary">Available</p>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-hf-text-secondary">
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hf-text">
                {new Set(exercises.map(e => e.category)).size}
              </div>
              <p className="text-xs text-hf-text-secondary">Different types</p>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-hf-text-secondary">
                Your Favorites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hf-text">
                {exercises.filter(e => e.isFavorite).length}
              </div>
              <p className="text-xs text-hf-text-secondary">Saved exercises</p>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-hf-text-secondary">
                Muscle Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hf-text">
                {new Set(exercises.flatMap(e => e.muscleGroups)).size}
              </div>
              <p className="text-xs text-hf-text-secondary">Covered</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}
