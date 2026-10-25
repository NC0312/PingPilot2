import { ImageResponse } from 'next/og';

// The share card for every public page (1200x630). Drawn here because public/banner.png is square, and Twitter and
// Facebook crop a square image badly when the card is "large image".
export const dynamic = 'force-static';

export function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 72,
                    background: 'linear-gradient(135deg, #07161c 0%, #0b2630 100%)',
                    color: '#eaf6f9',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 11, background: '#3dd6c6', marginRight: 16 }} />
                    Ping Pilott
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 84, fontWeight: 600, lineHeight: 1.02, letterSpacing: -3 }}>
                        Know it&apos;s down before your customers do.
                    </div>
                    <div style={{ marginTop: 28, fontSize: 32, color: '#9fc0c9' }}>
                        Website and server uptime monitoring, status pages and host metrics.
                    </div>
                </div>
                <div style={{ fontSize: 28, color: '#3dd6c6' }}>Free plan, no expiry</div>
            </div>
        ),
        { width: 1200, height: 630 },
    );
}
