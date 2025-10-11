import { NextResponse } from 'next/server';

export async function GET() {
    console.log('Hello API called');
    return NextResponse.json({ message: 'Hello from API!' });
}
