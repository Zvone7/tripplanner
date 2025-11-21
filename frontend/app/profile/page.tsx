"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Skeleton } from "../components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeftIcon, CheckIcon, SaveIcon } from "lucide-react"
import { TimezoneSelector } from "../components/TimeZoneSelector"
import { CurrencyDropdown } from "../components/CurrencyDropdown"
import type { User, PendingUser } from "../types/models"
import { userApi } from "../utils/apiClient"
import { getDefaultCurrencyId, useCurrencies } from "../hooks/useCurrencies"

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState<Record<string, boolean>>({})
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preferredUtcOffset, setPreferredUtcOffset] = useState(0)
  const [preferredCurrencyId, setPreferredCurrencyId] = useState<number | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { currencies, isLoading: isLoadingCurrencies } = useCurrencies()
  const defaultCurrencyId = useMemo(() => getDefaultCurrencyId(currencies), [currencies])

  const fetchPendingApprovals = useCallback(async () => {
    try {
      const pendingData = await userApi.getPendingApprovals()
      setPendingUsers(pendingData)
    } catch (err) {
      console.error("Error fetching pending approvals:", err)
      toast({
        title: "Error",
        description: "Failed to load pending user approvals",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await userApi.getAccountInfo()
        setUser(userData)
        setPreferredUtcOffset(userData.userPreference?.preferredUtcOffset || 0)
        setPreferredCurrencyId(userData.userPreference?.preferredCurrencyId ?? null)

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
  }, [fetchPendingApprovals])

  // Handle user approval
  const handleApproveUser = async (userId: string) => {
    setIsApproving((prev) => ({ ...prev, [userId]: true }))

    try {
      await userApi.approveUser(userId)

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

  useEffect(() => {
    if (preferredCurrencyId !== null) return
    const fromUser = user?.userPreference?.preferredCurrencyId
    if (typeof fromUser === "number" && fromUser > 0) {
      setPreferredCurrencyId(fromUser)
      return
    }
    if (defaultCurrencyId) {
      setPreferredCurrencyId(defaultCurrencyId)
    }
  }, [user?.userPreference?.preferredCurrencyId, defaultCurrencyId, preferredCurrencyId])

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true)

    const currencyIdForSave = preferredCurrencyId ?? defaultCurrencyId
    if (!currencyIdForSave) {
      toast({
        title: "Error",
        description: "Please select a preferred currency before saving",
        variant: "destructive",
      })
      setIsSavingPreferences(false)
      return
    }

    try {
      await userApi.updatePreference({
        preferredUtcOffset,
        preferredCurrencyId: currencyIdForSave,
      })

      if (user) {
        setUser({
          ...user,
          userPreference: {
            preferredUtcOffset: preferredUtcOffset,
            preferredCurrencyId: currencyIdForSave,
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

  const currentCurrencySelection = preferredCurrencyId ?? defaultCurrencyId ?? null
  const baselineCurrencyId = user?.userPreference?.preferredCurrencyId ?? defaultCurrencyId ?? null
  const baselineOffset = user?.userPreference?.preferredUtcOffset ?? 0
  const preferenceChanged =
    preferredUtcOffset !== baselineOffset || (currentCurrencySelection ?? baselineCurrencyId) !== baselineCurrencyId
  const saveDisabled = isSavingPreferences || !preferenceChanged || !currentCurrencySelection

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
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">Preferred Currency</p>
              {isLoadingCurrencies ? (
                <Skeleton className="h-10 w-64" />
              ) : (
                <CurrencyDropdown
                  value={currentCurrencySelection}
                  onChange={setPreferredCurrencyId}
                  currencies={currencies}
                  placeholder="Select currency"
                  triggerClassName="w-full md:w-64"
                />
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSavePreferences}
            disabled={saveDisabled}
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
