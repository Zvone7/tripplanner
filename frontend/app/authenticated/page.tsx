'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Authenticated() {
  const router = useRouter();

  useEffect(() => {
    console.log("Checking authentication...");

    fetch("/api/account/info", {
      method: "GET",
      credentials: "include", // ✅ Ensures authentication cookies are used
    })
      .then((res) => {
        console.log("Response Headers:", [...res.headers.entries()]); // ✅ Log all response headers
        console.log("Set-Cookie Header:", res.headers.get("Set-Cookie")); // ✅ Log Set-Cookie header

        if (!res.ok) {
          throw new Error("Authentication failed");
        }
        return res.json();
      })
      .then((data) => {
        console.log("User authenticated:", data);
        document.cookie.split(";").forEach((cookie) => {
          console.log("Stored Cookie:", cookie.trim()); // ✅ Log all cookies available in the browser
        });

        router.push("/trips"); // Redirect to trips page
      })
      .catch((err) => {
        console.error("Authentication failed", err);
        document.cookie.split(";").forEach((cookie) => {
          console.log("Stored Cookie:", cookie.trim()); // ✅ Log cookies in case of failure
        });
        router.push("/"); // Redirect back to home on failure
      });
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-4">Authenticating...</h1>
      <p>Please wait while we verify your login...</p>
    </div>
  );
}
