"use client"

import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, RecaptchaVerifier } from "firebase/auth"
import { firebaseConfig } from "./firebase-config"

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)

// Create a RecaptchaVerifier instance
export const createRecaptchaVerifier = (elementId: string) => {
  return new RecaptchaVerifier(auth, elementId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved, allow signInWithPhoneNumber.
    },
  })
}

export { app, auth }
