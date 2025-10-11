import { NextResponse } from 'next/server';

export async function GET() {
    console.log('🧪 Test API endpoint called');
    console.log('🧪 Request URL:', process.env.VERCEL_URL || 'localhost');
    return NextResponse.json({
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        path: process.cwd(),
        nodeEnv: process.env.NODE_ENV,
        vercelUrl: process.env.VERCEL_URL
    });
}
