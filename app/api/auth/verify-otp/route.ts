import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/app/lib/supabase/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // Check if user exists in Supabase
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("phone", phoneNumber)
      .maybeSingle()

    if (userError) {
      console.error("Error checking user:", userError)
      return NextResponse.json({ error: "Failed to check user" }, { status: 500 })
    }

    if (!existingUser) {
      // Create new user in Supabase
      const { data: newUser, error } = await supabaseAdmin
        .from("users")
        .insert([{ phone: phoneNumber }])
        .select()
        .single()

      if (error) {
        console.error("Error creating user:", error)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }
    }

    // In a real implementation, we would verify the OTP with Firebase
    // and create a custom token for the user
    // For now, we'll simulate it by returning a success response

    return NextResponse.json({
      success: true,
      customToken: "simulated-token-for-demo-purposes",
    })
  } catch (error: any) {
    console.error("Error verifying OTP:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
