import { cn } from '@/lib/utils';

/**
 * Why a check failed, in plain words: what happened, the likely cause, what to try first. The backend writes the
 * wording (utils/diagnosis.js) and sends `{ title, cause, action }`, or null when there is nothing useful to say, in
 * which case this renders nothing and the raw error line is all there is.
 *
 * compact: just the headline, for a list row where the full text would crowd it.
 */
export default function DiagnosisNote({ diagnosis, compact = false, className }) {
    if (!diagnosis?.title) return null;

    if (compact) {
        return <p className={cn('text-sm text-foreground', className)}>{diagnosis.title}</p>;
    }

    return (
        <div className={cn('space-y-1.5 text-sm', className)}>
            <p className="font-medium text-foreground">{diagnosis.title}</p>
            {diagnosis.cause && (
                <p className="text-muted-foreground">
                    <span className="text-foreground/80">Likely cause: </span>
                    {diagnosis.cause}
                </p>
            )}
            {diagnosis.action && (
                <p className="text-muted-foreground">
                    <span className="text-foreground/80">Try first: </span>
                    {diagnosis.action}
                </p>
            )}
        </div>
    );
}
