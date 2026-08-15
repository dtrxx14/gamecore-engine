import { Head, Link, useForm } from '@inertiajs/react';
import {
    Mail,
    MapPin,
    Phone,
    Send,
    Building2,
    Clock,
} from 'lucide-react';
import PublicHeader from '@/components/public/public-header';
import PublicFooter from '@/components/public/public-footer';
import { login } from '@/routes';

const contactInfo = [
    {
        icon: Mail,
        title: 'Email',
        lines: ['support@gamecore.example', 'hello@gamecore.example'],
    },
    {
        icon: MapPin,
        title: 'Headquarters',
        lines: ['123 Tournament Way', 'Metro City, MC 10001'],
    },
    {
        icon: Phone,
        title: 'Phone',
        lines: ['+1 (555) 234-5678', 'Mon–Fri, 9am–6pm'],
    },
    {
        icon: Clock,
        title: 'Support Hours',
        lines: ['Monday – Friday', '9:00 AM – 6:00 PM'],
    },
];

type ContactForm = {
    name: string;
    email: string;
    subject: string;
    message: string;
};

type Props = {
    success?: string;
};

export default function Contact({ success }: Props) {
    const { data, setData, post, processing, errors } =
        useForm<ContactForm>({
            name: '',
            email: '',
            subject: '',
            message: '',
        });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/contact');
    }

return (
        <div className="min-h-screen bg-background text-foreground">
            <Head title="Contact" />

            <PublicHeader active="contact" />

{/* Hero */}
            <section className="mx-auto max-w-7xl px-6 pt-16 pb-16 text-center md:pt-24">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-widest text-primary">
                    Contact
                </span>
                <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-black leading-tight text-foreground sm:text-5xl lg:text-6xl">
                    Let's{' '}
                    <span className="bg-gradient-to-r from-red-500 via-red-400 to-red-600 bg-clip-text text-transparent">
                        talk
                    </span>
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                    Have a question about running a tournament or using GameCore?
                    Send us a message and our team will get back to you.
                </p>
            </section>

            {/* Contact Content */}
            <section className="mx-auto max-w-7xl px-6 pb-24">
                <div className="grid gap-8 lg:grid-cols-5">
                    {/* Form */}
                    <div className="lg:col-span-3">
                        <div className="rounded-3xl border border-border bg-card p-6 md:p-10">
                            <h2 className="text-xl font-bold text-foreground">
                                Send us a message
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                We usually respond within one business day.
                            </p>

                            {success && (
                                <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
                                    {success}
                                </div>
                            )}

                            <form onSubmit={submit} className="mt-8 grid gap-6">
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <label
                                            htmlFor="name"
                                            className="text-sm font-medium text-foreground"
                                        >
                                            Name
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Your name"
                                            className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary/50"
                                        />
                                        {errors.name && (
                                            <p className="text-xs text-red-500">{errors.name}</p>
                                        )}
                                    </div>

                                    <div className="grid gap-2">
                                        <label
                                            htmlFor="email"
                                            className="text-sm font-medium text-foreground"
                                        >
                                            Email
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="you@example.com"
                                            className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary/50"
                                        />
                                        {errors.email && (
                                            <p className="text-xs text-red-500">{errors.email}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <label
                                        htmlFor="subject"
                                        className="text-sm font-medium text-foreground"
                                    >
                                        Subject
                                    </label>
                                    <input
                                        id="subject"
                                        type="text"
                                        value={data.subject}
                                        onChange={(e) => setData('subject', e.target.value)}
                                        placeholder="How can we help?"
                                        className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary/50"
                                    />
                                    {errors.subject && (
                                        <p className="text-xs text-red-500">{errors.subject}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <label
                                        htmlFor="message"
                                        className="text-sm font-medium text-foreground"
                                    >
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        rows={6}
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        placeholder="Tell us about your tournament or question..."
                                        className="resize-none rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary/50"
                                    />
                                    {errors.message && (
                                        <p className="text-xs text-red-500">{errors.message}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                                >
                                    {processing ? (
                                        'Sending...'
                                    ) : (
                                        <>
                                            Send Message
                                            <Send size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="grid gap-6 lg:col-span-2">
                        {contactInfo.map((info) => (
                            <div
                                key={info.title}
                                className="rounded-2xl border border-border bg-card p-6"
                            >
                                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <info.icon className="size-5" />
                                </div>
                                <h3 className="font-bold text-foreground">{info.title}</h3>
                                {info.lines.map((line) => (
                                    <p key={line} className="mt-1 text-sm text-muted-foreground">
                                        {line}
                                    </p>
                                ))}
                            </div>
                        ))}

                        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
                            <Building2 className="size-6 shrink-0 text-primary" />
                            <p className="text-sm text-foreground">
                                Want to become an organizer?{' '}
                                <Link href={login()} className="font-medium text-primary hover:underline">
                                    Get started
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

        <PublicFooter />
        </div>
    );
}
