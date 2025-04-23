"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for demo user in localStorage
    const demoUser = localStorage.getItem("demoUser")

    const checkAuth = async () => {
      try {
        if (!loading && !user && !demoUser) {
          router.push("/login")
        }
      } catch (err) {
        console.error("Error in protected route:", err)
        setError("Authentication error. Please try logging in again.")
      }
    }

    checkAuth()
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button className="mt-4" onClick={() => router.push("/login")}>
              Back to Login
            </Button>
          </Alert>
        </div>
      </div>
    )
  }

  if (!user && !localStorage.getItem("demoUser")) {
    return null
  }

  return <>{children}</>
}
