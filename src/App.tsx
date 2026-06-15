import React, { useEffect, useMemo, useState } from 'react';
import { UploadCloud, Camera, Heart, CheckCircle2, Image as ImageIcon, X, RefreshCw, Download, Images, FileVideo } from 'lucide-react';
import { uploadWeddingMedia } from './uploadService';
import { listWeddingUploads, type WeddingUpload } from './adminService';
import { ACCEPTED_FILE_EXTENSIONS, ACCEPTED_MEDIA_TYPES, MAX_FILES, MAX_PHOTO_SIZE_BYTES, MAX_PHOTO_SIZE_MB, MAX_VIDEO_SIZE_BYTES, MAX_VIDEO_SIZE_MB } from './config';
import { isSupabaseConfigured } from './supabaseClient';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

function formatFileSize(bytes: number) {
  if (!bytes) return '0 MB';
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';
}

function isVideoFile(file: File) {
  const extension = getFileExtension(file.name);
  return file.type.startsWith('video/') || ['.mp4', '.mov', '.m4v', '.webm'].includes(extension);
}

function isAcceptedMediaFile(file: File) {
  const extension = getFileExtension(file.name);
  return ACCEPTED_MEDIA_TYPES.includes(file.type) || ACCEPTED_FILE_EXTENSIONS.includes(extension);
}

function isVideoUpload(item: WeddingUpload) {
  const extension = getFileExtension(item.file_name);
  return item.file_type?.startsWith('video/') || ['.mp4', '.mov', '.m4v', '.webm'].includes(extension);
}

