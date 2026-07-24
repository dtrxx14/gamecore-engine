import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ShieldCheck, UserRound } from 'lucide-react';
import { useRef } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';

type Props = {
    passwordRules: string;
};

export default function PlayerSettings(props: Props)  {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="Player settings" />
            <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                                <ShieldCheck className="size-3.5" />
                                Account settings
                            </div>
                            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                                Manage your account
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Update your profile details, security options, and account preferences from one place.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href="/player/profile">
                                <Button variant="outline">
                                    <ArrowLeft className="mr-2 size-4" />
                                    Back to profile
                                </Button>
                            </Link>
                            <Link href={edit()}>
                                <Button>
                                    <UserRound className="mr-2 size-4" />
                                    Profile settings
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm">
                        <div className="text-sm font-semibold text-foreground">Profile & identity</div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Keep your name, email, and account number up to date so organizers and teams can identify you correctly.
                        </p>
                        <div className="mt-4 rounded-xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                            <div className="font-medium text-foreground">Current account</div>
                            <div className="mt-1">{user?.email}</div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm">
                        <div className="text-sm font-semibold text-foreground">Security</div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Manage your password and verify your email to keep your account secure.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Form
                                {...SecurityController.update.form()}
                                options={{
                                    preserveScroll: true,
                                }}
                                resetOnError={[
                                    'password',
                                    'password_confirmation',
                                    'current_password',
                                ]}
                                resetOnSuccess
                                onError={(errors) => {
                                    if (errors.password) {
                                        passwordInput.current?.focus();
                                    }

                                    if (errors.current_password) {
                                        currentPasswordInput.current?.focus();
                                    }
                                }}
                                className="space-y-4 w-full"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="current_password">
                                                Current password
                                            </Label>

                                            <PasswordInput
                                                id="current_password"
                                                ref={currentPasswordInput}
                                                name="current_password"
                                                className="mt-1 block w-full"
                                                autoComplete="current-password"
                                                placeholder="Current password"
                                            />

                                            <InputError message={errors.current_password} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password">New password</Label>

                                            <PasswordInput
                                                id="password"
                                                ref={passwordInput}
                                                name="password"
                                                className="mt-1 block w-full"
                                                autoComplete="new-password"
                                                placeholder="New password"
                                                passwordrules={props.passwordRules}
                                            />

                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password_confirmation">
                                                Confirm password
                                            </Label>

                                            <PasswordInput
                                                id="password_confirmation"
                                                name="password_confirmation"
                                                className="mt-1 block w-full"
                                                autoComplete="new-password"
                                                placeholder="Confirm password"
                                                passwordrules={props.passwordRules}
                                            />

                                            <InputError
                                                message={errors.password_confirmation}
                                            />
                                        </div>

                                        <div className="flex items-center justify-end gap-4">
                                            <Button
                                                disabled={processing}
                                                data-test="update-password-button"
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

PlayerSettings.layout = {
    breadcrumbs: [
        {
            title: 'Settings',
            href: '/player/settings',
        },
    ],
};
