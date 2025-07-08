
"use client"

import { useEffect, useState } from 'react'
import {
  CreditCard,
  Plus,
  TrendingUp,
  Calendar,
  Check,
  Star,
  ArrowRight,
  History,
  Zap,
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { StatCard } from '@/components/common/stat-card'
import { DataTable, Column } from '@/components/common/data-table'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface CreditData {
  remainingCredits: number
  totalPurchased: number
  totalUsed: number
  recentPurchases: any[]
  recentUsage: any[]
}

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  pricePerSession: number
  isPopular?: boolean
  features: string[]
  savings?: string
}

export default function CreditsPage() {
  const [creditData, setCreditData] = useState<CreditData | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const { toast } = useToast()

  const creditPackages: CreditPackage[] = [
    {
      id: 'starter',
      name: 'Starter',
      credits: 4,
      price: 340,
      pricePerSession: 85,
      features: [
        'Full workout tracking',
        'Basic analytics',
        'Schedule flexibility',
        'Email support'
      ]
    },
    {
      id: 'regular',
      name: 'Regular',
      credits: 10,
      price: 800,
      pricePerSession: 80,
      isPopular: true,
      savings: 'Save $50',
      features: [
        'Everything in Starter',
        'Advanced analytics',
        'Priority booking',
        'Phone support'
      ]
    },
    {
      id: 'committed',
      name: 'Committed',
      credits: 15,
      price: 1125,
      pricePerSession: 75,
      savings: 'Save $150',
      features: [
        'Everything in Regular',
        'Nutrition guidance',
        'Progress photos',
        'Dedicated support'
      ]
    },
    {
      id: 'champion',
      name: 'Champion',
      credits: 25,
      price: 1625,
      pricePerSession: 65,
      savings: 'Save $500',
      features: [
        'Everything in Committed',
        'Custom meal plans',
        '1-on-1 consultations',
        'Premium support'
      ]
    }
  ]

  useEffect(() => {
    fetchCreditData()
  }, [])

  const fetchCreditData = async () => {
    try {
      const response = await fetch('/api/credits')
      const data = await response.json()

      if (data.success) {
        setCreditData(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch credit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseCredits = async (packageData: CreditPackage) => {
    setPurchasing(packageData.id)

    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: packageData.credits,
          packageName: packageData.name,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // In a real app, you would redirect to Stripe Checkout here
        toast({
          title: 'Redirecting to payment...',
          description: 'You will be redirected to complete your purchase.',
        })
        
        // Simulate successful purchase for demo
        setTimeout(() => {
          toast({
            title: 'Purchase successful!',
            description: `${packageData.credits} credits have been added to your account.`,
          })
          fetchCreditData() // Refresh data
          setPurchasing(null)
        }, 2000)
      } else {
        throw new Error(data.error || 'Failed to initiate purchase')
      }
    } catch (error: any) {
      toast({
        title: 'Purchase failed',
        description: error.message || 'Failed to purchase credits. Please try again.',
        variant: 'destructive',
      })
      setPurchasing(null)
    }
  }

  const purchaseColumns: Column<any>[] = [
    {
      key: 'createdAt',
      title: 'Date',
      render: (value) => (
        <div>
          <p className="font-medium text-hf-text">{formatDate(value)}</p>
          <p className="text-xs text-hf-text-secondary">{formatRelativeTime(value)}</p>
        </div>
      ),
    },
    {
      key: 'packageName',
      title: 'Package',
      render: (value) => (
        <span className="font-medium text-hf-text">{value}</span>
      ),
    },
    {
      key: 'credits',
      title: 'Credits',
      render: (value) => (
        <Badge className="bg-hf-orange/10 text-hf-orange border-hf-orange/20">
          +{value}
        </Badge>
      ),
    },
    {
      key: 'amount',
      title: 'Amount',
      render: (value) => (
        <span className="font-medium text-hf-text">{formatCurrency(Number(value))}</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => {
        const statusColors = {
          COMPLETED: 'bg-hf-success/10 text-hf-success border-hf-success/20',
          PENDING: 'bg-hf-orange/10 text-hf-orange border-hf-orange/20',
          FAILED: 'bg-hf-error/10 text-hf-error border-hf-error/20',
        }
        
        return (
          <Badge className={statusColors[value as keyof typeof statusColors] || 'bg-gray-500/10 text-gray-400'}>
            {value}
          </Badge>
        )
      },
    },
  ]

  const usageColumns: Column<any>[] = [
    {
      key: 'createdAt',
      title: 'Date',
      render: (value) => (
        <div>
          <p className="font-medium text-hf-text">{formatDate(value)}</p>
          <p className="text-xs text-hf-text-secondary">{formatRelativeTime(value)}</p>
        </div>
      ),
    },
    {
      key: 'startTime',
      title: 'Session',
      render: (value, item) => (
        <div>
          <p className="font-medium text-hf-text">Training Session</p>
          <p className="text-xs text-hf-text-secondary">
            {new Date(value).toLocaleTimeString()} - {new Date(item.endTime).toLocaleTimeString()}
          </p>
        </div>
      ),
    },
    {
      key: 'creditsUsed',
      title: 'Credits Used',
      render: (value) => (
        <Badge variant="outline" className="border-hf-error/20 text-hf-error">
          -{value}
        </Badge>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => (
        <Badge className="bg-hf-success/10 text-hf-success border-hf-success/20">
          {value}
        </Badge>
      ),
    },
  ]

  if (loading) {
    return (
      <ProtectedLayout>
        <LoadingState message="Loading your credits..." />
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-hf-text">Training Credits</h1>
          <p className="text-hf-text-secondary max-w-2xl mx-auto">
            Purchase training credits to book sessions with our certified personal trainers. 
            Credits never expire and can be used whenever you're ready to train.
          </p>
        </div>

        {/* Credit Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Available Credits"
            value={creditData?.remainingCredits || 0}
            description="Ready to use"
            icon={Zap}
          />
          <StatCard
            title="Total Purchased"
            value={creditData?.totalPurchased || 0}
            description="All time credits"
            icon={CreditCard}
          />
          <StatCard
            title="Sessions Completed"
            value={creditData?.totalUsed || 0}
            description="Credits used"
            icon={TrendingUp}
          />
          <StatCard
            title="Credit Utilization"
            value={`${creditData?.totalPurchased ? Math.round(((creditData?.totalUsed || 0) / creditData.totalPurchased) * 100) : 0}%`}
            description="Usage rate"
            icon={Calendar}
          />
        </div>

        {/* Low Credits Warning */}
        {(creditData?.remainingCredits || 0) < 3 && (
          <Card className="bg-gradient-to-r from-hf-orange/10 to-hf-orange-dark/10 border-hf-orange/20">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-hf-orange/20 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-hf-orange" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-hf-text">Running Low on Credits</h3>
                <p className="text-hf-text-secondary">
                  You have {creditData?.remainingCredits || 0} credits remaining. 
                  Purchase more to continue booking sessions.
                </p>
              </div>
              <Button className="btn-gradient">
                <Plus className="h-4 w-4 mr-2" />
                Buy Credits
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Credit Packages */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-hf-text mb-2">Choose Your Package</h2>
            <p className="text-hf-text-secondary">
              All packages include the same high-quality training experience
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {creditPackages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative bg-hf-card border-hf-card transition-all duration-300 hover:border-hf-orange/50 ${
                  pkg.isPopular ? 'ring-2 ring-hf-orange shadow-lg' : ''
                }`}
              >
                {pkg.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-orange text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-hf-text">{pkg.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-hf-text">
                      {pkg.credits}
                      <span className="text-sm font-normal text-hf-text-secondary ml-1">
                        credits
                      </span>
                    </div>
                    <div className="text-xl font-semibold text-hf-orange">
                      {formatCurrency(pkg.price)}
                    </div>
                    <div className="text-sm text-hf-text-secondary">
                      {formatCurrency(pkg.pricePerSession)} per session
                    </div>
                    {pkg.savings && (
                      <Badge className="bg-hf-success/10 text-hf-success border-hf-success/20">
                        {pkg.savings}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-hf-text-secondary">
                        <Check className="h-4 w-4 text-hf-success mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${pkg.isPopular ? 'btn-gradient' : 'border-hf-card'}`}
                    variant={pkg.isPopular ? 'default' : 'outline'}
                    onClick={() => handlePurchaseCredits(pkg)}
                    disabled={purchasing === pkg.id}
                  >
                    {purchasing === pkg.id ? (
                      'Processing...'
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Purchase Package
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Progress Indicator */}
        {creditData && creditData.totalPurchased > 0 && (
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-hf-orange" />
                Credit Usage Progress
              </CardTitle>
              <CardDescription className="text-hf-text-secondary">
                Track your fitness journey through credit utilization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-hf-text-secondary">Sessions Completed</span>
                  <span className="text-hf-text">
                    {creditData.totalUsed} / {creditData.totalPurchased}
                  </span>
                </div>
                <Progress 
                  value={creditData.totalPurchased > 0 ? (creditData.totalUsed / creditData.totalPurchased) * 100 : 0} 
                  className="h-2" 
                />
              </div>
              <div className="text-xs text-hf-text-secondary">
                You've completed {Math.round(((creditData.totalUsed || 0) / (creditData.totalPurchased || 1)) * 100)}% 
                of your purchased sessions
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Purchase History */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-hf-text flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-hf-orange" />
                  Purchase History
                </CardTitle>
                <CardDescription className="text-hf-text-secondary">
                  Your recent credit purchases
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <a href="/credits/history">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              {creditData?.recentPurchases?.length === 0 ? (
                <EmptyState
                  title="No purchases yet"
                  description="Your credit purchase history will appear here"
                />
              ) : (
                <div className="space-y-4">
                  {creditData?.recentPurchases?.slice(0, 5).map((purchase: any) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between p-4 bg-hf-dark rounded-lg border border-hf-card"
                    >
                      <div>
                        <p className="font-medium text-hf-text">{purchase.packageName}</p>
                        <p className="text-sm text-hf-text-secondary">
                          {formatRelativeTime(purchase.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-hf-orange">
                          +{purchase.credits} credits
                        </p>
                        <p className="text-sm text-hf-text-secondary">
                          {formatCurrency(Number(purchase.amount))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage History */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-hf-text flex items-center">
                  <History className="h-5 w-5 mr-2 text-hf-orange" />
                  Usage History
                </CardTitle>
                <CardDescription className="text-hf-text-secondary">
                  Your recent credit usage
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <a href="/bookings">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              {creditData?.recentUsage?.length === 0 ? (
                <EmptyState
                  title="No sessions yet"
                  description="Your session history will appear here"
                  action={
                    <Button asChild className="btn-gradient">
                      <a href="/schedule">Book First Session</a>
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {creditData?.recentUsage?.slice(0, 5).map((usage: any) => (
                    <div
                      key={usage.id}
                      className="flex items-center justify-between p-4 bg-hf-dark rounded-lg border border-hf-card"
                    >
                      <div>
                        <p className="font-medium text-hf-text">Training Session</p>
                        <p className="text-sm text-hf-text-secondary">
                          {formatDate(usage.startTime)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-hf-error">
                          -{usage.creditsUsed} credit{usage.creditsUsed !== 1 ? 's' : ''}
                        </p>
                        <Badge className="bg-hf-success/10 text-hf-success border-hf-success/20 text-xs">
                          {usage.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}
