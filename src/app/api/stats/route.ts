import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const results = await prisma.surveyResponse.findMany();
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Fetch stats error:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
