import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/app/lib/logger';

export async function POST(request: NextRequest) {
  const start = Date.now();
  const endpoint = '/wafie.v1.ApplicationService/ListApplications';

  try {
    const apiHost = process.env.WAFIE_API_HOST;

    if (!apiHost) {
      logger.error('applications/route', 'WAFIE_API_HOST not configured');
      return NextResponse.json(
        { error: 'WAFIE_API_HOST environment variable is not configured' },
        { status: 500 }
      );
    }

    // Get the request body from the client
    const body = await request.json();

    // Forward the request to the external Wafie API
    const response = await fetch(`${apiHost}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const duration = Date.now() - start;

    if (!response.ok) {
      logger.api('POST', endpoint, response.status, duration);
      logger.error('applications/route', `API returned ${response.status}: ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch applications: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    logger.api('POST', endpoint, response.status, duration);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const duration = Date.now() - start;
    logger.api('POST', endpoint, 500, duration);
    logger.error('applications/route', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching applications' },
      { status: 500 }
    );
  }
}