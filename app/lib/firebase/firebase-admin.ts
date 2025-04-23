import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

const serviceAccount = {
  type: "service_account",
  project_id: "todo-web-app-62426",
  private_key_id: "2910083f91c22f7b371a6a27cfc3388484a0c478",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCmVkRI0YMvkomv\nD84EBTosYhsabFdCvtu9lTvkxMoYv76zcL34kjeleuuvORkZZ+4nf4aUiLuH2gNe\nqwfSY6LbuvpgvBEPmYfauHb0TPcLXwbkSgcJP60nYk01cx0/5nuZXnRnnC8X/854\naDVv+M+j3Pk7d2ckaODUY8OwD6WNrQeQmDfyBgmtZEBeHNcTCjb3oAdhQKlTHhaM\nyZ5rXvuszX/zfoLGhtjyO6QgkmplgkTyjLEAdwt4ZUH0qwYF3q5e148qPMjeF0j8\nliEEguZZyunDassWUsUf0/Aas9jmWASs4bApEG3IQERleavNd6flC1r1t8xW47va\nO6LqCmpFAgMBAAECggEAFj8BYO/MaMdjbKtjdTwxvI/eahlFTmLyRpe36++5y7eR\nTLRuY9lCYfpfnQ644aH5wwSWPjVPR2sL+lRLdoLm3BZUuC1O5tQ0zDbRifjlLXsn\nE88mw8DlapgGFXjw14P+0dNFJDpKPh5zQb1GMFSJiLPcDWz5uW/haeZx3JErJhhf\n7yzV6plSLOrfV/RPYEsiKm/wPiuJKM64PS1+iIy8rRRhDPWUfRy8qIvaj9c35tth\nDci6+7bFw6HiRXTwlYClvooVVHQL1CbeexxmhKhi0H3pQBtSJbh11A9Ar6Kj1I95\nVg+oVWktERxZNjZxdpz4ickNa5spo85U8vJnlHD0AQKBgQDR2hMakOIYHg3VMNQ9\nx5kpBRMqioE65qs/inybbSp10xmgeD0/t8mjS0F9kC9Dc50JLegnTYgf3JeneHsB\nIThjJT2VSo03TJh2NaR4LXTj1k4Ud5HDuzdBLz8SI3HdvmFCWX+NjZbM6+e4R2al\nz8wzoG5hDYzJ+L2kNSak8551RQKBgQDK6nT16HMo5n11/RKkyN8BdZluWGeJonS8\nqs3huY+GhwuFBGwRAXF7emRnHt2ndC4UGaRAqxVuNffl6sJnXdKub5xCDtghBxeH\nVfl3+ZSNknMdYPoc6NTn5oCxQMqoFdi8u0Xo3OnMfNsX8c50ZFlgvFDTzTjYobwb\nZ4hJQ07xAQKBgGJOQ3bFenUL1zUQ28xZLaGus+zQ13stRfnNOVRiTmrFypKG4UJx\nKW9quLJGki2KAn2jWMbYpjUu1Ihqg0zjMBQaBQBj3UWThzSRKov113VIFmm2Hb3Q\nfTD3Hhe0LQpQviUj4gIA2y0CMhn8sNRqROHGfQ7QFy0ibkx3bbQGQCv1AoGAEa3n\nzt0X24Jpf/QywaS2uVvTqGePbdB3t1Bya65NMP1nJYnDGKA1kPqS8OEhkstukFXD\nl9bQITAWjzOrCHKGPqh+xsqgThBeHm6BM9DM/qC54t9mK0ql8iaFI+xvO8HbhmYS\nqz1EKYrfU/C/eiicGO+PY0TIJSfCSej1WNzCbgECgYAWXyzgpJQvzuhXfYS1csBd\nRLU3oT1pugO4L2bvMo+i2Ue7X4YevSJYwZg4p1mwdde+eYM2YIkXHO9pklG0Vr+7\n4B2UdNKpqQYXfEnb1j0p96WJo3zEZjUpIkEk6Xiu7pBdJezL9vFUCdwsRN0zwUxh\nE463v4h+Da/x6JMhbiD6mw==\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@todo-web-app-62426.iam.gserviceaccount.com",
  client_id: "107227907975640688416",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40todo-web-app-62426.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
}

// Initialize Firebase Admin
let app
if (!getApps().length) {
  app = initializeApp({
    credential: cert(serviceAccount as any),
  })
} else {
  app = getApps()[0]
}

export const adminAuth = getAuth(app)
