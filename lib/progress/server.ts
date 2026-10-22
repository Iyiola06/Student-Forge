/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Records that the student studied today (keeps the streak honest) and optionally
 * adds newly mastered cards. Never throws: progress tracking must not break studying.
 */
export async function recordStudyActivity(supabase: any, userId: string, cardsMasteredDelta = 0) {
  try {
    const { error } = await supabase.rpc('record_study_activity', {
      p_user_id: userId,
      p_cards_mastered_delta: cardsMasteredDelta,
    });
    if (error) console.warn('[progress] record_study_activity failed', error.message);
  } catch (error) {
    console.warn('[progress] record_study_activity failed', error);
  }
}

export async function awardXp(supabase: any, userId: string, amount: number, source: string) {
  if (!amount || amount <= 0) return;
  try {
    const { error } = await supabase.rpc('award_xp', { p_user_id: userId, p_xp_to_add: Math.round(amount), p_source: source });
    if (error) console.warn('[progress] award_xp failed', error.message);
  } catch (error) {
    console.warn('[progress] award_xp failed', error);
  }
}
