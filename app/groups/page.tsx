'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import AppShell from '@/components/layout/AppShell';
import AppEmptyState from '@/components/app/AppEmptyState';
import Icon3D from '@/components/ui/Icon3D';
import { createClient } from '@/lib/supabase/client';

type GroupRow = { id: string; name: string; description: string | null; invite_code: string; owner_id: string };

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Array<GroupRow & { members: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('study_group_members')
        .select('study_groups(id,name,description,invite_code,owner_id,study_group_members(count))')
        .eq('user_id', user.id);
      if (error) toast.error('Study groups are not set up yet. Run the latest database migration.');
      setGroups(
        (data ?? []).flatMap((row: any) => {
          const g = Array.isArray(row.study_groups) ? row.study_groups[0] : row.study_groups;
          return g ? [{ ...g, members: g.study_group_members?.[0]?.count ?? 1 }] : [];
        })
      );
      setLoading(false);
    })();
  }, []);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) return;
    setBusy(true);
    const { data, error } = await createClient().rpc('create_study_group', { p_name: name.trim(), p_description: description.trim() || null });
    setBusy(false);
    if (error || !data) return toast.error(error?.message || 'Could not create the group');
    router.push(`/groups/${data}`);
  };

  const join = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    const { data, error } = await createClient().rpc('join_study_group', { p_invite_code: code.trim() });
    setBusy(false);
    if (error || !data) return toast.error(error?.message || 'Invite code not found');
    router.push(`/groups/${data}`);
  };

  return (
    <AppShell eyebrow="Community" title="Study groups" description="Study with classmates: share decks, compare progress and keep each other consistent.">
      <div className="workspace-stack">
        <section className="grid gap-5 lg:grid-cols-2">
          <form onSubmit={create} className="glass-panel app-panel pastel-sky">
            <Icon3D name="clapping" size={48} />
            <h2 className="panel-title mt-3">Start a group</h2>
            <p className="mt-1 text-sm text-[var(--text-soft)]">For your class, study circle or exam squad. You get an invite code to share.</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name, e.g. SS3 Science Squad"
              maxLength={80}
              className="mt-4 h-11 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--card)] px-4 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--accent)]"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you preparing for? (optional)"
              className="mt-2 h-11 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--card)] px-4 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--accent)]"
            />
            <button disabled={busy || name.trim().length < 2} className="primary-button mt-4">
              Create group
            </button>
          </form>

          <form onSubmit={join} className="glass-panel app-panel pastel-mint">
            <Icon3D name="key" size={48} />
            <h2 className="panel-title mt-3">Join with a code</h2>
            <p className="mt-1 text-sm text-[var(--text-soft)]">Ask a classmate for their group&rsquo;s 8-character invite code.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7F3A9C21"
              maxLength={12}
              className="mt-4 h-11 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--card)] px-4 font-mono text-sm tracking-[0.2em] text-[var(--text-strong)] uppercase outline-none focus:border-[var(--accent)]"
            />
            <button disabled={busy || !code.trim()} className="primary-button mt-4">
              Join group
            </button>
          </form>
        </section>

        <section>
          <p className="eyebrow">Your groups</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <div className="h-28 animate-pulse rounded-[24px] bg-[var(--card-2)]" />
            ) : groups.length ? (
              groups.map((g) => (
                <Link key={g.id} href={`/groups/${g.id}`} className="lift rounded-[24px] border border-[var(--line)] bg-[var(--card)] p-4">
                  <div className="flex items-center gap-3">
                    <span className="icon-tile size-12">
                      <Icon3D name="books" size={28} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-[16px] font-semibold text-[var(--text-strong)]">{g.name}</p>
                      <p className="text-[12.5px] text-[var(--text-soft)]">
                        {g.members} member{g.members === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  {g.description ? <p className="mt-3 line-clamp-2 text-[13px] text-[var(--text-soft)]">{g.description}</p> : null}
                </Link>
              ))
            ) : (
              <div className="sm:col-span-2 xl:col-span-3">
                <AppEmptyState icon="clapping" title="No groups yet" description="Create one for your class or join a friend with their invite code." />
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
