import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiHost = process.env.WAFIE_API_HOST;

    if (!apiHost) {
      return NextResponse.json(
        { error: 'WAFIE_API_HOST environment variable is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { application_id } = body;

    // Forward the request to the external Wafie API
    const response = await fetch(`${apiHost}/wafie.v1.ProtectionService/GetProtection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        application_id: application_id
      }),
    });

    // Handle 404 as a legitimate case - protection not enabled for this application
    if (response.status === 404) {
      return NextResponse.json({
        protection: {
          id: -1, // Placeholder ID for unprotected applications
          applicationId: application_id,
          protectionMode: 'PROTECTION_MODE_OFF',
          desiredState: null
        }
      });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch protection: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GetProtection API route:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching protection' },
      { status: 500 }
    );
  }
}