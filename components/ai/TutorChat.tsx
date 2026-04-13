'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase/client';
import { awardXp } from '@/app/actions/gamifier';
import CreditStatusBanner from '@/components/billing/CreditStatusBanner';
import { getBillingErrorMessage } from '@/lib/billing/client';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const SUGGESTED_PROMPTS = [
    { icon: 'science', text: 'Explain photosynthesis in simple terms', color: 'text-green-500' },
    { icon: 'calculate', text: 'Help me solve quadratic equations', color: 'text-blue-500' },
    { icon: 'history_edu', text: 'Summarize the causes of World War II', color: 'text-[#1a5c2a]' },
    { icon: 'biotech', text: 'What is DNA replication?', color: 'text-purple-500' },
    { icon: 'economics', text: 'Explain supply and demand', color: 'text-cyan-500' },
    { icon: 'menu_book', text: 'Help me understand Shakespeare\'s themes', color: 'text-pink-500' },
];

interface TutorChatProps {
    resourceContext?: string | null;
    resourceTitle?: string | null;
}

export default function TutorChat({ resourceContext, resourceTitle }: TutorChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [xpAwarded, setXpAwarded] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

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
                    context: resourceContext || undefined,
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

            setMessages(prev => [...prev, aiMessage]);

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
            <div className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-[#2d2d3f] bg-white dark:bg-[#1a1a24]">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-[#1a5c2a] to-orange-600 flex items-center justify-center shadow-lg shadow-[#1a5c2a]/20">
                        <span className="material-symbols-outlined text-white text-xl">psychology</span>
                    </div>
                    <div>
                        <h2 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">AI Tutor</h2>
                        <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                            <span className="size-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Online • Gemini-Powered
                        </p>
                    </div>
                    {resourceTitle && (
                        <div className="ml-auto px-3 py-1.5 bg-[#1a5c2a]/10 border border-[#1a5c2a]/20 rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#1a5c2a] text-sm">description</span>
                            <span className="text-xs font-bold text-[#1a5c2a] truncate max-w-[200px]">{resourceTitle}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="shrink-0 px-6 pt-4">
                <CreditStatusBanner featureLabel="AI tutor message" creditCost={15} />
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                    /* Empty State with Suggested Prompts */
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="size-20 rounded-full bg-gradient-to-br from-[#1a5c2a]/20 to-orange-500/10 border border-[#1a5c2a]/20 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-[#1a5c2a] text-4xl">auto_awesome</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                            What do you want to learn?
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mb-8">
                            Ask me anything — from exam prep questions to concept explanations. I&apos;m here to help you master any subject.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                            {SUGGESTED_PROMPTS.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(prompt.text)}
                                    className="flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-[#2d2d3f] rounded-xl hover:border-[#1a5c2a]/50 hover:shadow-lg hover:shadow-[#1a5c2a]/5 transition-all text-left group"
                                >
                                    <span className={`material-symbols-outlined ${prompt.color} text-xl group-hover:scale-110 transition-transform`}>
                                        {prompt.icon}
                                    </span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                                        {prompt.text}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Message bubbles */
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] md:max-w-[70%] ${msg.role === 'user'
                                ? 'bg-[#1a5c2a] text-white rounded-2xl rounded-br-md px-5 py-3.5 shadow-lg shadow-[#1a5c2a]/20'
                                : 'bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-[#2d2d3f] text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-md px-5 py-3.5 shadow-sm'
                                }`}>
                                {msg.role === 'assistant' && (
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-[#2d2d3f]">
                                        <span className="material-symbols-outlined text-[#1a5c2a] text-sm">psychology</span>
                                        <span className="text-[10px] font-black text-[#1a5c2a] uppercase tracking-widest">AI Tutor</span>
                                    </div>
                                )}
                                <div className="text-sm leading-relaxed prose-sm dark:prose-invert max-w-none break-words">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code(props: any) {
                                                const { children, className, node, ...rest } = props;
                                                return (
                                                    <code className="bg-slate-100 dark:bg-[#252535] px-1.5 py-0.5 rounded text-[#1a5c2a] dark:text-green-500 text-sm" {...rest}>
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
                        <div className="bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-[#2d2d3f] rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-[#1a5c2a] text-sm">psychology</span>
                                <span className="text-[10px] font-black text-[#1a5c2a] uppercase tracking-widest">AI Tutor</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="size-2 bg-[#1a5c2a] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="size-2 bg-[#1a5c2a] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="size-2 bg-[#1a5c2a] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="shrink-0 p-4 border-t border-slate-200 dark:border-[#2d2d3f] bg-white dark:bg-[#1a1a24]">
                <div className="flex items-end gap-3 max-w-4xl mx-auto">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything..."
                            rows={1}
                            className="w-full resize-none rounded-xl border border-slate-200 dark:border-[#2d2d3f] bg-[#f5f5f8] dark:bg-[#13131a] px-4 py-3 pr-12 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#1a5c2a] focus:border-transparent outline-none transition-all"
                            style={{ minHeight: '48px', maxHeight: '120px' }}
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                        className="size-12 rounded-xl bg-[#1a5c2a] hover:bg-[#d04e0a] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-lg shadow-[#1a5c2a]/20 hover:shadow-[#1a5c2a]/30 active:scale-95 shrink-0"
                    >
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-2 font-medium">
                    Press Enter to send • Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
