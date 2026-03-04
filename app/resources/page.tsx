'use client';

import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/layout/Sidebar';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useGoogleBooks } from '@/hooks/useGoogleBooks';
import { useUpload } from '@/components/providers/UploadProgressProvider';

interface Resource {
  id: string;
  title: string;
  subject: string;
  file_url?: string;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
  content?: string;
  processing_status?: string;
  processing_error?: string;
}

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'books'>('library');
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const { uploadFile, uploadState } = useUpload();
  const isUploading = uploadState === 'uploading' || uploadState === 'compressing' || uploadState === 'processing';

  // Resource Management State
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');

  const { searchBooks, results: bookResults, isLoading: isLoadingBooks, error: booksError } = useGoogleBooks();

  const folders = ['All', ...Array.from(new Set(resources.map(r => r.subject || 'Uncategorized')))];
  const filteredResources = selectedFolder === 'All'
    ? resources
    : resources.filter(r => (r.subject || 'Uncategorized') === selectedFolder);

  const fetchResources = async () => {
    setIsLoadingLibrary(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setResources(data as Resource[]);
    }
    setIsLoadingLibrary(false);
  };

  useEffect(() => {
    fetchResources();

    // Subscribe to realtime changes to refresh list when processing finishes
    const supabase = createClient();
    const channel = supabase
      .channel('resources-list-refresh')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'resources' }, () => {
        fetchResources();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'resources' }, () => {
        fetchResources();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = ''; // reset immediately so user can re-select same file
    setActiveTab('library');
    await uploadFile(file);
  };


  const handleDelete = async (resourceId: string) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('resources').delete().eq('id', resourceId);
      if (error) throw error;

      // Update local state
      setResources(prev => prev.filter(r => r.id !== resourceId));
      const newSelected = new Set(selectedIds);
      newSelected.delete(resourceId);
      setSelectedIds(newSelected);
    } catch (error: any) {
      alert(`Error deleting resource: ${error.message}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} resources?`)) return;

    try {
      const supabase = createClient();
      const idsToDelete = Array.from(selectedIds);
      const { error } = await supabase.from('resources').delete().in('id', idsToDelete);
      if (error) throw error;
      setResources(prev => prev.filter(r => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
    } catch (err: any) {
      alert(`Error bulk deleting: ${err.message}`);
    }
  };

  const saveEdit = async () => {
    if (!editingResource) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('resources')
        .update({ title: editTitle, subject: editSubject })
        .eq('id', editingResource.id);
      if (error) throw error;

      setResources(prev => prev.map(r => r.id === editingResource.id ? { ...r, title: editTitle, subject: editSubject } : r));
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert(`Error updating resource: ${err.message}`);
    }
  };

  const handleBookSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchBooks(searchQuery);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getIconForType = (type: string) => {
    if (type.includes('pdf')) return { icon: 'picture_as_pdf', colorClass: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20' };
    if (type.includes('doc') || type.includes('word')) return { icon: 'description', colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20' };
    if (type.includes('presentation') || type.includes('ppt')) return { icon: 'slideshow', colorClass: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20' };
    return { icon: 'insert_drive_file', colorClass: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/20' };
  };

  return (
    <div className="main-bg flex flex-col md:flex-row antialiased selection:bg-[#ea580c] selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">


        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden w-full max-w-[1440px] mx-auto">
          <div className="px-6 pt-10 pb-6 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">Resource Library</h1>
            </div>
            <div className="relative overflow-hidden inline-block w-full md:w-auto">
              <button
                disabled={isUploading}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#ea580c] hover:bg-[#ea580c]/90 disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_4px_20px_rgba(234,88,12,0.3)]"
              >
                {isUploading ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">
                    cloud_upload
                  </span>
                )}
                <span>{isUploading ? 'Processing...' : 'Upload File'}</span>
              </button>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                title="Upload your study material"
              />
            </div>
          </div>

          <main className="flex-1 md:overflow-y-auto px-4 md:px-8 flex flex-col 2xl:flex-row gap-8 pb-10">
            <div className="flex-1 space-y-6 min-w-0">
              {/* Search and Tabs */}
              <div className="flex flex-col gap-4">
                {activeTab === 'library' ? (
                  <div className="relative w-full">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <span className="material-symbols-outlined text-[20px]">
                        search
                      </span>
                    </span>
                    <input
                      className="w-full h-12 md:h-14 pl-12 pr-4 rounded-xl bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-[#2d2d3f] text-sm md:text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#ea580c] outline-none shadow-sm"
                      placeholder="Search topics, books, past papers..."
                      type="text"
                    />
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#ea580c] transition-colors">
                      <span className="material-symbols-outlined text-[20px]">tune</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBookSearch} className="relative w-full">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <span className="material-symbols-outlined text-[20px]">
                        search
                      </span>
                    </span>
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-12 md:h-14 pl-12 pr-28 rounded-xl bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-[#2d2d3f] text-sm md:text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#ea580c] outline-none shadow-sm"
                      placeholder="Search Google Books (e.g., Biology)..."
                      type="text"
                    />
                    <button
                      type="submit"
                      disabled={isLoadingBooks}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-[#ea580c] hover:bg-[#ea580c]/90 text-white rounded-lg text-xs md:text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      {isLoadingBooks ? 'Searching' : 'Search'}
                    </button>
                  </form>
                )}

                <div className="flex bg-white dark:bg-[#1a1a24] p-1.5 rounded-xl border border-slate-200 dark:border-[#2d2d3f] w-full shadow-sm">
                  <button
                    onClick={() => setActiveTab('library')}
                    className={`flex-1 px-4 md:px-8 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'library' ? 'bg-[#f5f5f8] dark:bg-[#252535] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                  >
                    My Uploads
                  </button>
                  <button
                    onClick={() => setActiveTab('books')}
                    className={`flex-1 px-4 md:px-8 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'books' ? 'bg-[#f5f5f8] dark:bg-[#252535] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                  >
                    Library Books
                  </button>
                </div>
              </div>

              {/* Grid of Resources */}
              {activeTab === 'library' && (
                <>
                  {resources.length > 0 && !isLoadingLibrary && (
                    <div className="flex justify-between items-center mb-2 flex-wrap gap-4 mt-6">
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full">
                        {folders.map(folder => (
                          <button
                            key={folder}
                            onClick={() => setSelectedFolder(folder)}
                            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedFolder === folder ? 'bg-[#ea580c] text-white shadow-lg shadow-[#ea580c]/20 scale-105' : 'bg-white dark:bg-[#1a1a24] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#2d2d3f] hover:border-[#ea580c]'}`}
                          >
                            {folder}
                          </button>
                        ))}
                      </div>
                      {selectedIds.size > 0 && (
                        <button
                          onClick={handleBulkDelete}
                          className="px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all text-sm shrink-0 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                          Delete ({selectedIds.size})
                        </button>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {isLoadingLibrary ? (
                      <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-500">
                        <div className="size-10 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="font-bold text-lg animate-pulse tracking-tight">Syncing your secure vault...</p>
                      </div>
                    ) : resources.length === 0 ? (
                      <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1a1a24] rounded-2xl border border-dashed border-slate-200 dark:border-[#2d2d3f] shadow-inner">
                        <div className="bg-[#f5f5f8] dark:bg-[#13131a] p-5 rounded-full mb-4 border border-slate-200 dark:border-[#2d2d3f] shadow-sm">
                          <span className="material-symbols-outlined text-5xl text-slate-400">cloud_off</span>
                        </div>
                        <p className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Your vault is empty</p>
                        <p className="text-sm opacity-70 mb-8">Upload study materials to begin your journey.</p>
                      </div>
                    ) : (
                      filteredResources.map((resource) => (
                        <div key={resource.id} className="bg-white dark:bg-[#1a1a24] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] p-5 hover:border-[#ea580c]/50 transition-all group flex flex-col relative hover:shadow-xl hover:shadow-[#ea580c]/5 hover:-translate-y-1">
                          <div className="absolute top-4 right-4 z-10 flex gap-1.5 items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingResource(resource);
                                setEditTitle(resource.title);
                                setEditSubject(resource.subject || '');
                                setIsEditModalOpen(true);
                              }}
                              className="size-8 rounded-lg bg-[#f5f5f8] dark:bg-[#252535] text-slate-500 hover:text-[#ea580c] transition-all flex items-center justify-center shadow-sm"
                              title="Edit Title/Folder"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <div className="size-8 flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(resource.id)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedIds);
                                  if (e.target.checked) newSet.add(resource.id);
                                  else newSet.delete(resource.id);
                                  setSelectedIds(newSet);
                                }}
                                className="size-5 rounded border-slate-300 dark:border-slate-600 text-[#ea580c] focus:ring-[#ea580c] cursor-pointer bg-transparent"
                              />
                            </div>
                          </div>

                          <div className="flex items-start gap-4 mb-5 mt-2">
                            <div className={`p-4 rounded-2xl shrink-0 transition-all shadow-sm ${getIconForType(resource.file_type).colorClass}`}>
                              <span className="material-symbols-outlined text-4xl">{getIconForType(resource.file_type).icon}</span>
                            </div>
                            <div className="min-w-0 pr-10 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[9px] font-black tracking-widest text-slate-500 dark:text-slate-400 bg-[#f5f5f8] dark:bg-[#13131a] px-2 py-0.5 rounded border border-slate-200 dark:border-[#2d2d3f] uppercase`}>
                                  {resource.file_type.includes('pdf') ? 'PDF'
                                    : resource.file_type.includes('presentation') || resource.file_type.includes('ppt') ? 'PPTX'
                                      : resource.file_type.includes('document') || resource.file_type.includes('doc') ? 'DOCX'
                                        : resource.file_type.includes('image') ? 'IMAGE'
                                          : 'FILE'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">•</span>
                                <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase">{formatSize(resource.file_size_bytes)}</span>
                              </div>
                              <h3 className="font-black text-[15px] text-slate-900 dark:text-white leading-tight line-clamp-2 break-words group-hover:text-[#ea580c] transition-colors" title={resource.title}>
                                {resource.title}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-6 bg-[#f5f5f8] dark:bg-[#13131a] p-2 rounded-lg border border-slate-100 dark:border-[#1d1d2b]">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            <span>Uploaded {formatDate(resource.created_at)}</span>
                            <span className="mx-1 opacity-50">•</span>
                            <span className="truncate">{resource.subject || 'General'}</span>
                          </div>

                          {/* Action Buttons - Redesigned to never overlap */}
                          <div className="grid grid-cols-1 gap-2 mt-auto">
                            <div className="flex gap-2">
                              {resource.file_type.includes('pdf') ||
                                resource.file_type.includes('image') ||
                                resource.file_type.includes('text') ||
                                resource.file_type.includes('wordprocessingml') ||
                                resource.file_type.includes('presentationml') ||
                                resource.title.endsWith('.docx') ||
                                resource.title.endsWith('.pptx') ? (
                                <button onClick={() => setSelectedResource(resource)} className="flex-1 min-w-0 bg-[#f5f5f8] dark:bg-[#252535] hover:bg-[#ea580c] hover:text-white text-slate-700 dark:text-slate-200 font-black py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-sm">
                                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                                  <span className="truncate">View File</span>
                                </button>
                              ) : (
                                <a href={resource.file_url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 bg-[#f5f5f8] dark:bg-[#252535] hover:bg-[#ea580c] hover:text-white text-slate-700 dark:text-slate-200 font-black py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-sm">
                                  <span className="material-symbols-outlined text-[18px]">download</span>
                                  <span className="truncate">Download</span>
                                </a>
                              )}

                              <button onClick={() => handleDelete(resource.id)} className="size-11 shrink-0 bg-[#f5f5f8] dark:bg-[#252535] hover:bg-red-500 hover:text-white text-slate-400 font-bold rounded-xl transition-all flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </div>

                            {(resource.file_type.includes('pdf') || resource.content) && (
                              <Link href={`/gamifier?id=${resource.id}`} className="w-full bg-[#ea580c] hover:bg-[#d04e0a] text-white font-black py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#ea580c]/20">
                                <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                                <span>Gamified Study Session</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* Books Search Results */}
              {activeTab === 'books' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isLoadingBooks ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
                      <div className="size-8 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="font-medium">Searching world libraries...</p>
                    </div>
                  ) : booksError ? (
                    <div className="col-span-full bg-red-900/10 border border-red-900/30 p-6 rounded-xl text-center">
                      <span className="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
                      <h3 className="text-red-400 font-bold mb-1">Search Failed</h3>
                      <p className="text-red-300 text-sm">{booksError}</p>
                    </div>
                  ) : bookResults.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 bg-white dark:bg-[#1a1a24] rounded-2xl border border-dashed border-slate-200 dark:border-[#2d2d3f]">
                      <div className="bg-[#f5f5f8] dark:bg-[#13131a] p-5 rounded-full mb-4 border border-slate-200 dark:border-[#2d2d3f]">
                        <span className="material-symbols-outlined text-4xl text-slate-500">auto_stories</span>
                      </div>
                      <p className="text-lg font-bold text-white mb-2">Google Books Search</p>
                      <p className="text-sm max-w-sm text-center">Enter a subject like "Biology" to discover comprehensive textbooks.</p>
                    </div>
                  ) : (
                    bookResults.map((book) => (
                      <div key={book.id} className="bg-white dark:bg-[#1a1a24] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] overflow-hidden hover:border-[#ea580c]/50 hover:-translate-y-1 transition-all flex flex-col group shadow-sm">
                        <div className="relative h-48 bg-[#f5f5f8] dark:bg-[#13131a] flex justify-center items-center overflow-hidden shrink-0 border-b border-slate-200 dark:border-[#2d2d3f]">
                          {book.thumbnail ? (
                            <>
                              <Image
                                src={book.thumbnail}
                                alt={`Cover of ${book.title}`}
                                fill
                                className="object-cover opacity-20 blur-xl absolute inset-0 group-hover:opacity-40 transition-all"
                              />
                              <Image
                                src={book.thumbnail}
                                alt={`Cover of ${book.title}`}
                                width={100}
                                height={150}
                                className="z-10 shadow-2xl object-contain h-auto max-h-[140px] rounded-sm filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                              />
                            </>
                          ) : (
                            <span className="material-symbols-outlined text-6xl text-slate-600">
                              menu_book
                            </span>
                          )}
                          <div className="absolute top-3 left-3 flex flex-col gap-1 z-20">
                            {book.pdfAvailable && (
                              <span className="bg-green-500 text-slate-900 dark:text-white text-[9px] uppercase font-black px-2 py-1 rounded shadow-sm">
                                PDF
                              </span>
                            )}
                            {book.publicDomain && (
                              <span className="bg-purple-500 text-white text-[9px] uppercase font-black px-2 py-1 rounded shadow-sm">
                                Free
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight mb-1" title={book.title}>
                            {book.title}
                          </h3>
                          <p className="text-[11px] text-[#5b5bfa] font-black uppercase tracking-wider mb-3 line-clamp-1">
                            {book.authors?.join(', ') || 'Unknown Author'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4 flex-1">
                            {book.description || 'No description available for this volume.'}
                          </p>
                          <div className="mt-auto">
                            {book.pdfLink ? (
                              <a
                                href={book.pdfLink}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-full text-center bg-[#ea580c] text-white py-3 rounded-xl text-xs font-black transition-colors shadow-lg shadow-[#ea580c]/20"
                              >
                                Download PDF
                              </a>
                            ) : book.webReaderLink || book.previewLink ? (
                              <a
                                href={book.webReaderLink || book.previewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-full text-center bg-slate-100 dark:bg-[#252535] group-hover:bg-[#ea580c] text-slate-600 dark:text-slate-300 group-hover:text-white py-3 rounded-xl text-xs font-bold transition-colors truncate px-2"
                              >
                                Read Online
                              </a>
                            ) : (
                              <button disabled className="w-full bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] text-slate-600 py-3 rounded-xl text-xs font-bold cursor-not-allowed">
                                Unavailable
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="w-full xl:w-80 shrink-0 space-y-6">
              <div className="bg-white dark:bg-[#1a1a24] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] shadow-sm flex flex-col overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-[#2d2d3f] flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white text-[15px]">Recently Viewed</h3>
                  <span className="material-symbols-outlined text-[18px] text-slate-400">history</span>
                </div>
                <div className="p-2 py-3 space-y-1">
                  {resources.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 hover:bg-slate-100 dark:bg-[#252535] rounded-xl cursor-pointer transition-colors group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="material-symbols-outlined text-slate-500 group-hover:text-[#ea580c] transition-colors text-[20px]">
                          {getIconForType(item.file_type || '').icon}
                        </span>
                        <div className="truncate">
                          <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#ea580c] transition-colors truncate">{item.title}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{formatDate(item.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {resources.length === 0 && (
                    <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-xs font-medium">No recent files</div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-[#1a1a24] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] shadow-sm flex flex-col overflow-hidden p-6 gap-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-[15px]">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {folders.map((folder) => (
                    <button
                      key={folder}
                      onClick={() => setSelectedFolder(folder)}
                      className={`text-xs font-bold px-4 py-2 rounded-xl transition-all border ${selectedFolder === folder
                        ? 'bg-[#ea580c] text-white border-[#ea580c] shadow-sm shadow-[#ea580c]/20'
                        : 'bg-slate-50 dark:bg-[#13131a] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#2d2d3f] hover:border-[#ea580c]/30'
                        }`}
                    >
                      {folder === 'All' ? 'All Subjects' : folder}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col backdrop-blur-sm animate-in fade-in duration-200">
          <header className="flex items-center justify-between p-4 bg-white dark:bg-[#1b1b27] border-b border-slate-200 dark:border-[#2d2d3f] shrink-0">
            <h2 className="text-slate-900 dark:text-white font-bold text-lg truncate pr-4">{selectedResource.title}</h2>
            <div className="flex gap-4 items-center">
              <a href={selectedResource.file_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-[#ea580c] transition-colors flex items-center gap-2 font-bold text-sm bg-slate-100 dark:bg-[#252535] px-4 py-2 rounded-full hidden md:flex">
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                Open Full
              </a>
              <button
                onClick={() => setSelectedResource(null)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-[#252535] hover:bg-slate-200 dark:hover:bg-[#2d2d3f]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
            {selectedResource.file_type.includes('pdf') ? (
              <iframe
                src={`${selectedResource.file_url}#view=FitH`}
                className="w-full max-w-5xl h-full bg-white rounded-xl shadow-2xl"
                title="PDF Viewer"
              />
            ) : selectedResource.file_type.includes('image') ? (
              <div className="max-w-5xl h-full flex items-center justify-center bg-white/5 p-4 rounded-xl overflow-auto">
                <img
                  src={selectedResource.file_url}
                  alt={selectedResource.title}
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                />
              </div>
            ) : selectedResource.file_type.includes('wordprocessingml') || selectedResource.title.endsWith('.docx') || selectedResource.file_type.includes('presentationml') || selectedResource.title.endsWith('.pptx') ? (
              <div className="w-full max-w-4xl bg-white dark:bg-[#1a1a24] p-5 md:p-12 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] md:max-h-full border border-slate-200 dark:border-[#2d2d3f] my-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-slate-100 dark:border-[#2d2d3f]">
                  <div className={`p-2 md:p-3 rounded-xl ${getIconForType(selectedResource.file_type).colorClass}`}>
                    <span className="material-symbols-outlined text-2xl md:text-3xl">{getIconForType(selectedResource.file_type).icon}</span>
                  </div>
                  <div>
                    <h3 className="font-black text-2xl text-slate-900 dark:text-white leading-tight">{selectedResource.title}</h3>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                      {selectedResource.title.endsWith('.docx') ? 'Word Document' : 'PowerPoint Presentation'} • {formatSize(selectedResource.file_size_bytes)}
                    </p>
                  </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                  {selectedResource.content ? (
                    <div className="space-y-6">
                      {selectedResource.content.split('\n').filter(line => line.trim()).map((line, i) => (
                        <p key={i} className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">find_in_page</span>
                      <p className="text-slate-500 font-bold">No text content could be extracted from this file.</p>
                    </div>
                  )}
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 dark:border-[#2d2d3f] flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-slate-400 font-medium">
                    Content extracted via AI analysis for study generation.
                  </div>
                  <a href={selectedResource.file_url} target="_blank" rel="noreferrer" className="bg-[#ea580c] hover:bg-[#d04e0a] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#ea580c]/20">
                    <span className="material-symbols-outlined">download</span>
                    Download Original File
                  </a>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-2xl bg-white dark:bg-[#1a1a24] p-8 rounded-xl shadow-2xl overflow-y-auto max-h-full">
                <h3 className="font-bold text-xl mb-4 text-slate-900 dark:text-white">Document Preview</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                  This file type is supported for study generation but direct viewing is limited.
                  You can download it to view locally.
                </p>
                <div className="mt-8 flex justify-center">
                  <a href={selectedResource.file_url} target="_blank" rel="noreferrer" className="bg-[#ea580c] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined">download</span>
                    Download File
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Edit Resource Modal */}
      {isEditModalOpen && editingResource && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a1a24] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-[#2d2d3f]">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ea580c]">edit_document</span>
              Edit Resource
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] transition-colors"
                  placeholder="Enter resource title..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Folder / Subject</label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] transition-colors"
                  placeholder="e.g., Biology, Math, Uncategorized"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#2d2d3f]">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#252535] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-5 py-2.5 rounded-xl font-bold bg-[#ea580c] hover:bg-[#ea580c]/90 text-white shadow-sm transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
