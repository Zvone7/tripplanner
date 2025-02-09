import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const backendUrl = 'http://127.0.0.1:5156'; // Ensure this works inside your container
    console.log('Redirecting OAuth response to backend URL:', backendUrl);

    const queryString = req.nextUrl.search; // Preserve query parameters
    const backendRedirectUrl = `${backendUrl}/api/account/googleresponse${queryString}`;

    console.log(`Redirecting OAuth response to: ${backendRedirectUrl}`);

    return NextResponse.redirect(backendRedirectUrl, 307);
}
