// app/api/check-servers/route.js
import { NextResponse } from 'next/server';
import { checkAllServersWithAlerts } from '../../../utils/serverCheckerWithAlerts';

export async function GET(request) {
    try {
        const results = await checkAllServersWithAlerts();
        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Error checking servers:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}