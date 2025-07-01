import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json()

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API 키가 필요합니다." },
        { status: 400 }
      )
    }

    if (apiKey.length < 20) {
      return NextResponse.json(
        { error: "올바른 API 키 형식이 아닙니다." },
        { status: 400 }
      )
    }

    // OpenRouter API 키 형식 검증 (sk-or-v1-로 시작하는지 확인)
    if (!apiKey.startsWith("sk-or-v1-")) {
      return NextResponse.json(
        { error: "OpenRouter API 키 형식이 아닙니다. 'sk-or-v1-'로 시작해야 합니다." },
        { status: 400 }
      )
    }

    // 실제 API 호출로 키 검증 (간단한 테스트 요청)
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Idea Generator",
      },
    })

    try {
      // 간단한 모델 목록 조회로 API 키 검증
      const models = await openai.models.list()
      
      // deepseek 모델이 사용 가능한지 확인
      const hasDeepseekModel = models.data.some(model => 
        model.id.includes("deepseek")
      )

      if (!hasDeepseekModel) {
        return NextResponse.json(
          { error: "DeepSeek 모델에 접근할 수 없습니다. API 키 권한을 확인해주세요." },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { 
          success: true, 
          message: "API 키가 유효합니다.",
          availableModels: models.data.length
        },
        { status: 200 }
      )
    } catch (apiError: any) {
      console.error("API 키 검증 오류:", apiError)
      
      if (apiError.status === 401) {
        return NextResponse.json(
          { error: "API 키가 유효하지 않습니다." },
          { status: 401 }
        )
      } else if (apiError.status === 403) {
        return NextResponse.json(
          { error: "API 키 권한이 부족합니다." },
          { status: 403 }
        )
      } else {
        return NextResponse.json(
          { error: "API 키 검증 중 오류가 발생했습니다." },
          { status: 500 }
        )
      }
    }
  } catch (error) {
    console.error("API 키 검증 처리 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
} 