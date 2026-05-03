import { supabase } from '@/lib/supabaseClient';

export async function signInAnonymouslyAndEnsureProfile() {
  const existing = await supabase.auth.getUser();

  if (existing.data.user) {
    return existing.data.user;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) throw error;
  if (!data.user) throw new Error('Anonymous sign-in failed');

  const user = data.user;

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    role: 'user',
    is_anonymous: true,
    display_name: 'Emergency User',
    onboarding_completed: false,
  });

  if (profileError) throw profileError;

  return user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}