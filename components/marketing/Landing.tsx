import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import Icon3D, { type Icon3DName } from '@/components/ui/Icon3D';
import { examNames, faqs, loopSteps, pillars, toolCards } from '@/components/marketing/home-content';
import type { CreditBundle } from '@/lib/billing/config';
import { formatNairaFromKobo } from '@/lib/billing/config';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Shared bits                                                          */
/* ------------------------------------------------------------------ */

function Figure({
  name,
  className,
  style,
  priority,
}: {
  name: Icon3DName;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
}) {
  return (
    <Image
      src={`/3d/${name}.png`}
      alt=""
      aria-hidden
      width={256}
      height={256}
      priority={priority}
      sizes="(max-width: 768px) 30vw, 240px"
      className={cn('icon-3d absolute h-auto', className)}
      style={style}
    />
  );
}

function SectionIntro({ kicker, title, body, tone }: { kicker: string; title: React.ReactNode; body?: string; tone?: string }) {
  return (
    <div className="mx-auto max-w-[720px] text-center">
      <p className="text-[13px] text-[var(--text-soft)]">{kicker}</p>
      <h2 className="display-lg mt-3 text-balance text-[var(--text-strong)]">
        <span className="torn-mark" data-tone={tone}>
          {title}
        </span>
      </h2>
      {body ? <p className="mx-auto mt-5 max-w-[56ch] text-[15px] leading-7 text-[var(--text-soft)]">{body}</p> : null}
    </div>
  );
}

function AvatarStack({ size = 26 }: { size?: number }) {
  const people: Icon3DName[] = ['woman-student', 'student-3', 'man-student-2'];
  return (
    <span className="inline-flex -space-x-2 align-middle">
      {people.map((p, i) => (
        <span
          key={p}
          className="inline-flex items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#dfeffd] dark:border-[#0f192c]"
          style={{ width: size, height: size, zIndex: 3 - i }}
        >
          <Image src={`/3d/${p}.png`} alt="" width={size * 2} height={size * 2} className="mt-[30%] scale-[1.35]" />
        </span>
      ))}
    </span>
  );
}

