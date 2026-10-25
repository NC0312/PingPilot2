import { Brand } from '@/components/ui/brand'
import FooterNav from '../Landing Page/FooterNav'

export default function SiteFooter() {
    return (
        <footer className="mt-auto border-t border-white/[0.07] px-4 py-12 sm:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
                <div className="max-w-xs space-y-4">
                    <Brand />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Uptime monitoring for websites and servers.
                    </p>
                </div>
                <FooterNav />
            </div>
            <p className="mx-auto mt-12 max-w-6xl text-xs text-muted-foreground/80">
                © {new Date().getFullYear()} Ping Pilott
            </p>
        </footer>
    )
}
