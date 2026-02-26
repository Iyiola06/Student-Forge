import Link from 'next/link';
import TopNavigation from '@/components/layout/TopNavigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Resource {
  id: string;
  title: string;
  subject: string;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchResources() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setResources(data as Resource[]);
      }
      setIsLoading(false);
    }

    fetchResources();
  }, []);

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
        <div className="px-6 pt-6 pb-2 md:px-8 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <span className="material-symbols-outlined text-[20px]">
                search
              </span>
            </span>
            <input
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-[#1b1b27] border border-slate-200 dark:border-[#2d2d3f] text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#2525f4]"
              placeholder="Search resources, topics, or authors..."
              type="text"
            />
          </div>
        </div>
        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
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
                {/* Static placeholders for recently viewed. Can be made dynamic later */}
                {/* Card 1 */}
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
                  Your Library
                </h2>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#252535] text-slate-600 dark:text-[#9c9cba] text-sm font-medium hover:bg-slate-200 dark:hover:bg-[#2d2d3f] transition-colors">
                    All
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-transparent text-slate-500 dark:text-[#9c9cba] text-sm font-medium hover:bg-slate-100 dark:hover:bg-[#252535] transition-colors">
                    PDFs
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-transparent text-slate-500 dark:text-[#9c9cba] text-sm font-medium hover:bg-slate-100 dark:hover:bg-[#252535] transition-colors">
                    Quizzes
                  </button>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1b1b27] rounded-xl border border-slate-200 dark:border-[#2d2d3f] overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-[#252535] text-slate-500 dark:text-[#9c9cba]">
                    <tr>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Subject</th>
                      <th className="px-6 py-4 font-medium">Date Added</th>
                      <th className="px-6 py-4 font-medium">Size</th>
                      <th className="px-6 py-4 font-medium text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#2d2d3f]">
                    {isLoading ? (
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
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${colorClass}`}>
                                  <span className="material-symbols-outlined text-xl">
                                    {icon}
                                  </span>
                                </div>
                                <span className="font-medium text-slate-900 dark:text-white truncate max-w-[250px]">
                                  {resource.title}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-[#9c9cba]">
                              {resource.subject || 'Uncategorized'}
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-[#9c9cba]">
                              {formatDate(resource.created_at)}
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-[#9c9cba]">
                              {formatSize(resource.file_size_bytes)}
                            </td>
                            <td className="px-6 py-4 text-right">
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
          </div>
        </main>
      </div>
    </div>
  );
}
