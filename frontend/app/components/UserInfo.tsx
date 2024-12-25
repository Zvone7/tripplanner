'use client'

import { useState, useEffect } from 'react'
import { User } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip"

interface UserData {
  name: string;
  email: string;
}

export function UserInfo() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const res = await fetch("/api/account/info", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
        });
        if (res.status === 307) {
          console.error("Redirect detected. Location:", res.headers.get("Location"));
        }
        if (res.ok) {
          const userData: UserData = await res.json();
          setUser(userData);
        }
        // if (res.status === 401), redirect to root
        if(res.status === 401 && window.location.pathname !== "/") {
          window.location.href = "/";
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    }

    fetchUserInfo();
  }, []);

  if (!user) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4" />
            <span>{user.name.split(' ')[0]}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{user.email}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}