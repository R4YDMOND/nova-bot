import { NextRequest, NextResponse } from 'next/server';

interface NovaSession {
  userId: number;
  name: string;
  avatar: string;
  screenName: string;
  accessToken: string;
  loginAt: number;
}

export async function GET(req: NextRequest) {
  const raw = req.cookies.get('nova_session')?.value;

  if (!raw) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const session: NovaSession = JSON.parse(raw);
    // accessToken намеренно не отдаём на клиент — он не должен покидать сервер
    return NextResponse.json({
      authenticated: true,
      userId: session.userId,
      name: session.name,
      avatar: session.avatar,
      screenName: session.screenName,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}