"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { supabase } from "@/app/lib/supabase/supabase-client"
import ProtectedRoute from "@/app/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function NewBoardPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [supabaseReady, setSupabaseReady] = useState(false)
  const { userProfile } = useAuth()
  const router = useRouter()

  // Check if Supabase is ready
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        // Simple test query to check if Supabase is working
        const { error } = await supabase.from("users").select("count", { count: "exact", head: true })

        if (error) {
          console.error("Supabase connection error:", error)
          setError("Database connection error. Please try again later.")
        } else {
          setSupabaseReady(true)
        }
      } catch (err) {
        console.error("Failed to connect to database:", err)
        setError("Database connection error. Please try again later.")
      }
    }

    checkSupabase()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (!userProfile) {
      setError("You must be logged in to create a board")
      setLoading(false)
      return
    }

    if (!supabaseReady) {
      setError("Database connection is not ready. Please try again later.")
      setLoading(false)
      return
    }

    try {
      // Create new board
      const { data, error: createError } = await supabase
        .from("boards")
        .insert([
          {
            title,
            description,
            owner_id: userProfile.id,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      // Add owner as a board member with 'owner' role
      const { error: memberError } = await supabase.from("board_members").insert([
        {
          board_id: data.id,
          user_id: userProfile.id,
          role: "owner",
        },
      ])

      if (memberError) throw memberError

      setSuccess("Board created successfully!")

      // Redirect to the new board after a short delay
      setTimeout(() => {
        router.push(`/boards/${data.id}`)
      }, 1000)
    } catch (err: any) {
      console.error("Error creating board:", err)
      setError(err.message || "Failed to create board. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Board</CardTitle>
            <CardDescription>Create a new board to organize your tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Board Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Enter board title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter board description"
                    rows={4}
                  />
                </div>
                <Button type="submit" disabled={loading || !supabaseReady}>
                  {loading ? "Creating..." : "Create Board"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
