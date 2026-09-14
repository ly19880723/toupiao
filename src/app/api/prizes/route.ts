import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const prizes = await prisma.prizeData.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    
    const prizeMap: Record<string, { label: string; icon: string; subs: { value: string; label: string }[] }> = {};
    prizes.forEach(p => {
      prizeMap[p.key] = {
        label: p.label,
        icon: p.icon,
        subs: Array.isArray(p.subs) ? (p.subs as any[]) : []
      };
    });
    
    return NextResponse.json({ data: prizeMap });
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
    const { data } = body;
    
    // Upsert all prize data
    const entries = Object.entries(data);
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i] as [string, any];
      await prisma.prizeData.upsert({
        where: { key },
        update: {
          label: value.label,
          icon: value.icon || 'star',
          subs: value.subs || []
        },
        create: {
          key,
          label: value.label,
          icon: value.icon || 'star',
          subs: value.subs || [],
          sortOrder: i
        }
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save prizes error:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
