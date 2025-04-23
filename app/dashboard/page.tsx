"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/context/auth-context"
import { supabase } from "@/app/lib/supabase/supabase-client"
import { withRetry } from "@/app/lib/utils/query-with-retry"
import ProtectedRoute from "@/app/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

interface Board {
  id: string
  title: string
  description: string
  created_at: string
}

export default function DashboardPage() {
  const { user, userProfile } = useAuth()
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [retrying, setRetrying] = useState(false)

  const fetchBoards = async () => {
    if (!userProfile) return

    setLoading(true)
    setError("")

    try {
      // Get boards where user is owner with retry
      const data = await withRetry(async () => {
        const { data, error } = await supabase
          .from("boards")
          .select("*")
          .eq("owner_id", userProfile?.id)
          .order("created_at", { ascending: false })

        if (error) throw error
        return data || []
      })

      // Also get boards where user is a member with retry
      const memberBoards = await withRetry(async () => {
        const { data, error } = await supabase
          .from("board_members")
          .select("board_id, boards(*)")
          .eq("user_id", userProfile?.id)

        if (error) throw error
        return data || []
      })

      const memberBoardsData = memberBoards?.map((item) => item.boards) || []
      const allBoards = [...data, ...memberBoardsData]

      // Remove duplicates
      const uniqueBoards = Array.from(new Map(allBoards.map((board) => [board.id, board])).values())

      setBoards(uniqueBoards as Board[])
    } catch (error: any) {
      console.error("Error fetching boards:", error)
      setError(error.message || "Failed to load boards. Please try again.")
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }

  useEffect(() => {
    if (userProfile) {
      fetchBoards()
    } else {
      setLoading(false)
    }
  }, [user, userProfile])

  const handleRetry = () => {
    setRetrying(true)
    fetchBoards()
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Boards</h1>
          <Button asChild>
            <Link href="/boards/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Board
            </Link>
          </Button>
        </div>

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

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : boards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <Link href={`/boards/${board.id}`} key={board.id}>
                <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{board.title}</CardTitle>
                    <CardDescription>Created {new Date(board.created_at).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 line-clamp-2">{board.description || "No description"}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">No boards yet</h3>
            <p className="text-gray-500 mb-6">Create your first board to get started</p>
            <Button asChild>
              <Link href="/boards/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Board
              </Link>
            </Button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
