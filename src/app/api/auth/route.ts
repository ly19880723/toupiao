import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;
    
    const correctPassword = process.env.ADMIN_PASSWORD || '9527';
    
    if (password === correctPassword) {
      return NextResponse.json({ valid: true });
    }
    
    return NextResponse.json({ valid: false }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
