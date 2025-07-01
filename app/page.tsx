"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Sparkles, Settings } from "lucide-react"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { ApiKeyInput } from "@/components/api-key-input"

interface SavedIdea {
  id: string
  title: string
  content: string
  category: string
  timestamp: number
}

export default function AIIdeaGenerator() {
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([])
  const [selectedIdea, setSelectedIdea] = useState<SavedIdea | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [apiKey, setApiKey] = useState<string>("")
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [currentMessage, setCurrentMessage] = useState<string>("")
  const [likedIdeas, setLikedIdeas] = useState<Set<string>>(new Set())
  const [showLikeFeedback, setShowLikeFeedback] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string>("")
  const [sessionId, setSessionId] = useState<string>("")

  const categories = [
    { value: "startup", label: "스타트업 아이디어" },
    { value: "automation", label: "비즈니스 자동화 아이디어" },
    { value: "blog", label: "블로그 아이디어" },
    { value: "youtube", label: "유튜브 아이디어" },
    { value: "project", label: "프로젝트 아이디어" },
  ]

  // 세션 ID 생성 및 저장된 아이디어 로드
  useEffect(() => {
    // 기존 세션 ID가 있으면 사용, 없으면 새로 생성
    const existingSessionId = sessionStorage.getItem('ai-idea-session-id')
    if (existingSessionId) {
      setSessionId(existingSessionId)
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
      sessionStorage.setItem('ai-idea-session-id', newSessionId)
      setSessionId(newSessionId)
    }
  }, [])

  // 저장된 아이디어 로드
  const loadSavedIdeas = useCallback(async () => {
    if (!sessionId) return

    try {
      const response = await fetch(`/api/saved-ideas?sessionId=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setSavedIdeas(data.ideas || [])
        
        // likedIdeas Set 업데이트
        const likedContents = new Set(data.ideas.map((idea: SavedIdea) => idea.content))
        setLikedIdeas(likedContents)
      }
    } catch (error) {
      console.error('Failed to load saved ideas:', error)
    }
  }, [sessionId])

  // 컴포넌트 마운트 시 저장된 아이디어 로드
  useEffect(() => {
    loadSavedIdeas()
  }, [loadSavedIdeas])

  const handleGenerateIdea = async () => {
    if (!selectedCategory) return
    if (!apiKey) {
      setShowApiKeyInput(true)
      return
    }

    setIsGenerating(true)
    setSelectedIdea(null)
    setCurrentMessage("")

    // 다양성을 위한 추가 컨텍스트 생성
    const timestamp = Date.now()
    const randomVariation = Math.random().toString(36).substring(7)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60초 타임아웃

      const response = await fetch("/api/generate-idea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ 
            role: "user", 
            content: `${selectedCategory}_${timestamp}_${randomVariation}` 
          }],
          apiKey: apiKey,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Response body is null")
      }

      const decoder = new TextDecoder()
      let accumulatedContent = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log("Stream completed successfully")
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          accumulatedContent += chunk
          setCurrentMessage(accumulatedContent)
        }
      } catch (streamError) {
        console.error("Stream reading error:", streamError)
        setCurrentMessage(accumulatedContent + "\n\n⚠️ 스트리밍이 중단되었습니다. 생성된 내용까지만 표시됩니다.")
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error("Error generating idea:", error)
      if (error.name === 'AbortError') {
        setCurrentMessage("요청 시간이 초과되었습니다. 다시 시도해주세요.")
      } else {
        setCurrentMessage("아이디어 생성 중 오류가 발생했습니다. 다시 시도해주세요.")
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleLikeIdea = async () => {
    if (!currentMessage || !sessionId) return

    try {
      const titleMatch = currentMessage.match(/^#\s*(.+)$/m)
      const title = titleMatch
        ? titleMatch[1]
        : `${categories.find((c) => c.value === selectedCategory)?.label} - ${new Date().toLocaleDateString()}`

      const ideaData = {
        id: Date.now().toString(),
        title,
        content: currentMessage,
        category: selectedCategory,
        timestamp: Date.now(),
      }

      const response = await fetch('/api/saved-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea: ideaData,
          sessionId: sessionId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // 서버에서 받은 업데이트된 아이디어 목록으로 상태 업데이트
        setSavedIdeas(data.ideas || [])
        
        // likedIdeas Set 업데이트
        const likedContents = new Set(data.ideas.map((idea: SavedIdea) => idea.content))
        setLikedIdeas(likedContents)
        
        // 피드백 메시지 설정
        const isLiked = likedContents.has(currentMessage)
        setFeedbackMessage(isLiked ? "아이디어가 저장되었습니다! 💚" : "저장이 취소되었습니다! ❌")
        setShowLikeFeedback(true)
        setTimeout(() => setShowLikeFeedback(false), 2000)
      } else {
        console.error('Failed to save/remove idea')
        setFeedbackMessage("저장 중 오류가 발생했습니다.")
        setShowLikeFeedback(true)
        setTimeout(() => setShowLikeFeedback(false), 2000)
      }
    } catch (error) {
      console.error('Error saving/removing idea:', error)
      setFeedbackMessage("저장 중 오류가 발생했습니다.")
      setShowLikeFeedback(true)
      setTimeout(() => setShowLikeFeedback(false), 2000)
    }
  }

  const handleSelectSavedIdea = (idea: SavedIdea) => {
    setSelectedIdea(idea)
  }

  const handleBackToNewIdea = () => {
    setSelectedIdea(null)
  }

  const currentContent = selectedIdea ? selectedIdea.content : currentMessage
  const showLikeButton = !selectedIdea && currentMessage && !isGenerating
  const isCurrentIdeaLiked = likedIdeas.has(currentMessage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-between mb-6">
            <div></div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Sparkles className="text-purple-600" />
              AI 아이디어 생성기
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              API 설정
            </Button>
          </div>
          <p className="text-lg text-gray-600">당신의 다음 대박 아이디어, 클릭 한 번이면 됩니다!</p>
        </div>

        {/* API Key Input */}
        {showApiKeyInput && (
          <div className="mb-8">
            <ApiKeyInput onApiKeySet={setApiKey} />
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* Left Column - Controls and Saved Ideas (40%) */}
          <div className="lg:col-span-4 space-y-8">
            {/* Controls */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">아이디어 생성</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">카테고리를 선택하세요:</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleGenerateIdea}
                  disabled={!selectedCategory || isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? "새로운 아이디어 생성 중..." : apiKey ? "🎲 새로운 아이디어 생성" : "API 키 설정 필요"}
                </Button>
                {!apiKey && (
                  <p className="text-xs text-orange-600 text-center">
                    아이디어 생성을 위해 API 키를 먼저 설정해주세요.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Saved Ideas */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Heart className="text-red-500" size={20} />
                  Recently Liked Ideas
                  {savedIdeas.length > 0 && (
                    <span className="ml-auto text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full">
                      {savedIdeas.length}/10
                    </span>
                  )}
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  💾 서버에 저장됨 • 24시간 후 자동 삭제
                </p>
              </CardHeader>
              <CardContent>
                {savedIdeas.length > 0 ? (
                  <div className="space-y-3">
                    {savedIdeas.map((idea, index) => (
                      <button
                        key={idea.id}
                        onClick={() => handleSelectSavedIdea(idea)}
                        className={`w-full text-left p-4 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 ${
                          selectedIdea?.id === idea.id ? 'bg-blue-50 border-blue-300 shadow-md' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900 line-clamp-2 leading-relaxed">{idea.title}</div>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-gray-500">
                                {categories.find((c) => c.value === idea.category)?.label}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(idea.timestamp).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-orange-500">
                                {(() => {
                                  const now = Date.now()
                                  const timeLeft = 24 * 60 * 60 * 1000 - (now - idea.timestamp)
                                  const hoursLeft = Math.max(0, Math.floor(timeLeft / (60 * 60 * 1000)))
                                  return `${hoursLeft}시간 후 만료`
                                })()}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 ml-3">
                            #{index + 1}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-10">
                    <Heart size={32} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">아직 좋아요한 아이디어가 없습니다.</p>
                    <p className="text-xs mt-2">마음에 드는 아이디어에 좋아요를 눌러보세요!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Generated Ideas (60%) */}
          <div className="lg:col-span-6">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  {selectedIdea ? "저장된 아이디어" : "생성된 아이디어"}
                  {selectedIdea && (
                    <span className="text-sm text-gray-500 font-normal">
                      - {selectedIdea.title}
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-3">
                  {selectedIdea && (
                    <Button
                      onClick={handleBackToNewIdea}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Sparkles size={16} />
                      새 아이디어 생성
                    </Button>
                  )}
                  {showLikeButton && (
                    <div className="flex items-center gap-3">
                      {isCurrentIdeaLiked && (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <Heart size={16} className="fill-current" />
                          <span>저장됨</span>
                        </div>
                      )}
                      <Button
                        onClick={handleLikeIdea}
                        variant={isCurrentIdeaLiked ? "default" : "outline"}
                        size="sm"
                        className={`flex items-center gap-2 transition-all duration-200 ${
                          isCurrentIdeaLiked 
                            ? "bg-green-600 hover:bg-green-700 text-white" 
                            : "hover:bg-red-50 hover:border-red-300"
                        }`}
                      >
                        <Heart size={16} className={isCurrentIdeaLiked ? "fill-current" : ""} />
                        {isCurrentIdeaLiked ? "저장 취소" : "좋아요"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="relative p-6">
                {showLikeFeedback && (
                  <div className={`absolute top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-10 animate-pulse ${
                    feedbackMessage.includes("저장되었습니다") 
                      ? "bg-green-100 border border-green-300 text-green-800" 
                      : "bg-red-100 border border-red-300 text-red-800"
                  }`}>
                    <div className="flex items-center gap-2">
                      <Heart size={16} className="fill-current" />
                      <span>{feedbackMessage}</span>
                    </div>
                  </div>
                )}
                {currentContent ? (
                  <div className="prose prose-gray max-w-none">
                    <MarkdownRenderer content={currentContent} />
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-16">
                    <Sparkles size={48} className="mx-auto mb-6 text-gray-300" />
                    <p className="text-lg">카테고리를 선택하고 아이디어를 생성해보세요!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 mb-6">
          <p className="text-sm text-gray-500">
            각 아이디어는 AI가 고유하게 생성한 것입니다—완전히 같은 아이디어는 존재하지 않습니다!
          </p>
        </div>
      </div>
    </div>
  )
}