function GalleryPage() {
  const [uploads, setUploads] = useState<WeddingUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadUploads = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listWeddingUploads();
      setUploads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar galeria.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUploads();
  }, []);

  return (
    <div className="min-h-screen bg-[#fbf9f6] p-4 sm:p-8 font-sans text-[#4a4542]">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white border border-[#e8ede7]/60 rounded-[2rem] p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[#a89f91] text-xs font-semibold tracking-[0.2em] uppercase mb-2">Nathyele e Emídio</p>
              <h1 className="font-serif text-3xl sm:text-4xl">Galeria de Memórias</h1>
              <p className="text-sm text-[#4a4542]/70 mt-2">Veja as fotos e vídeos compartilhados pelos convidados.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/" className="inline-flex items-center justify-center gap-2 bg-[#fbf9f6] border border-[#e8ede7] px-4 py-3 rounded-2xl shadow-sm text-sm font-medium">
                <Camera size={18} /> Enviar arquivos
              </a>
              <button onClick={loadUploads} className="inline-flex items-center justify-center gap-2 bg-white border border-[#e8ede7] px-4 py-3 rounded-2xl shadow-sm text-sm font-medium">
                <RefreshCw size={18} /> Atualizar
              </button>
            </div>
          </div>
        </div>

        {loading && <p className="bg-white rounded-2xl p-4 border border-[#e8ede7]">Carregando memórias...</p>}
        {error && <p className="text-red-500 bg-white rounded-2xl p-4 border border-red-100">{error}</p>}

        {!loading && uploads.length === 0 && !error && (
          <div className="bg-white border border-[#e8ede7] rounded-3xl p-8 text-center">
            <div className="w-16 h-16 bg-[#f4ece8] rounded-full flex items-center justify-center mx-auto mb-4 text-[#a89f91]">
              <Images size={28} />
            </div>
            <p className="font-medium">Ainda não chegou nenhuma memória.</p>
            <p className="text-sm text-[#4a4542]/60 mt-2">Quando os convidados enviarem fotos ou vídeos, eles aparecerão aqui.</p>
            <a href="/" className="mt-5 inline-flex items-center justify-center gap-2 bg-[#a89f91] text-white px-5 py-3 rounded-2xl shadow-sm text-sm font-medium">
              Enviar primeiras memórias
            </a>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploads.map((item) => (
            <div key={item.id} className="bg-white border border-[#e8ede7] rounded-3xl overflow-hidden shadow-sm">
              <a href={item.file_url} target="_blank" rel="noreferrer" className="block bg-[#f4ece8]">
                {isVideoUpload(item) ? (
                  <video src={item.file_url} className="w-full aspect-square object-cover bg-[#f4ece8]" controls preload="metadata" />
                ) : (
                  <img src={item.file_url} alt={item.file_name} className="w-full aspect-square object-cover bg-[#f4ece8]" loading="lazy" />
                )}
              </a>
              <div className="p-3">
                <p className="font-medium text-sm truncate">{item.guest_name}</p>
                <p className="text-xs text-[#4a4542]/60 truncate">{item.file_name}</p>
                <p className="text-xs text-[#4a4542]/50 mt-1">{formatFileSize(item.file_size)}</p>
                <a href={item.file_url} download target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-[#a89f91] font-medium">
                  <Download size={15} /> Baixar
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [name, setName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState('');

  const currentRoute = window.location.pathname.replace(/\/$/, '');
  const isGalleryRoute = currentRoute === '/galeria' || currentRoute === '/admin';

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  if (isGalleryRoute) return <GalleryPage />;

  const validateFiles = (selectedFiles: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of selectedFiles) {
      const isVideo = isVideoFile(file);
      const maxSizeBytes = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_PHOTO_SIZE_BYTES;
      const maxSizeMb = isVideo ? MAX_VIDEO_SIZE_MB : MAX_PHOTO_SIZE_MB;
      const mediaLabel = isVideo ? 'vídeo' : 'foto';

      if (!isAcceptedMediaFile(file)) {
        errors.push(`${file.name}: envie fotos JPG, PNG, WEBP, HEIC ou vídeos MP4, MOV, M4V ou WEBM.`);
        continue;
      }

      if (file.size > maxSizeBytes) {
        errors.push(`${file.name}: máximo de ${maxSizeMb} MB por ${mediaLabel}.`);
        continue;
      }

      validFiles.push(file);
    }

    if (files.length + validFiles.length > MAX_FILES) {
      errors.push(`Envie no máximo ${MAX_FILES} arquivos por vez.`);
      return { validFiles: validFiles.slice(0, Math.max(0, MAX_FILES - files.length)), errors };
    }

    return { validFiles, errors };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const { validFiles, errors } = validateFiles(selectedFiles);
      setFiles((prev) => [...prev, ...validFiles]);
      if (errors.length > 0) setError(errors[0]);
    }
    e.target.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !name.trim()) return;

    if (!isSupabaseConfigured) {
      setStatus('error');
      setError('Supabase ainda não foi configurado. Preencha o arquivo .env antes de publicar.');
      return;
    }

    setStatus('uploading');
    setError('');

    try {
      await uploadWeddingMedia(name, files);
      setStatus('success');
      setFiles([]);
      setName('');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Não foi possível enviar os arquivos. Tente novamente.');
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#fbf9f6] flex flex-col items-center justify-center p-4 sm:p-8 font-sans text-[#4a4542]">
      <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-sm border border-[#e8ede7]/60 overflow-hidden min-h-[700px] flex flex-col relative">
        {status === 'success' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-[#f4ece8] rounded-full flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-[#f4ece8] rounded-full animate-ping opacity-50"></div>
              <Heart size={48} className="text-[#a89f91] fill-[#f4ece8] z-10" />
            </div>
            <h2 className="font-serif text-3xl text-[#4a4542] mb-4">Obrigado!</h2>
            <p className="text-[#4a4542]/80 mb-10 leading-relaxed text-lg">
              Suas memórias foram enviadas com sucesso. <br />
              Agradecemos por nos ajudar a guardar esse dia para sempre!
            </p>
            <div className="flex flex-col gap-3 w-full max-w-[280px]">
              <button onClick={resetForm} className="px-8 py-4 rounded-full bg-[#fbf9f6] text-[#4a4542] font-medium border border-[#e8ede7] shadow-sm hover:bg-[#e8ede7] transition-colors flex items-center justify-center gap-2">
                <Camera size={20} />
                Enviar mais arquivos
              </button>
              <a href="/galeria" className="px-8 py-4 rounded-full bg-[#a89f91] text-white font-medium shadow-sm hover:bg-[#8e8579] transition-colors flex items-center justify-center gap-2">
                <Images size={20} />
                Ver galeria
              </a>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <header className="pt-12 pb-8 px-6 text-center relative overflow-hidden bg-[#fbf9f6]">
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#e8ede7] rounded-full opacity-50 blur-2xl"></div>
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#f4ece8] rounded-full opacity-50 blur-xl"></div>
              <h1 className="font-serif text-4xl text-[#4a4542] mb-2 leading-tight relative z-10">
                Nathyele <br />
                <span className="font-serif italic text-3xl text-[#a89f91] px-2 font-light">e</span> Emídio
              </h1>
              <p className="text-[#a89f91] text-xs font-semibold tracking-[0.2em] uppercase mt-4 relative z-10">
                13 de Junho de 2026
              </p>
            </header>

            <div className="px-6 pt-6 pb-2 text-center bg-white rounded-t-3xl -mt-4 relative z-20">
              <h2 className="font-serif text-xl font-medium mb-3 text-[#4a4542]">Memórias do Casamento</h2>
              <p className="text-sm text-[#4a4542]/70 leading-relaxed max-w-[280px] mx-auto">
                Escaneie o QR Code, envie suas melhores fotos e vídeos e ajude a guardar esse dia para sempre.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-8 pt-4 flex flex-col flex-1 bg-white">
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#4a4542]/80 mb-2 ml-1">Seu nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Como podemos te chamar?"
                  className="w-full px-5 py-4 rounded-2xl border border-[#e8ede7] bg-[#fbf9f6] text-[#4a4542] placeholder-[#a89f91]/60 focus:outline-none focus:ring-2 focus:ring-[#a89f91]/30 focus:border-[#a89f91] transition-all text-base"
                />
              </div>

              <div className="mb-6 flex-1 flex flex-col">
                <label className="block text-sm font-medium text-[#4a4542]/80 mb-2 ml-1">Fotos e vídeos</label>
                <div className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${files.length > 0 ? 'border-[#e8ede7] bg-[#fbf9f6]' : 'border-[#e8ede7] hover:border-[#a89f91] bg-[#fbf9f6]'}`}>
                  <input type="file" multiple accept="image/*,video/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFileChange} />
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4 text-[#a89f91] border border-[#e8ede7]/50 relative z-10">
                    <UploadCloud strokeWidth={1.5} size={28} />
                  </div>
                  <p className="text-base text-[#4a4542] font-medium mb-1 relative z-10">Toque para selecionar</p>
                  <p className="text-sm text-[#4a4542]/60 relative z-10">até {MAX_FILES} arquivos</p>
                  <p className="text-xs text-[#4a4542]/50 relative z-10 mt-1">foto até {MAX_PHOTO_SIZE_MB} MB · vídeo até {MAX_VIDEO_SIZE_MB} MB</p>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2 flex-1 overflow-y-auto max-h-[140px] pr-2">
                    {files.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-[#fbf9f6] border border-[#e8ede7] p-3 rounded-xl">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-[#f4ece8] p-2 rounded-lg text-[#a89f91]">{isVideoFile(file) ? <FileVideo size={16} /> : <ImageIcon size={16} />}</div>
                          <div className="overflow-hidden">
                            <span className="block text-sm text-[#4a4542] truncate max-w-[200px]">{file.name}</span>
                            <span className="block text-xs text-[#4a4542]/50">{formatFileSize(file.size)}</span>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeFile(index)} className="text-[#a89f91] hover:text-red-400 p-2"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}

                {files.length > 0 && <p className="text-xs text-[#4a4542]/60 mt-3">Selecionados: {files.length}/{MAX_FILES} arquivos · Total: {formatFileSize(totalSize)}</p>}
                {error && <p className="text-sm text-red-500 mt-3 bg-red-50 border border-red-100 rounded-2xl p-3">{error}</p>}
              </div>

              <div className="mt-auto pt-4">
                <button type="submit" disabled={status === 'uploading' || files.length === 0 || !name.trim()} className="w-full bg-[#a89f91] text-white py-4 px-6 rounded-2xl font-medium text-lg shadow-md shadow-[#a89f91]/20 hover:bg-[#8e8579] hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:bg-[#a89f91] disabled:shadow-none flex items-center justify-center gap-3 active:scale-[0.98]">
                  {status === 'uploading' ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Enviando...</>
                  ) : (
                    <><CheckCircle2 size={22} /> Enviar {files.length > 0 ? `${files.length} ` : ''}arquivo(s)</>
                  )}
                </button>
                <a href="/galeria" className="mt-3 w-full bg-[#fbf9f6] text-[#4a4542] py-4 px-6 rounded-2xl font-medium text-lg border border-[#e8ede7] shadow-sm hover:bg-[#e8ede7] transition-colors flex items-center justify-center gap-3 active:scale-[0.98]">
                  <Images size={22} /> Ver galeria
                </a>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
