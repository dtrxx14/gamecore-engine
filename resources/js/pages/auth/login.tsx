import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register as registerRoute } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Log in" />
            <div className="flex items-center justify-center gap-6">
                <div className="w-full max-w-sm rounded-lg border border-border/70 bg-card/80 p-4 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)] backdrop-blur-sm dark:border-primary/15 dark:bg-card/90 sm:p-8">
                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        className="flex flex-col gap-6"
                    >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="email@example.com"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">Password</Label>
                                            <TextLink
                                                href={request()}
                                                className="ml-auto text-sm text-primary no-underline hover:underline"
                                                tabIndex={5}
                                            >
                                                Forgot your password?
                                            </TextLink>
                                    </div>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Password"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <Button
                                    type="submit"
                                    className="mt-4 w-full"
                                    tabIndex={3}
                                    disabled={processing}
                                    data-test="login-button"
                                >
                                    {processing && <Spinner />}
                                    Log in
                                </Button>

                                <p className="text-center text-sm text-muted-foreground">
                                    Don&apos;t have an account?{' '}
                                    <Link href={registerRoute().url} className="font-medium text-primary underline-offset-4 hover:underline">
                                        Register here
                                    </Link>
                                </p>
                            </div>
                        </>
                    )}
                    </Form>

                    {status && (
                        <div className="mb-4 text-center text-sm font-medium text-green-600">
                            {status}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
};
