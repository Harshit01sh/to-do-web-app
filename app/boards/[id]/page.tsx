"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { supabase } from "@/app/lib/supabase/supabase-client"
import { withRetry } from "@/app/lib/utils/query-with-retry"
import ProtectedRoute from "@/app/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle, Clock, PlusCircle, Trash2, Users, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface Board {
  id: string
  title: string
  description: string
  owner_id: string
}

interface Todo {
  id: string
  title: string
  description: string
  status: "pending" | "in_progress" | "completed"
  due_date: string | null
  assigned_to: string | null
  created_by: string
}

interface BoardMember {
  id: string
  user_id: string
  role: string
  users: {
    id: string
    name: string
    phone: string
  }
}

export default function BoardDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const { userProfile } = useAuth()
  const router = useRouter()

  const [board, setBoard] = useState<Board | null>(null)
  const [todos, setTodos] = useState<Todo[]>([])
  const [members, setMembers] = useState<BoardMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [retrying, setRetrying] = useState(false)

  const [newTodoTitle, setNewTodoTitle] = useState("")
  const [newTodoDescription, setNewTodoDescription] = useState("")
  const [newTodoStatus, setNewTodoStatus] = useState<"pending" | "in_progress" | "completed">("pending")
  const [newTodoDueDate, setNewTodoDueDate] = useState("")
  const [newTodoAssignee, setNewTodoAssignee] = useState("")

  const [invitePhone, setInvitePhone] = useState("")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [newTodoDialogOpen, setNewTodoDialogOpen] = useState(false)

  const [activeTab, setActiveTab] = useState("all")

  // Function to fetch board data with retry logic
  const fetchBoardData = async () => {
    if (!userProfile) return

    setLoading(true)
    setError("")

    try {
      // If the ID is "new", redirect to the new board page
      if (id === "new") {
        router.push("/boards/new")
        return
      }

      // Fetch board details with retry
      const boardData = await withRetry(async () => {
        const { data, error } = await supabase.from("boards").select("*").eq("id", id).single()
        if (error) throw error
        return data
      })

      setBoard(boardData)

      // Check if user is a member of this board with retry
      try {
        const memberData = await withRetry(async () => {
          const { data, error } = await supabase
            .from("board_members")
            .select("*")
            .eq("board_id", id)
            .eq("user_id", userProfile.id)
            .single()

          if (error && error.code !== "PGRST116") {
            throw error
          }
          return data
        })

        if (!memberData && boardData.owner_id !== userProfile.id) {
          router.push("/dashboard")
          return
        }
      } catch (err) {
        console.error("Error checking membership:", err)
        // Continue anyway if this fails, as the user might be the owner
      }

      // Fetch todos with retry
      const todoData = await withRetry(async () => {
        const { data, error } = await supabase
          .from("todos")
          .select("*")
          .eq("board_id", id)
          .order("created_at", { ascending: false })

        if (error) throw error
        return data || []
      })

      setTodos(todoData)

      // Fetch board members with retry
      const membersData = await withRetry(async () => {
        const { data, error } = await supabase
          .from("board_members")
          .select(`
            id,
            user_id,
            role,
            users (
              id,
              name,
              phone
            )
          `)
          .eq("board_id", id)

        if (error) throw error
        return data || []
      })

      setMembers(membersData)
    } catch (err: any) {
      console.error("Error fetching board data:", err)
      setError(err.message || "Failed to load board data. Please try again.")
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }

  useEffect(() => {
    if (userProfile && id !== "new") {
      fetchBoardData()
    } else if (id === "new") {
      router.push("/boards/new")
    } else {
      setLoading(false)
    }
  }, [id, userProfile, router])

  const handleRetry = () => {
    setRetrying(true)
    fetchBoardData()
  }

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userProfile || !board) return

    try {
      const { data, error } = await withRetry(async () => {
        const { data, error } = await supabase
          .from("todos")
          .insert([
            {
              board_id: board.id,
              title: newTodoTitle,
              description: newTodoDescription,
              status: newTodoStatus,
              due_date: newTodoDueDate || null,
              assigned_to: newTodoAssignee || null,
              created_by: userProfile.id,
            },
          ])
          .select()
          .single()

        if (error) throw error
        return { data, error }
      })

      setTodos([data, ...todos])
      setNewTodoTitle("")
      setNewTodoDescription("")
      setNewTodoStatus("pending")
      setNewTodoDueDate("")
      setNewTodoAssignee("")
      setNewTodoDialogOpen(false)
    } catch (err: any) {
      console.error("Error creating todo:", err)
      setError(err.message || "Failed to create todo")
    }
  }

  const handleUpdateTodoStatus = async (todoId: string, newStatus: "pending" | "in_progress" | "completed") => {
    try {
      await withRetry(async () => {
        const { error } = await supabase.from("todos").update({ status: newStatus }).eq("id", todoId)
        if (error) throw error
      })

      setTodos(todos.map((todo) => (todo.id === todoId ? { ...todo, status: newStatus } : todo)))
    } catch (err: any) {
      console.error("Error updating todo status:", err)
      setError(err.message || "Failed to update todo status")
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await withRetry(async () => {
        const { error } = await supabase.from("todos").delete().eq("id", todoId)
        if (error) throw error
      })

      setTodos(todos.filter((todo) => todo.id !== todoId))
    } catch (err: any) {
      console.error("Error deleting todo:", err)
      setError(err.message || "Failed to delete todo")
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userProfile || !board) return

    try {
      // Check if user exists
      const userData = await withRetry(async () => {
        const { data, error } = await supabase.from("users").select("id").eq("phone", invitePhone).single()

        if (error) {
          if (error.code === "PGRST116") {
            throw new Error("User with this phone number does not exist")
          }
          throw error
        }

        return data
      })

      // Check if user is already a member
      try {
        const existingMember = await withRetry(async () => {
          const { data, error } = await supabase
            .from("board_members")
            .select("id")
            .eq("board_id", board.id)
            .eq("user_id", userData.id)
            .single()

          if (error && error.code !== "PGRST116") {
            throw error
          }

          return data
        })

        if (existingMember) {
          setError("User is already a member of this board")
          return
        }
      } catch (err: any) {
        // If error is not "no rows returned", rethrow
        if (err.message !== "User with this phone number does not exist" && err.code !== "PGRST116") {
          throw err
        }
      }

      // Add user as a member
      await withRetry(async () => {
        const { error } = await supabase.from("board_members").insert([
          {
            board_id: board.id,
            user_id: userData.id,
            role: "member",
          },
        ])

        if (error) throw error
      })

      // Refresh members list
      const membersData = await withRetry(async () => {
        const { data, error } = await supabase
          .from("board_members")
          .select(`
            id,
            user_id,
            role,
            users (
              id,
              name,
              phone
            )
          `)
          .eq("board_id", id)

        if (error) throw error
        return data || []
      })

      setMembers(membersData)
      setInvitePhone("")
      setInviteDialogOpen(false)
    } catch (err: any) {
      console.error("Error inviting member:", err)
      setError(err.message || "Failed to invite member")
    }
  }

  const filteredTodos = todos.filter((todo) => {
    if (activeTab === "all") return true
    return todo.status === activeTab
  })

  const isOwner = board?.owner_id === userProfile?.id

  // If the ID is "new", show a loading state until the redirect happens
  if (id === "new") {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
            <p className="text-gray-500">Taking you to the new board page</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <div className="flex flex-col">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              <Button variant="outline" size="sm" className="mt-2 self-start" onClick={handleRetry} disabled={retrying}>
                {retrying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  "Try Again"
                )}
              </Button>
            </div>
          </Alert>
        )}

        {board && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold">{board.title}</h1>
                {board.description && <p className="text-gray-500 mt-2">{board.description}</p>}
              </div>
              <div className="flex gap-2">
                <Dialog open={newTodoDialogOpen} onOpenChange={setNewTodoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                      <DialogDescription>Add a new task to this board</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTodo}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="title">Task Title</Label>
                          <Input
                            id="title"
                            value={newTodoTitle}
                            onChange={(e) => setNewTodoTitle(e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description (Optional)</Label>
                          <Textarea
                            id="description"
                            value={newTodoDescription}
                            onChange={(e) => setNewTodoDescription(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="status">Status</Label>
                          <Select value={newTodoStatus} onValueChange={(value: any) => setNewTodoStatus(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="dueDate">Due Date (Optional)</Label>
                          <Input
                            id="dueDate"
                            type="date"
                            value={newTodoDueDate}
                            onChange={(e) => setNewTodoDueDate(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="assignee">Assign To (Optional)</Label>
                          <Select value={newTodoAssignee} onValueChange={setNewTodoAssignee}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {members.map((member) => (
                                <SelectItem key={member.user_id} value={member.user_id}>
                                  {member.users.name || member.users.phone}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Create Task</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {isOwner && (
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Users className="mr-2 h-4 w-4" />
                        Invite
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Member</DialogTitle>
                        <DialogDescription>Invite a user to collaborate on this board</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleInviteMember}>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+1234567890"
                              value={invitePhone}
                              onChange={(e) => setInvitePhone(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Invite</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            <div className="mb-6">
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {filteredTodos.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredTodos.map((todo) => (
                  <Card key={todo.id} className="overflow-hidden">
                    <div
                      className={`h-2 ${
                        todo.status === "completed"
                          ? "bg-green-500"
                          : todo.status === "in_progress"
                            ? "bg-blue-500"
                            : "bg-orange-500"
                      }`}
                    ></div>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{todo.title}</h3>
                          {todo.description && <p className="text-gray-600 mb-4">{todo.description}</p>}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge
                              variant={
                                todo.status === "completed"
                                  ? "default"
                                  : todo.status === "in_progress"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {todo.status === "completed" && <CheckCircle className="mr-1 h-3 w-3" />}
                              {todo.status === "in_progress" && <Clock className="mr-1 h-3 w-3" />}
                              {todo.status.replace("_", " ")}
                            </Badge>

                            {todo.due_date && (
                              <Badge variant="outline">Due: {new Date(todo.due_date).toLocaleDateString()}</Badge>
                            )}

                            {todo.assigned_to && (
                              <Badge variant="outline">
                                Assigned to:{" "}
                                {members.find((m) => m.user_id === todo.assigned_to)?.users.name ||
                                  members.find((m) => m.user_id === todo.assigned_to)?.users.phone ||
                                  "Unknown"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={todo.status}
                            onValueChange={(value: any) => handleUpdateTodoStatus(todo.id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTodo(todo.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-medium mb-2">No tasks found</h3>
                <p className="text-gray-500 mb-6">
                  {activeTab === "all"
                    ? "Create your first task to get started"
                    : `No ${activeTab.replace("_", " ")} tasks found`}
                </p>
                <Button onClick={() => setNewTodoDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
            )}

            {members.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Board Members</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{member.users.name || "Unnamed User"}</p>
                          <p className="text-sm text-gray-500">{member.users.phone}</p>
                        </div>
                        <Badge>{member.role}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}
