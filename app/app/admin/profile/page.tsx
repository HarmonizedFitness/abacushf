
"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  User,
  Mail,
  Phone,
  Calendar,
  Edit,
  Save,
  X,
  Camera,
  Shield,
  Key,
  Activity,
  Settings,
  Lock,
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingState } from '@/components/common/status-message'
import { formatDate, getInitials } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface AdminProfile {
  id: string
  email: string
  name: string
  phone?: string
  image?: string
  role: string
  isActive: boolean
  createdAt: string
  _count?: {
    bookings: number
    workoutSessions: number
    personalRecords: number
  }
}

export default function AdminProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (session?.user?.email) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/admin/profile')
      const data = await response.json()
      
      if (data.success) {
        setProfile(data.data)
        setFormData({
          name: data.data.name || '',
          email: data.data.email || '',
          phone: data.data.phone || '',
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
      const response = await fetch('/api/admin/profile', {
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
      const response = await fetch('/api/admin/profile/password', {
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

  if (loading) {
    return (
      <ProtectedLayout requireRole="ADMIN">
        <LoadingState message="Loading your profile..." />
      </ProtectedLayout>
    )
  }

  if (!profile) {
    return (
      <ProtectedLayout requireRole="ADMIN">
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
    <ProtectedLayout requireRole="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-hf-text">Admin Profile</h1>
            <p className="text-hf-text-secondary">
              Manage your administrator account settings
            </p>
          </div>
          <Badge className="bg-hf-orange/10 text-hf-orange border-hf-orange/20">
            <Shield className="h-4 w-4 mr-2" />
            Administrator
          </Badge>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="security">Security Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-hf-card border-hf-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-hf-text flex items-center">
                    <User className="h-5 w-5 mr-2 text-hf-orange" />
                    Profile Information
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
                      <Badge className="bg-hf-orange/10 text-hf-orange border-hf-orange/20">
                        <Shield className="h-3 w-3 mr-1" />
                        {profile.role}
                      </Badge>
                      <Badge className="bg-hf-success/10 text-hf-success border-hf-success/20">
                        Active
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

                  <div className="space-y-2">
                    <Label className="text-hf-text">Member Since</Label>
                    <div className="flex items-center space-x-2 p-3 bg-hf-dark rounded-lg border border-hf-card">
                      <Calendar className="h-4 w-4 text-hf-text-secondary" />
                      <span className="text-hf-text">{formatDate(profile.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedLayout>
  )
}
