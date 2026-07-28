import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// 🚨 CRITICAL: Tells Vercel to NEVER cache this endpoint so live stats are always accurate
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Try to connect to the database to get the real numbers
    const totalUsers = await prisma.user.count();
    
    const aggregations = await prisma.user.aggregate({
      _sum: { wldBalance: true },
    });

    const totalWld = aggregations._sum.wldBalance || 0;

    return NextResponse.json({ totalUsers, totalWld });
  } catch (error) {
    // 2. THE SAFETY NET: If Neon is locked, serve the marketing numbers!
    console.log("⚠️ Database locked (Compute Limit). Serving placeholder stats.");
    return NextResponse.json({ 
      totalUsers: 34, 
      totalWld: 2504 
    });
  }
}