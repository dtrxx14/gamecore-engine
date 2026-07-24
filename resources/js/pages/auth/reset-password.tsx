import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <>
            <Head title="Reset password" />
            <div className="flex items-center justify-center">
                <div className="w-full max-w-sm rounded-lg border border-border/70 bg-card/80 p-4 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)] backdrop-blur-sm dark:border-primary/15 dark:bg-card/90 sm:p-8">
                    <Form
                        {...update.form()}
                        transform={(data) => ({ ...data, token, email })}
                        resetOnSuccess={['password', 'password_confirmation']}
                    >
                        {({ processing, errors }) => (
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        autoComplete="email"
                                        value={email}
                                        className="mt-1 block w-full"
                                        readOnly
                                    />
                                    <InputError
                                        message={errors.email}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        autoComplete="new-password"
                                        className="mt-1 block w-full"
                                        autoFocus
                                        placeholder="Password"
                                        passwordrules={passwordRules}
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
                                        autoComplete="new-password"
                                        className="mt-1 block w-full"
                                        placeholder="Confirm password"
                                        passwordrules={passwordRules}
                                    />
                                    <InputError
                                        message={errors.password_confirmation}
                                        className="mt-2"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="mt-4 w-full"
                                    disabled={processing}
                                    data-test="reset-password-button"
                                >
                                    {processing && <Spinner />}
                                    Reset password
                                </Button>
                            </div>
                        )}
                    </Form>
                </div>
            </div>
        </>
    );
}

ResetPassword.layout = {
    title: 'Reset password',
    description: 'Please enter your new password below',
};
