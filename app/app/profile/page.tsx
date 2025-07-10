
"use client"

import { useSession } from 'next-auth/react'
import { Activity, Calendar, Target, CreditCard, Shield } from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AccountSettings } from '@/components/common/account-settings'
import Link from 'next/link'

export default function ProfilePage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-hf-text flex items-center">
              {isAdmin && <Shield className="h-8 w-8 mr-3 text-hf-orange" />}
              {isAdmin ? 'Admin Settings' : 'My Profile'}
            </h1>
            <p className="text-hf-text-secondary">
              {isAdmin 
                ? 'Manage your administrator account settings'
                : 'Manage your account settings and preferences'
              }
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Account Settings - spans most of the width */}
          <div className="lg:col-span-3">
            <AccountSettings 
              showClientFeatures={!isAdmin} 
            />
          </div>

          {/* Side Panel - Quick Actions for clients only */}
          {!isAdmin && (
            <div className="space-y-4">
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
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/credits">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Purchase Credits
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Admin Quick Links */}
          {isAdmin && (
            <div className="space-y-4">
              <Card className="bg-hf-card border-hf-card">
                <CardHeader>
                  <CardTitle className="text-hf-text">Admin Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/admin/clients">
                      <Activity className="h-4 w-4 mr-2" />
                      Manage Clients
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/admin/workouts">
                      <Target className="h-4 w-4 mr-2" />
                      Log Workouts
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/admin/analytics">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Analytics
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/admin/dashboard">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}
