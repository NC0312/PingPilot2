import Link from 'next/link';
import { Brand } from '@/components/ui/brand';
import { Button, ButtonArrow } from '@/components/ui/button';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
    return (
        <main id="main-content" className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-8 text-center">
            <Brand />
            <div className="mt-14 space-y-5">
                <p className="font-mono text-sm tabular-nums text-primary">404</p>
                <h1 className="font-display text-5xl font-medium leading-[1.02] tracking-[-0.03em] sm:text-6xl">
                    This page isn&apos;t here.
                </h1>
                <p className="mx-auto max-w-[42ch] text-base leading-relaxed text-muted-foreground">
                    The link may be out of date, or the address was mistyped.
                </p>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                    <Link href="/">
                        Back to home
                        <ButtonArrow />
                    </Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                    <Link href="/dashboard">Go to dashboard</Link>
                </Button>
            </div>
        </main>
    );
}
