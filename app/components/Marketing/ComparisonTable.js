/** rows: [label, ours, theirs]. Plain semantic table so Google can read it. */
export default function ComparisonTable({ theirs, rows, caption }) {
    return (
        <div className="overflow-x-auto rounded-2xl ring-1 ring-white/[0.07]">
            <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
                <caption className="sr-only">{caption}</caption>
                <thead>
                    <tr className="bg-white/[0.04] text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                        <th scope="col" className="px-3 py-3 sm:px-4 font-medium">Feature</th>
                        <th scope="col" className="px-3 py-3 sm:px-4 font-medium text-primary">Ping Pilott</th>
                        <th scope="col" className="px-3 py-3 sm:px-4 font-medium">{theirs}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                    {rows.map(([label, ours, other]) => (
                        <tr key={label}>
                            <th scope="row" className="px-3 py-3.5 sm:px-4 font-medium text-foreground/90">{label}</th>
                            <td className="px-3 py-3.5 sm:px-4 text-foreground/90">{ours}</td>
                            <td className="px-3 py-3.5 sm:px-4 text-muted-foreground">{other}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
