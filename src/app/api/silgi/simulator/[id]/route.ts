import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import fs from "fs/promises"
import path from "path"

const SIMULATORS: Record<string, string> = {
  "phase1-main": "simulator1.html",
  "bridge": "elemaster-bridge.js",
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const filename = SIMULATORS[id]
  if (!filename) {
    return new NextResponse("Not Found", { status: 404 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const filePath = path.join(process.cwd(), "src", "private", "silgi", filename)
    const fileContent = await fs.readFile(filePath)
    const contentType = filename.endsWith(".html") 
      ? "text/html; charset=utf-8" 
      : "application/javascript; charset=utf-8"
    
    return new NextResponse(new Uint8Array(fileContent), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      }
    })
  } catch (e) {
    console.error("[silgi-simulator] file read error:", e)
    return new NextResponse("Server Error", { status: 500 })
  }
}