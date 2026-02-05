'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Plus, TrendingUp, Zap } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface StockAddition {
  id: string
  item_name: string
  quantity: number
  category: string
  location: string
  created_at: string
  created_by: string
}

interface StockTransaction {
  id: string
  item_name: string
  transaction_type: string
  quantity: number
  location: string
  reference_type: string
  created_at: string
}

export default function StoreAnalyticsPage() {
  const { user } = useAuth()
  const [additions, setAdditions] = useState<StockAddition[]>([])
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)

      // Fetch new stock additions
      const additionsResponse = await fetch('/api/store/stock-additions')
      if (additionsResponse.ok) {
        const additionsData = await additionsResponse.json()
        setAdditions(additionsData.additions || [])
      }

      // Fetch all transactions
      const transactionsResponse = await fetch('/api/store/all-transactions')
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        setTransactions(transactionsData.transactions || [])
      }
    } catch (error) {
      console.error('[v0] Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTransactionBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'addition':
      case 'transfer_in':
      case 'receipt':
        return 'bg-green-100 text-green-800'
      case 'transfer_out':
      case 'issue':
      case 'reduction':
        return 'bg-red-100 text-red-800'
      case 'assignment':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Store Analytics</h1>
            <p className="text-slate-600 mt-2">Track stock additions and transactions across all locations</p>
          </div>
          <Button onClick={loadData} variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="additions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="additions" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Stock Additions
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              All Transactions
            </TabsTrigger>
          </TabsList>

          {/* New Stock Additions Tab */}
          <TabsContent value="additions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>New Stock Additions</CardTitle>
                <CardDescription>
                  All new items and stock quantities added to the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-slate-500">Loading...</div>
                ) : additions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No stock additions yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="text-left py-3 px-4 font-semibold">Item Name</th>
                          <th className="text-left py-3 px-4 font-semibold">Quantity</th>
                          <th className="text-left py-3 px-4 font-semibold">Category</th>
                          <th className="text-left py-3 px-4 font-semibold">Location</th>
                          <th className="text-left py-3 px-4 font-semibold">Date Added</th>
                          <th className="text-left py-3 px-4 font-semibold">Added By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {additions.map((addition) => (
                          <tr key={addition.id} className="border-b hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium">{addition.item_name}</td>
                            <td className="py-3 px-4">
                              <Badge className="bg-green-100 text-green-800">{addition.quantity} pcs</Badge>
                            </td>
                            <td className="py-3 px-4">{addition.category}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{addition.location}</Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {new Date(addition.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">{addition.created_by}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>
                  Complete history of stock movements across all locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-slate-500">Loading...</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No transactions yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="text-left py-3 px-4 font-semibold">Item Name</th>
                          <th className="text-left py-3 px-4 font-semibold">Type</th>
                          <th className="text-left py-3 px-4 font-semibold">Quantity</th>
                          <th className="text-left py-3 px-4 font-semibold">Location</th>
                          <th className="text-left py-3 px-4 font-semibold">Reference</th>
                          <th className="text-left py-3 px-4 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium">{transaction.item_name}</td>
                            <td className="py-3 px-4">
                              <Badge className={getTransactionBadgeColor(transaction.transaction_type)}>
                                {transaction.transaction_type}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">{transaction.quantity}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{transaction.location}</Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-xs">{transaction.reference_type}</td>
                            <td className="py-3 px-4 text-slate-600">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
