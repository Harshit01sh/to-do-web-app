/**
 * Executes a function with retry logic
 * @param fn The function to execute
 * @param retries Number of retries
 * @param delay Delay between retries in ms
 * @returns The result of the function
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn()
  } catch (error: any) {
    // Check if we should retry
    if (retries > 0) {
      // If it's a timeout or network error, retry
      if (
        error.message?.includes("timeout") ||
        error.message?.includes("network") ||
        error.message?.includes("fetch") ||
        error.code === "PGRST301" // Supabase timeout error
      ) {
        console.log(`Retrying... (${retries} attempts left)`)
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay))
        // Retry with one less retry and increased delay
        return withRetry(fn, retries - 1, delay * 1.5)
      }
    }

    // If we shouldn't retry or ran out of retries, throw the error
    throw error
  }
}
