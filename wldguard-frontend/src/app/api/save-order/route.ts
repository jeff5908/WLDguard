import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { intent_action, signature } = body;

    if (!intent_action || !signature) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    
    const result = await sql`
      INSERT INTO limit_orders (intent_action, signature)
      VALUES (${intent_action}, ${signature})
      RETURNING *;
    `;

    return NextResponse.json({ success: true, data: result[0] }, { status: 200 });
  } catch (error: unknown) {
    console.error('Database Error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
