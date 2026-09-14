import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 检查环境变量是否存在
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 });
    }

    const results = await prisma.surveyResponse.findMany();
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Fetch stats error:', error);
    return NextResponse.json({ 
      error: '查询失败', 
      detail: error?.message || String(error)
    }, { status: 500 });
  }
}
