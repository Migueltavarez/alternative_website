'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DEFAULT_3D_EXTENSIONS = ['.stl', '.obj', '.3mf', '.step', '.stp'];

interface FileUploadProps {
  onUploadComplete: (fileName: string, fileUrl: string, fileSize?: number) => void;
  isUploading: boolean;
  acceptedExtensions?: string[];
}

export function FileUpload({ onUploadComplete, isUploading, acceptedExtensions }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = acceptedExtensions ?? DEFAULT_3D_EXTENSIONS;

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      return `Tipo de archivo no permitido. Usa: ${allowedExtensions.join(', ')}`;
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'El archivo es muy grande. Máximo 100MB';
    }

    return null;
  };

  const handleUpload = async (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setUploadStatus('error');
      return;
    }

    setFile(selectedFile);
    setError('');
    setUploadStatus('uploading');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al subir');
      }

      const data = await res.json();
      setUploadProgress(100);
      setUploadStatus('success');
      
      setTimeout(() => {
        onUploadComplete(data.fileName, data.fileUrl, data.fileSize);
        setFile(null);
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 500);
    } catch (err: any) {
      setError(err.message);
      setUploadStatus('error');
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleUpload(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleUpload(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError('');
    setUploadStatus('idle');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full">
      {uploadStatus === 'idle' || uploadStatus === 'error' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging 
              ? 'border-primary bg-primary/10' 
              : 'border-border hover:border-primary/50 hover:bg-accent/50'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedExtensions.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isDragging ? 'bg-primary/20' : 'bg-primary/10'
            }`}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            
            <div>
              <p className="font-medium">
                {isDragging ? 'Suelta el archivo aquí' : 'Arrastra tu archivo aquí'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                o haz clic para seleccionar
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {allowedExtensions.map((ext) => (
                <span key={ext} className="text-xs px-2 py-0.5 rounded bg-accent text-muted-foreground">
                  {ext}
                </span>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              Máximo 100MB
            </p>
          </div>
        </div>
      ) : uploadStatus === 'uploading' ? (
        <div className="border border-border rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <File className="w-6 h-6 text-primary" />
            </div>
            
            <div className="flex-1">
              <p className="font-medium truncate">{file?.name}</p>
              <p className="text-sm text-muted-foreground">
                {file && formatFileSize(file.size)}
              </p>
              
              <div className="mt-2 h-2 bg-accent rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        </div>
      ) : uploadStatus === 'success' ? (
        <div className="border border-green-500/30 bg-green-500/10 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            
            <div className="flex-1">
              <p className="font-medium text-green-500">¡Archivo subido!</p>
              <p className="text-sm text-muted-foreground truncate">{file?.name}</p>
            </div>
            
            <button
              onClick={removeFile}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : null}

      {error && (
        <div className="flex items-center gap-2 mt-3 text-sm text-red-500">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
