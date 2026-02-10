import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { useImageUpload } from '../hooks/useImageUpload';

interface ImageUploaderProps {
    currentImageUrl?: string;
    onImageChange: (url: string | null) => void;
    endpoint?: string;
}

export const ImageUploader = ({ currentImageUrl, onImageChange, endpoint }: ImageUploaderProps) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { upload, isUploading, progress } = useImageUpload(endpoint);

    const handleFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) return;

        // Show local preview immediately
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);

        // Upload to server
        const uploadedUrl = await upload(file, endpoint);
        if (uploadedUrl) {
            setPreviewUrl(uploadedUrl);
            onImageChange(uploadedUrl);
        } else {
            // Revert on error
            setPreviewUrl(currentImageUrl || null);
        }

        URL.revokeObjectURL(localPreview);
    }, [upload, onImageChange, currentImageUrl]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleClear = useCallback(() => {
        setPreviewUrl(null);
        onImageChange(null);
    }, [onImageChange]);

    return (
        <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative w-full h-32 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center overflow-hidden ${isDragging ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-primary" size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{progress}%</span>
                </div>
            ) : previewUrl ? (
                <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleClear(); }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-lg hover:bg-red-500 transition-colors"
                    >
                        <X size={12} className="text-white" />
                    </button>
                </>
            ) : (
                <div className="flex flex-col items-center gap-2 text-white/30">
                    <Upload size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Arrastra o haz clic</span>
                </div>
            )}
        </div>
    );
};
