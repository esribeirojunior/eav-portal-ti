import React, { useEffect, useState } from 'react';
import { BookOpen, ChevronLeft, Search, Loader2, Plus, X, Save, Trash2, AlertCircle, RefreshCw, FileText, HelpCircle, Settings, User, Video, PlayCircle, CheckCircle, Share2, Copy, Link } from 'lucide-react';
import { Tutorial } from '../types';
import { apiClient } from '../lib/apiClient';

interface TutorialsModuleProps {
    onBack: () => void;
    userEmail?: string;
    userRole?: string;
    publicMode?: boolean;
    sharedTutorialId?: string | null;
}

const TutorialsModuleComponent = ({ onBack, userEmail, userRole, publicMode, sharedTutorialId }: TutorialsModuleProps) => {
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [viewingTutorial, setViewingTutorial] = useState<Tutorial | null>(null);

    // Form State
    const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('Suporte');
    const [iconName, setIconName] = useState('BookOpen');
    const [videoUrl, setVideoUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fetchTutorials = async (retries = 3) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/tutorials');
            if (!response.ok) throw new Error('Falha ao carregar tutoriais');
            const data = await response.json();
            setTutorials(data || []);
            setLoading(false);
        } catch (err: any) {
            console.error('Erro ao buscar tutoriais:', err);
            if (retries > 0) {
                setTimeout(() => fetchTutorials(retries - 1), 2000);
            } else {
                setError(err.message || 'Erro de conexão com tutoriais');
                setLoading(false);
            }
        }
    };

    const fetchShared = async (retries = 3) => {
        try {
            setLoading(true);
            const response = await fetch('/api/tutorials');
            if (!response.ok) throw new Error('Falha ao carregar tutoriais');
            const data = await response.json();
            const tutorial = data.find((t: any) => t.id === sharedTutorialId);
            if (!tutorial) throw new Error('Tutorial não encontrado');
            setViewingTutorial(tutorial);
            setLoading(false);
        } catch (err) {
            console.error("Erro ao carregar tutorial público:", err);
            if (retries > 0) {
                setTimeout(() => fetchShared(retries - 1), 2000);
            } else {
                setError("Tutorial não encontrado ou erro de conexão.");
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (publicMode && sharedTutorialId) {
            fetchShared();
        } else {
            fetchTutorials();
        }
    }, [publicMode, sharedTutorialId]);

    const handleShare = (id: string) => {
        const url = `${window.location.origin}${window.location.pathname}?tutorialId=${id}`;
        navigator.clipboard.writeText(url);
        alert("Link de compartilhamento copiado! Agora você pode enviar para quem quiser.");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limite de 50MB para vídeos
        if (file.size > 50 * 1024 * 1024) {
            alert('O vídeo é muito grande! O limite é 50MB.');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `videos/${fileName}`;

            // Upload para o bucket 'tutorials'
            const { data, error: uploadError } = await apiClient.storage
                .from('tutorials')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Pegar URL pública
            const { data: { publicUrl } } = apiClient.storage
                .from('tutorials')
                .getPublicUrl(filePath);

            setVideoUrl(publicUrl);
            setUploadProgress(100);
            setTimeout(() => setUploading(false), 1000);
        } catch (err: any) {
            console.error('Erro no upload:', err);
            alert('Falha ao subir vídeo: ' + (err.message || 'Erro desconhecido'));
            setUploading(false); // PARA O CARREGAMENTO
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const tutorialData = {
                title,
                description,
                content,
                category,
                icon_name: iconName,
                video_url: videoUrl,
            };

            const url = editingTutorial ? `/api/tutorials/${editingTutorial.id}` : '/api/tutorials';
            const method = editingTutorial ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tutorialData)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Erro ao salvar');
            }

            setIsModalOpen(false);
            resetForm();
            fetchTutorials();
        } catch (err: any) {
            console.error('Erro ao salvar tutorial:', err);
            alert('Erro ao salvar tutorial: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Deseja excluir este procedimento permanentemente?')) return;
        try {
            const response = await fetch(`/api/tutorials/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Erro ao deletar');
            fetchTutorials();
            if (viewingTutorial?.id === id) setViewingTutorial(null);
        } catch (err: any) {
            console.error('Erro ao deletar:', err);
            alert('Erro ao deletar tutorial');
        }
    };

    const resetForm = () => {
        setEditingTutorial(null);
        setTitle('');
        setDescription('');
        setContent('');
        setCategory('Suporte');
        setIconName('BookOpen');
        setVideoUrl('');
    };

    const handleEdit = (tutorial: Tutorial) => {
        setEditingTutorial(tutorial);
        setTitle(tutorial.title);
        setDescription(tutorial.description);
        setContent(tutorial.content);
        setCategory(tutorial.category);
        setIconName(tutorial.icon_name || 'BookOpen');
        setVideoUrl(tutorial.video_url || '');
        setIsModalOpen(true);
    };

    const getIcon = (name: string, size = 24) => {
        switch (name) {
            case 'BookOpen': return <BookOpen size={size} />;
            case 'FileText': return <FileText size={size} />;
            case 'HelpCircle': return <HelpCircle size={size} />;
            case 'Settings': return <Settings size={size} />;
            case 'User': return <User size={size} />;
            default: return <BookOpen size={size} />;
        }
    };

    const categories = ['Todos', ...Array.from(new Set(tutorials.map(t => t.category)))];

    const filteredTutorials = tutorials.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || t.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
 
    const getVideoEmbedUrl = (url: string) => {
        if (!url) return null;
        
        // YouTube
        const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/);
        if (ytMatch && ytMatch[1]) {
            const id = ytMatch[1].split('&')[0];
            return `https://www.youtube.com/embed/${id}`;
        }

        // Google Drive
        const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
        if (driveMatch && driveMatch[1]) {
            return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
        }

        return url;
    };
 
    const isDirectVideo = (url: string) => {
        return url.match(/\.(mp4|webm|ogg)$/i);
    };

    return (
        <div className="min-h-screen bg-[#0a0b2e] p-6 sm:p-12 animate-in fade-in duration-500 pb-24 text-left font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={viewingTutorial ? () => setViewingTutorial(null) : onBack}
                            className="p-4 bg-white dark:bg-white/5 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-slate-500 dark:text-white/40 border border-slate-300 dark:border-white/5 active:scale-90"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h2 className="text-4xl font-[900] uppercase tracking-tighter text-slate-900 dark:text-white">
                                {viewingTutorial ? 'Procedimento' : 'Passo a Passo TI'}
                            </h2>
                            <p className="text-slate-400 dark:text-white/20 text-[10px] font-black tracking-[0.3em] uppercase mt-1">
                                {publicMode ? 'Acesso Público' : viewingTutorial ? viewingTutorial.category : 'Manuais e Procedimentos de Suporte'}
                            </p>
                        </div>
                    </div>

                    {!viewingTutorial && !publicMode && (
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Pesquisar manual..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl py-4 px-12 text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500/50 transition-all w-64 placeholder:text-slate-400 dark:text-white/10"
                                />
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={16} />
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                                    className="flex items-center gap-3 bg-orange-600 hover:bg-orange-500 text-slate-900 dark:text-white px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 shadow-xl shadow-orange-900/20"
                                >
                                    <Plus size={18} />
                                    Novo Manual
                                </button>
                            )}
                        </div>
                    )}
                </div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-48 text-slate-400 dark:text-white/20 gap-6">
                        <Loader2 className="animate-spin text-orange-500" size={64} />
                        <p className="font-[900] uppercase tracking-[0.4em] text-xs">Carregando Procedimento...</p>
                    </div>
                ) : error ? (
                    <div className="bg-rose-500/10 border border-rose-500/20 p-12 rounded-[3rem] flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-rose-500/20 rounded-[2rem] flex items-center justify-center text-rose-500">
                            <AlertCircle size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Ops! Algo deu errado</h3>
                            <p className="text-slate-500 dark:text-white/40 font-medium italic max-w-sm">{error}</p>
                        </div>
                        <button onClick={publicMode ? () => window.location.reload() : () => fetchTutorials()} className="bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 border border-slate-300 dark:border-white/5">
                            <RefreshCw size={16} className="inline mr-2" /> Tentar Novamente
                        </button>
                    </div>
                ) : viewingTutorial ? (
                    /* Detailed View */
                    <div className="animate-in slide-in-from-right-4 duration-300 space-y-8">
                        <div className="bg-slate-900/60 border border-slate-300 dark:border-white/5 rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
                            
                            <div className="relative z-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="w-20 h-20 bg-orange-600 rounded-[2rem] flex items-center justify-center text-slate-900 dark:text-white shadow-2xl">
                                        {getIcon(viewingTutorial.icon_name || 'BookOpen', 40)}
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleShare(viewingTutorial.id)} 
                                            className="p-3 bg-indigo-500/10 hover:bg-indigo-500 rounded-xl text-indigo-400 hover:text-slate-900 dark:text-white transition-all flex items-center gap-2 group"
                                            title="Compartilhar Link"
                                        >
                                            <Share2 size={18} />
                                            <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block">Compartilhar</span>
                                        </button>
                                        
                                        {isAdmin && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEdit(viewingTutorial)} className="p-3 bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-slate-600 dark:text-white/60 transition-all"><Settings size={18} /></button>
                                                <button onClick={() => handleDelete(viewingTutorial.id)} className="p-3 bg-rose-500/10 hover:bg-rose-500 rounded-xl text-rose-500 hover:text-slate-900 dark:text-white transition-all"><Trash2 size={18} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{viewingTutorial.title}</h1>
                                    <p className="text-slate-500 dark:text-white/40 text-lg font-medium italic leading-relaxed">{viewingTutorial.description}</p>
                                </div>

                                <div className="h-[1px] w-full bg-white dark:bg-white/5" />

                                <div className="text-slate-800 dark:text-white/80 text-base leading-loose font-medium whitespace-pre-wrap tutorial-content">
                                    {viewingTutorial.content}
                                </div>
 
                                {viewingTutorial.video_url && (
                                    <div className="mt-10 space-y-4">
                                        <div className="flex items-center gap-3 text-orange-500">
                                            <Video size={20} />
                                            <span className="text-[11px] font-black uppercase tracking-widest">Vídeo Demonstrativo</span>
                                        </div>
                                        <div className="rounded-3xl overflow-hidden bg-white dark:bg-black/40 border border-slate-300 dark:border-white/5 aspect-video flex items-center justify-center">
                                            {isDirectVideo(viewingTutorial.video_url) ? (
                                                <video 
                                                    src={viewingTutorial.video_url} 
                                                    controls 
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <iframe
                                                    src={getVideoEmbedUrl(viewingTutorial.video_url)!}
                                                    title={viewingTutorial.title}
                                                    className="w-full h-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            )}
                                        </div>
                                        {viewingTutorial.video_url.includes('drive.google.com') && (
                                            <div className="mt-4 flex justify-center">
                                                <a 
                                                    href={viewingTutorial.video_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border border-slate-300 dark:border-white/10 active:scale-95"
                                                >
                                                    <Link size={16} />
                                                    Abrir vídeo em nova guia (Google Drive)
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* List View */
                    <div className="space-y-8">
                        {/* Categories */}
                        {!publicMode && (
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-white text-black border-white' : 'bg-white dark:bg-white/5 text-slate-500 dark:text-white/40 border-slate-300 dark:border-white/5 hover:border-white/20 hover:text-slate-900 dark:text-white'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}

                        {filteredTutorials.length === 0 ? (
                                    <div className="col-span-full py-24 border-2 border-dashed border-slate-300 dark:border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4 opacity-40">
                                        <BookOpen size={48} />
                                        <p className="font-black uppercase tracking-widest text-xs">Nenhum procedimento encontrado.</p>
                                    </div>
                                ) : filteredTutorials.map(tutorial => (
                                    <button
                                        key={tutorial.id}
                                        onClick={() => setViewingTutorial(tutorial)}
                                        className="group bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-300 dark:border-white/5 hover:border-orange-500/30 transition-all hover:translate-y-[-4px] text-left relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:bg-orange-600/10 transition-colors" />
                                        
                                        <div className="flex gap-6 items-start relative z-10">
                                            <div className="w-14 h-14 bg-orange-600/10 text-orange-500 rounded-2xl flex items-center justify-center group-hover:bg-orange-600 group-hover:text-slate-900 dark:text-white transition-all duration-500">
                                                {getIcon(tutorial.icon_name || 'BookOpen')}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-orange-500/60">{tutorial.category}</span>
                                                    {tutorial.video_url && <PlayCircle size={14} className="text-orange-500/40" />}
                                                </div>
                                                <h3 className="text-2xl font-[900] text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">{tutorial.title}</h3>
                                                <p className="text-slate-500 dark:text-white/40 text-sm font-medium leading-relaxed line-clamp-2 italic">{tutorial.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                    </div>
                )}
            </div>

            {/* Modal de Cadastro/Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-slate-100 dark:bg-slate-950 rounded-[2.5rem] border border-slate-300 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-300 dark:border-white/5 flex justify-between items-center bg-gradient-to-r from-orange-900/20 to-slate-900">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingTutorial ? 'Editar Manual' : 'Novo Manual'}</h3>
                                <p className="text-[10px] font-black text-orange-400/60 uppercase tracking-widest mt-1">Cadastro de procedimento de suporte</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl transition-all text-slate-500 dark:text-white/40">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-white/30 uppercase tracking-widest">Título do Procedimento</label>
                                    <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white dark:bg-white/5 text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition-all text-sm font-bold" placeholder="Ex: Configuração de VPN" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-white/30 uppercase tracking-widest">Categoria</label>
                                    <input required value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white dark:bg-white/5 text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition-all text-sm font-bold" placeholder="Ex: Rede, Software, etc." />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 dark:text-white/30 uppercase tracking-widest">Descrição Curta</label>
                                <input required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white dark:bg-white/5 text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition-all text-sm font-medium" placeholder="Breve resumo do que este manual trata" />
                            </div>

                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 dark:text-white/30 uppercase tracking-widest">Link de Vídeo (Opcional)</label>
                                <div className="relative">
                                    <input 
                                        type="url" 
                                        value={videoUrl} 
                                        onChange={e => setVideoUrl(e.target.value)} 
                                        className="w-full bg-white dark:bg-white/5 text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 pl-12 focus:outline-none focus:border-orange-500/50 transition-all text-sm font-medium" 
                                        placeholder="Cole o link do YouTube, Vimeo ou Google Drive..." 
                                    />
                                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={16} />
                                </div>
                                <p className="text-[9px] text-slate-400 dark:text-white/20 uppercase tracking-widest mt-1 ml-1">O vídeo será incorporado automaticamente se for do YouTube.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 dark:text-white/30 uppercase tracking-widest">Ícone</label>
                                <div className="flex gap-4">
                                    {['BookOpen', 'FileText', 'HelpCircle', 'Settings', 'User'].map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setIconName(icon)}
                                            className={`p-4 rounded-xl border transition-all ${iconName === icon ? 'bg-orange-600 border-orange-500 text-slate-900 dark:text-white' : 'bg-white dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-400 dark:text-white/20 hover:border-white/30'}`}
                                        >
                                            {getIcon(icon, 20)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 dark:text-white/30 uppercase tracking-widest">Conteúdo do Procedimento</label>
                                <textarea required value={content} onChange={e => setContent(e.target.value)} className="w-full bg-white dark:bg-white/5 text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50 transition-all text-sm font-medium h-64 resize-none leading-relaxed" placeholder="Escreva o passo a passo detalhado aqui..." />
                            </div>

                            <button type="submit" disabled={saving} className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-slate-900 dark:text-white font-black rounded-2xl shadow-xl transition-all uppercase text-[12px] tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                                {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                {saving ? 'Salvando...' : editingTutorial ? 'Atualizar Manual' : 'Criar Manual'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Footer */}
            <div className="text-center pt-10 border-t border-slate-300 dark:border-white/5 no-print mt-10">
                <p className="text-slate-400 dark:text-white/10 text-[9px] uppercase tracking-[0.4em] font-black">
                    Escola Americana de Vitória &copy; 2026 - Versão 2.0 by Erisson Ribeiro
                </p>
            </div>
        </div>
    );
};

export const TutorialsModule = React.memo(TutorialsModuleComponent);
