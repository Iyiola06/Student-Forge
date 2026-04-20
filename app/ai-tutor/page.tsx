'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
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
        <AppShell
            eyebrow="Labs"
            title="AI tutor"
            description="Ask focused questions, unpack difficult topics, or study directly against one selected resource."
            contentClassName="h-full"
        >
            <div className="h-[calc(100vh-13rem)] min-h-[640px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:border-white/8 dark:bg-[#0f1724]">
                <TutorChat
                    resourceContext={resourceContext}
                    resourceTitle={resourceTitle}
                />
            </div>
        </AppShell>
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
