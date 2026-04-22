'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Plus, TrendingUp, Zap, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  item_id?: string
}

export default function StoreAnalyticsPage() {
  const { user } = useAuth()
  const [additions, setAdditions] = useState<StockAddition[]>([])
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StockAddition | StockTransaction | null>(null)
  const [deleteType, setDeleteType] = useState<'addition' | 'transaction'>('addition')
  const [deleteReason, setDeleteReason] = useState('')
  const [deleting, setDeleting] = useState(false)

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

  const isAdmin = user?.role === 'admin' || user?.role === 'it_store_head'

  const handleDeleteClick = (item: StockAddition | StockTransaction, type: 'addition' | 'transaction') => {
    setSelectedItem(item)
    setDeleteType(type)
    setDeleteReason('')
    setDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedItem || !deleteReason.trim()) {
      alert('Please provide a reason for deletion')
      return
    }

    try {
      setDeleting(true)
      const response = await fetch('/api/store/delete-item', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem.id,
          transactionId: deleteType === 'transaction' ? selectedItem.id : undefined,
          deletedBy: user?.email || 'unknown',
          reason: deleteReason,
          userRole: user?.role,
          userLocation: user?.location,
          deleteType: deleteType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(`Error: ${data.error}`)
        return
      }

      alert(`${deleteType === 'addition' ? 'Item' : 'Transaction'} deleted successfully`)
      setDeleteDialog(false)
      setSelectedItem(null)
      await loadData()
    } catch (error) {
      console.error('[v0] Error deleting:', error)
      alert('Failed to delete')
    } finally {
      setDeleting(false)
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-stone-50 to-slate-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Store Analytics</h1>
            <p className="text-slate-600 mt-2">Track stock additions and transactions across all locations</p>
          </div>
          <Button onClick={loadData} variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="additions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl border border-emerald-100 bg-white p-1">
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
            <Card className="rounded-2xl border-emerald-100 shadow-sm bg-white">
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
                        <tr className="border-b bg-emerald-50/60">
                          <th className="text-left py-3 px-4 font-semibold">Item Name</th>
                          <th className="text-left py-3 px-4 font-semibold">Quantity</th>
                          <th className="text-left py-3 px-4 font-semibold">Category</th>
                          <th className="text-left py-3 px-4 font-semibold">Location</th>
                          <th className="text-left py-3 px-4 font-semibold">Date Added</th>
                          <th className="text-left py-3 px-4 font-semibold">Added By</th>
                          {isAdmin && <th className="text-left py-3 px-4 font-semibold">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {additions.map((addition) => (
                          <tr key={addition.id} className="border-b hover:bg-emerald-50/40">
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
                            {isAdmin && (
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteClick(addition)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            )}
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
            <Card className="rounded-2xl border-emerald-100 shadow-sm bg-white">
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
                        <tr className="border-b bg-emerald-50/60">
                          <th className="text-left py-3 px-4 font-semibold">Item Name</th>
                          <th className="text-left py-3 px-4 font-semibold">Type</th>
                          <th className="text-left py-3 px-4 font-semibold">Quantity</th>
                          <th className="text-left py-3 px-4 font-semibold">Location</th>
                          <th className="text-left py-3 px-4 font-semibold">Reference</th>
                          <th className="text-left py-3 px-4 font-semibold">Date</th>
                          {isAdmin && <th className="text-left py-3 px-4 font-semibold">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b hover:bg-emerald-50/40">
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
                            {isAdmin && (
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteClick(transaction, 'transaction')}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            )}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete {deleteType === 'addition' ? 'Stock Item' : 'Transaction'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteType === 'addition' ? 'this item' : 'this transaction'}?
              <br />
              {deleteType === 'addition' && 'This action will remove '}
              <span className="font-semibold">{selectedItem?.item_name}</span>
              {deleteType === 'addition' && ` (${selectedItem?.quantity} units) from inventory.`}
              {deleteType === 'transaction' && ' from the transaction history.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Reason for deletion *</label>
              <textarea
                placeholder={
                  deleteType === 'addition'
                    ? 'Provide a reason (e.g., damaged, expired, administrative correction)'
                    : 'Provide a reason for removing this transaction (e.g., duplicate entry, data correction)'
                }
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="mt-2 w-full p-2 border rounded-md text-sm"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting || !deleteReason.trim()}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
