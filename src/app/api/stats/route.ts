import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Count total registered users in the database
    const userCount = await prisma.user.count();
    
    // Sum up the wldBalance of every user in the database
    const aggregations = await prisma.user.aggregate({
      _sum: {
        wldBalance: true,
      },
    });

    // Genuine baseline: Starting with the Founder (You) and your initial 100 WLD!
    const baseUsers = 1;
    const baseWld = 100;

    const totalUsers = baseUsers + userCount;
    const totalWld = baseWld + (aggregations._sum.wldBalance || 0);

    return NextResponse.json({ totalUsers, totalWld });
  } catch (error) {
    console.error("Stats API Error:", error);
    // Safe fallback if the database connection temporarily drops
    return NextResponse.json({ totalUsers: 1, totalWld: 100 });
  }
}