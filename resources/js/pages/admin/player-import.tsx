import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    FileSpreadsheet,
    Info,
    Loader2,
    Upload,
    Users,
    XCircle,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Configuration {
    id: number;
    name: string;
    status: {
        name: string;
        slug: string;
    } | null;
}

interface Props {
    configurations: Configuration[];
}

export default function PlayerImport({ configurations }: Props) {
    const { errors: pageErrors } = usePage().props;
    const [file, setFile] = useState<File | null>(null);
    const [configurationId, setConfigurationId] = useState('');
    const [processing, setProcessing] = useState(false);
    const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        // Try to preview the file
        if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
            const text = await selectedFile.text();
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length > 0) {
                const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
                const rows = lines.slice(1, 6).map(line =>
                    line.split(',').map(cell => cell.trim().replace(/^"(.*)"$/, '$1'))
                );
                setPreview({ headers, rows });
            }
        } else {
            // For Excel files, we just show file info (no preview easily without backend call)
            setPreview(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv'],
        },
        maxFiles: 1,
        maxSize: 10485760, // 10MB
    });

    const handleRemoveFile = () => {
        setFile(null);
        setPreview(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            toast.error('Please select a file to import.');
            return;
        }

        if (!configurationId) {
            toast.error('Please select a live configuration.');
            return;
        }

        setProcessing(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('live_configuration_id', configurationId);

        router.post('/admin/player-import', formData, {
            preserveScroll: true,
            onSuccess: () => {
                setProcessing(false);
                setFile(null);
                setPreview(null);
                toast.success('Import completed successfully!');
            },
            onError: (errors) => {
                setProcessing(false);
                toast.error('Import failed. Please check the form for errors.');
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <>
            <Head title="Player Import" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                {/* Back button */}
                <Link
                    href="/admin/live-configuration"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to live configurations
                </Link>

                {/* Page header */}
                <div className="rounded-xl border border-border/70 bg-gradient-to-br from-background via-card to-emerald-500/15 p-6 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-md">
                            <Upload className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                                Import Players
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Upload an Excel or CSV file to bulk import players, create teams, and auto-configure categories.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
                    <CardContent className="flex items-start gap-3 p-4">
                        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                            <p className="font-medium">Excel/CSV Format</p>
                            <p className="mt-1">Your file should have these columns in order:</p>
                            <ol className="mt-1 list-inside list-decimal space-y-0.5">
                                <li><strong>Full Name</strong> — Full name of the player (used for email generation)</li>
                                <li><strong>First Name</strong> — Player's first name</li>
                                <li><strong>Last Name</strong> — Player's last name</li>
                                <li><strong>Team</strong> — Team name (e.g. "Team A")</li>
                                <li><strong>Team Number</strong> — Team number (e.g. 1, 2, 3)</li>
                                <li><strong>Category</strong> — Category name (Intermediate, Novice, 45+, etc.)</li>
                            </ol>
                            <p className="mt-2">
                                <strong>Auto-configuration rules:</strong> Intermediate & Novice = 51 points, Game Time 30min, Interval 5min. 45+ = 36 points, Game Time 20min, Interval 5min.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Import form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Live Configuration Selector */}
                    <Card className="border-border/70 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)]">
                        <CardHeader className="border-b border-border/70 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-red-500" />
                                <h2 className="text-lg font-semibold text-foreground">Live Configuration</h2>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Label htmlFor="live_configuration_id" className="text-sm font-medium">
                                Select configuration <span className="text-destructive">*</span>
                            </Label>
                            <select
                                id="live_configuration_id"
                                value={configurationId}
                                onChange={(e) => setConfigurationId(e.target.value)}
                                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-none outline-none transition-colors focus-visible:border-primary/50"
                            >
                                <option value="">Select a configuration...</option>
                                {configurations.map((config) => (
                                    <option key={config.id} value={config.id}>
                                        {config.name}
                                    </option>
                                ))}
                            </select>
                            {pageErrors?.live_configuration_id && (
                                <p className="mt-1.5 text-sm text-destructive">{pageErrors.live_configuration_id}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* File upload */}
                    <Card className="border-border/70 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)]">
                        <CardHeader className="border-b border-border/70 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                                <h2 className="text-lg font-semibold text-foreground">Upload File</h2>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div
                                {...getRootProps()}
                                className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                                    isDragActive
                                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                                        : 'border-border/70 hover:border-emerald-300 hover:bg-accent/50'
                                }`}
                            >
                                <input {...getInputProps()} />
                                {file ? (
                                    <div className="space-y-2">
                                        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFile();
                                            }}
                                            className="mt-2"
                                        >
                                            <XCircle className="mr-1 h-4 w-4" />
                                            Remove file
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                                        <p className="text-sm font-medium text-foreground">
                                            {isDragActive
                                                ? 'Drop your file here...'
                                                : 'Drag & drop your file here, or click to browse'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Supported formats: .xlsx, .xls, .csv (max 10MB)
                                        </p>
                                    </div>
                                )}
                            </div>
                            {pageErrors?.file && (
                                <p className="mt-1.5 text-sm text-destructive">{pageErrors.file}</p>
                            )}

                            {/* Preview for CSV */}
                            {preview && (
                                <div className="mt-6">
                                    <div className="mb-2 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium text-muted-foreground">
                                            Preview (first {preview.rows.length} rows)
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-border">
                                        <table className="min-w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-border bg-muted/50">
                                                    {preview.headers.map((header, i) => (
                                                        <th key={i} className="px-4 py-2 font-medium text-muted-foreground">
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {preview.rows.map((row, ri) => (
                                                    <tr key={ri} className="border-b border-border last:border-0">
                                                        {row.map((cell, ci) => (
                                                            <td key={ci} className="px-4 py-2 text-foreground">
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-4 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)]">
                        <Link href="/admin/live-configuration">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing || !file || !configurationId}
                            className="inline-flex items-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Users className="h-4 w-4" />
                                    Import Players
                                </>
                            )}
                        </Button>
                    </div>
                </form>

                {/* Flash messages */}
                {(pageErrors as any)?.import_errors && Array.isArray((pageErrors as any).import_errors) && (
                    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <div>
                                    <p className="font-medium text-amber-700 dark:text-amber-300">
                                        Import Notes
                                    </p>
                                    <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-amber-600 dark:text-amber-400">
                                        {((pageErrors as any).import_errors as string[]).slice(0, 10).map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                        {(pageErrors as any).import_errors.length > 10 && (
                                            <li className="text-xs">
                                                ...and {(pageErrors as any).import_errors.length - 10} more
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

PlayerImport.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Live Configuration',
            href: '/admin/live-configuration',
        },
        {
            title: 'Player Import',
            href: '#',
        },
    ],
};
