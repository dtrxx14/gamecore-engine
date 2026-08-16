import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Lock, Pencil, QrCode, Send, Shield, Upload } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Country {
    id: number;
    name: string;
}

interface StateProvince {
    id: number;
    name: string;
}

interface Player {
    id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    profile_image?: string | null;
    contact_number?: string;
    club?: string;
    gender?: string;
    birthdate?: string;
    nationality_id?: number;
    state_province_id?: number;
    dupr_account?: string;
    bio?: string;
    created_at?: string;
    updated_at?: string;
    user?: {
        id: number;
        email: string;
        account_number: string;
    };
    nationality?: Country;
    stateProvince?: StateProvince;
}

interface Props {
    player: Player;
    countries: Country[];
    stateProvinces: StateProvince[];
}

const formatDate = (value?: string) => {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const getProfileImageUrl = (image?: string | null) => {
    if (!image) {
        return null;
    }

    return image.startsWith('http') ? image : `/storage/${image}`;
};

export default function PlayerDetail({ player, countries, stateProvinces: initialStateProvinces }: Props) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordMode, setPasswordMode] = useState<'reset' | 'send-link'>('send-link');
    const [stateProvinces, setStateProvinces] = useState<StateProvince[]>(initialStateProvinces || []);
    const [loadingStates, setLoadingStates] = useState(false);
    const [pendingAction, setPendingAction] = useState<'edit' | 'send-link' | 'reset-password' | 'remove-image' | null>(null);
    const [isRemoveImageModalOpen, setIsRemoveImageModalOpen] = useState(false);
    const [cropZoom, setCropZoom] = useState(1);
    const [imagePositionX, setImagePositionX] = useState(50);
    const [imagePositionY, setImagePositionY] = useState(50);
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const profileImageUrl = useMemo(() => getProfileImageUrl(player.profile_image), [player.profile_image]);

    const qrValue = player.user?.account_number || `player-${player.id}`;

    const [form, setForm] = useState({
        first_name: player.first_name,
        last_name: player.last_name,
        contact_number: player.contact_number || '',
        club: player.club || '',
        gender: player.gender || '',
        birthdate: player.birthdate || '',
        nationality_id: String(player.nationality_id || ''),
        state_province_id: String(player.state_province_id || ''),
        dupr_account: player.dupr_account || '',
        bio: player.bio || '',
    });

    const [passwordForm, setPasswordForm] = useState({
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        let isMounted = true;

        const loadStateOptions = async () => {
            if (!player.nationality_id) {
                if (isMounted) {
                    setStateProvinces([]);
                }

                return;
            }

            setLoadingStates(true);

            try {
                const response = await fetch(`/api/countries/${player.nationality_id}/states`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error('Failed to fetch states');
                }

                if (isMounted) {
                    setStateProvinces(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error('Failed to fetch states:', error);

                if (isMounted) {
                    setStateProvinces([]);
                }
            } finally {
                if (isMounted) {
                    setLoadingStates(false);
                }
            }
        };

        loadStateOptions();

        return () => {
            isMounted = false;
        };
    }, [player.nationality_id]);

    useEffect(() => {
        return () => {
            if (profilePreview && profilePreview.startsWith('blob:')) {
                URL.revokeObjectURL(profilePreview);
            }
        };
    }, [profilePreview]);

    const handleNationalityChange = async (value: string) => {
        setForm((current) => ({
            ...current,
            nationality_id: value,
            state_province_id: '',
        }));

        if (!value) {
            setStateProvinces([]);
            return;
        }

        setLoadingStates(true);

        try {
            const response = await fetch(`/api/countries/${value}/states`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error('Failed to fetch states');
            }

            setStateProvinces(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch states:', error);
            setStateProvinces([]);
        } finally {
            setLoadingStates(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            setProfileFile(null);
            setProfilePreview(null);
            setCropSourceUrl(null);
            return;
        }

        setProfileFile(file);
        const previewUrl = URL.createObjectURL(file);
        setProfilePreview(previewUrl);
        setCropSourceUrl(previewUrl);
        setCropZoom(1);
        setImagePositionX(50);
        setImagePositionY(50);
    };

    const cropImageToFile = async () => {
        const sourceUrl = cropSourceUrl ?? profilePreview ?? profileImageUrl;

        if (!sourceUrl) {
            return null;
        }

        const image = new Image();
        image.src = sourceUrl;

        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        const size = 1200;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }

        const smaller = Math.min(image.naturalWidth, image.naturalHeight);
        const sourceX = (image.naturalWidth - smaller) / 2;
        const sourceY = (image.naturalHeight - smaller) / 2;

        const safeZoom = Math.min(Math.max(cropZoom, 1), 1.8);
        const panX = ((imagePositionX - 50) / 50) * size * 0.28;
        const panY = ((imagePositionY - 50) / 50) * size * 0.28;

        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const scaledSize = size * safeZoom;
        ctx.drawImage(
            image,
            sourceX,
            sourceY,
            smaller,
            smaller,
            -(scaledSize - size) / 2 + panX,
            -(scaledSize - size) / 2 + panY,
            scaledSize,
            scaledSize,
        );

        ctx.restore();

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
        if (!blob) {
            return null;
        }

        return new File([blob], profileFile?.name || 'profile-image.jpg', { type: 'image/jpeg' });
    };

    const handleEditModalOpen = () => {
        setForm({
            first_name: player.first_name,
            last_name: player.last_name,
            contact_number: player.contact_number || '',
            club: player.club || '',
            gender: player.gender || '',
            birthdate: player.birthdate || '',
            nationality_id: String(player.nationality_id || ''),
            state_province_id: String(player.state_province_id || ''),
            dupr_account: player.dupr_account || '',
            bio: player.bio || '',
        });

        if (profilePreview && profilePreview.startsWith('blob:')) {
            URL.revokeObjectURL(profilePreview);
        }

        const nextPreview = profileImageUrl ? profileImageUrl : null;
        setProfilePreview(nextPreview);
        setCropSourceUrl(nextPreview);
        setProfileFile(null);
        setCropZoom(1);
        setImagePositionX(50);
        setImagePositionY(50);
        setIsEditModalOpen(true);
    };

    const handleRemoveProfileImage = () => {
        setIsRemoveImageModalOpen(true);
    };

    const confirmRemoveProfileImage = () => {
        setPendingAction('remove-image');

        router.delete(`/admin/player-management/${player.id}/profile-image`, {
            onSuccess: () => {
                setProfilePreview(null);
                setProfileFile(null);
                setIsRemoveImageModalOpen(false);
                setPendingAction(null);
            },
            onError: () => {
                setPendingAction(null);
            },
            onFinish: () => {
                setPendingAction(null);
            },
        });
    };

    const submitEditForm = async (event: React.FormEvent) => {
        event.preventDefault();
        setPendingAction('edit');

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('first_name', form.first_name);
        formData.append('last_name', form.last_name);
        formData.append('contact_number', form.contact_number);
        formData.append('club', form.club);
        formData.append('gender', form.gender || '');
        formData.append('birthdate', form.birthdate || '');
        formData.append('nationality_id', form.nationality_id ? String(form.nationality_id) : '');
        formData.append('state_province_id', form.state_province_id ? String(form.state_province_id) : '');
        formData.append('dupr_account', form.dupr_account);
        formData.append('bio', form.bio);

        const croppedFile = await cropImageToFile();
        const finalProfileFile = croppedFile ?? profileFile;

        if (finalProfileFile) {
            formData.append('profile_image', finalProfileFile);
        }

        router.post(`/admin/player-management/${player.id}`, formData, {
            forceFormData: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setProfilePreview(null);
                setProfileFile(null);
                setPendingAction(null);
            },
            onError: () => {
                setPendingAction(null);
            },
            onFinish: () => {
                setPendingAction(null);
            },
        });
    };

    const handleResetPassword = (event: React.FormEvent) => {
        event.preventDefault();

        if (passwordForm.password !== passwordForm.password_confirmation) {
            alert('Passwords do not match');
            return;
        }

        setPendingAction('reset-password');

        router.post(`/admin/player-management/${player.id}/reset-password`, {
            password: passwordForm.password,
            password_confirmation: passwordForm.password_confirmation,
        }, {
            onSuccess: () => {
                setPasswordForm({ password: '', password_confirmation: '' });
                setIsPasswordModalOpen(false);
                setPendingAction(null);
            },
            onError: () => {
                setPendingAction(null);
            },
            onFinish: () => {
                setPendingAction(null);
            },
        });
    };

    const initials = `${player.first_name?.charAt(0) ?? ''}${player.last_name?.charAt(0) ?? ''}`.toUpperCase();

    return (
        <>
            <Head title={`${player.first_name} ${player.last_name}`} />

            <div
                className="min-h-screen text-foreground"
                // style={{
                //     backgroundColor: 'var(--background)',
                //     backgroundImage:
                //         'radial-gradient(circle at top left, color-mix(in srgb, var(--primary) 12%, transparent), transparent 34%), linear-gradient(135deg, color-mix(in srgb, var(--primary) 5%, transparent), transparent 40%)',
                // }}
            >
                <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                    {/* Back */}
                    <Link href="/admin/player-management" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Back to player management
                    </Link>
                    <div className="rounded-xl border border-border/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-red-900/40 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120b0b_100%)]">
                        <header className="flex flex-col gap-4 border-b border-border/70 px-5 py-4 flex-row items-center justify-end dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Button onClick={handleEditModalOpen} className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                                    <Pencil className="size-4" />
                                    Edit
                                </Button>
                            </div>
                        </header>

                        <main className="space-y-6 p-5 sm:p-6 lg:p-8">
                            <section
                                className="flex flex-col gap-5 rounded-[24px] p-5 text-white shadow-[0_18px_45px_-24px_rgba(132,31,31,0.7)] sm:p-6 lg:flex-row lg:items-center lg:justify-between"
                                style={{
                                    background: 'linear-gradient(135deg, var(--primary-dark), var(--primary-medium))',
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white/40 bg-white/15 shadow-lg shadow-red-900/20">
                                        {profileImageUrl ? (
                                            <img src={profileImageUrl} alt={`${player.first_name} ${player.last_name}`} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-2xl font-bold tracking-wide">{initials || 'P'}</span>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-100">Player profile</p>
                                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                                            {player.first_name} {player.last_name}
                                        </h1>
                                        <p className="mt-2 text-sm text-red-100">{player.user?.email}</p>
                                    </div>
                                </div>

                                <div className="ml-auto flex items-center self-end lg:self-center">
                                    <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-2.5 shadow-inner shadow-red-950/20 backdrop-blur-sm">
                                        <div className="flex h-20 w-20 items-center justify-center rounded-sm bg-white p-1.5">
                                            <QRCode
                                                value={qrValue}
                                                size={72}
                                                bgColor="transparent"
                                                fgColor="#ac1f1f"
                                                level="M"
                                                title={`Player account number ${player.user?.account_number ?? player.id}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
                                <div className="rounded-[24px] border border-border/70 bg-card p-5 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)] dark:border-red-900/40 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120b0b_100%)] sm:p-6">
                                    <div className="mb-5 flex items-center justify-between">
                                        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground dark:text-slate-400">Overview</h2>
                                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary dark:bg-primary/20 dark:text-red-200">
                                            Active
                                        </span>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-2xl bg-muted/40 p-4 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120b0b_100%)]">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Gender</p>
                                            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {player.gender ? player.gender.charAt(0).toUpperCase() + player.gender.slice(1) : '—'}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-muted/40 p-4 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120b0b_100%)]">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Birthdate</p>
                                            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{player.birthdate || '—'}</p>
                                        </div>
                                        <div className="rounded-2xl bg-muted/40 p-4 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120b0b_100%)]">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Contact</p>
                                            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{player.contact_number || '—'}</p>
                                        </div>
                                        <div className="rounded-2xl bg-muted/40 p-4 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120b0b_100%)]">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Nationality</p>
                                            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{player.nationality?.name || '—'}</p>
                                        </div>
                                        <div className="rounded-2xl bg-muted/40 p-4 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120b0b_100%)]">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">State / Province</p>
                                            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{player.stateProvince?.name || '—'}</p>
                                        </div>
                                        <div className="rounded-2xl bg-muted/40 p-4 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120b0b_100%)]">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">DUPR</p>
                                            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{player.dupr_account || '—'}</p>
                                        </div>
                                    </div>

                                    {player.bio && (
                                        <div className="mt-6 rounded-2xl border border-border/70 bg-muted/40 p-4 dark:border-red-900/60 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120b0b_100%)]">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Bio</p>
                                            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">{player.bio}</p>
                                        </div>
                                    )}
                                </div>

                                <aside className="space-y-5">
                                    <div className="rounded-[24px] border border-border/70 bg-card p-5 shadow-sm dark:border-red-900/40 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120b0b_100%)] sm:p-6">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Account</p>
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Account Number</p>
                                                <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{player.user?.account_number || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Member since</p>
                                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(player.created_at)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Last updated</p>
                                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(player.updated_at)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-[24px] border border-primary/15 bg-gradient-to-br from-primary/5 to-red-50 p-5 shadow-sm dark:border-red-900/60 dark:from-red-950/60 dark:to-red-950/40 sm:p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-xl bg-primary/10 p-2 text-primary shadow-sm dark:bg-[rgba(80,21,21,0.38)] dark:text-red-200">
                                                <Shield className="size-4" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Password</p>
                                        </div>

                                        <div className="mt-5 space-y-3">
                                            <Button
                                                onClick={() => {
                                                    setPasswordMode('send-link');
                                                    setIsPasswordModalOpen(true);
                                                }}
                                                variant="outline"
                                                className="w-full justify-start gap-2 rounded-xl border-primary/20 bg-background text-foreground hover:bg-primary/5 dark:border-red-900/60 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120a0a_100%)] dark:text-slate-100"
                                            >
                                                <Send className="size-4" />
                                                Send reset link
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setPasswordMode('reset');
                                                    setIsPasswordModalOpen(true);
                                                }}
                                                variant="outline"
                                                className="w-full justify-start gap-2 rounded-xl border-primary/20 bg-background text-foreground hover:bg-primary/5 dark:border-red-900/60 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120a0a_100%)] dark:text-slate-100"
                                            >
                                                <Lock className="size-4" />
                                                Set new password
                                            </Button>
                                        </div>
                                    </div>
                                </aside>
                            </section>
                        </main>
                    </div>
                </div>
            </div>

            <Dialog
                open={isEditModalOpen}
                onOpenChange={(open) => {
                    if (!open && isRemoveImageModalOpen) {
                        return;
                    }

                    setIsEditModalOpen(open);
                    if (!open) {
                        setIsRemoveImageModalOpen(false);
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl border-0 bg-card p-0 shadow-2xl dark:border-red-900/50 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120b0b_100%)]">
                    <div
                        className="border-b border-border/70 px-6 py-5 text-white dark:border-slate-700"
                        style={{
                            background: 'linear-gradient(135deg, var(--primary-dark), var(--primary-medium))',
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle className="text-xl text-white">Edit player details</DialogTitle>
                            <DialogDescription className="text-red-100">Update the profile information for this player.</DialogDescription>
                        </DialogHeader>
                    </div>

                    <form className="space-y-4 p-6" onSubmit={submitEditForm}>
                        <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-sm dark:border-red-900/60 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120b0b_100%)]">
                                    {profilePreview ? (
                                        <img
                                            src={profilePreview}
                                            alt="Profile preview"
                                            className="h-full w-full object-cover"
                                            style={{
                                                transform: `scale(${Math.min(Math.max(cropZoom, 1), 1.8)}) translate(${((imagePositionX - 50) / 2.5).toFixed(1)}px, ${((imagePositionY - 50) / 2.5).toFixed(1)}px)`,
                                                transformOrigin: 'center center',
                                            }}
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-100 to-rose-100 text-lg font-bold text-red-600 dark:from-red-900 dark:to-rose-900 dark:text-red-200">
                                            {initials || 'P'}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Upload className="size-4 text-red-600" />
                                        <Label htmlFor="profile_image" className="cursor-pointer text-sm font-medium text-slate-900 dark:text-slate-100">
                                            Upload profile image
                                        </Label>
                                    </div>
                                    <Input id="profile_image" ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="cursor-pointer" />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Choose a clear headshot and adjust the crop before saving.</p>

                                    {profileImageUrl && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="mt-2 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950/50"
                                            onClick={handleRemoveProfileImage}
                                            loading={pendingAction === 'remove-image'}
                                            disabled={pendingAction !== null}
                                        >
                                            {pendingAction === 'remove-image' ? 'Removing...' : 'Remove photo'}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {profilePreview && (
                                <div className="mt-4 space-y-3 rounded-xl border border-red-100 bg-white p-3 dark:border-red-900/60 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120b0b_100%)]">
                                    <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                                        <span>Crop</span>
                                        <span>{cropZoom.toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="1.8"
                                        step="0.1"
                                        value={Math.min(Math.max(cropZoom, 1), 1.8)}
                                        onChange={(event) => setCropZoom(Number(event.target.value))}
                                        className="w-full accent-red-600"
                                    />

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Horizontal</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={imagePositionX}
                                                onChange={(event) => setImagePositionX(Number(event.target.value))}
                                                className="w-full accent-red-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Vertical</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={imagePositionY}
                                                onChange={(event) => setImagePositionY(Number(event.target.value))}
                                                className="w-full accent-red-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name *</Label>
                                <Input
                                    id="first_name"
                                    required
                                    value={form.first_name}
                                    onChange={(e) => setForm((c) => ({ ...c, first_name: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name *</Label>
                                <Input
                                    id="last_name"
                                    required
                                    value={form.last_name}
                                    onChange={(e) => setForm((c) => ({ ...c, last_name: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <div className="rounded-xl border border-input bg-muted/50 px-3 py-2.5 text-sm text-slate-600 dark:border-red-900/50 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120b0b_100%)] dark:text-slate-300">
                                {player.user?.email}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="contact_number">Contact Number</Label>
                                <Input
                                    id="contact_number"
                                    type="tel"
                                    value={form.contact_number}
                                    onChange={(e) => setForm((c) => ({ ...c, contact_number: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="club">Club</Label>
                                <Input
                                    id="club"
                                    value={form.club}
                                    onChange={(e) => setForm((c) => ({ ...c, club: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2 w-full">
                                <Label htmlFor="gender">Gender</Label>
                                <Select value={form.gender} onValueChange={(value) => setForm((c) => ({ ...c, gender: value }))}>
                                    <SelectTrigger id="gender">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">None</SelectItem>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="birthdate">Birthdate</Label>
                                <Input
                                    id="birthdate"
                                    type="date"
                                    value={form.birthdate}
                                    onChange={(e) => setForm((c) => ({ ...c, birthdate: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="nationality_id">Nationality</Label>
                                <Select value={form.nationality_id} onValueChange={handleNationalityChange}>
                                    <SelectTrigger id="nationality_id">
                                        <SelectValue placeholder="Select nationality" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">None</SelectItem>
                                        {countries.map((country) => (
                                            <SelectItem key={country.id} value={String(country.id)}>
                                                {country.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state_province_id">State / Province</Label>
                                <Select
                                    value={form.state_province_id}
                                    onValueChange={(value) => setForm((c) => ({ ...c, state_province_id: value }))}
                                    disabled={!form.nationality_id || loadingStates}
                                >
                                    <SelectTrigger id="state_province_id">
                                        <SelectValue placeholder={!form.nationality_id ? 'Select nationality first' : 'Select state/province'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">None</SelectItem>
                                        {stateProvinces.map((state) => (
                                            <SelectItem key={state.id} value={String(state.id)}>
                                                {state.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dupr_account">DUPR Account</Label>
                            <Input
                                id="dupr_account"
                                placeholder="e.g., 12345678"
                                value={form.dupr_account}
                                onChange={(e) => setForm((c) => ({ ...c, dupr_account: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={form.bio}
                                onChange={(e) => setForm((c) => ({ ...c, bio: e.target.value }))}
                                rows={4}
                                placeholder="Add a short bio..."
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={pendingAction !== null}>
                                Cancel
                            </Button>
                            <Button type="submit" loading={pendingAction === 'edit'}>
                                Save changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isRemoveImageModalOpen}
                onOpenChange={(open) => {
                    setIsRemoveImageModalOpen(open);
                    if (!open) {
                        setPendingAction(null);
                    }
                }}
            >
                <DialogContent
                    className="max-w-md rounded-3xl border-0 bg-card shadow-2xl dark:border-red-900/50 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120b0b_100%)]"
                    onEscapeKeyDown={(event) => {
                        event.preventDefault();
                    }}
                    onPointerDownOutside={(event) => {
                        event.preventDefault();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Remove profile photo</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove this player&apos;s profile image? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsRemoveImageModalOpen(false);
                                setPendingAction(null);
                            }}
                            disabled={pendingAction !== null}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmRemoveProfileImage}
                            loading={pendingAction === 'remove-image'}
                            disabled={pendingAction !== null}
                        >
                            {pendingAction === 'remove-image' ? 'Removing...' : 'Remove photo'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogContent className="rounded-3xl border-0 bg-card shadow-2xl dark:border-red-900/50 dark:bg-[linear-gradient(145deg,#1d1010_0%,#120b0b_100%)]">
                    <DialogHeader>
                        <DialogTitle>
                            {passwordMode === 'send-link' ? 'Send password reset link' : 'Set new password'}
                        </DialogTitle>
                        <DialogDescription>
                            {passwordMode === 'send-link'
                                ? `A secure link will be sent to ${player.user?.email}`
                                : 'Enter a new password for this player account.'}
                        </DialogDescription>
                    </DialogHeader>

                    {passwordMode === 'send-link' ? (
                        <DialogFooter className="sm:justify-end">
                            <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)} disabled={pendingAction !== null}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    setPendingAction('send-link');
                                    router.post(`/admin/player-management/${player.id}/send-password-reset-link`, {}, {
                                        onSuccess: () => {
                                            setIsPasswordModalOpen(false);
                                            setPendingAction(null);
                                        },
                                        onError: () => {
                                            setPendingAction(null);
                                        },
                                        onFinish: () => {
                                            setPendingAction(null);
                                        },
                                    });
                                }}
                                loading={pendingAction === 'send-link'}
                                disabled={pendingAction !== null}
                            >
                                {pendingAction === 'send-link' ? 'Sending...' : 'Send link'}
                            </Button>
                        </DialogFooter>
                    ) : (
                        <form className="space-y-4" onSubmit={handleResetPassword}>
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    minLength={8}
                                    value={passwordForm.password}
                                    onChange={(e) => setPasswordForm((c) => ({ ...c, password: e.target.value }))}
                                    placeholder="Minimum 8 characters"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm Password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    required
                                    minLength={8}
                                    value={passwordForm.password_confirmation}
                                    onChange={(e) => setPasswordForm((c) => ({ ...c, password_confirmation: e.target.value }))}
                                    placeholder="Confirm password"
                                />
                            </div>
                            <DialogFooter className="sm:justify-end">
                                <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)} disabled={pendingAction !== null}>
                                    Cancel
                                </Button>
                                <Button type="submit" loading={pendingAction === 'reset-password'} disabled={pendingAction !== null}>
                                    {pendingAction === 'reset-password' ? 'Setting...' : 'Set password'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

PlayerDetail.layout = ({ player }: {
        player: any;
    }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Player Management',
            href: '/admin/player-management',
        },
        {
            title: `${player.first_name} ${player.last_name}'s Profile`,
            href: '#',
        },
    ],
});

