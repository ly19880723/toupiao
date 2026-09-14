import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const prizes = await prisma.prizeData.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    const result: Record<string, Record<string, { label: string; icon: string; subs: { value: string; label: string }[] }>> = {
      first: {},
      second: {},
      third: {},
    };

    prizes.forEach(p => {
      const level = p.level;
      if (!result[level]) result[level] = {};
      result[level][p.key] = {
        label: p.label,
        icon: p.icon,
        subs: Array.isArray(p.subs) ? (p.subs as any[]) : []
      };
    });

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Fetch prizes error:', error);
    return NextResponse.json({
      error: '查询失败',
      detail: error?.message || String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { first, second, third } = body;

    // 按奖项级别分别处理
    const levels: Record<string, any> = { first, second, third };

    for (const [level, data] of Object.entries(levels)) {
      // 1. 先清空该奖项级别的数据
      await prisma.prizeData.deleteMany({ where: { level } });

      // 2. 重新写入
      const entries = Object.entries(data || {});
      for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i] as [string, any];
        await prisma.prizeData.create({
          data: {
            key,
            level,
            label: value.label,
            icon: value.icon || 'star',
            subs: value.subs || [],
            sortOrder: i
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save prizes error:', error);
    return NextResponse.json({
      error: '保存失败',
      detail: error?.message || String(error)
    }, { status: 500 });
  }
}
