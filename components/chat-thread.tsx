'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, MessageSquare, Paperclip, X, ImageIcon } from 'lucide-react';

export interface ChatMessageData {
  id: string;
  sender: 'USER' | 'ADMIN';
  content: string;
  imageUrl?: string | null;
  createdAt: string;
}

interface ChatThreadProps {
  fetchUrl: string;
  postUrl: string;
  mySender: 'USER' | 'ADMIN';
  pollIntervalMs?: number;
  emptyLabel?: string;
  placeholder?: string;
}

export function ChatThread({
  fetchUrl,
  postUrl,
  mySender,
  pollIntervalMs = 5000,
  emptyLabel = 'Aún no hay mensajes. Escribe el primero.',
  placeholder = 'Escribe un mensaje...',
}: ChatThreadProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ file: File; previewUrl: string; uploadedUrl?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchUrl]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const fetchMessages = async (showLoading: boolean) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch(fetchUrl);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPendingImage({ file, previewUrl });

    // Upload immediately
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setPendingImage(prev => prev ? { ...prev, uploadedUrl: data.fileUrl } : null);
      } else {
        setPendingImage(null);
      }
    } catch {
      setPendingImage(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePendingImage = () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if ((!trimmed && !pendingImage?.uploadedUrl) || sending || uploading) return;

    setSending(true);
    try {
      const res = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed,
          imageUrl: pendingImage?.uploadedUrl ?? null,
        }),
      });
      if (res.ok) {
        setContent('');
        if (pendingImage) {
          URL.revokeObjectURL(pendingImage.previewUrl);
          setPendingImage(null);
        }
        await fetchMessages(false);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
    } finally {
      setSending(false);
    }
  };

  const canSend = (content.trim() || pendingImage?.uploadedUrl) && !sending && !uploading;

  return (
    <>
      <div className="flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto px-1 py-2 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">{emptyLabel}</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.sender === mySender;
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                      isMine
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-card border border-border rounded-bl-sm'
                    }`}
                  >
                    {m.imageUrl && (
                      <button
                        onClick={() => setLightboxUrl(`/api/download${m.imageUrl}`)}
                        className="block mb-1.5 rounded-lg overflow-hidden max-w-[220px]"
                      >
                        <img
                          src={`/api/download${m.imageUrl}`}
                          alt="imagen adjunta"
                          className="rounded-lg object-cover max-h-48 w-full hover:opacity-90 transition-opacity"
                        />
                      </button>
                    )}
                    {m.content && (
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    )}
                    <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {new Date(m.createdAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Image preview bar */}
        {pendingImage && (
          <div className="flex items-center gap-2 px-1 py-2 border-t border-border/50">
            <div className="relative">
              <img
                src={pendingImage.previewUrl}
                alt="preview"
                className="h-14 w-14 object-cover rounded-lg border border-border"
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{pendingImage.file.name}</p>
              <p className="text-[10px] text-muted-foreground">{uploading ? 'Subiendo...' : pendingImage.uploadedUrl ? 'Lista para enviar' : 'Error al subir'}</p>
            </div>
            <button onClick={removePendingImage} className="p-1 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2 pt-3 border-t border-border mt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!!pendingImage}
            className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground disabled:opacity-40"
            title="Adjuntar imagen"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-sm"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <img
            src={lightboxUrl}
            alt="imagen ampliada"
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
