import { useState, useCallback } from 'react';
import api from '../api/api';

interface UploadResult {
    url: string;
    filename: string;
}

export const useImageUpload = (defaultEndpoint: string = '/uploads/product-image') => {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const upload = useCallback(async (file: File, endpointOverride?: string): Promise<string | null> => {
        setIsUploading(true);
        setProgress(0);
        setError(null);

        const targetEndpoint = endpointOverride || defaultEndpoint;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post<UploadResult>(targetEndpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                    }
                }
            });

            setProgress(100);
            return response.data.url;
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al subir imagen');
            return null;
        } finally {
            setIsUploading(false);
        }
    }, [defaultEndpoint]);

    const reset = useCallback(() => {
        setProgress(0);
        setError(null);
    }, []);

    return { upload, isUploading, progress, error, reset };
};
