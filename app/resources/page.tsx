'use client';

import Link from 'next/link';
import Image from 'next/image';
import TopNavigation from '@/components/layout/TopNavigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useGoogleBooks } from '@/hooks/useGoogleBooks';

interface Resource {
  id: string;
  title: string;
  subject: string;
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
    setUploadProgress(`Uploading and analyzing ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/resources/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
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
    <div className="bg-[#13131a] font-display min-h-screen flex flex-col antialiased selection:bg-[#3b3bfa]/30 selection:text-[#3b3bfa]">
      <TopNavigation />

      {/* Upload Toast Indicator */}
      {isUploading && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1a24] border border-[#2d2d3f] shadow-xl rounded-xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="size-8 bg-[#3b3bfa]/20 rounded-full flex items-center justify-center shrink-0">
            <div className="size-4 border-2 border-[#5b5bfa] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Processing Document</p>
            <p className="text-xs text-slate-400">{uploadProgress}</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full max-w-[1440px] mx-auto">
        <div className="px-6 pt-10 pb-6 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white">Resource Library</h1>
          </div>
          <div className="relative overflow-hidden inline-block w-full md:w-auto">
            <button
              disabled={isUploading}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#3b3bfa] hover:bg-[#3b3bfa]/90 disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(59,59,250,0.3)]"
            >
              {isUploading ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined text-[20px]">
                  cloud_upload
                </span>
              )}
              <span>{isUploading ? 'Processing...' : 'Upload PDF'}</span>
            </button>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              title="Upload your PDF study material"
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
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-[#1a1a24] border border-[#2d2d3f] text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#3b3bfa] outline-none"
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
                    className="w-full h-12 pl-12 pr-28 rounded-xl bg-[#1a1a24] border border-[#2d2d3f] text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#3b3bfa] outline-none"
                    placeholder="Search Google Books (e.g., Biology)..."
                    type="text"
                  />
                  <button
                    type="submit"
                    disabled={isLoadingBooks}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-[#3b3bfa] hover:bg-[#3b3bfa]/90 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {isLoadingBooks ? 'Searching' : 'Search'}
                  </button>
                </form>
              )}

              <div className="flex bg-[#1a1a24] p-1.5 rounded-xl border border-[#2d2d3f] w-full md:w-auto">
                <button
                  onClick={() => setActiveTab('library')}
                  className={`flex-1 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'library' ? 'bg-[#252535] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  My Uploads
                </button>
                <button
                  onClick={() => setActiveTab('books')}
                  className={`flex-1 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'books' ? 'bg-[#252535] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
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
                    <div className="size-8 border-4 border-[#3b3bfa] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-medium animate-pulse">Loading structured resources...</p>
                  </div>
                ) : resources.length === 0 ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-[#1a1a24] rounded-2xl border border-dashed border-[#2d2d3f]">
                    <div className="bg-[#13131a] p-4 rounded-full mb-4 border border-[#2d2d3f]">
                      <span className="material-symbols-outlined text-4xl text-slate-500">folder_open</span>
                    </div>
                    <p className="text-base font-bold text-white mb-1">No resources found</p>
                    <p className="text-sm">You haven&apos;t uploaded any PDFs or documents yet.</p>
                  </div>
                ) : (
                  resources.map((resource) => (
                    <div key={resource.id} className="bg-[#1a1a24] rounded-2xl border border-[#2d2d3f] p-5 hover:border-[#3b3bfa]/50 transition-colors group flex flex-col">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-red-500/10 text-red-500 rounded-xl shrink-0 group-hover:bg-red-500/20 transition-colors">
                          <span className="material-symbols-outlined text-3xl">picture_as_pdf</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-white leading-snug line-clamp-2 group-hover:text-[#5b5bfa] transition-colors">{resource.title}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-6">
                        <span className="text-[10px] font-black tracking-wider text-slate-400 bg-[#13131a] px-2 py-1 rounded">PDF</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-500 font-medium">{formatSize(resource.file_size_bytes)}</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-500 font-medium">Uploaded {formatDate(resource.created_at)}</span>
                      </div>
                      <div className="flex gap-3 mt-auto">
                        <button className="flex-1 bg-[#252535] hover:bg-[#3b3bfa] hover:text-white text-slate-300 font-bold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          Open
                        </button>
                        <button className="px-4 bg-[#252535] hover:bg-red-500/20 hover:text-red-400 text-slate-400 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
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
                    <div className="size-8 border-4 border-[#3b3bfa] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-medium">Searching world libraries...</p>
                  </div>
                ) : booksError ? (
                  <div className="col-span-full bg-red-900/10 border border-red-900/30 p-6 rounded-xl text-center">
                    <span className="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
                    <h3 className="text-red-400 font-bold mb-1">Search Failed</h3>
                    <p className="text-red-300 text-sm">{booksError}</p>
                  </div>
                ) : bookResults.length === 0 ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 bg-[#1a1a24] rounded-2xl border border-dashed border-[#2d2d3f]">
                    <div className="bg-[#13131a] p-5 rounded-full mb-4 border border-[#2d2d3f]">
                      <span className="material-symbols-outlined text-4xl text-slate-500">auto_stories</span>
                    </div>
                    <p className="text-lg font-bold text-white mb-2">Google Books Search</p>
                    <p className="text-sm max-w-sm text-center">Enter a subject like "Biology" to discover comprehensive textbooks.</p>
                  </div>
                ) : (
                  bookResults.map((book) => (
                    <div key={book.id} className="bg-[#1a1a24] rounded-2xl border border-[#2d2d3f] overflow-hidden hover:border-[#3b3bfa]/50 hover:-translate-y-1 transition-all flex flex-col group shadow-sm">
                      <div className="relative h-48 bg-[#13131a] flex justify-center items-center overflow-hidden shrink-0 border-b border-[#2d2d3f]">
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
                            <span className="bg-green-500 text-white text-[9px] uppercase font-black px-2 py-1 rounded shadow-sm">
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
                        <h3 className="font-bold text-white line-clamp-2 leading-tight mb-1" title={book.title}>
                          {book.title}
                        </h3>
                        <p className="text-[11px] text-[#5b5bfa] font-black uppercase tracking-wider mb-3 line-clamp-1">
                          {book.authors?.join(', ') || 'Unknown Author'}
                        </p>
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4 flex-1">
                          {book.description || 'No description available for this volume.'}
                        </p>
                        <div className="mt-auto">
                          {book.pdfLink || book.previewLink ? (
                            <a
                              href={book.pdfLink || book.previewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="block w-full text-center bg-[#252535] group-hover:bg-[#3b3bfa] text-slate-300 group-hover:text-white py-3 rounded-xl text-xs font-bold transition-colors truncate px-2"
                            >
                              {book.pdfLink ? 'Download PDF' : 'Read Preview'}
                            </a>
                          ) : (
                            <button disabled className="w-full bg-[#13131a] border border-[#2d2d3f] text-slate-600 py-3 rounded-xl text-xs font-bold cursor-not-allowed">
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
            <div className="bg-[#1a1a24] rounded-2xl border border-[#2d2d3f] shadow-sm flex flex-col overflow-hidden">
              <div className="p-5 border-b border-[#2d2d3f]">
                <h3 className="font-bold text-white text-[15px]">Recently Viewed</h3>
              </div>
              <div className="p-2 py-3 space-y-1">
                {/* Mock Data mimicking screenshot */}
                {[
                  { title: 'Physics Midterm Notes', time: '10 mins ago', type: 'PDF' },
                  { title: 'Organic Chem Basics', time: 'Yesterday', type: 'PDF' },
                  { title: 'Calculus Ch 3 Integration', time: '2 days ago', type: 'PDF' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 hover:bg-[#252535] rounded-xl cursor-pointer transition-colors group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="material-symbols-outlined text-slate-500 group-hover:text-[#5b5bfa] transition-colors text-[20px]">description</span>
                      <div className="truncate">
                        <div className="text-sm font-bold text-white group-hover:text-[#5b5bfa] transition-colors truncate">{item.title}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{item.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1a1a24] rounded-2xl border border-[#2d2d3f] shadow-sm flex flex-col overflow-hidden p-6 gap-4">
              <h3 className="font-bold text-white text-[15px]">Categories</h3>
              <div className="flex flex-wrap gap-2">
                <button className="bg-[#3b3bfa] text-white text-xs font-bold px-4 py-2 rounded-full">All Subjects</button>
                <button className="bg-[#252535] hover:bg-[#2d2d3f] text-slate-300 text-xs font-bold px-4 py-2 rounded-full transition-colors border border-[#2d2d3f]">Biology</button>
                <button className="bg-[#252535] hover:bg-[#2d2d3f] text-slate-300 text-xs font-bold px-4 py-2 rounded-full transition-colors border border-[#2d2d3f]">Mathematics</button>
                <button className="bg-[#252535] hover:bg-[#2d2d3f] text-slate-300 text-xs font-bold px-4 py-2 rounded-full transition-colors border border-[#2d2d3f]">Physics</button>
                <button className="bg-[#252535] hover:bg-[#2d2d3f] text-slate-300 text-xs font-bold px-4 py-2 rounded-full transition-colors border border-[#2d2d3f]">Chemistry</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
