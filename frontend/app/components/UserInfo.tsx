"use client"

import { useState, useEffect } from "react"
import { User, LogOut } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip"
import { Button } from "../components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface UserData {
  name: string
  email: string
}

export function UserInfo() {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const res = await fetch("/api/account/info", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })

        if (res.status === 307) {
          console.error("Redirect detected. Location:", res.headers.get("Location"))
        }

        if (res.ok) {
          const userData: UserData = await res.json()
          setUser(userData)
        }

        if (res.status === 401 && window.location.pathname !== "/" && window.location.pathname !== "/status") {
          window.location.href = "/"
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error)
      }
    }

    fetchUserInfo()
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const res = await fetch("/api/account/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })

      if (res.ok) {
        setUser(null)
        router.push("/")
      } else {
        console.error("Logout failed")
      }
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex items-center gap-4 group">
      {user && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/profile">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="w-4 h-4" />
                  <span>{user.name.split(" ")[0]}</span>
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.email}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex items-center gap-1 text-xs"
      >
        <span className=" opacity-0 group-hover:opacity-100 transition-opacity">Logout</span>
        <LogOut className="w-3 h-3" />
      </Button>
    </div>
  )
}
