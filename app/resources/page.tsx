'use client';

import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/layout/Sidebar';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useGoogleBooks } from '@/hooks/useGoogleBooks';

interface Resource {
  id: string;
  title: string;
  subject: string;
  file_url?: string;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
}

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'books'>('library');
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const { searchBooks, results: bookResults, isLoading: isLoadingBooks, error: booksError } = useGoogleBooks();

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
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(`Uploading ${file.name} to secure storage...`);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('resources')
        .upload(filePath, file);

      if (storageError) {
        throw new Error(storageError.message || 'Failed to upload to storage');
      }

      setUploadProgress(`Analyzing document content...`);
      const response = await fetch('/api/resources/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Processing failed');
      }

      // Refresh the library to show the new file
      await fetchResources();
      setActiveTab('library');
    } catch (error: any) {
      alert(`Error uploading file: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('resources').delete().eq('id', resourceId);
      if (error) throw error;

      // Update local state
      setResources(prev => prev.filter(r => r.id !== resourceId));
    } catch (error: any) {
      alert(`Error deleting resource: ${error.message}`);
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
    <div className="bg-[#f5f5f8] dark:bg-[#13131a] font-display min-h-screen flex flex-col md:flex-row antialiased selection:bg-[#ea580c]/30 selection:text-[#ea580c]">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Upload Toast Indicator */}
        {isUploading && (
          <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-[#2d2d3f] shadow-xl rounded-xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom-5">
            <div className="size-8 bg-[#ea580c]/20 rounded-full flex items-center justify-center shrink-0">
              <div className="size-4 border-2 border-[#5b5bfa] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Processing Document</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{uploadProgress}</p>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden w-full max-w-[1440px] mx-auto">
          <div className="px-6 pt-10 pb-6 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">Resource Library</h1>
            </div>
            <div className="relative overflow-hidden inline-block w-full md:w-auto">
              <button
                disabled={isUploading}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#ea580c] hover:bg-[#ea580c]/90 disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(59,59,250,0.3)]"
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

          <main className="flex-1 overflow-y-auto px-6 md:px-8 flex flex-col xl:flex-row gap-8 pb-10">
            <div className="flex-1 space-y-6">
              {/* Search and Tabs */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {activeTab === 'library' ? (
                  <div className="relative w-full md:w-[400px]">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <span className="material-symbols-outlined text-[20px]">
                        search
                      </span>
                    </span>
                    <input
                      className="w-full h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-[#2d2d3f] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#ea580c] outline-none"
                      placeholder="Search topics, books, past papers..."
                      type="text"
                    />
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">tune</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBookSearch} className="relative w-full md:w-[400px]">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <span className="material-symbols-outlined text-[20px]">
                        search
                      </span>
                    </span>
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-12 pl-12 pr-28 rounded-xl bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-[#2d2d3f] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#ea580c] outline-none"
                      placeholder="Search Google Books (e.g., Biology)..."
                      type="text"
                    />
                    <button
                      type="submit"
                      disabled={isLoadingBooks}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-[#ea580c] hover:bg-[#ea580c]/90 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {isLoadingBooks ? 'Searching' : 'Search'}
                    </button>
                  </form>
                )}

                <div className="flex bg-white dark:bg-[#1a1a24] p-1.5 rounded-xl border border-slate-200 dark:border-[#2d2d3f] w-full md:w-auto">
                  <button
                    onClick={() => setActiveTab('library')}
                    className={`flex-1 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'library' ? 'bg-slate-100 dark:bg-[#252535] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    My Uploads
                  </button>
                  <button
                    onClick={() => setActiveTab('books')}
                    className={`flex-1 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'books' ? 'bg-slate-100 dark:bg-[#252535] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Library Books
                  </button>
                </div>
              </div>

              {/* Grid of Resources */}
              {activeTab === 'library' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isLoadingLibrary ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
                      <div className="size-8 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="font-medium animate-pulse">Loading structured resources...</p>
                    </div>
                  ) : resources.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1a1a24] rounded-2xl border border-dashed border-slate-200 dark:border-[#2d2d3f]">
                      <div className="bg-[#f5f5f8] dark:bg-[#13131a] p-4 rounded-full mb-4 border border-slate-200 dark:border-[#2d2d3f]">
                        <span className="material-symbols-outlined text-4xl text-slate-500">folder_open</span>
                      </div>
                      <p className="text-base font-bold text-slate-900 dark:text-white mb-1">No resources found</p>
                      <p className="text-sm">You haven&apos;t uploaded any files yet.</p>
                    </div>
                  ) : (
                    resources.map((resource) => (
                      <div key={resource.id} className="bg-white dark:bg-[#1a1a24] rounded-2xl border border-slate-200 dark:border-[#2d2d3f] p-5 hover:border-[#ea580c]/50 transition-colors group flex flex-col">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`p-3 rounded-xl shrink-0 transition-colors ${getIconForType(resource.file_type).colorClass}`}>
                            <span className="material-symbols-outlined text-3xl">{getIconForType(resource.file_type).icon}</span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 break-all group-hover:text-[#5b5bfa] transition-colors" title={resource.title}>{resource.title}</h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-6 flex-wrap">
                          <span className={`text-[10px] font-black tracking-wider text-slate-500 dark:text-slate-400 bg-[#f5f5f8] dark:bg-[#13131a] px-2 py-1 rounded`}>
                            {resource.file_type.includes('pdf') ? 'PDF'
                              : resource.file_type.includes('presentation') || resource.file_type.includes('ppt') ? 'PPTX'
                                : resource.file_type.includes('document') || resource.file_type.includes('doc') ? 'DOCX'
                                  : resource.file_type.includes('image') ? 'IMAGE'
                                    : 'FILE'}
                          </span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{formatSize(resource.file_size_bytes)}</span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Uploaded {formatDate(resource.created_at)}</span>
                        </div>
                        <div className="flex gap-2 mt-auto">
                          {resource.file_type.includes('pdf') || resource.file_type.includes('image') ? (
                            <button onClick={() => setSelectedPdfUrl(resource.file_url || null)} className="flex-1 bg-slate-100 dark:bg-[#252535] hover:bg-[#ea580c] hover:text-white text-slate-600 dark:text-slate-300 font-bold py-2.5 rounded-xl transition-colors text-[13px] flex items-center justify-center gap-2">
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              View File
                            </button>
                          ) : (
                            <a href={resource.file_url} target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-100 dark:bg-[#252535] hover:bg-[#ea580c] hover:text-white text-slate-600 dark:text-slate-300 font-bold py-2.5 rounded-xl transition-colors text-[13px] flex items-center justify-center gap-2">
                              <span className="material-symbols-outlined text-[16px]">download</span>
                              Download
                            </a>
                          )}

                          {resource.file_type.includes('pdf') && (
                            <Link href={`/gamifier?id=${resource.id}`} className="flex-1 bg-[#ea580c]/10 hover:bg-[#ea580c] text-[#ea580c] hover:text-white font-bold py-2.5 rounded-xl transition-colors text-[13px] flex items-center justify-center gap-2">
                              <span className="material-symbols-outlined text-[16px]">sports_esports</span>
                              Read & Earn XP
                            </Link>
                          )}
                          <button onClick={() => handleDelete(resource.id)} className="px-3 bg-slate-100 dark:bg-[#252535] hover:bg-red-500/20 hover:text-red-400 text-slate-500 dark:text-slate-400 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
                            {book.pdfLink || book.previewLink ? (
                              <a
                                href={book.pdfLink || book.previewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-full text-center bg-slate-100 dark:bg-[#252535] group-hover:bg-[#ea580c] text-slate-600 dark:text-slate-300 group-hover:text-white py-3 rounded-xl text-xs font-bold transition-colors truncate px-2"
                              >
                                {book.pdfLink ? 'Download PDF' : 'Read Preview'}
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
                <div className="p-5 border-b border-slate-200 dark:border-[#2d2d3f]">
                  <h3 className="font-bold text-white text-[15px]">Recently Viewed</h3>
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
                  <button className="bg-[#ea580c] text-white text-xs font-bold px-4 py-2 rounded-full">All Subjects</button>
                  <button className="bg-slate-100 dark:bg-[#252535] hover:bg-[#2d2d3f] text-slate-600 dark:text-slate-300 text-xs font-bold px-4 py-2 rounded-full transition-colors border border-slate-200 dark:border-[#2d2d3f]">Biology</button>
                  <button className="bg-slate-100 dark:bg-[#252535] hover:bg-[#2d2d3f] text-slate-600 dark:text-slate-300 text-xs font-bold px-4 py-2 rounded-full transition-colors border border-slate-200 dark:border-[#2d2d3f]">Mathematics</button>
                  <button className="bg-slate-100 dark:bg-[#252535] hover:bg-[#2d2d3f] text-slate-600 dark:text-slate-300 text-xs font-bold px-4 py-2 rounded-full transition-colors border border-slate-200 dark:border-[#2d2d3f]">Physics</button>
                  <button className="bg-slate-100 dark:bg-[#252535] hover:bg-[#2d2d3f] text-slate-600 dark:text-slate-300 text-xs font-bold px-4 py-2 rounded-full transition-colors border border-slate-200 dark:border-[#2d2d3f]">Chemistry</button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {selectedPdfUrl && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col backdrop-blur-sm animate-in fade-in duration-200">
          <header className="flex items-center justify-between p-4 bg-white dark:bg-[#1b1b27] border-b border-slate-200 dark:border-[#2d2d3f] shrink-0">
            <h2 className="text-slate-900 dark:text-white font-bold text-lg">Document Viewer</h2>
            <div className="flex gap-4 items-center">
              <a href={selectedPdfUrl} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-[#ea580c] transition-colors flex items-center gap-2 font-bold text-sm bg-slate-100 dark:bg-[#252535] px-4 py-2 rounded-full">
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                Open External
              </a>
              <button
                onClick={() => setSelectedPdfUrl(null)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-[#252535] hover:bg-slate-200 dark:hover:bg-[#2d2d3f]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <iframe
              src={`${selectedPdfUrl}#view=FitH`}
              className="w-full max-w-5xl h-full bg-white rounded-xl shadow-2xl"
              title="PDF Viewer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
