'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TutorChat from '@/components/ai/TutorChat';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';


function AITutorContent() {
    const searchParams = useSearchParams();
    const resourceId = searchParams.get('resourceId');
    const [resourceContext, setResourceContext] = useState<string | null>(null);
    const [resourceTitle, setResourceTitle] = useState<string | null>(null);

    useEffect(() => {
        if (!resourceId) return;

        async function loadResource() {
            const supabase = createClient();
            const { data } = await supabase
                .from('resources')
                .select('title, content')
                .eq('id', resourceId)
                .single();

            if (data) {
                setResourceContext(data.content || null);
                setResourceTitle(data.title || null);
            }
        }

        loadResource();
    }, [resourceId]);

    return (
        <div className="main-bg font-display min-h-screen flex flex-col md:flex-row antialiased selection:bg-[#1a5c2a]/30 selection:text-[#1a5c2a]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen md:h-screen md:overflow-hidden">
                <TutorChat
                    resourceContext={resourceContext}
                    resourceTitle={resourceTitle}
                />
            </div>
        </div>
    );
}

export default function AITutorPage() {
    return (
        <Suspense fallback={
            <div className="main-bg font-display min-h-screen flex items-center justify-center">
                <div className="size-10 border-4 border-[#1a5c2a] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <AITutorContent />
        </Suspense>
    );
}
