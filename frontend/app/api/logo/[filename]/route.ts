import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  // Validar filename para segurança
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
  }

  // Tentar servir de public/logo/
  const logoPath = path.join(process.cwd(), 'public', 'logo', filename)

  if (!fs.existsSync(logoPath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const ext = path.extname(filename).toLowerCase()
  const contentType: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
  }

  const buffer = fs.readFileSync(logoPath)
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
