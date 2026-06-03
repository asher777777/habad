import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const headers = Object.fromEntries(req.headers);
  return NextResponse.json({ headers });
}
