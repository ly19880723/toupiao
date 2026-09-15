import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, firstCat, firstSub, secondCat, secondSub, thirdCat, thirdSub, fourthCat, fourthSub, suggestions } = body;

    if (!name || !firstCat || !firstSub || !secondCat || !secondSub || !thirdCat || !thirdSub) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    const record = await prisma.surveyResponse.create({
      data: {
        name: name.trim(),
        firstCat,
        firstSub,
        secondCat,
        secondSub,
        thirdCat,
        thirdSub,
        fourthCat: fourthCat || '',
        fourthSub: fourthSub || '',
        suggestions: suggestions?.trim() || '',
      }
    });

    return NextResponse.json({ success: true, id: record.id });
  } catch (error: any) {
    console.error('Submit error:', error);
    return NextResponse.json({ 
      error: '提交失败',
      detail: error?.message || String(error)
    }, { status: 500 });
  }
}
