"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  MessageSquare,
  Calendar,
  User,
  FileCheck,
  Shield,
  Award,
  ThumbsUp,
  ThumbsDown,
  History,
  Search,
  Filter
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface TaskSubmission {
  id: string
  taskId: string
  taskName: string
  taskCategory: "financial" | "customer" | "internal" | "learning"
  staffId: string
  staffName: string
  submissionDate: string
  completionDate: string
  description: string
  attachments: string[] // File URLs or evidence
  selfScore: number
  estimatedTime: number // in hours
  actualTime: number // in hours
  status: "submitted" | "under_review" | "verified" | "rejected" | "needs_revision"
  verificationNotes?: string
  verifiedBy?: string
  verifiedDate?: string
  verificationScore?: number
  qualityRating?: 1 | 2 | 3 | 4 | 5
  impactOnBSC: boolean // Whether this affects BSC metrics
  bscMetricIds: string[] // Associated BSC metrics
}

interface VerificationComment {
  id: string
  taskSubmissionId: string
  commentBy: string
  commentDate: string
  comment: string
  type: "question" | "feedback" | "approval" | "rejection"
}

interface TaskVerificationSystemProps {
  userRole: "staff" | "supervisor" | "it_head" | "regional_it_head"
  userId: string
}

export function TaskVerificationSystem({ userRole, userId }: TaskVerificationSystemProps) {
  const { user } = useAuth()
  const [taskSubmissions, setTaskSubmissions] = useState<TaskSubmission[]>([])
  const [comments, setComments] = useState<VerificationComment[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [newComment, setNewComment] = useState("")
  const [verificationScore, setVerificationScore] = useState<number>(0)
  const [qualityRating, setQualityRating] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [verificationNotes, setVerificationNotes] = useState("")

  // Mock data - replace with API calls
  useEffect(() => {
    const mockSubmissions: TaskSubmission[] = [
      {
        id: "sub_001",
        taskId: "task_001",
        taskName: "Network Infrastructure Audit",
        taskCategory: "internal",
        staffId: "staff_001",
        staffName: "John Doe",
        submissionDate: "2024-01-15T08:00:00Z",
        completionDate: "2024-01-15T16:30:00Z",
        description: "Completed comprehensive audit of network infrastructure including switches, routers, and access points. Identified 3 critical vulnerabilities and documented recommendations.",
        attachments: ["audit_report.pdf", "vulnerability_scan.xlsx"],
        selfScore: 85,
        estimatedTime: 8,
        actualTime: 8.5,
        status: "submitted",
        impactOnBSC: true,
        bscMetricIds: ["metric_001", "metric_003"]
      },
      {
        id: "sub_002",
        taskId: "task_002",
        taskName: "User Support Ticket Resolution",
        taskCategory: "customer",
        staffId: "staff_002",
        staffName: "Jane Smith",
        submissionDate: "2024-01-14T14:00:00Z",
        completionDate: "2024-01-14T15:45:00Z",
        description: "Resolved 15 user support tickets including password resets, software installations, and hardware issues. All tickets closed with positive feedback.",
        attachments: ["ticket_summary.pdf"],
        selfScore: 92,
        estimatedTime: 2,
        actualTime: 1.75,
        status: "verified",
        verifiedBy: "supervisor_001",
        verifiedDate: "2024-01-14T17:00:00Z",
        verificationScore: 90,
        qualityRating: 4,
        verificationNotes: "Excellent work. Fast resolution and good customer feedback.",
        impactOnBSC: true,
        bscMetricIds: ["metric_002"]
      },
      {
        id: "sub_003",
        taskId: "task_003",
        taskName: "Server Maintenance",
        taskCategory: "internal",
        staffId: "staff_003",
        staffName: "Mike Johnson",
        submissionDate: "2024-01-13T10:00:00Z",
        completionDate: "2024-01-13T18:00:00Z",
        description: "Performed scheduled maintenance on production servers. Updated OS patches and validated system performance.",
        attachments: ["maintenance_log.txt"],
        selfScore: 78,
        estimatedTime: 6,
        actualTime: 8,
        status: "needs_revision",
        verifiedBy: "supervisor_001",
        verifiedDate: "2024-01-13T19:00:00Z",
        verificationNotes: "Missing performance validation report. Please provide post-maintenance benchmarks.",
        impactOnBSC: true,
        bscMetricIds: ["metric_001"]
      }
    ]

    const mockComments: VerificationComment[] = [
      {
        id: "comment_001",
        taskSubmissionId: "sub_001",
        commentBy: "supervisor_001",
        commentDate: "2024-01-15T17:00:00Z",
        comment: "Great work on the audit. Can you provide more details about the mitigation timeline?",
        type: "question"
      },
      {
        id: "comment_002",
        taskSubmissionId: "sub_003",
        commentBy: "supervisor_001",
        commentDate: "2024-01-13T19:00:00Z",
        comment: "The maintenance was completed but we need performance benchmarks to validate the improvements.",
        type: "feedback"
      }
    ]

    setTaskSubmissions(mockSubmissions)
    setComments(mockComments)
  }, [])

  // Filter submissions based on user role
  const getFilteredSubmissions = () => {
    let filtered = taskSubmissions

    // Role-based filtering
    if (userRole === "staff") {
      filtered = filtered.filter(sub => sub.staffId === userId)
    }

    // Status filtering
    if (filterStatus !== "all") {
      filtered = filtered.filter(sub => sub.status === filterStatus)
    }

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
  }

  const handleVerifyTask = (submissionId: string, action: "verify" | "reject" | "needs_revision") => {
    const updatedSubmissions = taskSubmissions.map(sub => {
      if (sub.id === submissionId) {
        return {
          ...sub,
          status: action === "verify" ? "verified" : action as TaskSubmission["status"],
          verifiedBy: user?.id || "current_user",
          verifiedDate: new Date().toISOString(),
          verificationScore: action === "verify" ? verificationScore : undefined,
          qualityRating: action === "verify" ? qualityRating : undefined,
          verificationNotes: verificationNotes || undefined
        }
      }
      return sub
    })

    setTaskSubmissions(updatedSubmissions)
    
    // Add verification comment
    if (verificationNotes) {
      const newCommentObj: VerificationComment = {
        id: `comment_${Date.now()}`,
        taskSubmissionId: submissionId,
        commentBy: user?.id || "current_user",
        commentDate: new Date().toISOString(),
        comment: verificationNotes,
        type: action === "verify" ? "approval" : action === "reject" ? "rejection" : "feedback"
      }
      setComments([...comments, newCommentObj])
    }

    // Reset form
    setVerificationScore(0)
    setQualityRating(3)
    setVerificationNotes("")
    setSelectedSubmission(null)
  }

  const addComment = (submissionId: string) => {
    if (!newComment.trim()) return

    const commentObj: VerificationComment = {
      id: `comment_${Date.now()}`,
      taskSubmissionId: submissionId,
      commentBy: user?.id || "current_user",
      commentDate: new Date().toISOString(),
      comment: newComment,
      type: "feedback"
    }

    setComments([...comments, commentObj])
    setNewComment("")
  }

  const getStatusBadge = (status: TaskSubmission["status"]) => {
    const statusConfig = {
      submitted: { variant: "secondary" as const, icon: Clock, text: "Pending Review" },
      under_review: { variant: "default" as const, icon: Eye, text: "Under Review" },
      verified: { variant: "default" as const, icon: CheckCircle, text: "Verified" },
      rejected: { variant: "destructive" as const, icon: XCircle, text: "Rejected" },
      needs_revision: { variant: "outline" as const, icon: AlertTriangle, text: "Needs Revision" }
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    )
  }

  const canVerify = userRole === "supervisor" || userRole === "it_head" || userRole === "regional_it_head"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Task Verification System</h2>
          <p className="text-muted-foreground">
            {userRole === "staff" ? "Track your task submissions" : "Review and verify staff task completions"}
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          {userRole === "staff" ? "Staff View" : "Supervisor View"}
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tasks, staff, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="submitted">Pending Review</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="needs_revision">Needs Revision</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Submissions List */}
      <div className="grid gap-4">
        {getFilteredSubmissions().map((submission) => (
          <Card key={submission.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{submission.taskName}</CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {submission.staffName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(submission.submissionDate).toLocaleDateString()}
                    </span>
                    <Badge variant="outline">{submission.taskCategory}</Badge>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(submission.status)}
                  {submission.impactOnBSC && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      BSC Impact
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{submission.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <Label className="text-xs font-medium">Self Score</Label>
                  <p className="font-semibold">{submission.selfScore}%</p>
                </div>
                <div>
                  <Label className="text-xs font-medium">Estimated Time</Label>
                  <p className="font-semibold">{submission.estimatedTime}h</p>
                </div>
                <div>
                  <Label className="text-xs font-medium">Actual Time</Label>
                  <p className="font-semibold">{submission.actualTime}h</p>
                </div>
                {submission.verificationScore && (
                  <div>
                    <Label className="text-xs font-medium">Verified Score</Label>
                    <p className="font-semibold">{submission.verificationScore}%</p>
                  </div>
                )}
              </div>

              {submission.attachments.length > 0 && (
                <div>
                  <Label className="text-xs font-medium">Attachments</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {submission.attachments.map((attachment, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        <FileCheck className="w-3 h-3" />
                        {attachment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {submission.verificationNotes && (
                <Alert>
                  <MessageSquare className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Verification Notes:</strong> {submission.verificationNotes}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  {comments.filter(c => c.taskSubmissionId === submission.id).length > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {comments.filter(c => c.taskSubmissionId === submission.id).length} Comments
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{submission.taskName}</DialogTitle>
                        <DialogDescription>
                          Task verification and feedback
                        </DialogDescription>
                      </DialogHeader>
                      <TaskSubmissionDetails 
                        submission={submission}
                        comments={comments.filter(c => c.taskSubmissionId === submission.id)}
                        canVerify={canVerify}
                        onVerify={handleVerifyTask}
                        onAddComment={addComment}
                        newComment={newComment}
                        setNewComment={setNewComment}
                        verificationScore={verificationScore}
                        setVerificationScore={setVerificationScore}
                        qualityRating={qualityRating}
                        setQualityRating={setQualityRating}
                        verificationNotes={verificationNotes}
                        setVerificationNotes={setVerificationNotes}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {getFilteredSubmissions().length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Task Submissions Found</h3>
            <p className="text-muted-foreground">
              {userRole === "staff" 
                ? "You haven't submitted any tasks yet." 
                : "No task submissions match your current filters."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface TaskSubmissionDetailsProps {
  submission: TaskSubmission
  comments: VerificationComment[]
  canVerify: boolean
  onVerify: (submissionId: string, action: "verify" | "reject" | "needs_revision") => void
  onAddComment: (submissionId: string) => void
  newComment: string
  setNewComment: (value: string) => void
  verificationScore: number
  setVerificationScore: (value: number) => void
  qualityRating: 1 | 2 | 3 | 4 | 5
  setQualityRating: (value: 1 | 2 | 3 | 4 | 5) => void
  verificationNotes: string
  setVerificationNotes: (value: string) => void
}

function TaskSubmissionDetails({
  submission,
  comments,
  canVerify,
  onVerify,
  onAddComment,
  newComment,
  setNewComment,
  verificationScore,
  setVerificationScore,
  qualityRating,
  setQualityRating,
  verificationNotes,
  setVerificationNotes
}: TaskSubmissionDetailsProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Task Details</TabsTrigger>
          <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
          {canVerify && submission.status === "submitted" && (
            <TabsTrigger value="verification">Verification</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Staff Member</Label>
              <p>{submission.staffName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Submission Date</Label>
              <p>{new Date(submission.submissionDate).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Completion Date</Label>
              <p>{new Date(submission.completionDate).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Category</Label>
              <Badge variant="outline">{submission.taskCategory}</Badge>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Description</Label>
            <p className="mt-1 text-sm text-muted-foreground">{submission.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Self Score</Label>
              <p className="text-2xl font-bold text-blue-600">{submission.selfScore}%</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Estimated Time</Label>
              <p className="text-2xl font-bold">{submission.estimatedTime}h</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Actual Time</Label>
              <p className="text-2xl font-bold">{submission.actualTime}h</p>
            </div>
          </div>

          {submission.attachments.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Attachments</Label>
              <div className="mt-2 space-y-2">
                {submission.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <FileCheck className="w-4 h-4" />
                    <span className="text-sm">{attachment}</span>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{comment.commentBy}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {comment.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.commentDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm">{comment.comment}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t pt-4">
            <Label className="text-sm font-medium">Add Comment</Label>
            <Textarea
              placeholder="Enter your comment or feedback..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button 
              onClick={() => onAddComment(submission.id)}
              disabled={!newComment.trim()}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Add Comment
            </Button>
          </div>
        </TabsContent>

        {canVerify && submission.status === "submitted" && (
          <TabsContent value="verification" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Verification Score (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={verificationScore}
                  onChange={(e) => setVerificationScore(Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Quality Rating</Label>
                <Select value={qualityRating.toString()} onValueChange={(value) => setQualityRating(Number(value) as 1 | 2 | 3 | 4 | 5)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Poor</SelectItem>
                    <SelectItem value="2">2 - Fair</SelectItem>
                    <SelectItem value="3">3 - Good</SelectItem>
                    <SelectItem value="4">4 - Very Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Verification Notes</Label>
              <Textarea
                placeholder="Provide feedback and notes for this verification..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => onVerify(submission.id, "verify")}
                className="flex-1"
                disabled={!verificationScore}
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Verify & Approve
              </Button>
              <Button 
                variant="outline"
                onClick={() => onVerify(submission.id, "needs_revision")}
                className="flex-1"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Needs Revision
              </Button>
              <Button 
                variant="destructive"
                onClick={() => onVerify(submission.id, "reject")}
                className="flex-1"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}