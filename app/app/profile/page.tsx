
"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  User,
  Mail,
  Phone,
  Calendar,
  Target,
  Edit,
  Save,
  X,
  Camera,
  Cake,
  Activity,
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/common/status-message'
import { formatDate, getInitials } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface UserProfile {
  id: string
  email: string
  name: string
  phone?: string
  dateOfBirth?: string
  fitnessGoals?: string
  image?: string
  role: string
  isActive: boolean
  createdAt: string
  daysPerWeek?: number
  remainingCredits?: number
  _count?: {
    bookings: number
    workoutSessions: number
    personalRecords: number
  }
}

export default function ClientProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dateOfBirth: '',
    fitnessGoals: '',
  })

  useEffect(() => {
    if (session?.user?.email) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      const data = await response.json()
      
      if (data.success) {
        setProfile(data.data)
        setFormData({
          name: data.data.name || '',
          phone: data.data.phone || '',
          dateOfBirth: data.data.dateOfBirth ? data.data.dateOfBirth.split('T')[0] : '',
          fitnessGoals: data.data.fitnessGoals || '',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch profile data',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch profile data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setProfile(data.data)
        setEditing(false)
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update profile',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || '',
      dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
      fitnessGoals: profile?.fitnessGoals || '',
    })
    setEditing(false)
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <LoadingState message="Loading your profile..." />
      </ProtectedLayout>
    )
  }

  if (!profile) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <User className="h-16 w-16 mx-auto text-hf-text-secondary mb-4" />
            <h2 className="text-xl font-semibold text-hf-text mb-2">Profile Not Found</h2>
            <p className="text-hf-text-secondary">
              Unable to load your profile. Please try again later.
            </p>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-hf-text">My Profile</h1>
            <p className="text-hf-text-secondary">
              Manage your account settings and preferences
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {!editing ? (
              <Button onClick={() => setEditing(true)} className="btn-gradient">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-gradient"
                >
                  {saving ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <Card className="lg:col-span-2 bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <User className="h-5 w-5 mr-2 text-hf-orange" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.image || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`} />
                  <AvatarFallback className="bg-gradient-orange text-white text-xl">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-hf-text">{profile.name}</h3>
                  <p className="text-hf-text-secondary">{profile.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className="bg-hf-success/10 text-hf-success border-hf-success/20">
                      {profile.role}
                    </Badge>
                    <Badge className="bg-hf-orange/10 text-hf-orange border-hf-orange/20">
                      {profile.daysPerWeek || 2} days/week
                    </Badge>
                  </div>
                </div>
                {editing && (
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-hf-text">Full Name</Label>
                  {editing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-hf-dark border-hf-card"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-hf-dark rounded-lg border border-hf-card">
                      <User className="h-4 w-4 text-hf-text-secondary" />
                      <span className="text-hf-text">{profile.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-hf-text">Email Address</Label>
                  <div className="flex items-center space-x-2 p-3 bg-hf-dark rounded-lg border border-hf-card">
                    <Mail className="h-4 w-4 text-hf-text-secondary" />
                    <span className="text-hf-text">{profile.email}</span>
                    <Badge variant="secondary" className="ml-auto">Read Only</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-hf-text">Phone Number</Label>
                  {editing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="bg-hf-dark border-hf-card"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-hf-dark rounded-lg border border-hf-card">
                      <Phone className="h-4 w-4 text-hf-text-secondary" />
                      <span className="text-hf-text">{profile.phone || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-hf-text">Date of Birth</Label>
                  {editing ? (
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="bg-hf-dark border-hf-card"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-hf-dark rounded-lg border border-hf-card">
                      <Cake className="h-4 w-4 text-hf-text-secondary" />
                      <span className="text-hf-text">
                        {profile.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Not provided'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fitnessGoals" className="text-hf-text">Fitness Goals</Label>
                {editing ? (
                  <Textarea
                    id="fitnessGoals"
                    value={formData.fitnessGoals}
                    onChange={(e) => setFormData({ ...formData, fitnessGoals: e.target.value })}
                    placeholder="Describe your fitness goals..."
                    className="bg-hf-dark border-hf-card"
                    rows={3}
                  />
                ) : (
                  <div className="flex items-start space-x-2 p-3 bg-hf-dark rounded-lg border border-hf-card">
                    <Target className="h-4 w-4 text-hf-text-secondary mt-0.5" />
                    <span className="text-hf-text">
                      {profile.fitnessGoals || 'No goals set yet'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 text-sm text-hf-text-secondary">
                <Calendar className="h-4 w-4" />
                <span>Member since {formatDate(profile.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card className="bg-hf-card border-hf-card">
              <CardHeader>
                <CardTitle className="text-hf-text">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-hf-orange">
                    {profile.remainingCredits || 0}
                  </div>
                  <p className="text-sm text-hf-text-secondary">Remaining Credits</p>
                </div>
                
                {profile._count && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-hf-text-secondary">Sessions:</span>
                      <span className="text-hf-text font-medium">{profile._count.bookings}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-hf-text-secondary">Workouts:</span>
                      <span className="text-hf-text font-medium">{profile._count.workoutSessions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-hf-text-secondary">Personal Records:</span>
                      <span className="text-hf-text font-medium">{profile._count.personalRecords}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-hf-card border-hf-card">
              <CardHeader>
                <CardTitle className="text-hf-text">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/schedule">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Session
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/workouts">
                    <Activity className="h-4 w-4 mr-2" />
                    View Workouts
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/personal-records">
                    <Target className="h-4 w-4 mr-2" />
                    Personal Records
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
