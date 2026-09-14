import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, firstCat, firstSub, secondCat, secondSub, thirdCat, thirdSub, suggestions } = body;

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
        suggestions: suggestions?.trim() || '',
      }
    });

    return NextResponse.json({ success: true, id: record.id });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: '提交失败' }, { status: 500 });
  }
}
