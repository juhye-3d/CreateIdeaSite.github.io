import { NextRequest, NextResponse } from 'next/server'

interface SavedIdea {
  id: string
  title: string
  content: string
  category: string
  timestamp: number
  sessionId: string
}

// 메모리 기반 저장소 (실제 프로덕션에서는 데이터베이스 사용 권장)
let savedIdeasStorage: SavedIdea[] = []

// 24시간 후 자동 삭제를 위한 정리 함수
function cleanupExpiredIdeas() {
  const now = Date.now()
  const oneDayInMs = 24 * 60 * 60 * 1000 // 24시간
  
  savedIdeasStorage = savedIdeasStorage.filter(idea => {
    return (now - idea.timestamp) < oneDayInMs
  })
}

// GET: 저장된 아이디어 조회
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
  }

  // 만료된 아이디어 정리
  cleanupExpiredIdeas()
  
  // 해당 세션의 아이디어만 필터링
  const userIdeas = savedIdeasStorage
    .filter(idea => idea.sessionId === sessionId)
    .sort((a, b) => b.timestamp - a.timestamp) // 최신순 정렬

  return NextResponse.json({ ideas: userIdeas })
}

// POST: 아이디어 저장
export async function POST(request: NextRequest) {
  try {
    const { idea, sessionId } = await request.json()
    
    if (!sessionId || !idea) {
      return NextResponse.json({ error: 'Session ID and idea are required' }, { status: 400 })
    }

    // 만료된 아이디어 정리
    cleanupExpiredIdeas()

    // 중복 확인 (같은 세션에서 같은 내용의 아이디어가 있는지)
    const existingIndex = savedIdeasStorage.findIndex(
      saved => saved.sessionId === sessionId && saved.content === idea.content
    )

    if (existingIndex !== -1) {
      // 이미 존재하면 제거 (토글 기능)
      savedIdeasStorage.splice(existingIndex, 1)
      return NextResponse.json({ 
        message: 'Idea removed', 
        ideas: savedIdeasStorage.filter(idea => idea.sessionId === sessionId)
      })
    }

    // 새로운 아이디어 추가
    const newIdea: SavedIdea = {
      ...idea,
      sessionId,
      timestamp: Date.now()
    }

    savedIdeasStorage.push(newIdea)

    // 최대 10개까지만 유지
    const userIdeas = savedIdeasStorage
      .filter(idea => idea.sessionId === sessionId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)

    // 전체 저장소에서도 10개 초과분 제거
    savedIdeasStorage = savedIdeasStorage.filter(idea => 
      userIdeas.some(userIdea => userIdea.id === idea.id)
    )

    return NextResponse.json({ 
      message: 'Idea saved', 
      ideas: userIdeas 
    })

  } catch (error) {
    console.error('Error saving idea:', error)
    return NextResponse.json({ error: 'Failed to save idea' }, { status: 500 })
  }
}

// DELETE: 특정 아이디어 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { ideaId, sessionId } = await request.json()
    
    if (!sessionId || !ideaId) {
      return NextResponse.json({ error: 'Session ID and idea ID are required' }, { status: 400 })
    }

    // 해당 세션의 아이디어만 삭제
    savedIdeasStorage = savedIdeasStorage.filter(
      idea => !(idea.sessionId === sessionId && idea.id === ideaId)
    )

    const userIdeas = savedIdeasStorage
      .filter(idea => idea.sessionId === sessionId)
      .sort((a, b) => b.timestamp - a.timestamp)

    return NextResponse.json({ 
      message: 'Idea deleted', 
      ideas: userIdeas 
    })

  } catch (error) {
    console.error('Error deleting idea:', error)
    return NextResponse.json({ error: 'Failed to delete idea' }, { status: 500 })
  }
} 