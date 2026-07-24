// Components
import { Form, Head } from '@inertiajs/react';
import { MailCheck, ShieldCheck, Sparkles } from 'lucide-react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    const isLinkSent = status === 'verification-link-sent';

    return (
        <>
            <Head title="Email verification" />
            <div className="flex items-center justify-center">
                <div className="w-full max-w-md rounded-lg border border-border/70 bg-card/90 p-5 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.35)] backdrop-blur-sm dark:border-primary/15 dark:bg-card/95 sm:p-8">
                    <div className="mb-6 flex flex-col items-center text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary shadow-sm">
                            <MailCheck className="size-7" />
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-primary">
                            <ShieldCheck className="size-3.5" />
                            One more step
                        </div>
                        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                            Verify your email
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            We sent a secure confirmation link to your inbox. Open it to activate your account and continue securely.
                        </p>
                    </div>

                    {isLinkSent && (
                        <div className="mb-5 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                            <Sparkles className="mt-0.5 size-4 shrink-0" />
                            <span>
                                A new verification link has been sent to the email address you provided during registration.
                            </span>
                        </div>
                    )}

                    <Form {...send.form()} className="space-y-5 text-center">
                        {({ processing }) => (
                            <>
                                <Button type="submit" disabled={processing} className="w-full justify-center">
                                    {processing && <Spinner />}
                                    Resend verification email
                                </Button>

                                <div className="flex items-center justify-center pt-1">
                                    <TextLink
                                        href={logout()}
                                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Log out
                                    </TextLink>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Email verification',
    description:
        'Please verify your email address by clicking on the link we just emailed to you.',
};
