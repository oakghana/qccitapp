'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface Transaction {
  id: string
  item_name: string
  transaction_type: string
  quantity: number
  unit?: string
  location?: string
  reference_type?: string
  reference_number?: string
  notes?: string
  created_by?: string
  created_at: string
}

interface CentralStoresActivityLogProps {
  location?: string
  limit?: number
}

export function CentralStoresActivityLog({ location = 'Central Stores', limit = 15 }: CentralStoresActivityLogProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTransactions()
  }, [location, limit])

  async function fetchTransactions() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/store/transactions?location=${encodeURIComponent(location)}&limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }
      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (err) {
      console.error('[v0] Error fetching transactions:', err)
      setError('Failed to load activity log')
    } finally {
      setLoading(false)
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'addition':
      case 'receipt':
        return 'bg-green-50 border-green-200'
      case 'reduction':
      case 'issue':
      case 'assignment':
        return 'bg-orange-50 border-orange-200'
      case 'return':
        return 'bg-blue-50 border-blue-200'
      case 'adjustment':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getTransactionBadgeVariant = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'addition':
      case 'receipt':
        return 'bg-green-100 text-green-800'
      case 'reduction':
      case 'issue':
        return 'bg-red-100 text-red-800'
      case 'assignment':
        return 'bg-orange-100 text-orange-800'
      case 'return':
        return 'bg-blue-100 text-blue-800'
      case 'adjustment':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Central Stores Activity Log</CardTitle>
        <CardDescription>Recent stock transactions and movements</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-sm text-destructive">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No transactions recorded yet</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`p-3 border rounded-lg transition-colors ${getTransactionColor(transaction.transaction_type)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{transaction.item_name}</span>
                      <Badge className={`text-xs ${getTransactionBadgeVariant(transaction.transaction_type)}`}>
                        {transaction.transaction_type}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {transaction.quantity} {transaction.unit || 'pcs'}
                        </span>
                        {transaction.location && <span>• {transaction.location}</span>}
                      </div>
                      {transaction.reference_number && (
                        <div>
                          {transaction.reference_type}: {transaction.reference_number}
                        </div>
                      )}
                      {transaction.notes && <div className="italic">{transaction.notes}</div>}
                      <div className="flex items-center gap-1">
                        <span>{formatDate(transaction.created_at)}</span>
                        {transaction.created_by && <span>• {transaction.created_by}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
