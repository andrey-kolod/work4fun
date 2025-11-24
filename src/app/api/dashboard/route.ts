// src/app/api/dashboard/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardService } from '@/lib/services/dashboardService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const dashboardService = new DashboardService();
    const dashboardData = await dashboardService.getDashboardData(
      parseInt(projectId),
      parseInt(session.user.id),
      session.user.role,
    );

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    console.error('Error in dashboard API:', error);

    if (error.message === 'Access denied to project') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (error.message === 'Project not found') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
