'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TestApiButton } from '../components/TestApiButton';
import { getServerStartTime } from '../lib/serverTime';
import Link from 'next/link';

export default function Authenticated() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<string | null>(null);

  const serverStartTime = getServerStartTime();
  const frontendUrl= process.env.NEXT_PUBLIC_FRONTEND_ROOT_URL || 'not set';
  const backendUrl= process.env.NEXT_PUBLIC_BACKEND_ROOT_URL || 'not set';
  const envCode= process.env.NEXT_PUBLIC_ENV_CODE || 'unknown';
  const buildNumber= process.env.NEXT_PUBLIC_BUILD_NUMBER || 'unknown';
  useEffect(() => {

    var startTime = getServerStartTime();
    console.log("Server start time: "+startTime);

    console.log("Checking authentication...");

    fetch(`/api/account/info`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
            console.log("Response Headers:", [...res.headers.entries()]);
            console.log("Set-Cookie Header:", res.headers.get("Set-Cookie"));
          throw new Error("Authentication failed");
        }
        else{
        }
        return res.json();
      })
      .then((data) => {
        console.log("User authenticated:", data);
        setAuthStatus(`Authenticated as: ${data.email || "Unknown"}`);
      })
      .catch((err) => {
        console.error("Authentication failed", err);
        setAuthStatus("Not authenticated");
      });
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <Link href="/" className="text-blue-500 hover:underline mb-8">
        Back to TripPlanner
      </Link>
      
      <TestApiButton />
      
      <div className="mt-8 text-sm text-gray-500">
        <p>{authStatus || "Checking..."}</p>
        <p>Server start time: {serverStartTime} (utc)</p>
        <p>Environment: {envCode}, Build: {buildNumber}</p>
        <p>Frontend URL: {frontendUrl}</p>
        <p>Backend URL: {backendUrl}</p>
      </div>
    </div>
  );
}