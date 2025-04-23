"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from "firebase/auth"
import { auth, createRecaptchaVerifier } from "@/app/lib/firebase/firebase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { supabase } from "@/app/lib/supabase/supabase-client"

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [verificationId, setVerificationId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [step, setStep] = useState(1) // 1: Phone number, 2: OTP
  const router = useRouter()
  const [supabaseReady, setSupabaseReady] = useState(false)

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

  const formatPhoneNumber = (phone: string) => {
    // Ensure phone number is in E.164 format (e.g., +1234567890)
    if (!phone.startsWith("+")) {
      return `+${phone}`
    }
    return phone
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber)

      // Create recaptcha verifier
      const recaptchaVerifier = createRecaptchaVerifier("recaptcha-container")

      // Send OTP via Firebase
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, recaptchaVerifier)

      setVerificationId(confirmationResult.verificationId)
      setSuccess("OTP sent successfully!")
      setStep(2)
    } catch (err: any) {
      console.error("Error sending OTP:", err)
      setError(err.message || "Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Create credential with verification ID and OTP
      const credential = PhoneAuthProvider.credential(verificationId, otp)

      // Sign in with credential
      const userCredential = await signInWithCredential(auth, credential)
      const user = userCredential.user

      if (!supabaseReady) {
        throw new Error("Database connection is not ready. Please try again later.")
      }

      // Check if user exists in Supabase
      const { data: existingUser, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("phone", user.phoneNumber)
        .maybeSingle()

      if (userError && userError.code !== "PGRST116") {
        throw new Error("Failed to check user")
      }

      if (!existingUser) {
        // Create new user in Supabase
        const { error } = await supabase.from("users").insert([{ phone: user.phoneNumber }])

        if (error) {
          throw new Error("Failed to create user")
        }
      }

      setSuccess("Login successful!")

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Error verifying OTP:", err)
      setError(err.message || "Failed to verify OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // For demo purposes, let's add a bypass login option
  const handleBypassLogin = async () => {
    setLoading(true)
    setError("")

    try {
      if (!supabaseReady) {
        throw new Error("Database connection is not ready. Please try again later.")
      }

      // Create a user in Supabase if it doesn't exist
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber)

      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("phone", formattedPhoneNumber)
        .maybeSingle()

      if (userError && userError.code !== "PGRST116") {
        throw new Error("Failed to check user")
      }

      if (!existingUser) {
        // Create new user in Supabase
        const { error } = await supabase.from("users").insert([{ phone: formattedPhoneNumber }])

        if (error) {
          throw new Error("Failed to create user")
        }
      }

      // Store phone number in localStorage for demo purposes
      localStorage.setItem("demoUser", formattedPhoneNumber)

      setSuccess("Demo login successful!")

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Error with demo login:", err)
      setError(err.message || "Failed to login. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to Todo App</CardTitle>
          <CardDescription>
            {step === 1 ? "Enter your phone number to receive an OTP" : "Enter the OTP sent to your phone"}
          </CardDescription>
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

          {step === 1 ? (
            <form onSubmit={handleSendOTP}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <div id="recaptcha-container"></div>
                <Button type="submit" disabled={loading || !supabaseReady}>
                  {loading ? "Sending..." : "Send OTP"}
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBypassLogin}
                  disabled={loading || !supabaseReady || !phoneNumber}
                >
                  Demo Login (Skip OTP)
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading || !supabaseReady}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {step === 2 && (
            <Button variant="link" onClick={() => setStep(1)} disabled={loading}>
              Change Phone Number
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
