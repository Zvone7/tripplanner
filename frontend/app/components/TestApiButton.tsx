'use client'

import { useState } from 'react'
import { Button } from "../components/ui/button"
import { toast } from "../components/ui/use-toast"

export function TestApiButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    console.log(process.env);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_ROOT_URL || "https://dev-wapp-tripplanner-be-e9eyezate0caefes.northeurope-01.azurewebsites.net";
    console.log("be_"+backendUrl);
    console.log("fe_"+process.env.NEXT_PUBLIC_FRONTEND_ROOT_URL);
    try {
      const response = await fetch('/api/home/test1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('API request failed')
      }

      const data = await response.text()
      console.log("data:"+data);
      toast({
        title: "API Test Successful",
        description: 'API request was successful, response: ' + data,
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "API Test Failed",
        description: "There was an error communicating with the API."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleClick} 
      disabled={isLoading}
      className="mt-4"
    >
      {isLoading ? "Testing..." : "Test API"}
    </Button>
  )
}