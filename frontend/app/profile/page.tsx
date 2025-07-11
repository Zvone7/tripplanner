"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Skeleton } from "../components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeftIcon, CheckIcon, SaveIcon } from "lucide-react"
import { TimezoneSelector } from "../components/TimeZoneSelector"

interface UserPreference {
  preferredUtcOffset: number
}

interface User {
  id: string
  name: string
  email: string
  role: string
  imageUrl?: string
  userPreference: UserPreference
}

interface PendingUser {
  id: string
  name: string
  email: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState<Record<string, boolean>>({})
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preferredUtcOffset, setPreferredUtcOffset] = useState(0)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/account/info")
        if (!response.ok) {
          throw new Error("Failed to fetch user data")
        }
        const userData = await response.json()
        setUser(userData)
        setPreferredUtcOffset(userData.userPreference?.preferredUtcOffset || 0)

        if (userData.role === "admin") {
          fetchPendingApprovals()
        }
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError("Failed to load user profile")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Fetch pending approvals for admin users
  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch("/api/user/pendingapprovals")
      if (!response.ok) {
        throw new Error("Failed to fetch pending approvals")
      }
      const pendingData = await response.json()
      setPendingUsers(pendingData)
    } catch (err) {
      console.error("Error fetching pending approvals:", err)
      toast({
        title: "Error",
        description: "Failed to load pending user approvals",
        variant: "destructive",
      })
    }
  }

  // Handle user approval
  const handleApproveUser = async (userId: string) => {
    setIsApproving((prev) => ({ ...prev, [userId]: true }))

    try {
      const response = await fetch(`/api/user/approveuser?userIdToApprove=${userId}`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to approve user")
      }

      // Remove approved user from the list
      setPendingUsers((prev) => prev.filter((user) => user.id !== userId))

      toast({
        title: "Success",
        description: "User has been approved",
        variant: "default",
      })
    } catch (err) {
      console.error("Error approving user:", err)
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive",
      })
    } finally {
      setIsApproving((prev) => ({ ...prev, [userId]: false }))
    }
  }

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true)

    try {
      const response = await fetch("/api/user/UpdateUserPreference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferredUtcOffset: preferredUtcOffset,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update user preferences")
      }

      if (user) {
        setUser({
          ...user,
          userPreference: {
            preferredUtcOffset: preferredUtcOffset,
          },
        })
      }

      toast({
        title: "Success",
        description: "User preferences updated successfully",
        variant: "default",
      })
    } catch (err) {
      console.error("Error updating user preferences:", err)
      toast({
        title: "Error",
        description: "Failed to update user preferences",
        variant: "destructive",
      })
    } finally {
      setIsSavingPreferences(false)
    }
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => router.push("/")}>Return to Home</Button>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Button variant="outline" className="mb-6" onClick={() => router.back()}>
        <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back
      </Button>

      {/* User Profile Card */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center gap-4">
          <div>
            <CardTitle className="text-2xl">{user?.name}</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </div>
          <Badge className="ml-auto" variant={user?.role === "admin" ? "default" : "outline"}>
            {user?.role}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-medium">{user?.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{user?.role}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Preferences</h3>
            <TimezoneSelector
              label="Preferred Timezone"
              value={preferredUtcOffset}
              onChange={setPreferredUtcOffset}
              id="preferred-timezone"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSavePreferences}
            disabled={isSavingPreferences || preferredUtcOffset === (user?.userPreference?.preferredUtcOffset || 0)}
          >
            {isSavingPreferences ? (
              <span className="flex items-center">
                <Skeleton className="h-4 w-4 rounded-full mr-2 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center">
                <SaveIcon className="mr-2 h-4 w-4" />
                Save Preferences
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>

      {user?.role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>Pending User Approvals</CardTitle>
            <CardDescription>Approve new users who have registered for the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">No pending approvals</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((pendingUser) => (
                    <TableRow key={pendingUser.id}>
                      <TableCell className="font-mono text-xs">{pendingUser.id}</TableCell>
                      <TableCell>{pendingUser.name}</TableCell>
                      <TableCell>{pendingUser.email}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleApproveUser(pendingUser.id)}
                          disabled={isApproving[pendingUser.id]}
                        >
                          {isApproving[pendingUser.id] ? (
                            <span className="flex items-center">
                              <Skeleton className="h-4 w-4 rounded-full mr-2 animate-spin" />
                              Approving...
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <CheckIcon className="mr-2 h-4 w-4" />
                              Approve
                            </span>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="ml-auto" onClick={fetchPendingApprovals}>
              Refresh List
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Skeleton className="h-10 w-24 mb-6" />

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
          <Skeleton className="h-6 w-20 ml-auto" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-5 w-40" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-60 mb-2" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
