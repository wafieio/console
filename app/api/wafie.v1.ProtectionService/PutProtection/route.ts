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

    // Get the request body from the client
    const body = await request.json();

    // Forward the request to the external Wafie API
    const response = await fetch(`${apiHost}/wafie.v1.ProtectionService/PutProtection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to update protection: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PutProtection API route:', error);
    return NextResponse.json(
      { error: 'Internal server error while updating protection' },
      { status: 500 }
    );
  }
}