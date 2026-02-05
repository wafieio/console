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
    const { id } = body;

    // Make API call to WAFIE backend to get all applications
    const response = await fetch(`${apiHost}/wafie.v1.ApplicationService/ListApplications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        options: {
          include_ingress: true
        }
      }),
    });

    if (!response.ok) {
      console.error('WAFIE API call failed:', response.status, await response.text());
      return NextResponse.json(
        { error: `Failed to fetch applications: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Find the specific application by ID
    const application = data.applications?.find((app: any) => app.id === id);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Return in the expected format
    return NextResponse.json({
      application: application
    });
  } catch (error) {
    console.error('Error in GetApplication API route:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching application' },
      { status: 500 }
    );
  }
}