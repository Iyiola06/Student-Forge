'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import TutorChat from '@/components/ai/TutorChat';

export const dynamic = 'force-dynamic';


function AITutorContent() {
    const searchParams = useSearchParams();
    const resourceId = searchParams.get('resourceId');
    const conversationId = searchParams.get('conversation');

    return (
        <AppShell
            eyebrow="Learn"
            title="AI tutor"
            description="Explain, guide or quiz, on any topic or on your own notes. Chats are saved and the tutor remembers how you learn."
            contentClassName="h-full"
        >
            <div className="h-[min(76vh,820px)] min-h-[560px] overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow-md)] lg:h-[calc(100vh-13rem)] lg:min-h-[660px]">
                <TutorChat key={conversationId ?? 'new'} initialResourceId={resourceId} initialConversationId={conversationId} />
            </div>
        </AppShell>
    );
}

export default function AITutorPage() {
    return (
        <Suspense fallback={
            <div className="main-bg font-display min-h-screen flex items-center justify-center">
                <div className="size-10 border-4 border-[#2f7fd3] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <AITutorContent />
        </Suspense>
    );
}
