// A title template here keeps the \"· Ping Pilott\" suffix on the nested pages below.
export const metadata = { title: { default: 'Sign in', template: '%s · Ping Pilott' }, robots: { index: false, follow: true } };

export default function AuthLayout({ children }) {
    return (
        <main id="main-content" className="min-h-[100dvh]">
            {children}
        </main>
    );
}
