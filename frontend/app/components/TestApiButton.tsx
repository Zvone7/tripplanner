'use client'

import { useState } from 'react'
import { Button } from "../components/ui/button"
import { toast } from "../components/ui/use-toast"

export function TestApiButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
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