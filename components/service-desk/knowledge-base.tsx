"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Search,
  BookOpen,
  Monitor,
  Wifi,
  Smartphone,
  Printer,
  Shield,
  HelpCircle,
  ChevronRight,
  Star,
  ThumbsUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface Article {
  id: string
  title: string
  content: string
  category: string
  author: string
  is_published: boolean
  is_featured: boolean
  views: number
  helpful_count: number
  tags: string[]
  created_at: string
  updated_at: string
}

const categoryIcons: Record<string, any> = {
  Security: Shield,
  Network: Wifi,
  Hardware: Monitor,
  Software: Smartphone,
  Printers: Printer,
  General: HelpCircle,
}

export function KnowledgeBase() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  
  // Admin dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "General",
    tags: "",
    is_featured: false,
    is_published: true,
  })

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/knowledge-base")
      const data = await response.json()
      setArticles(data.articles || [])
    } catch (error) {
      console.error("Error loading articles:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddArticle = async () => {
    if (!formData.title || !formData.content) {
      toast.error("Title and content are required")
      return
    }
    setFormLoading(true)
    try {
      const response = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
          author: user?.full_name || user?.name || "IT Admin",
        }),
      })
      const result = await response.json()
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Article created successfully")
      setShowAddDialog(false)
      setFormData({ title: "", content: "", category: "General", tags: "", is_featured: false, is_published: true })
      loadArticles()
    } catch (error) {
      toast.error("Failed to create article")
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditArticle = async () => {
    if (!editingArticle) return
    setFormLoading(true)
    try {
      const response = await fetch("/api/knowledge-base", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingArticle.id,
          ...formData,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      })
      const result = await response.json()
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Article updated successfully")
      setShowEditDialog(false)
      setEditingArticle(null)
      loadArticles()
    } catch (error) {
      toast.error("Failed to update article")
    } finally {
      setFormLoading(false)
    }
  }

  const openEditDialog = (article: Article) => {
    setEditingArticle(article)
    setFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags?.join(", ") || "",
      is_featured: article.is_featured,
      is_published: article.is_published,
    })
    setShowEditDialog(true)
  }

  // Filter articles
  const filteredArticles = articles.filter(a => {
    const matchesSearch = !searchTerm || 
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || a.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const featuredArticles = filteredArticles.filter(a => a.is_featured)
  const categories = [...new Set(articles.map(a => a.category))]

  // Article detail view
  if (selectedArticle) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedArticle(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="outline" className="mb-2">{selectedArticle.category}</Badge>
              <CardTitle className="text-2xl">{selectedArticle.title}</CardTitle>
              <CardDescription className="mt-2">
                By {selectedArticle.author} • {new Date(selectedArticle.created_at).toLocaleDateString()}
                <span className="mx-2">•</span>
                <Eye className="h-3 w-3 inline" /> {selectedArticle.views || 0} views
              </CardDescription>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(selectedArticle)}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {selectedArticle.content}
          </div>
          {selectedArticle.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {selectedArticle.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
          <div className="mt-8 pt-6 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Was this article helpful?</p>
            <Button variant="outline" size="sm">
              <ThumbsUp className="h-4 w-4 mr-2" />
              Yes, this helped ({selectedArticle.helpful_count || 0})
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const defaultCategories = [
    { id: "hardware", name: "Hardware", icon: Monitor, count: articles.filter(a => a.category === "Hardware").length || 15 },
    { id: "software", name: "Software", icon: Smartphone, count: articles.filter(a => a.category === "Software").length || 23 },
    { id: "network", name: "Network", icon: Wifi, count: articles.filter(a => a.category === "Network").length || 12 },
    { id: "security", name: "Security", icon: Shield, count: articles.filter(a => a.category === "Security").length || 8 },
    { id: "printers", name: "Printers", icon: Printer, count: articles.filter(a => a.category === "Printers").length || 6 },
    { id: "general", name: "General", icon: HelpCircle, count: articles.filter(a => a.category === "General").length || 10 },
  ]

  const quickSolutions = [
    {
      problem: "Computer is running slowly",
      solution: "Restart your computer, close unnecessary programs, run disk cleanup",
      category: "Hardware",
    },
    {
      problem: "Can't connect to internet",
      solution: "Check cable connections, restart router, contact IT if issue persists",
      category: "Network",
    },
    {
      problem: "Forgot my password",
      solution: "Use the password reset link on login page or contact IT help desk",
      category: "Security",
    },
    {
      problem: "Printer won't print",
      solution: "Check paper and ink levels, restart printer, verify connection",
      category: "Hardware",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Admin Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-green-600" />
            Knowledge Base
          </h2>
          <p className="text-muted-foreground">Find solutions to common IT issues</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAddDialog(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" /> Add Article
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for solutions, guides, and tutorials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Featured Articles from Database */}
      {featuredArticles.length > 0 && !searchTerm && selectedCategory === "all" && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> Featured Articles
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredArticles.map(article => {
              const IconComponent = categoryIcons[article.category] || HelpCircle
              return (
                <Card 
                  key={article.id} 
                  className="cursor-pointer hover:border-green-500 transition-colors"
                  onClick={() => setSelectedArticle(article)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
                        <IconComponent className="h-4 w-4 text-green-600" />
                      </div>
                      <Badge variant="outline">{article.category}</Badge>
                    </div>
                    <h4 className="font-medium">{article.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {article.content.substring(0, 100)}...
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {article.views || 0}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {article.helpful_count || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* All Articles from Database */}
      {filteredArticles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Articles ({filteredArticles.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredArticles.map(article => {
              const IconComponent = categoryIcons[article.category] || HelpCircle
              return (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer"
                  onClick={() => setSelectedArticle(article)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{article.title}</h4>
                        {article.is_featured && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {article.category} • {new Date(article.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditDialog(article) }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse Categories</TabsTrigger>
          <TabsTrigger value="quick">Quick Solutions</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Categories Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {defaultCategories.map((category) => {
              const IconComponent = category.icon
              return (
                <Card 
                  key={category.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">{category.count} articles</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="quick" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Solutions</CardTitle>
              <CardDescription>Common problems and their immediate solutions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quickSolutions.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-destructive">Problem: {item.problem}</h4>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      <strong>Solution:</strong> {item.solution}
                    </p>
                    <Button variant="ghost" size="sm">
                      <ThumbsUp className="mr-1 h-3 w-3" /> Helpful
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Article Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Article</DialogTitle>
            <DialogDescription>Create a new knowledge base article for staff reference</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Article title"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Network">Network</SelectItem>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Printers">Printers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Article content"
                rows={10}
              />
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., password, login, security"
              />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(v) => setFormData({ ...formData, is_published: v })}
                />
                <Label>Published</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddArticle} disabled={formLoading} className="bg-green-600 hover:bg-green-700">
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Article Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Article</DialogTitle>
            <DialogDescription>Update the knowledge base article</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Network">Network</SelectItem>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Printers">Printers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={10} />
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_featured} onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })} />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_published} onCheckedChange={(v) => setFormData({ ...formData, is_published: v })} />
                <Label>Published</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditArticle} disabled={formLoading} className="bg-green-600 hover:bg-green-700">
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
