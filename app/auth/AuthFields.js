'use client';

import React, { forwardRef, useState } from 'react';
import { Eye, EyeSlash, CircleNotch } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Input with a leading icon. Works with react-hook-form's register (ref is forwarded). */
export const IconInput = forwardRef(function IconInput({ icon: Icon, className, ...props }, ref) {
    return (
        <div className="relative">
            <Icon weight="light" className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input ref={ref} className={cn('pl-11', className)} {...props} />
        </div>
    );
});

/** Password input with a real show/hide button. */
export const PasswordInput = forwardRef(function PasswordInput({ icon, className, ...props }, ref) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <IconInput ref={ref} icon={icon} type={show ? 'text' : 'password'} className={cn('pr-12', className)} {...props} />
            <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Hide password' : 'Show password'}
                aria-pressed={show}
                className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors duration-300 ease-fluid hover:bg-white/[0.06] hover:text-foreground"
            >
                {show ? <EyeSlash weight="light" className="size-5" /> : <Eye weight="light" className="size-5" />}
            </button>
        </div>
    );
});

/** Full-width primary submit with a text-only loading state. */
export function SubmitButton({ loading, children, loadingText }) {
    return (
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <CircleNotch weight="light" className="animate-spin" />}
            {loading ? loadingText : children}
        </Button>
    );
}

/** Centered progress state for token checks. */
export function Verifying({ children }) {
    return (
        <div className="flex flex-col items-center gap-4 py-10 text-center" role="status">
            <CircleNotch weight="light" className="size-9 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{children}</p>
        </div>
    );
}
