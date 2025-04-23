"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/app/lib/firebase/firebase-client"
import { supabase } from "@/app/lib/supabase/supabase-client"

interface AuthContextType {
  user: User | null
  loading: boolean
  userProfile: any | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userProfile: null,
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for demo user in localStorage
    const demoUser = localStorage.getItem("demoUser")

    const fetchUserProfile = async (phoneNumber: string) => {
      try {
        // Get user profile from Supabase
        const { data, error } = await supabase.from("users").select("*").eq("phone", phoneNumber).maybeSingle()

        if (error) {
          console.error("Supabase error fetching user profile:", error)
          return null
        }

        if (data) {
          return data
        }

        // If no user found, create one for demo purposes
        if (demoUser) {
          try {
            const { data: newUser, error: createError } = await supabase
              .from("users")
              .insert([{ phone: phoneNumber }])
              .select()
              .single()

            if (createError) {
              console.error("Error creating user:", createError)
              return null
            }

            return newUser
          } catch (createErr) {
            console.error("Exception creating user:", createErr)
            return null
          }
        }

        return null
      } catch (err) {
        console.error("Error in fetchUserProfile:", err)
        return null
      }
    }

    // Function to handle auth state changes
    const handleAuthStateChange = async (firebaseUser: User | null) => {
      setUser(firebaseUser)

      try {
        if (firebaseUser) {
          const profile = await fetchUserProfile(firebaseUser.phoneNumber!)
          setUserProfile(profile)
        } else if (demoUser) {
          // If we have a demo user but no Firebase user, use the demo user
          const profile = await fetchUserProfile(demoUser)
          setUserProfile(profile)

          // Create a mock user object
          setUser({
            phoneNumber: demoUser,
            uid: "demo-user",
          } as unknown as User)
        } else {
          setUserProfile(null)
        }
      } catch (err) {
        console.error("Error handling auth state change:", err)
      } finally {
        setLoading(false)
      }
    }

    // Initialize demo user if needed
    const initDemoUser = async () => {
      if (demoUser && !user) {
        try {
          const profile = await fetchUserProfile(demoUser)
          setUserProfile(profile)

          // Create a mock user object
          setUser({
            phoneNumber: demoUser,
            uid: "demo-user",
          } as unknown as User)
        } catch (err) {
          console.error("Error initializing demo user:", err)
        } finally {
          setLoading(false)
        }
      }
    }

    // Set up Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange)

    // Initialize demo user if needed
    initDemoUser()

    return () => unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user, loading, userProfile }}>{children}</AuthContext.Provider>
}
