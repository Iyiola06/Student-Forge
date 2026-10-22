'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase/client';
import { awardXp } from '@/app/actions/gamifier';
import CreditStatusBanner from '@/components/billing/CreditStatusBanner';
import { getBillingErrorMessage } from '@/lib/billing/client';
import Icon3D from '@/components/ui/Icon3D';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

type TutorMode = 'explain' | 'socratic' | 'quiz';

const MODES: Array<{ id: TutorMode; label: string; hint: string }> = [
    { id: 'explain', label: 'Explain', hint: 'Clear explanations with examples' },
    { id: 'socratic', label: 'Guide me', hint: 'Questions that lead you to the answer' },
    { id: 'quiz', label: 'Quiz me', hint: 'One question at a time, with feedback' },
];

const MODE_PROMPTS: Record<Exclude<TutorMode, 'explain'>, string[]> = {
    socratic: [
        'Help me work out why the sky is blue',
        'Guide me through solving 2x + 6 = 14',
        'Help me reason about why inflation hurts savers',
        'Lead me to understand how vaccines work',
    ],
    quiz: [
        'Quiz me on cell biology',
        'Quiz me on quadratic equations',
        'Quiz me on the causes of World War I',
        'Quiz me on my uploaded notes',
    ],
};

const SUGGESTED_PROMPTS = [
    { icon: 'science', text: 'Explain photosynthesis in simple terms', color: 'text-green-500' },
    { icon: 'calculate', text: 'Help me solve quadratic equations', color: 'text-blue-500' },
    { icon: 'history_edu', text: 'Summarize the causes of World War II', color: 'text-[#2f7fd3]' },
    { icon: 'biotech', text: 'What is DNA replication?', color: 'text-purple-500' },
    { icon: 'economics', text: 'Explain supply and demand', color: 'text-cyan-500' },
    { icon: 'menu_book', text: 'Help me understand Shakespeare\'s themes', color: 'text-pink-500' },
];

interface TutorChatProps {
    initialResourceId?: string | null;
    initialConversationId?: string | null;
}

type ResourceOption = { id: string; title: string };
type ConversationSummary = { id: string; title: string; mode: TutorMode; updated_at: string };

