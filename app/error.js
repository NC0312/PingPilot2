'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Brand } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';

export default function Error({ error, reset }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main id="main-content" className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-8 text-center">
            <Brand />
            <div className="mt-14 space-y-5">
                <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-[-0.03em] sm:text-5xl">
                    Something went wrong.
                </h1>
                <p className="mx-auto max-w-[42ch] text-base leading-relaxed text-muted-foreground">
                    This page failed to load. Your monitors keep running while you sort it out. Try again, or head back home.
                </p>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" onClick={() => reset()}>
                    Try again
                </Button>
                <Button asChild size="lg" variant="ghost">
                    <Link href="/">Back to home</Link>
                </Button>
            </div>
        </main>
    );
}
