import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { searchTerm, patientSSN } = body;

    const response = await fetch('http://192.168.1.53/cgi-bin/apiProbCatSrh.sh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        UserName: 'CPRS-UAT',
        Password: 'UAT@123',
        PatientSSN: patientSSN || '800000035',
        DUZ: '80',
        cdpProbCat: '',
        other: searchTerm
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in search-proxy:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process search request' },
      { status: 500 }
    );
  }
}
