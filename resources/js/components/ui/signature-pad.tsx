import { useRef, useEffect, useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';

interface SignaturePadProps {
    label: string;
    color?: string;
    onSave?: (dataUrl: string | null) => void;
    disabled?: boolean;
    defaultValue?: string | null;
}

export default function SignaturePad({ label, color = '#1e293b', onSave, disabled = false, defaultValue }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);

    // Load default value if provided (e.g., from server)
    useEffect(() => {
        if (defaultValue && canvasRef.current) {
            const img = new Image();
            img.onload = () => {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    setHasContent(true);
                }
            };
            img.src = defaultValue;
        }
    }, [defaultValue]);

    const getPosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        if ('touches' in e) {
            const touch = e.touches[0] || e.changedTouches[0];
            return {
                x: (touch.clientX - rect.left) * (canvas.width / rect.width),
                y: (touch.clientY - rect.top) * (canvas.height / rect.height),
            };
        }

        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height),
        };
    }, []);

    const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;
        e.preventDefault();
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        const pos = getPosition(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsDrawing(true);
        setHasContent(true);
    }, [disabled, getPosition]);

    const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || disabled) return;
        e.preventDefault();
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        const pos = getPosition(e);
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }, [isDrawing, disabled, getPosition, color]);

    const stopDrawing = useCallback(() => {
        setIsDrawing(false);
    }, []);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasContent(false);
        onSave?.(null);
    }, [onSave]);

    // Save data URL when drawing stops
    useEffect(() => {
        if (!hasContent) return;
        const timeout = setTimeout(() => {
            const canvas = canvasRef.current;
            if (canvas) {
                const dataUrl = canvas.toDataURL('image/png');
                onSave?.(dataUrl);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [isDrawing, hasContent, onSave]);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">{label}</label>
                {hasContent && !disabled && (
                    <button
                        onClick={clearCanvas}
                        type="button"
                        className="flex items-center gap-1 text-xs text-red-600 hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="h-3 w-3" />
                        Clear
                    </button>
                )}
            </div>
            <div
                className={`relative rounded-lg border-2 border-dashed transition-colors ${
                    disabled
                        ? 'border-muted bg-muted/20 cursor-default'
                        : hasContent
                        ? 'border-emerald-300 bg-white dark:border-emerald-700 dark:bg-gray-900'
                        : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:hover:border-gray-500'
                }`}
            >
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-24 sm:h-28 touch-none cursor-crosshair rounded-lg"
                    style={{ touchAction: 'none' }}
                />
                {!hasContent && !disabled && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-sm text-muted-foreground/60 select-none">
                            Sign here
                        </p>
                    </div>
                )}
            </div>
            {disabled && !hasContent && (
                <p className="text-xs text-muted-foreground italic">No signature provided</p>
            )}
        </div>
    );
}
