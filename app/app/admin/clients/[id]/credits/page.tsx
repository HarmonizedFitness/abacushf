
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  CreditCard, 
  ArrowLeft, 
  Plus, 
  Minus, 
  DollarSign, 
  Calendar,
  History,
  User
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Client {
  id: string
  name: string
  email: string
  remainingCredits: number
}

interface CreditTransaction {
  id: string
  type: 'PURCHASE' | 'DEDUCTION' | 'BONUS'
  credits: number
  amount?: number
  reason?: string
  date: string
  status: string
}

export default function ManageCreditsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [client, setClient] = useState<Client | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [actionType, setActionType] = useState<'add' | 'remove'>('add')
  const [formData, setFormData] = useState({
    credits: '',
    amount: '',
    reason: '',
  })

  useEffect(() => {
    if (params.id) {
      fetchData()
    }
  }, [params.id])

  const fetchData = async () => {
    try {
      // Fetch client details
      const clientResponse = await fetch(`/api/admin/clients/${params.id}`)
      const clientData = await clientResponse.json()

      if (clientData.success) {
        setClient(clientData.data)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch client details',
          variant: 'destructive',
        })
        router.push('/admin/clients')
        return
      }

      // Fetch credit transactions
      const transactionsResponse = await fetch(`/api/admin/clients/${params.id}/credits`)
      const transactionsData = await transactionsResponse.json()
      if (transactionsData.success) {
        setTransactions(transactionsData.data || [])
      }

    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch client data',
        variant: 'destructive',
      })
      router.push('/admin/clients')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    try {
      const credits = parseInt(formData.credits)
      const amount = formData.amount ? parseFloat(formData.amount) : 0

      if (isNaN(credits) || credits <= 0) {
        toast({
          title: 'Error',
          description: 'Please enter a valid number of credits',
          variant: 'destructive',
        })
        return
      }

      const response = await fetch(`/api/admin/clients/${params.id}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: actionType === 'add' ? 'BONUS' : 'DEDUCTION',
          credits: actionType === 'add' ? credits : -credits,
          amount: actionType === 'add' ? amount : 0,
          reason: formData.reason || `Manual ${actionType === 'add' ? 'credit addition' : 'credit deduction'} by admin`,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: `${actionType === 'add' ? 'Added' : 'Removed'} ${credits} credits successfully`,
        })
        
        // Reset form
        setFormData({ credits: '', amount: '', reason: '' })
        
        // Refresh data
        await fetchData()
      } else {
        toast({
          title: 'Error',
          description: data.error || `Failed to ${actionType} credits`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to process credits:', error)
      toast({
        title: 'Error',
        description: `Failed to ${actionType} credits`,
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return <LoadingState message="Loading credit information..." />
  }

  if (!client) {
    return null
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="ghost" asChild>
            <Link href={`/admin/clients/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-hf-text">Manage Credits</h1>
        <p className="text-hf-text-secondary">Add or remove credits for {client.name}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Credit Management Form */}
        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <CardTitle className="text-hf-text flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-hf-orange" />
              <span>Credit Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="text-center p-4 bg-hf-dark rounded-lg border border-hf-card">
                <div className="text-3xl font-bold text-hf-orange mb-2">
                  {client.remainingCredits}
                </div>
                <p className="text-hf-text-secondary">Current credits</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant={actionType === 'add' ? 'default' : 'outline'}
                  onClick={() => setActionType('add')}
                  className={actionType === 'add' ? 'btn-gradient' : ''}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Credits
                </Button>
                <Button
                  type="button"
                  variant={actionType === 'remove' ? 'destructive' : 'outline'}
                  onClick={() => setActionType('remove')}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Remove Credits
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credits" className="text-hf-text">
                  Number of Credits
                </Label>
                <Input
                  id="credits"
                  name="credits"
                  type="number"
                  min="1"
                  required
                  value={formData.credits}
                  onChange={handleInputChange}
                  className="bg-hf-dark border-hf-card text-hf-text"
                  placeholder="Enter number of credits"
                />
              </div>

              {actionType === 'add' && (
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-hf-text flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-hf-orange" />
                    <span>Amount (optional)</span>
                  </Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="bg-hf-dark border-hf-card text-hf-text"
                    placeholder="Enter amount paid (optional)"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-hf-text">
                  Reason/Notes
                </Label>
                <Textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="bg-hf-dark border-hf-card text-hf-text"
                  placeholder={`Reason for ${actionType === 'add' ? 'adding' : 'removing'} credits...`}
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                disabled={processing}
                className={actionType === 'add' ? 'btn-gradient w-full' : 'w-full'}
                variant={actionType === 'add' ? 'default' : 'destructive'}
              >
                {processing ? 'Processing...' : `${actionType === 'add' ? 'Add' : 'Remove'} Credits`}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <CardTitle className="text-hf-text flex items-center space-x-2">
              <History className="h-5 w-5 text-hf-orange" />
              <span>Transaction History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-hf-dark rounded-lg border border-hf-card"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {transaction.type === 'PURCHASE' ? (
                          <CreditCard className="h-5 w-5 text-hf-success" />
                        ) : transaction.type === 'BONUS' ? (
                          <Plus className="h-5 w-5 text-hf-orange" />
                        ) : (
                          <Minus className="h-5 w-5 text-hf-error" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${
                            transaction.credits > 0 ? 'text-hf-success' : 'text-hf-error'
                          }`}>
                            {transaction.credits > 0 ? '+' : ''}{transaction.credits} credits
                          </span>
                          <Badge
                            className={`text-xs ${
                              transaction.type === 'PURCHASE' 
                                ? 'bg-hf-success/10 text-hf-success border-hf-success/20'
                                : transaction.type === 'BONUS'
                                ? 'bg-hf-orange/10 text-hf-orange border-hf-orange/20'
                                : 'bg-hf-error/10 text-hf-error border-hf-error/20'
                            }`}
                          >
                            {transaction.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-hf-text-secondary">
                          {formatDate(transaction.date)}
                        </p>
                        {transaction.reason && (
                          <p className="text-xs text-hf-text-secondary mt-1">
                            {transaction.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {transaction.amount && (
                        <div className="text-hf-text font-medium">
                          ${transaction.amount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={History}
                title="No transactions"
                description="No credit transactions found for this client."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
