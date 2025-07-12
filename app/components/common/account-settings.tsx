
"use client"

import { useEffect, useState } from 'react'
import { useSession, getSession } from 'next-auth/react'
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
  Lock,
  Key,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingState } from '@/components/common/status-message'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatDate, getInitials } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

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

interface AccountSettingsProps {
  showClientFeatures?: boolean
  clientId?: string
  isAdminViewing?: boolean
}

export function AccountSettings({ 
  showClientFeatures = true, 
  clientId, 
  isAdminViewing = false 
}: AccountSettingsProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPhotoDialog, setShowPhotoDialog] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    fitnessGoals: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (session?.user?.email || clientId) {
      fetchProfile()
    }
  }, [session, clientId])

  const fetchProfile = async () => {
    try {
      // Use different endpoint if admin is viewing a client
      const endpoint = clientId ? `/api/admin/clients/${clientId}` : '/api/profile'
      const response = await fetch(endpoint)
      const data = await response.json()
      
      if (data.success) {
        setProfile(data.data)
        setFormData({
          name: data.data.name || '',
          email: data.data.email || '',
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
      // Use different endpoint if admin is editing a client
      const endpoint = clientId ? `/api/admin/clients/${clientId}` : '/api/profile'
      const response = await fetch(endpoint, {
        method: clientId ? 'PATCH' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setProfile(data.data)
        setEditing(false)
        
        // ENHANCED: Refresh session to update header name display
        if (!clientId) {
          // Force session refresh with updated data
          const updatedSession = await getSession()
          // Update the session context by triggering a re-render
          if (updatedSession) {
            // Use router refresh to update all components with new session data
            window.location.reload()
          }
        }
        
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

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'New password must be at least 8 characters long',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      // Password changes are only for own profile, not when editing clients
      const endpoint = '/api/profile/password'
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setChangingPassword(false)
        toast({
          title: 'Success',
          description: 'Password updated successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update password',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to update password:', error)
      toast({
        title: 'Error',
        description: 'Failed to update password',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
      fitnessGoals: profile?.fitnessGoals || '',
    })
    setEditing(false)
  }

  const handleCancelPassword = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setChangingPassword(false)
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select a valid image file',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size must be less than 5MB',
        variant: 'destructive',
      })
      return
    }

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      
      // Use different endpoint if admin is uploading for a client
      const endpoint = clientId ? `/api/admin/clients/${clientId}/photo` : '/api/profile/photo'
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setProfile(prev => prev ? { ...prev, image: data.imageUrl } : null)
        setShowPhotoDialog(false)
        
        // Refresh session to update header photo
        if (!clientId) {
          await getSession()
        }
        
        toast({
          title: 'Success',
          description: 'Profile photo updated successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to upload photo',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to upload photo:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload photo',
        variant: 'destructive',
      })
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (loading) {
    return <LoadingState message="Loading profile..." />
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto text-hf-text-secondary mb-4" />
          <h2 className="text-xl font-semibold text-hf-text mb-2">Profile Not Found</h2>
          <p className="text-hf-text-secondary">
            Unable to load profile. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  const isAdmin = profile.role === 'ADMIN'
  const showTabs = !clientId // Only show tabs for own profile, not when admin is editing client

  const profileContent = (
    <Card className="bg-hf-card border-hf-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-hf-text flex items-center">
            <User className="h-5 w-5 mr-2 text-hf-orange" />
            {isAdminViewing ? `${profile.name}'s Profile` : 'Profile Information'}
          </CardTitle>
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
              <Badge className={
                isAdmin
                  ? 'bg-hf-orange/10 text-hf-orange border-hf-orange/20'
                  : 'bg-hf-success/10 text-hf-success border-hf-success/20'
              }>
                {profile.role}
              </Badge>
              {!isAdmin && profile.daysPerWeek && (
                <Badge className="bg-hf-orange/10 text-hf-orange border-hf-orange/20">
                  {profile.daysPerWeek} days/week
                </Badge>
              )}
            </div>
          </div>
          {editing && (
            <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Change Photo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Update Profile Photo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile?.image || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name}`} />
                      <AvatarFallback className="bg-gradient-orange text-white text-xl">
                        {profile?.name ? getInitials(profile.name) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="text-sm text-hf-text-secondary">
                        Upload a new profile photo. Max size: 5MB
                      </p>
                      <p className="text-xs text-hf-text-secondary mt-1">
                        Supported formats: JPG, PNG, GIF
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="photo-upload" className="sr-only">
                      Choose photo
                    </Label>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="cursor-pointer"
                    />
                  </div>
                  
                  {uploadingPhoto && (
                    <div className="flex items-center justify-center py-4">
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      <span className="text-sm text-hf-text-secondary">Uploading...</span>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowPhotoDialog(false)}
                      disabled={uploadingPhoto}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
            {editing ? (
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-hf-dark border-hf-card"
              />
            ) : (
              <div className="flex items-center space-x-2 p-3 bg-hf-dark rounded-lg border border-hf-card">
                <Mail className="h-4 w-4 text-hf-text-secondary" />
                <span className="text-hf-text">{profile.email}</span>
              </div>
            )}
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

          {/* Client-specific fields */}
          {showClientFeatures && !isAdmin && (
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
          )}

          <div className="space-y-2">
            <Label className="text-hf-text">Member Since</Label>
            <div className="flex items-center space-x-2 p-3 bg-hf-dark rounded-lg border border-hf-card">
              <Calendar className="h-4 w-4 text-hf-text-secondary" />
              <span className="text-hf-text">{formatDate(profile.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Fitness Goals - only for clients */}
        {showClientFeatures && !isAdmin && (
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
        )}
      </CardContent>
    </Card>
  )

  const securityContent = !clientId && ( // Only show security tab for own profile
    <Card className="bg-hf-card border-hf-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-hf-text flex items-center">
            <Lock className="h-5 w-5 mr-2 text-hf-orange" />
            Password Security
          </CardTitle>
          {!changingPassword ? (
            <Button onClick={() => setChangingPassword(true)} className="btn-gradient">
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                onClick={handlePasswordChange}
                disabled={saving}
                className="btn-gradient"
              >
                {saving ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
              <Button
                onClick={handleCancelPassword}
                variant="outline"
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!changingPassword ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-3 bg-hf-dark rounded-lg border border-hf-card">
              <Lock className="h-4 w-4 text-hf-text-secondary" />
              <span className="text-hf-text">Password is secure</span>
              <Badge variant="secondary" className="ml-auto">Protected</Badge>
            </div>
            <p className="text-sm text-hf-text-secondary">
              Your password is encrypted and secure. Click "Change Password" to update it.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-hf-text">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Enter current password"
                className="bg-hf-dark border-hf-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-hf-text">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password"
                className="bg-hf-dark border-hf-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-hf-text">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="bg-hf-dark border-hf-card"
              />
            </div>
            <div className="text-sm text-hf-text-secondary">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>At least 8 characters long</li>
                <li>Should be unique and not easily guessable</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (!showTabs) {
    return profileContent
  }

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="profile">Profile Information</TabsTrigger>
        <TabsTrigger value="security">Security Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        {profileContent}
      </TabsContent>

      <TabsContent value="security">
        {securityContent}
      </TabsContent>
    </Tabs>
  )
}
