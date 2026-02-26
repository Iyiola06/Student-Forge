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

  const [searchQuery, setSearchQuery] = useState('');
  const { searchBooks, results: bookResults, isLoading: isLoadingBooks, error: booksError } = useGoogleBooks();

  useEffect(() => {
    async function fetchResources() {
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
    }

    fetchResources();
  }, []);

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
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col antialiased selection:bg-[#2525f4]/30 selection:text-[#2525f4]">
      <TopNavigation>
        <button className="flex items-center gap-2 bg-[#2525f4] hover:bg-[#2525f4]/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#2525f4]/20 hidden md:flex">
          <span className="material-symbols-outlined text-[20px]">
            upload_file
          </span>
          <span>Upload PDF</span>
        </button>
      </TopNavigation>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full max-w-[1440px] mx-auto">
        <div className="px-6 pt-6 pb-2 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Custom Tab Navigation */}
          <div className="flex bg-slate-200 dark:bg-[#1b1b27] p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex-1 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'library' ? 'bg-white dark:bg-[#2d2d3f] text-[#2525f4] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              My Library
            </button>
            <button
              onClick={() => setActiveTab('books')}
              className={`flex-1 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'books' ? 'bg-white dark:bg-[#2d2d3f] text-[#2525f4] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Search Books
            </button>
          </div>

          {activeTab === 'library' ? (
            <div className="relative w-full max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-[20px]">
                  search
                </span>
              </span>
              <input
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#2525f4]"
                placeholder="Search your resources..."
                type="text"
              />
            </div>
          ) : (
            <form onSubmit={handleBookSearch} className="relative w-full max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-[20px]">
                  search
                </span>
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-24 rounded-lg bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#2525f4]"
                placeholder="Search Google Books (e.g., Biology)..."
                type="text"
              />
              <button
                type="submit"
                disabled={isLoadingBooks}
                className="absolute right-1 top-1 bottom-1 px-4 bg-[#2525f4] hover:bg-[#2525f4]/90 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isLoadingBooks ? 'Searching...' : 'Search'}
              </button>
            </form>
          )}
        </div>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">

            {activeTab === 'library' && (
              <>
                {/* Recently Viewed */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Recently Viewed
                    </h2>
                    <Link
                      className="text-sm font-medium text-[#2525f4] hover:underline"
                      href="#"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                      <div className="h-32 bg-gradient-to-r from-blue-500 to-cyan-500 relative p-4 flex items-end">
                        <span className="bg-white/90 dark:bg-[#1b1b27]/90 text-slate-900 dark:text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
                          Biology
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-[#2525f4] transition-colors">
                          Advanced Cell Biology
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-[#9c9cba] mb-3">
                          Last viewed 2 hours ago • 45% Complete
                        </p>
                        <div className="w-full bg-slate-100 dark:bg-[#2d2d3f] rounded-full h-1.5 mb-3">
                          <div
                            className="bg-[#2525f4] h-1.5 rounded-full"
                            style={{ width: '45%' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Main Library */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Your Resources
                    </h2>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#252535] text-slate-600 dark:text-[#9c9cba] text-sm font-medium hover:bg-slate-200 dark:hover:bg-[#2d2d3f] transition-colors">
                        All
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-transparent text-slate-500 dark:text-[#9c9cba] text-sm font-medium hover:bg-slate-100 dark:hover:bg-[#252535] transition-colors">
                        PDFs
                      </button>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-[#252535] text-slate-500 dark:text-[#9c9cba]">
                        <tr>
                          <th className="px-4 md:px-6 py-4 font-medium">Name</th>
                          <th className="px-4 md:px-6 py-4 font-medium hidden md:table-cell">Subject</th>
                          <th className="px-4 md:px-6 py-4 font-medium hidden sm:table-cell">Date Added</th>
                          <th className="px-4 md:px-6 py-4 font-medium hidden lg:table-cell">Size</th>
                          <th className="px-4 md:px-6 py-4 font-medium text-right">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#2d2d3f]">
                        {isLoadingLibrary ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-[#9c9cba]">
                              <div className="flex justify-center items-center gap-2">
                                <div className="size-5 border-2 border-[#2525f4] border-t-transparent rounded-full animate-spin"></div>
                                Loading resources...
                              </div>
                            </td>
                          </tr>
                        ) : resources.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-[#9c9cba]">
                              <div className="flex flex-col items-center gap-3">
                                <div className="bg-slate-100 dark:bg-[#252535] p-4 rounded-full">
                                  <span className="material-symbols-outlined text-4xl text-slate-400">folder_open</span>
                                </div>
                                <p className="text-base font-medium">No resources found</p>
                                <p className="text-sm">You haven&apos;t uploaded any PDFs or documents yet.</p>
                                <button className="mt-2 text-[#2525f4] font-bold hover:underline">Upload your first PDF</button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          resources.map((resource) => {
                            const { icon, colorClass } = getIconForType(resource.file_type);
                            return (
                              <tr key={resource.id} className="hover:bg-slate-50 dark:hover:bg-[#252535]/50 transition-colors group cursor-pointer">
                                <td className="px-4 md:px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${colorClass} shrink-0`}>
                                      <span className="material-symbols-outlined text-xl">
                                        {icon}
                                      </span>
                                    </div>
                                    <span className="font-medium text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-[250px]">
                                      {resource.title}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 md:px-6 py-4 text-slate-500 dark:text-[#9c9cba] hidden md:table-cell">
                                  {resource.subject || 'Uncategorized'}
                                </td>
                                <td className="px-4 md:px-6 py-4 text-slate-500 dark:text-[#9c9cba] hidden sm:table-cell">
                                  {formatDate(resource.created_at)}
                                </td>
                                <td className="px-4 md:px-6 py-4 text-slate-500 dark:text-[#9c9cba] hidden lg:table-cell">
                                  {formatSize(resource.file_size_bytes)}
                                </td>
                                <td className="px-4 md:px-6 py-4 text-right">
                                  <button className="text-slate-400 hover:text-[#2525f4] opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined">
                                      download
                                    </span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {/* Google Books Search Results */}
            {activeTab === 'books' && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Search Results
                  </h2>
                  {bookResults.length > 0 && (
                    <span className="text-sm text-slate-500 dark:text-[#9c9cba]">
                      Found {bookResults.length} books
                    </span>
                  )}
                </div>

                {isLoadingBooks ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-[#9c9cba]">
                    <div className="size-8 border-4 border-[#2525f4] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-medium">Searching world libraries...</p>
                  </div>
                ) : booksError ? (
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-6 rounded-xl text-center">
                    <span className="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
                    <h3 className="text-red-800 dark:text-red-400 font-bold mb-1">Search Failed</h3>
                    <p className="text-red-600 dark:text-red-300 text-sm">{booksError}</p>
                  </div>
                ) : bookResults.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-[#9c9cba]">
                    <div className="bg-slate-100 dark:bg-[#252535] p-5 rounded-full mb-4">
                      <span className="material-symbols-outlined text-5xl text-slate-400">auto_stories</span>
                    </div>
                    <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">Google Books Search</p>
                    <p className="text-sm max-w-sm text-center">Enter a subject like "Biology" or "Calculus" to discover comprehensive textbooks and resources.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {bookResults.map((book) => (
                      <div key={book.id} className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col group">
                        <div className="relative h-48 bg-slate-100 dark:bg-[#252535] flex justify-center items-center overflow-hidden shrink-0">
                          {book.thumbnail ? (
                            <Image
                              src={book.thumbnail}
                              alt={`Cover of ${book.title}`}
                              fill
                              className="object-cover opacity-50 blur-sm absolute inset-0 group-hover:blur-md transition-all"
                            />
                          ) : null}
                          {book.thumbnail ? (
                            <Image
                              src={book.thumbnail}
                              alt={`Cover of ${book.title}`}
                              width={100}
                              height={150}
                              className="z-10 shadow-lg object-contain h-auto max-h-[140px]"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-[#3b3b54]">
                              menu_book
                            </span>
                          )}
                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
                            {book.pdfAvailable && (
                              <span className="bg-green-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded shadow-sm">
                                PDF
                              </span>
                            )}
                            {book.publicDomain && (
                              <span className="bg-purple-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded shadow-sm">
                                Free
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight mb-1" title={book.title}>
                            {book.title}
                          </h3>
                          <p className="text-xs text-[#2525f4] font-medium mb-3 line-clamp-1">
                            {book.authors?.join(', ') || 'Unknown Author'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-[#9c9cba] line-clamp-3 leading-relaxed mb-4 flex-1">
                            {book.description || 'No description available for this volume.'}
                          </p>

                          <div className="pt-4 border-t border-slate-100 dark:border-[#2d2d3f] flex items-center justify-between gap-2 mt-auto">
                            {book.pdfLink || book.previewLink ? (
                              <a
                                href={book.pdfLink || book.previewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-center py-2 rounded-lg text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors truncate px-2"
                              >
                                {book.pdfLink ? 'Download PDF' : 'Read Preview'}
                              </a>
                            ) : (
                              <button disabled className="flex-1 bg-slate-100 dark:bg-[#252535] text-slate-400 dark:text-slate-500 py-2 rounded-lg text-xs font-bold cursor-not-allowed">
                                Unavailable
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
