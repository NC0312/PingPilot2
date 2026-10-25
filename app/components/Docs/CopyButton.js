'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { copyText } from '@/lib/clipboard'

/** Copies a command and says so; says so too when the browser would not let it */
export default function CopyButton({ text }) {
    const [state, setState] = useState('idle')
    const timer = useRef(null)
    useEffect(() => () => clearTimeout(timer.current), [])

    const copy = async () => {
        const ok = await copyText(text)
        setState(ok ? 'copied' : 'failed')
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setState('idle'), 2500)
    }

    return (
        <div className="flex items-center gap-3">
            <span aria-live="polite" className={state === 'failed' ? 'text-[13px] text-destructive' : 'text-[13px] text-success'}>
                {state === 'copied' ? 'Copied' : state === 'failed' ? 'Could not copy: select it and copy by hand' : ''}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={copy} className="min-h-12 sm:min-h-8">
                {state === 'copied' ? <Check weight="bold" className="text-success" /> : <Copy weight="light" />}
                Copy
            </Button>
        </div>
    )
}
