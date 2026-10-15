import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) {
    return NextResponse.json({ error: 'Server admin API is not configured. Add SUPABASE_SERVICE_ROLE_KEY as a server-only environment variable.' }, { status: 503 });
  }
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const authClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
  const adminClient = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: actor, error: actorError } = await adminClient.from('profiles').select('role,is_active').eq('id', authData.user.id).maybeSingle();
  if (actorError || actor?.role !== 'admin' || actor?.is_active !== true) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const { id } = await context.params;
  if (id === authData.user.id) return NextResponse.json({ error: 'You cannot delete your own admin account.' }, { status: 400 });
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) {
    // Preserve order history when foreign-key restrictions prevent hard deletion.
    const { data: target } = await adminClient.from('profiles').select('id,email').eq('id', id).maybeSingle();
    if (!target) return NextResponse.json({ error: error.message }, { status: 400 });
    const anonymizedEmail = 'deleted+' + id + '@deleted.invalid';
    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(id, { email: anonymizedEmail, ban_duration: '876000h', user_metadata: { deleted: true } });
    const { error: profileError } = await adminClient.from('profiles').update({ full_name: 'Deleted user', email: anonymizedEmail, phone: null, gender: null, university: null, major: null, academic_year: null, governorate: null, date_of_birth: null, avatar_path: null, is_active: false, role: 'student' }).eq('id', id);
    if (authUpdateError || profileError) return NextResponse.json({ error: authUpdateError?.message || profileError?.message || error.message }, { status: 400 });
    return NextResponse.json({ success: true, message: 'Order history was retained; the account was banned and personal profile details were anonymized.' });
  }
  return NextResponse.json({ success: true, message: 'User account deleted.' });
}