function FloatingChip({ icon, title, meta, className }: { icon: Icon3DName; title: string; meta: string; className?: string }) {
  return (
    <div
      className={cn(
        'absolute z-20 flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/90 py-2 pr-4 pl-2 shadow-[0_18px_40px_rgba(30,64,120,0.18)] backdrop-blur-md dark:border-white/10 dark:bg-[#0f192c]/85',
        className
      )}
    >
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#eaf4fe] dark:bg-white/5">
        <Icon3D name={icon} size={28} />
      </span>
      <span className="leading-tight">
        <span className="block text-[13px] font-semibold text-[var(--text-strong)]">{title}</span>
        <span className="block text-[11.5px] text-[var(--text-soft)]">{meta}</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                 */
/* ------------------------------------------------------------------ */

const crowdBack: Array<{ name: Icon3DName; left: string; width: string }> = [
  { name: 'student-2', left: '13%', width: '14%' },
  { name: 'woman-student-2', left: '29%', width: '13.5%' },
  { name: 'man-student', left: '45.5%', width: '13%' },
  { name: 'woman-student-4', left: '61%', width: '13.5%' },
  { name: 'student-3', left: '75.5%', width: '14%' },
];

const crowdFront: Array<{ name: Icon3DName; left: string; width: string; z?: number }> = [
  { name: 'woman-hand', left: '-1%', width: '22%' },
  { name: 'man-student-3', left: '17.5%', width: '22%', z: 2 },
  { name: 'woman-student', left: '38%', width: '25%', z: 3 },
  { name: 'student-1', left: '60%', width: '22%', z: 2 },
  { name: 'man-hand', left: '79%', width: '22%' },
];

const tossedCaps: Array<{ left: string; top: string; width: string; rotate: number; delay: string }> = [
  { left: '8%', top: '6%', width: '7%', rotate: -18, delay: '0s' },
  { left: '27%', top: '-4%', width: '5.5%', rotate: 14, delay: '1.2s' },
  { left: '70%', top: '-2%', width: '6%', rotate: -10, delay: '0.6s' },
  { left: '88%', top: '8%', width: '7.5%', rotate: 20, delay: '1.8s' },
];

export function Hero() {
  return (
    <section className="sky-bg relative overflow-hidden pt-28 sm:pt-36">
      <div className="relative z-10 mx-auto max-w-[920px] px-5 text-center">
        <span className="eyebrow-pill animate-rise">
          <AvatarStack size={22} />
          Built for students preparing for real exams
        </span>
        <h1 className="display-xl mt-6 text-balance text-[#0b1220] animate-rise [animation-delay:80ms] dark:text-white">
          Learn Smarter. Remember Longer. Ace Every Exam.
        </h1>
        <p className="mx-auto mt-6 max-w-[560px] text-[15.5px] leading-7 text-[#3d4657] animate-rise [animation-delay:160ms] dark:text-[#c9d3e3]">
          Upload your notes, slides or scanned handouts. Studify turns them into quizzes, flashcards and a daily review plan
          that keeps every topic fresh until exam day.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-rise [animation-delay:240ms]">
          <Link href="/signup" className="primary-button !h-12 !px-7 !text-[15px]">
            Start studying free
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-white/70 px-6 text-[15px] font-medium text-[#0b1220] backdrop-blur-md transition hover:bg-white dark:bg-white/10 dark:text-white"
          >
            See how it works
          </Link>
        </div>
      </div>

      {/* Graduation-day crowd */}
      <div className="relative mt-8 aspect-[1200/500] w-[170%] max-w-[1240px] -translate-x-[20.6%] sm:mx-auto sm:-mt-6 sm:w-full sm:translate-x-0">
        {tossedCaps.map((cap, i) => (
          <Figure
            key={i}
            name="grad-cap"
            className="animate-float"
            style={{ left: cap.left, top: cap.top, width: cap.width, rotate: `${cap.rotate}deg`, animationDelay: cap.delay }}
          />
        ))}
        <Figure name="sparkles" className="animate-float" style={{ left: '50%', top: '0%', width: '5%', animationDelay: '0.4s' }} />
        <Figure name="party" className="animate-float" style={{ left: '93%', top: '34%', width: '5%', animationDelay: '1s' }} />

        {crowdBack.map((p) => (
          <Figure key={p.name} name={p.name} priority style={{ left: p.left, width: p.width, bottom: '30%', zIndex: 1 }} />
        ))}
        {crowdFront.map((p) => (
          <Figure key={p.name} name={p.name} priority style={{ left: p.left, width: p.width, bottom: '-9%', zIndex: p.z ?? 1 }} />
        ))}

        <FloatingChip icon="target" title="Quiz ready" meta="12 questions from Biology ch. 4" className="top-[24%] left-[3%] hidden md:flex animate-float [animation-delay:0.5s]" />
        <FloatingChip icon="fire" title="7-day streak" meta="Keep it going today" className="top-[12%] right-[6%] hidden md:flex animate-float [animation-delay:1.4s]" />
        <FloatingChip icon="chart-up" title="Mastery 82%" meta="Organic chemistry" className="top-[40%] right-[0%] hidden xl:flex animate-float [animation-delay:2.1s]" />

      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-white to-transparent dark:from-[#070d1a]" />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Exam strip                                                           */
/* ------------------------------------------------------------------ */

export function ExamStrip() {
  const items = [...examNames, ...examNames];
  return (
    <section className="bg-white py-12 dark:bg-[#070d1a]">
      <p className="text-center text-[15px] text-[var(--text-body)]">Made for every exam that matters</p>
      <div className="fade-edges mt-7 overflow-hidden">
        <div className="marquee gap-14 pr-14">
          {items.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="font-display text-[26px] font-semibold tracking-[-0.03em] whitespace-nowrap text-[#b4c0cf] transition hover:text-[#4a9be8] dark:text-[#2c3c57]"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Statement                                                            */
/* ------------------------------------------------------------------ */

function InlineIcon({ name }: { name: Icon3DName }) {
  return (
    <span className="mx-1 inline-flex translate-y-[0.08em] align-baseline">
      <Image src={`/3d/${name}.png`} alt="" width={96} height={96} className="icon-3d inline-block size-[0.95em]" />
    </span>
  );
}

export function Statement() {
  return (
    <section className="bg-white px-5 pt-10 pb-24 dark:bg-[#070d1a]">
      <div className="mx-auto max-w-[1120px]">
        <p className="mx-auto max-w-[980px] text-center font-display text-[32px] leading-[1.22] font-semibold tracking-[-0.025em] text-balance text-[var(--text-strong)] sm:text-[46px] lg:text-[56px]">
          <span className="mr-1 align-top font-serif text-[0.8em] text-[#c3cdd9]">&ldquo;</span>
          A study partner that <AvatarStack size={44} /> helps curious <InlineIcon name="sparkles" /> minds learn faster,
          remember longer and <InlineIcon name="thumbs-up" /> ace every exam
        </p>

        <div className="mt-20 grid items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
            {[
              { value: '60s', label: 'Upload to first quiz', body: 'Drop in a chapter and start practising while it is still fresh.' },
              { value: '5 min', label: 'Daily review', body: 'Spaced repetition keeps old topics alive with tiny sessions.' },
              { value: '11', label: 'Free AI models', body: 'If one is busy, the next answers. Your study session never stalls.' },
            ].map((stat) => (
              <div key={stat.label} className="grid grid-cols-[110px_1fr] items-start gap-4 border-b border-[var(--line)] pb-6 last:border-0">
                <div>
                  <p className="font-display text-[34px] font-semibold leading-none tracking-[-0.03em] text-[var(--text-strong)]">{stat.value}</p>
                  <p className="mt-2 text-[12px] text-[var(--text-soft)]">{stat.label}</p>
                </div>
                <p className="pt-1 text-[14px] leading-6 text-[var(--text-soft)]">{stat.body}</p>
              </div>
            ))}
          </div>

          <div className="relative grid items-end gap-6 sm:grid-cols-[1fr_1fr]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] sky-bg">
              <Figure name="woman-tech" priority className="bottom-[4%] left-1/2 w-[82%] -translate-x-1/2" />
              <Figure name="rocket" className="animate-float top-[8%] right-[8%] w-[22%]" />
              <Figure name="books" className="bottom-[6%] left-[4%] w-[26%]" />
            </div>
            <div className="space-y-5 pb-2">
              <Icon3D name="bulb" size={52} />
              <p className="text-[15px] leading-7 text-[var(--text-body)]">
                Practise with questions written from your own notes, so every minute you spend is on the syllabus you will
                actually be tested on.
              </p>
              <p className="text-[15px] leading-7 text-[var(--text-body)]">
                Then let the review queue do the remembering for you. It brings each idea back just before it fades.
              </p>
              <Link href="/signup" className="primary-button !h-10">
                Join now
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pillars + hill                                                        */
/* ------------------------------------------------------------------ */

export function Pillars() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#070d1a]">
      <div className="relative px-5 pt-10">
        <SectionIntro
          kicker="Why does it matter?"
          title="Study Built for Real Results"
          body="Re-reading feels productive but fades in days. Studify is built on active recall and spaced repetition, the two study habits research keeps proving work."
        />

        <div className="relative z-10 mx-auto mt-14 grid max-w-[1120px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <div key={p.title} className="lift group rounded-[28px] border border-[var(--line)] bg-[var(--card)] p-2 shadow-[var(--shadow-sm)]">
              <div className="px-3 pt-3">
                <p className="text-[11.5px] text-[var(--text-soft)]">{p.kicker}</p>
                <h3 className="mt-1 font-display text-[19px] font-semibold tracking-[-0.02em] text-[var(--text-strong)]">{p.title}</h3>
              </div>
              <div className={cn('relative mt-3 aspect-[5/4] overflow-hidden rounded-[22px]', p.tone)}>
                <Figure name={p.icons[0]} className="left-[6%] bottom-[10%] w-[44%] transition duration-500 group-hover:-translate-y-1 group-hover:-rotate-3" />
                <Figure name={p.icons[1]} className="right-[6%] bottom-[18%] w-[46%] transition duration-500 group-hover:-translate-y-2" />
                <Figure name={p.icons[2]} className="animate-float top-[8%] right-[30%] w-[24%]" />
              </div>
              <p className="px-3 pt-4 pb-3 text-[13.5px] leading-6 text-[var(--text-soft)]">{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grassy hill */}
      <div className="relative -mt-16 h-[340px] sm:h-[400px]">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#e3f1fd] to-[#cfe6fb] dark:from-[#070d1a] dark:via-[#0b1830] dark:to-[#10264a]" />
        <Image src="/textures/cloud-a.svg" alt="" width={440} height={200} className="cloud-float top-[20%] left-[6%] w-[300px] opacity-90" />
        <Image src="/textures/cloud-b.svg" alt="" width={330} height={150} className="cloud-float top-[34%] right-[30%] w-[220px] opacity-80 [animation-delay:3s]" />
        <div
          className="absolute -bottom-[60%] left-1/2 h-[110%] w-[150%] -translate-x-1/2 rounded-[50%]"
          style={{
            background:
              'radial-gradient(2px 2px at 20% 18%, #fff 60%, transparent 61%), radial-gradient(2px 2px at 34% 10%, #fff 60%, transparent 61%), radial-gradient(2px 2px at 48% 22%, #fff 60%, transparent 61%), radial-gradient(2px 2px at 62% 12%, #fff 60%, transparent 61%), radial-gradient(2px 2px at 76% 20%, #fff 60%, transparent 61%), radial-gradient(1.6px 1.6px at 28% 26%, #fff 60%, transparent 61%), radial-gradient(1.6px 1.6px at 56% 30%, #fff 60%, transparent 61%), radial-gradient(1.6px 1.6px at 70% 28%, #fff 60%, transparent 61%), radial-gradient(ellipse at 50% 0%, #8fd35a 0%, #5fb13d 38%, #3f8f2c 70%)',
            boxShadow: 'inset 0 18px 40px rgba(255,255,255,0.35)',
          }}
        />
        <div className="absolute right-[8%] -bottom-[6px] w-[150px] sm:right-[14%] sm:w-[210px]">
          <Image src="/3d/man-tipping.png" alt="" width={256} height={256} className="icon-3d h-auto w-full" />
          <Link href="/signup" className="primary-button absolute top-[14%] -left-[78%] !h-9 !px-4 !text-[12.5px] sm:-left-[62%]">
            Start learning
          </Link>
        </div>
        <div className="absolute bottom-[10%] left-[10%] w-[90px] sm:w-[120px]">
          <Image src="/3d/seedling.png" alt="" width={256} height={256} className="icon-3d h-auto w-full" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Study loop                                                            */
/* ------------------------------------------------------------------ */

export function StudyLoop() {
  return (
    <section id="how-it-works" className="scroll-mt-28 bg-[#3f8f2c]/0 px-5 py-24 dark:bg-[#070d1a]">
      <SectionIntro kicker="How it works" title="From Notes to Mastery in Four Steps" tone="mint" />
      <div className="relative mx-auto mt-16 grid max-w-[1120px] gap-5 md:grid-cols-4">
        <div className="absolute top-[52px] right-[12%] left-[12%] hidden border-t-2 border-dashed border-[#bcd7f2] md:block dark:border-[#1d2a42]" />
        {loopSteps.map((s) => (
          <div key={s.step} className="relative text-center">
            <div className="relative mx-auto flex size-[104px] items-center justify-center rounded-full border border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow-md)]">
              <Icon3D name={s.icon} size={58} />
              <span className="absolute -top-1 -right-1 inline-flex size-8 items-center justify-center rounded-full bg-[var(--action)] text-[11px] font-semibold text-[var(--action-ink)]">
                {s.step}
              </span>
            </div>
            <h3 className="mt-6 font-display text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-strong)]">{s.title}</h3>
            <p className="mx-auto mt-2 max-w-[30ch] text-[14px] leading-6 text-[var(--text-soft)]">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Tools                                                                 */
/* ------------------------------------------------------------------ */

export function Tools() {
  return (
    <section id="tools" className="scroll-mt-28 bg-gradient-to-b from-white to-[#eef7ff] px-5 py-24 dark:from-[#070d1a] dark:to-[#0b1830]">
      <SectionIntro
        kicker="Our tools"
        title="Tools That Matter in the Real Exam"
        body="From the first read to the night before the paper, every tool is built around how memory actually works."
      />

      <div className="mx-auto mt-14 grid max-w-[1180px] gap-6 md:grid-cols-2 lg:grid-cols-3">
        {toolCards.map((tool) => (
          <article
            key={tool.title}
            className={cn('lift group flex flex-col overflow-hidden rounded-[32px] border border-[var(--line)] shadow-[var(--shadow-sm)]', tool.tone)}
          >
            <div className="relative aspect-[16/10]">
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                {tool.tags.map((t) => (
                  <span key={t} className="pill-tag">
                    {t}
                  </span>
                ))}
              </div>
              <Figure name={tool.icons[0]} className="top-[18%] left-1/2 w-[40%] -translate-x-1/2 transition duration-500 group-hover:-translate-y-2 group-hover:scale-105" />
              <Figure name={tool.icons[1]} className="bottom-[4%] left-[12%] w-[22%] transition duration-500 group-hover:-rotate-6" />
              <Figure name={tool.icons[2]} className="animate-float right-[12%] bottom-[14%] w-[20%]" />
            </div>
            <div className="flex flex-1 flex-col px-6 pt-2 pb-6">
              <h3 className="font-display text-[23px] font-semibold tracking-[-0.02em] text-[var(--text-strong)]">{tool.title}</h3>
              <p className="mt-2 text-[14px] leading-6 text-[var(--text-soft)]">{tool.body}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[var(--text-body)]">
                <span className="inline-flex items-center gap-1.5">
                  <Icon3D name="star" size={16} />
                  {tool.meta[0]}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon3D name="stopwatch" size={16} />
                  {tool.meta[1]}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon3D name="medal" size={16} />
                  {tool.meta[2]}
                </span>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-11 items-center justify-center overflow-hidden rounded-full bg-[var(--accent-soft)]">
                    <Image src={`/3d/${tool.guide.icon}.png`} alt="" width={64} height={64} className="mt-2 scale-125" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[14px] font-medium text-[var(--text-strong)]">{tool.guide.name}</span>
                    <span className="block text-[12px] text-[var(--text-soft)]">{tool.guide.role}</span>
                  </span>
                </div>
                <Link href="/signup" className={tool.featured ? 'primary-button !h-10' : 'secondary-button !h-10'}>
                  Try it
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-14 text-center">
        <Link href="/signup" className="primary-button !h-12 !px-7 !text-[15px]">
          Explore all tools
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Mission (cloud section)                                               */
/* ------------------------------------------------------------------ */

export function Mission() {
  return (
    <section className="relative bg-[#eef7ff] dark:bg-[#0b1830]">
      <div aria-hidden className="cloud-edge h-[120px] bg-[#bfe0fa] sm:h-[200px] dark:bg-[#10264a]" />
      <div className="relative -mt-px overflow-hidden bg-[#bfe0fa] pt-6 pb-28 dark:bg-[#10264a]">
        <Image src="/textures/cloud-c.svg" alt="" width={660} height={260} className="cloud-float bottom-0 -left-24 w-[420px] opacity-90" />
        <Image src="/textures/cloud-a.svg" alt="" width={440} height={200} className="cloud-float right-0 bottom-10 w-[320px] opacity-80 [animation-delay:4s]" />
        <div className="relative z-10 mx-auto max-w-[920px] px-5 text-center">
          <p className="text-[15px] text-[#3d5a7a] dark:text-[#9fbfe0]">Our promise</p>
          <p className="mt-5 font-display text-[34px] leading-[1.14] font-semibold tracking-[-0.03em] text-balance text-[#0b1220] sm:text-[52px] dark:text-white">
            <span className="torn-mark" data-tone="white">
              Studify helps you build real understanding,
            </span>{' '}
            not just cram.&rdquo;
          </p>
          <p className="mx-auto mt-6 max-w-[560px] text-[16px] leading-7 text-[#3d5a7a] dark:text-[#9fbfe0]">
            Every feature asks you to think before it tells you the answer. That small struggle is what moves knowledge from
            your notes into your long-term memory.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { icon: 'open-book' as const, t: 'Learn it', b: 'Clear explanations at your level' },
              { icon: 'brain' as const, t: 'Recall it', b: 'Answer first, then check' },
              { icon: 'crown' as const, t: 'Own it', b: 'Spaced reviews make it stick' },
            ].map((x) => (
              <div key={x.t} className="flex items-center gap-3 rounded-[22px] bg-white/80 p-3 text-left backdrop-blur-md dark:bg-white/5">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf4fe] dark:bg-white/5">
                  <Icon3D name={x.icon} size={32} />
                </span>
                <span>
                  <span className="block font-display text-[15px] font-semibold text-[#0b1220] dark:text-white">{x.t}</span>
                  <span className="block text-[12.5px] text-[#5b6476] dark:text-[#9aa7bc]">{x.b}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pricing                                                               */
/* ------------------------------------------------------------------ */

const bundleArt: Array<{ tone: string; icons: [Icon3DName, Icon3DName] }> = [
  { tone: 'pastel-sky', icons: ['coin', 'sparkles'] },
  { tone: 'pastel-mint', icons: ['money-bag', 'rocket'] },
  { tone: 'pastel-lavender', icons: ['gem', 'trophy'] },
];

export function Pricing({ bundles }: { bundles: CreditBundle[] }) {
  return (
    <section id="pricing" className="scroll-mt-28 bg-white px-5 py-24 dark:bg-[#070d1a]">
      <SectionIntro
        kicker="Pricing"
        title="Pay Only When the AI Works for You"
        tone="butter"
        body="Start with free credits. Reviewing your saved cards is always free. Top up only when you want to generate more."
      />
      <div className="mx-auto mt-14 grid max-w-[1060px] gap-6 md:grid-cols-3">
        {bundles.map((bundle, i) => {
          const art = bundleArt[i % bundleArt.length];
          const featured = i === 1;
          return (
            <div
              key={bundle.id}
              className={cn(
                'lift relative flex flex-col overflow-hidden rounded-[32px] border shadow-[var(--shadow-sm)]',
                art.tone,
                featured ? 'border-[#4a9be8]/50 ring-4 ring-[#4a9be8]/10' : 'border-[var(--line)]'
              )}
            >
              <div className="relative h-[150px]">
                {featured ? <span className="pill-tag absolute top-4 left-4">Most popular</span> : null}
                <Figure name={art.icons[0]} className="top-[16%] left-1/2 w-[34%] -translate-x-1/2" />
                <Figure name={art.icons[1]} className="animate-float top-[12%] right-[14%] w-[16%]" />
              </div>
              <div className="flex flex-1 flex-col px-6 pb-6">
                <p className="text-[13px] text-[var(--text-soft)]">{bundle.name}</p>
                <p className="mt-1 font-display text-[38px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                  {formatNairaFromKobo(bundle.amountKobo)}
                </p>
                <p className="text-[14px] font-medium text-[var(--accent)]">{bundle.credits.toLocaleString()} credits</p>
                <p className="mt-3 flex-1 text-[14px] leading-6 text-[var(--text-soft)]">{bundle.tagline}</p>
                <ul className="mt-5 space-y-2 text-[13.5px] text-[var(--text-body)]">
                  {['Quizzes, flashcards and summaries', 'AI tutor and essay grading', 'Free daily review, always'].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={cn('mt-6 w-full', featured ? 'primary-button' : 'secondary-button')}>
                  Get {bundle.name}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ + CTA + footer                                                    */
/* ------------------------------------------------------------------ */

export function Faq() {
  return (
    <section className="bg-white px-5 pb-24 dark:bg-[#070d1a]">
      <div className="mx-auto grid max-w-[1060px] gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-[13px] text-[var(--text-soft)]">Questions</p>
          <h2 className="display-md mt-3 text-[var(--text-strong)]">Everything you need to know</h2>
          <div className="mt-6 inline-flex items-center gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--card-2)] p-3">
            <Icon3D name="thinking" size={40} />
            <p className="text-[13.5px] leading-5 text-[var(--text-soft)]">
              Still curious? <a className="font-medium text-[var(--accent)]" href="mailto:hello@sulvatech.com">Email the team</a>
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-[22px] border border-[var(--line)] bg-[var(--card)] px-5 py-4 shadow-[var(--shadow-sm)] open:shadow-[var(--shadow-md)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[16px] font-medium text-[var(--text-strong)]">
                {f.q}
                <ChevronDown className="size-5 shrink-0 text-[var(--text-soft)] transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-[14.5px] leading-7 text-[var(--text-soft)]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="bg-white px-4 pb-10 dark:bg-[#070d1a]">
      <div className="sky-bg relative mx-auto max-w-[1180px] overflow-hidden rounded-[40px] px-6 py-20 text-center sm:py-24">
        <Figure name="rocket" className="animate-float top-[6%] left-[4%] w-[56px] sm:top-[14%] sm:left-[6%] sm:w-[130px]" />
        <Figure name="trophy" className="animate-float right-[4%] bottom-[4%] w-[56px] [animation-delay:1.5s] sm:right-[6%] sm:bottom-[12%] sm:w-[120px]" />
        <Figure name="grad-cap" className="animate-float top-[5%] right-[8%] w-[48px] [animation-delay:0.8s] sm:top-[10%] sm:right-[14%] sm:w-[80px]" />
        <h2 className="display-lg relative z-10 mx-auto max-w-[16ch] text-balance text-[#0b1220] dark:text-white">Your next A starts with today&rsquo;s notes.</h2>
        <p className="relative z-10 mx-auto mt-5 max-w-[48ch] text-[15.5px] leading-7 text-[#3d4657] dark:text-[#c9d3e3]">
          Create a free account, upload one chapter and take your first quiz in under a minute.
        </p>
        <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="primary-button !h-12 !px-7 !text-[15px]">
            Get started free
          </Link>
          <Link href="/login" className="inline-flex h-12 items-center rounded-full bg-white/75 px-6 text-[15px] font-medium text-[#0b1220] backdrop-blur-md hover:bg-white dark:bg-white/10 dark:text-white">
            I already have an account
          </Link>
        </div>
      </div>
    </section>
  );
}
