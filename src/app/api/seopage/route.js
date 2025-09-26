import { NextResponse } from 'next/server';


export async function GET(request) {
    const { searchParams } = new URL(request.url);

    const movieid = searchParams.get('id');
    const backendBaseUrl = process.env.NEXT_PUBLIC_ADS_URL || "https://play8movie.com";

    if (!movieid) {
        return NextResponse.json(
            { success: false, error: 'Missing movieid parameter.' },
            { status: 400 }
        );
    }

    const backendApiUrl = `${backendBaseUrl}/api/seopage/${movieid}`;


    const response = await fetch(backendApiUrl, {
        cache: 'no-store',
    });

    const data = await response.json();

    if (data.success === false) {
        return NextResponse.json(
            { success: false, error: data.error },
            { status: response.status }
        );
    }

    if (data.success === true && data.data) {
        return NextResponse.json(
            { success: true, data: data.data },
            { status: 200 }
        );
    }

    return NextResponse.json(
        { success: false, error: 'An unexpected response was received from the backend.' },
        { status: 500 }
    );


}