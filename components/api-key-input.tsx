"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Key, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void
}

export function ApiKeyInput({ onApiKeySet }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // 세션 스토리지에서 API 키 확인
    const savedApiKey = sessionStorage.getItem("openrouter_api_key")
    if (savedApiKey) {
      setApiKey(savedApiKey)
      setIsValid(true)
      onApiKeySet(savedApiKey)
    }
  }, [onApiKeySet])

  const validateApiKey = async (key: string) => {
    if (!key.trim()) {
      setError("API 키를 입력해주세요.")
      return false
    }

    if (key.length < 20) {
      setError("올바른 API 키 형식이 아닙니다.")
      return false
    }

    setIsValidating(true)
    setError("")

    try {
      // 간단한 API 키 형식 검증 (실제 API 호출 없이)
      const response = await fetch("/api/validate-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: key }),
      })

      if (response.ok) {
        setIsValid(true)
        sessionStorage.setItem("openrouter_api_key", key)
        onApiKeySet(key)
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.error || "API 키가 유효하지 않습니다.")
        return false
      }
    } catch (err) {
      setError("API 키 검증 중 오류가 발생했습니다.")
      return false
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await validateApiKey(apiKey)
  }

  const handleClearApiKey = () => {
    setApiKey("")
    setIsValid(false)
    setError("")
    sessionStorage.removeItem("openrouter_api_key")
    onApiKeySet("")
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          OpenRouter API 키 설정
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isValid ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                API 키가 설정되었습니다. 아이디어 생성을 시작할 수 있습니다!
              </AlertDescription>
            </Alert>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                value="••••••••••••••••••••••••••••••••"
                disabled
                className="font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearApiKey}
                className="text-red-600 hover:text-red-700"
              >
                변경
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="api-key" className="text-sm font-medium text-gray-700">
                OpenRouter API 키
              </label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="pr-10 font-mono"
                  disabled={isValidating}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                  disabled={isValidating}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isValidating || !apiKey.trim()}
              >
                {isValidating ? "검증 중..." : "API 키 설정"}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                API 키는 브라우저 세션에만 저장되며, 페이지를 새로고침하면 다시 입력해야 합니다.
              </p>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
} 