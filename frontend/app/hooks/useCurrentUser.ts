import { useEffect, useState } from "react"

import type { User } from "../types/models"
import { userApi } from "../utils/apiClient"

let cachedUser: User | null = null
let inflightRequest: Promise<User> | null = null

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(cachedUser)
  const [isLoading, setIsLoading] = useState<boolean>(!cachedUser)
  const [error, setError] = useState<string | null>(null)

  const runFetch = () => {
    if (!inflightRequest) {
      inflightRequest = userApi.getAccountInfo()
    }
    return inflightRequest
  }

  useEffect(() => {
    if (cachedUser) {
      setUser(cachedUser)
      setIsLoading(false)
      return
    }

    let isActive = true

    runFetch()
      ?.then((data) => {
        if (!isActive) return
        cachedUser = data
        setUser(data)
        setError(null)
      })
      .catch((err) => {
        if (!isActive) return
        console.error("Failed to load current user:", err)
        setError("Failed to load current user")
      })
      .finally(() => {
        if (!isActive) return
        setIsLoading(false)
        inflightRequest = null
      })

    return () => {
      isActive = false
    }
  }, [])

  return { user, isLoading, error }
}
