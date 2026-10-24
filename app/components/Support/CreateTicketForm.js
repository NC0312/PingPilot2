// app/components/Support/CreateTicketForm.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ArrowLeft, CheckCircle, CircleNotch } from '@phosphor-icons/react';
import { useAuth } from '@/app/context/AuthContext';
import { Button, ButtonArrow } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { CATEGORY_META } from './ticketMeta';

const CATEGORY_HINTS = {
    technical: 'Monitoring, alerts or the dashboard',
    billing: 'Plans, invoices and payments',
    feature_request: 'Something you would like to see',
    general: 'Anything else',
};

const CreateTicketForm = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const { apiRequest } = useAuth();
    const redirectTimer = useRef(null);

    useEffect(() => () => clearTimeout(redirectTimer.current), []);

    const {
        register,
        handleSubmit: hookFormSubmit,
        formState: { errors },
        watch,
    } = useForm({
        defaultValues: {
            subject: '',
            description: '',
            category: 'technical',
        },
    });

    const selectedCategory = watch('category');

    const onSubmit = async (data) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiRequest('/api/support/tickets', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (response.status === 'success') {
                setSuccess(true);
                redirectTimer.current = setTimeout(() => {
                    router.push('/support/tickets');
                }, 2000);
            } else {
                throw new Error(response.message || 'Failed to create ticket');
            }
        } catch (err) {
            console.error('Error creating ticket:', err);
            setError(err.message || 'We couldn’t create your ticket. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10">
            <PageHeader
                eyebrow="Support"
                title="New ticket"
                description="Tell us what you need. The more detail you give, the faster we can help."
                actions={
                    <Button asChild variant="ghost">
                        <Link href="/support/tickets">
                            <ArrowLeft weight="light" />
                            Back to tickets
                        </Link>
                    </Button>
                }
            />

            <div className="bezel max-w-3xl">
                <div className="bezel-core p-6 sm:p-9">
                    {success ? (
                        <div className="flex flex-col items-center py-10 text-center" role="status">
                            <span className="grid size-14 place-items-center rounded-full bg-success/12 text-success">
                                <CheckCircle weight="light" className="size-8" />
                            </span>
                            <h2 className="mt-6 font-display text-2xl font-medium tracking-tight">Ticket submitted</h2>
                            <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
                                We will reply on the ticket as soon as we can. Taking you back to your tickets.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={hookFormSubmit(onSubmit)} className="space-y-8" noValidate>
                            {error && (
                                <Alert tone="error" title="Your ticket wasn’t sent">
                                    {error}
                                </Alert>
                            )}

                            <fieldset className="space-y-3">
                                <legend className="text-sm font-medium text-foreground/90">Category</legend>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {Object.keys(CATEGORY_META).map((cat) => {
                                        const Icon = CATEGORY_META[cat].icon;
                                        const on = selectedCategory === cat;
                                        return (
                                            <label
                                                key={cat}
                                                className={`relative flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 ring-1 transition-[background-color,box-shadow] duration-500 ease-fluid has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${on ? 'bg-primary/[0.08] ring-primary/40' : 'bg-white/[0.03] ring-white/10 hover:bg-white/[0.05] hover:ring-white/20'}`}
                                            >
                                                <input type="radio" value={cat} {...register('category')} className="sr-only" />
                                                <Icon weight="light" className={`size-6 shrink-0 ${on ? 'text-primary' : 'text-muted-foreground'}`} aria-hidden="true" />
                                                <span className="min-w-0">
                                                    <span className="block text-sm font-medium">{CATEGORY_META[cat].label}</span>
                                                    <span className="block text-xs text-muted-foreground">{CATEGORY_HINTS[cat]}</span>
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </fieldset>

                            <Field id="subject" label="Subject" error={errors.subject?.message}>
                                <Input
                                    id="subject"
                                    placeholder="A short summary of the issue"
                                    aria-invalid={!!errors.subject}
                                    aria-describedby={errors.subject ? 'subject-msg' : undefined}
                                    {...register('subject', {
                                        required: 'Add a subject',
                                        minLength: { value: 5, message: 'Subject needs at least 5 characters' },
                                        maxLength: { value: 100, message: 'Subject can be up to 100 characters' },
                                    })}
                                />
                            </Field>

                            <Field
                                id="description"
                                label="What’s happening?"
                                hint="Include the URL, what you expected and what you saw."
                                error={errors.description?.message}
                            >
                                <Textarea
                                    id="description"
                                    rows={6}
                                    placeholder="Describe the problem in as much detail as you can"
                                    aria-invalid={!!errors.description}
                                    aria-describedby="description-msg"
                                    {...register('description', {
                                        required: 'Describe the problem',
                                        minLength: { value: 20, message: 'Description needs at least 20 characters' },
                                    })}
                                />
                            </Field>

                            <div className="flex justify-end pt-1">
                                <Button type="submit" size="lg" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <CircleNotch weight="light" className="animate-spin" />
                                            Sending
                                        </>
                                    ) : (
                                        <>
                                            Send ticket
                                            <ButtonArrow />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateTicketForm;
