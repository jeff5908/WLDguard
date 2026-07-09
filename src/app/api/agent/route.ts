import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// 🚨 CRITICAL: Tells Vercel to NEVER cache this endpoint so live stats are always accurate
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Count actual users in the database
    const totalUsers = await prisma.user.count();
    
    // Sum actual WLD balances in the database
    const aggregations = await prisma.user.aggregate({
      _sum: { wldBalance: true },
    });

    const totalWld = aggregations._sum.wldBalance || 0;

    return NextResponse.json({ totalUsers, totalWld });
  } catch (error) {
    console.error("Stats API Error:", error);
    // If DB fails, fallback to 0 instead of fake numbers
    return NextResponse.json({ totalUsers: 0, totalWld: 0 });
  }
}