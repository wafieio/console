import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the request body from the client
    const body = await request.json();
    const { scheme, host } = body;

    if (!scheme || !host) {
      return NextResponse.json(
        { error: 'Missing required parameters: scheme and host' },
        { status: 400 }
      );
    }

    // Construct the XFF URL
    const xffUrl = `${scheme}://${host}/v1/wafie/cip/xff`;

    // Forward the request to the XFF endpoint
    const response = await fetch(xffUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch XFF data: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(data)
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in XFF API route:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching XFF data' },
      { status: 500 }
    );
  }
}