export default function TutorChat({ initialResourceId, initialConversationId }: TutorChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [xpAwarded, setXpAwarded] = useState(false);
    const [mode, setMode] = useState<TutorMode>('explain');
    const [resources, setResources] = useState<ResourceOption[]>([]);
    const [resourceId, setResourceId] = useState<string>(initialResourceId ?? '');
    const [conversationId, setConversationId] = useState<string | null>(initialConversationId ?? null);
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const resourceTitle = resources.find((r) => r.id === resourceId)?.title ?? null;

    const loadConversations = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('tutor_conversations')
            .select('id,title,mode,updated_at')
            .order('updated_at', { ascending: false })
            .limit(20);
        setConversations((data as ConversationSummary[]) ?? []);
    };

    useEffect(() => {
        (async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('resources')
                .select('id,title')
                .eq('processing_status', 'ready')
                .order('created_at', { ascending: false })
                .limit(50);
            setResources((data as ResourceOption[]) ?? []);
            await loadConversations();
            if (initialConversationId) {
                const { data: convo } = await supabase
                    .from('tutor_conversations')
                    .select('id,mode,resource_id,messages')
                    .eq('id', initialConversationId)
                    .maybeSingle();
                if (convo) {
                    setMode((convo.mode as TutorMode) || 'explain');
                    if (convo.resource_id) setResourceId(convo.resource_id);
                    setMessages(
                        (Array.isArray(convo.messages) ? convo.messages : []).map((m: { role: 'user' | 'assistant'; content: string; at?: string }, i: number) => ({
                            id: `${m.role}-${i}`,
                            role: m.role,
                            content: m.content,
                            timestamp: m.at ? new Date(m.at) : new Date(),
                        }))
                    );
                }
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** Saves the conversation so the student can come back to it (and the tutor remembers). */
    const persist = async (all: Message[]) => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const firstQuestion = all.find((m) => m.role === 'user')?.content ?? 'New conversation';
            const row = {
                user_id: user.id,
                title: firstQuestion.slice(0, 80),
                mode,
                resource_id: resourceId || null,
                messages: all.slice(-60).map((m) => ({ role: m.role, content: m.content, at: m.timestamp.toISOString() })),
                updated_at: new Date().toISOString(),
            };
            if (conversationId) {
                await supabase.from('tutor_conversations').update(row).eq('id', conversationId);
            } else {
                const { data } = await supabase.from('tutor_conversations').insert(row).select('id').single();
                if (data?.id) setConversationId(data.id);
            }
            loadConversations();
        } catch {
            /* saving is best-effort */
        }
    };

    const startNewChat = () => {
        setMessages([]);
        setConversationId(null);
        setShowHistory(false);
        window.history.replaceState(null, '', '/ai-tutor');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text?: string) => {
        const messageText = text || input.trim();
        if (!messageText || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Build history for API (excluding the message we're about to send)
            const history = messages.map(m => ({
                role: m.role,
                content: m.content,
            }));

            const response = await fetch('/api/ai/tutor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    history,
                    resourceId: resourceId || undefined,
                    mode,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(getBillingErrorMessage(data, 'Failed to get response'));
            }

            const aiMessage: Message = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: data.reply,
                timestamp: new Date(),
            };

            const updated = [...messages, userMessage, aiMessage];
            setMessages(updated);
            persist(updated);

            // Award XP for the first interaction in this session
            if (!xpAwarded) {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await awardXp(user.id, 15, 'ai_tutor_chat');
                    setXpAwarded(true);
                }
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to get AI response');
            // Remove the pending user message on error
            setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };



    return (
        <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="shrink-0 border-b border-[var(--line)] px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                        <Icon3D name="robot" size={30} />
                    </span>
                    <div className="min-w-0">
                        <h2 className="font-display text-[17px] font-semibold text-[var(--text-strong)]">AI Tutor</h2>
                        <p className="flex items-center gap-1.5 text-[12px] text-[var(--text-soft)]">
                            <span className="size-1.5 animate-pulse rounded-full bg-[var(--success)]" />
                            {MODES.find((m) => m.id === mode)?.hint}
                        </p>
                    </div>
                    <div className="app-tabs ml-auto" role="tablist" aria-label="Tutor mode">
                        {MODES.map((m) => (
                            <button key={m.id} type="button" role="tab" aria-selected={mode === m.id} className="app-tab !h-8 !px-3 !text-[13px]" data-active={mode === m.id} onClick={() => setMode(m.id)}>
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                        value={resourceId}
                        onChange={(e) => setResourceId(e.target.value)}
                        className="h-9 max-w-full flex-1 rounded-full border border-[var(--line-strong)] bg-[var(--card)] px-3 text-[13px] text-[var(--text-strong)] sm:max-w-[320px]"
                        aria-label="Study material for the tutor"
                    >
                        <option value="">No material: general knowledge</option>
                        {resources.map((r) => (
                            <option key={r.id} value={r.id}>
                                Study: {r.title}
                            </option>
                        ))}
                    </select>
                    <button type="button" className="secondary-button !h-9 !px-3 !text-[13px]" onClick={() => setShowHistory((v) => !v)}>
                        Recent chats{conversations.length ? ` (${conversations.length})` : ''}
                    </button>
                    <button type="button" className="ghost-button !h-9 !px-3 !text-[13px]" onClick={startNewChat}>
                        New chat
                    </button>
                </div>
                {showHistory ? (
                    <div className="mt-3 max-h-56 space-y-1 overflow-y-auto rounded-[20px] border border-[var(--line)] bg-[var(--card-2)] p-2">
                        {conversations.length ? (
                            conversations.map((c) => (
                                <a
                                    key={c.id}
                                    href={`/ai-tutor?conversation=${c.id}`}
                                    className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 text-[13px] hover:bg-[var(--accent-softer)]"
                                >
                                    <span className="truncate text-[var(--text-strong)]">{c.title}</span>
                                    <span className="shrink-0 text-[11.5px] text-[var(--text-soft)]">
                                        {MODES.find((m) => m.id === c.mode)?.label} &middot; {new Date(c.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </a>
                            ))
                        ) : (
                            <p className="px-3 py-2 text-[13px] text-[var(--text-soft)]">Your saved conversations will appear here.</p>
                        )}
                    </div>
                ) : null}
            </div>

            <div className="shrink-0 px-4 pt-4 sm:px-6">
                <CreditStatusBanner featureLabel="AI tutor message" creditCost={15} />
            </div>

            {/* Messages Area */}
            <div className="flex flex-1 flex-col space-y-6 overflow-y-auto p-4 sm:p-6">
                {messages.length === 0 ? (
                    /* Empty State with Suggested Prompts */
                    <div className="m-auto flex flex-col items-center justify-center px-2 py-4 text-center">
                        <Icon3D name={mode === 'quiz' ? 'target' : mode === 'socratic' ? 'thinking' : 'robot'} size={88} className="mb-4 animate-float" />
                        <h3 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-[var(--text-strong)]">
                            {mode === 'quiz' ? 'Ready to be quizzed?' : mode === 'socratic' ? 'Let\u2019s think it through together' : 'What do you want to learn?'}
                        </h3>
                        {resourceTitle ? (
                            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-softer)] px-3 py-1 text-[12.5px] text-[var(--accent-strong)]">
                                <Icon3D name="open-book" size={14} /> Using: {resourceTitle}
                            </p>
                        ) : null}
                        <p className="mt-2 mb-7 max-w-md text-sm text-[var(--text-soft)]">
                            {mode === 'quiz'
                                ? 'I will ask one question at a time, wait for your answer, then explain what you got right and what to fix.'
                                : mode === 'socratic'
                                    ? 'Instead of handing you the answer, I will ask questions that lead you to it. You will remember it far longer.'
                                    : 'Ask about any concept. I will explain it simply, with examples, then check that it clicked.'}
                        </p>
                        <div className="grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {(mode === 'explain' ? SUGGESTED_PROMPTS.map((p) => p.text) : MODE_PROMPTS[mode]).map((text, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(text)}
                                    className="rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-left text-[13.5px] font-medium text-[var(--text-body)] transition hover:-translate-y-px hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
                                >
                                    {text}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Message bubbles */
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] md:max-w-[70%] ${msg.role === 'user'
                                ? 'bg-[var(--action)] text-[var(--action-ink)] rounded-[22px] rounded-br-md px-5 py-3.5 shadow-[var(--shadow-action)]'
                                : 'bg-[var(--card)] border border-[var(--line)] text-[var(--text-body)] rounded-[22px] rounded-bl-md px-5 py-3.5 shadow-[var(--shadow-sm)]'
                                }`}>
                                {msg.role === 'assistant' && (
                                    <div className="mb-2 flex items-center gap-2 border-b border-[var(--line)] pb-2">
                                        <Icon3D name="robot" size={16} />
                                        <span className="text-[11px] font-medium text-[var(--accent)]">AI Tutor</span>
                                    </div>
                                )}
                                <div className="study-prose prose-sm max-w-none break-words text-[14.5px] leading-relaxed">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code(props: any) {
                                                const { children, className, node, ...rest } = props;
                                                return (
                                                    <code className="bg-slate-100 dark:bg-[#13203a] px-1.5 py-0.5 rounded text-[#2f7fd3] dark:text-green-500 text-sm" {...rest}>
                                                        {children}
                                                    </code>
                                                );
                                            }
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                                <div className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {/* Typing Indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-[#0f192c] border border-slate-200 dark:border-[#1d2a42] rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
                            <div className="mb-2 flex items-center gap-2">
                                <Icon3D name="robot" size={16} />
                                <span className="text-[11px] font-medium text-[var(--accent)]">Thinking...</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="size-2 bg-[#2f7fd3] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="size-2 bg-[#2f7fd3] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="size-2 bg-[#2f7fd3] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="shrink-0 border-t border-[var(--line)] p-4">
                <div className="flex items-end gap-3 max-w-4xl mx-auto">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={mode === 'quiz' ? 'Type your answer, or name a topic to be quizzed on...' : mode === 'socratic' ? 'What are you trying to understand?' : 'Ask me anything...'}
                            rows={1}
                            className="w-full resize-none rounded-[22px] border border-[var(--line-strong)] bg-[var(--card-2)] px-4 py-3 pr-12 text-sm text-[var(--text-strong)] outline-none transition-all placeholder:text-[var(--text-faint)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--ring-brand)]"
                            style={{ minHeight: '48px', maxHeight: '120px' }}
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--action)] text-[var(--action-ink)] shadow-[var(--shadow-action)] transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Send"
                    >
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-2 font-medium">
                    Press Enter to send. Shift+Enter for a new line.
                </p>
            </div>
        </div>
    );
}
