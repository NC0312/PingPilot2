export const metadata = { title: { absolute: 'Status page not found' }, robots: { index: false, follow: false } };

// Shown for an address with no published page. Plain on purpose: it could be anybody's mistyped link.
export default function StatusNotFound() {
    return (
        <main id="main-content" className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-8 text-center">
            <p className="font-mono text-sm tabular-nums text-primary">404</p>
            <h1 className="mt-4 font-display text-4xl font-medium leading-[1.05] tracking-[-0.03em] sm:text-5xl">This status page isn&apos;t available.</h1>
            <p className="mx-auto mt-4 max-w-[42ch] text-base leading-relaxed text-muted-foreground">
                The address may be mistyped, or the page has not been published.
            </p>
        </main>
    );
}
