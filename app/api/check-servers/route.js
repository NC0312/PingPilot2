// app/api/check-servers/route.js
import { NextResponse } from 'next/server';
import { checkAllServers } from '../../../utils/serverChecker';

export async function GET(request) {
    try {
        const results = await checkAllServers();
        return NextResponse.json({ results });
    } catch (error) {
        console.error('Error checking servers:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
