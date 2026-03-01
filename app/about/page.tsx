'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';

/* ──────────────────────────────────────────────────
   TEAM DATA — Replace names, roles, quotes, and photo
   src attributes with real values when ready.
   ────────────────────────────────────────────────── */
const teamMembers = [
    { name: 'Team Member 1', role: 'Frontend Developer', quote: 'Code is my superpower.' },
    { name: 'Team Member 2', role: 'Backend Developer', quote: 'Databases never lie.' },
    { name: 'Team Member 3', role: 'UI/UX Designer', quote: 'Pixels tell stories.' },
    { name: 'Team Member 4', role: 'Full Stack Developer', quote: 'Ship it or shelve it.' },
    { name: 'Team Member 5', role: 'Frontend Developer', quote: 'Debugging is my cardio.' },
    { name: 'Team Member 6', role: 'Backend Developer', quote: 'APIs are poetry.' },
    { name: 'Team Member 7', role: 'Project Manager', quote: 'Deadlines fuel greatness.' },
    { name: 'Team Member 8', role: 'Full Stack Developer', quote: 'Ctrl+S saves lives.' },
];

/* ──────────────────────────────────────────────────
   FLOATING ICON COMPONENT for hero background
   ────────────────────────────────────────────────── */
function FloatingIcon({ icon, className }: { icon: string; className: string }) {
    return (
        <motion.span
            className={`material-symbols-outlined absolute text-white/[0.04] text-6xl select-none pointer-events-none ${className}`}
            animate={{ y: [0, -20, 0], x: [0, 8, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        >
            {icon}
        </motion.span>
    );
}

/* ──────────────────────────────────────────────────
   SECTION WRAPPER with scroll-triggered fade-in
   ────────────────────────────────────────────────── */
function Section({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay }}
            className={className}
        >
            {children}
        </motion.section>
    );
}

/* ──────────────────────────────────────────────────
   ABOUT PAGE
   ────────────────────────────────────────────────── */
export default function AboutPage() {
    return (
        <div className="bg-[#101022] font-display min-h-screen flex flex-col antialiased selection:bg-[#ea580c]/30 selection:text-[#ea580c] text-white">

            {/* ─── STICKY HEADER ─── */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-[#2d2d3f] px-4 sm:px-10 py-4 bg-[#101022]/80 backdrop-blur-md sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ea580c] text-3xl">school</span>
                    <h2 className="text-white text-xl font-bold tracking-tight">StudyForge</h2>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-slate-300 hover:text-[#ea580c] transition-colors text-sm font-medium hidden sm:block">
                        Log In
                    </Link>
                    <Link href="/signup">
                        <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-6 bg-[#ea580c] hover:bg-[#ea580c]/90 transition-colors text-white text-sm font-bold shadow-lg shadow-[#ea580c]/20">
                            Get Started
                        </button>
                    </Link>
                </div>
            </header>

            {/* ═══════════════════════════════════════════
          1. HERO SECTION
          ═══════════════════════════════════════════ */}
            <section className="relative overflow-hidden flex flex-col items-center justify-center text-center px-6 py-28 md:py-40">
                {/* Animated floating background icons */}
                <FloatingIcon icon="menu_book" className="top-[10%] left-[8%]" />
                <FloatingIcon icon="lightbulb" className="top-[20%] right-[12%]" />
                <FloatingIcon icon="code" className="bottom-[15%] left-[15%]" />
                <FloatingIcon icon="auto_stories" className="top-[55%] right-[8%]" />
                <FloatingIcon icon="school" className="bottom-[25%] right-[30%]" />
                <FloatingIcon icon="terminal" className="top-[40%] left-[5%]" />

                {/* Gradient blurs */}
                <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] bg-[#ea580c]/8 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[40vw] h-[40vw] bg-blue-600/8 rounded-full blur-[140px] pointer-events-none" />

                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 max-w-3xl">
                    <div className="mx-auto mb-8">
                        <span className="material-symbols-outlined text-[#ea580c] text-6xl">school</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
                        Built by Students.{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ea580c] to-blue-500">
                            Built for Students.
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        StudyForge was born out of a simple frustration — studying is hard, and the tools available to students weren&apos;t good enough. So we built our own.
                    </p>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════
          2. OUR STORY
          ═══════════════════════════════════════════ */}
            <Section className="px-6 py-20 md:py-28 max-w-6xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
                    {/* Illustration side */}
                    <div className="flex items-center justify-center">
                        <div className="relative w-full max-w-md aspect-square rounded-3xl bg-gradient-to-br from-[#1b1b27] to-[#252535] border border-[#2d2d3f] flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#ea580c]/5 to-blue-600/5" />
                            <div className="relative flex flex-col items-center gap-4 p-8 text-center">
                                <span className="material-symbols-outlined text-8xl text-[#ea580c]/60">auto_stories</span>
                                <span className="material-symbols-outlined text-6xl text-blue-500/40 absolute top-8 right-8">psychology</span>
                                <span className="material-symbols-outlined text-5xl text-purple-500/30 absolute bottom-12 left-8">code</span>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-4">From Classroom to Platform</p>
                            </div>
                        </div>
                    </div>
                    {/* Text side */}
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight">Our Story</h2>
                        <div className="space-y-5 text-slate-400 leading-relaxed text-[15px]">
                            <p>
                                StudyForge is the product of real student experience. It was conceived and built entirely by students of the <span className="text-white font-semibold">Programming Entrepreneurship class at Venite University</span> — a group of young developers who understood firsthand the pressure of exams, the struggle of staying organized, and the need for smarter study tools.
                            </p>
                            <p>
                                What started as a classroom project quickly became something much bigger: a fully functional platform designed to transform the way students read, study, and prepare for exams. Every feature in StudyForge — from the gamified PDF reader to the AI question generator — was designed with one person in mind: <span className="text-[#ea580c] font-semibold">the student sitting up late the night before an exam.</span>
                            </p>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ═══════════════════════════════════════════
          3. MEET THE FACILITATOR
          ═══════════════════════════════════════════ */}
            <Section className="px-6 py-20 md:py-28">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-[#1b1b27] rounded-3xl border border-[#2d2d3f] p-8 md:p-12 relative overflow-hidden">
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ea580c]/5 rounded-full blur-[100px] pointer-events-none" />

                        <h2 className="text-2xl md:text-3xl font-black text-center mb-10 tracking-tight">Meet the Facilitator</h2>

                        <div className="flex flex-col items-center text-center relative z-10">
                            {/* FACILITATOR PHOTO - Replace the src below with the actual image path e.g. src="/images/iyiola.jpg" - recommended size: 300x300px, square crop */}
                            <div className="relative mb-6">
                                <div className="size-36 md:size-44 rounded-full ring-4 ring-[#ea580c]/30 p-1 bg-[#252535]">
                                    <Image
                                        src="/images/placeholder-avatar.png"
                                        alt="Iyiola Ogunjobi"
                                        width={176}
                                        height={176}
                                        className="rounded-full object-cover w-full h-full"
                                    />
                                </div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#252535] border border-[#3b3b54] text-[10px] font-bold text-slate-400 px-3 py-1 rounded-full whitespace-nowrap">
                                    Click to upload photo
                                </div>
                            </div>

                            <h3 className="text-2xl font-black mt-2">Iyiola Ogunjobi</h3>
                            <p className="text-[#ea580c] font-bold text-sm mt-1">Entrepreneurship Facilitator &amp; Student, Venite University</p>

                            <p className="text-slate-400 leading-relaxed mt-6 max-w-lg text-[15px]">
                                Iyiola Ogunjobi is both a student and the entrepreneurship facilitator who guided the Programming Entrepreneurship class at Venite University in bringing StudyForge to life. His vision was simple — give students a tool worthy of their ambitions.
                            </p>

                            {/* Stat pills */}
                            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                                <span className="px-4 py-2 bg-[#ea580c]/10 border border-[#ea580c]/20 rounded-full text-sm font-bold text-[#ea580c]">
                                    1 Vision
                                </span>
                                <span className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm font-bold text-blue-400">
                                    1 University
                                </span>
                                <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm font-bold text-purple-400">
                                    Countless Students Impacted
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ═══════════════════════════════════════════
          4. MEET THE TEAM — "The Builders"
          ═══════════════════════════════════════════ */}
            <Section className="px-6 py-20 md:py-28 max-w-7xl mx-auto w-full">
                <div className="text-center mb-14">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">The Builders</h2>
                    <p className="text-slate-400 max-w-xl mx-auto text-[15px]">
                        The Programming Entrepreneurship students of Venite University who designed, coded, and shipped StudyForge.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {teamMembers.map((member, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{ y: -6, boxShadow: '0 12px 40px rgba(59,130,246,0.15)' }}
                            className="bg-[#1b1b27] rounded-2xl border border-[#2d2d3f] p-6 flex flex-col items-center text-center transition-all cursor-default"
                        >
                            {/* TEAM MEMBER PHOTO - replace src with actual image path e.g. src="/images/member1.jpg" - recommended size: 200x200px, square crop */}
                            <div className="size-24 rounded-full ring-[3px] ring-blue-500/30 p-0.5 bg-[#252535] mb-5 overflow-hidden">
                                <Image
                                    src="/images/placeholder-avatar.png"
                                    alt={member.name}
                                    width={96}
                                    height={96}
                                    className="rounded-full object-cover w-full h-full"
                                />
                            </div>

                            <h3 className="font-bold text-white text-[15px]">{member.name}</h3>
                            <span className="inline-block mt-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                                {member.role}
                            </span>
                            <p className="mt-4 text-slate-500 text-sm italic">&ldquo;{member.quote}&rdquo;</p>
                        </motion.div>
                    ))}
                </div>
            </Section>

            {/* ═══════════════════════════════════════════
          5. OUR MISSION
          ═══════════════════════════════════════════ */}
            <Section className="px-6 py-20 md:py-28">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center mb-14">Our Mission</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                emoji: '🎯',
                                title: 'Make Studying Engaging',
                                desc: 'We gamify learning so students actually want to open their books.',
                            },
                            {
                                emoji: '🤖',
                                title: 'Harness AI for Every Student',
                                desc: 'Powerful AI tools that were once only available to the privileged, now free for every student.',
                            },
                            {
                                emoji: '🤝',
                                title: 'Build a Student Community',
                                desc: 'A shared knowledge base where students help each other succeed.',
                            },
                        ].map((pillar, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.12 }}
                                className="bg-[#1b1b27] rounded-2xl border border-[#2d2d3f] p-8 text-center hover:border-[#ea580c]/30 transition-colors"
                            >
                                <div className="text-5xl mb-5">{pillar.emoji}</div>
                                <h3 className="text-lg font-bold mb-3">{pillar.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{pillar.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ═══════════════════════════════════════════
          6. UNIVERSITY BADGE
          ═══════════════════════════════════════════ */}
            <Section className="px-6 py-20 md:py-24 text-center">
                <div className="max-w-2xl mx-auto">
                    <span className="material-symbols-outlined text-5xl text-[#ea580c]/40 mb-4 block">account_balance</span>
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#3b3b54]" />
                        <span className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Official Product</span>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#3b3b54]" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                        Venite University
                    </h2>
                    <p className="text-slate-400 text-[15px] leading-relaxed max-w-lg mx-auto">
                        A product of the Programming Entrepreneurship Department, Venite University.
                    </p>
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <div className="h-px flex-1 max-w-24 bg-[#2d2d3f]" />
                        <span className="material-symbols-outlined text-[#ea580c]/20 text-3xl">verified</span>
                        <div className="h-px flex-1 max-w-24 bg-[#2d2d3f]" />
                    </div>
                </div>
            </Section>

            {/* ═══════════════════════════════════════════
          7. CALL TO ACTION
          ═══════════════════════════════════════════ */}
            <Section className="mt-auto">
                <div className="bg-gradient-to-r from-[#ea580c] to-blue-600 py-20 md:py-28 px-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] pointer-events-none" />

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                            Ready to Study Smarter?
                        </h2>
                        <p className="text-white/80 text-lg mb-10">
                            Join thousands of students already using StudyForge to ace their exams.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/signup">
                                <button className="h-14 px-10 rounded-xl bg-white text-[#ea580c] font-black text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                                    Get Started Free
                                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                                </button>
                            </Link>
                            <Link href="/dashboard">
                                <button className="h-14 px-10 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-lg hover:bg-white/20 hover:scale-105 transition-all flex items-center gap-2 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-xl">explore</span>
                                    Explore the App
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ─── FOOTER ─── */}
            <footer className="bg-[#0c0c1a] border-t border-[#2d2d3f] py-8 px-6 text-center">
                <p className="text-sm text-slate-500">
                    © {new Date().getFullYear()} StudyForge · Built with ❤️ at Venite University
                </p>
            </footer>
        </div>
    );
}
