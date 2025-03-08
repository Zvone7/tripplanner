'use client'

import { useState } from 'react'
import { Button } from "../components/ui/button"

interface LoginButtonProps {
  backendUrl: string;
}

export function LoginButton({ backendUrl }: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      console.log("backendUrl:"+backendUrl);
      // Create a form element
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = `${backendUrl}/api/Account/Login`;
      
      // This will include cookies in the request
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleLogin} 
      disabled={isLoading}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      {isLoading ? "Connecting..." : "Login with Google"}
    </Button>
  );
}