'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, BookOpen, Clock3, Save, UserRound, ExternalLink } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { publicImage, money } from '@/lib/utils';
import { useApp } from '@/components/Providers';

export default function ProfilePage() {
  const { user, profile, loading, lang, t, toast, refreshProfile } = useApp();
  const [form, setForm] = useState<any>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const sb = supabaseBrowser();
      const [p, o, e] = await Promise.all([
        sb.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        sb.from('cliq_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        sb.from('enrollments').select('*, courses(*)').eq('user_id', user.id)
      ]);
      if (!active) return;
      if (p.data) setForm(p.data);
      if (o.error) toast(o.error.message, 'error');
      setOrders(o.data || []);
      setEnrollments(e.data || []);
      setReady(true);
    })();
    return () => { active = false; };
  }, [user, toast]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const fields = ['full_name', 'phone', 'gender', 'university', 'major', 'academic_year', 'governorate', 'date_of_birth'];
    const payload: any = {};
    fields.forEach(k => payload[k] = form[k] || null);
    const { error } = await supabaseBrowser().from('profiles').update(payload).eq('id', user.id);
    setBusy(false);
    if (error) toast(error.message, 'error');
    else {
      toast(t('تم حفظ الملف الشخصي', 'Profile saved'), 'success');
      await refreshProfile();
    }
  }

  async function avatar(file?: File) {
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast(t('اختر ملف صورة', 'Choose an image file'), 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast(t('حجم الصورة يجب ألا يتجاوز 5 ميغابايت', 'Image must be under 5 MB'), 'error');
      return;
    }
    setAvatarBusy(true);
    const sb = supabaseBrowser();
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const up = await sb.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (up.error) {
      toast(up.error.message, 'error');
      setAvatarBusy(false);
      return;
    }
    sb.storage.from('avatars').getPublicUrl(path);
    const { error } = await sb.from('profiles').update({ avatar_path: path }).eq('id', user.id);
    setAvatarBusy(false);
    if (error) toast(error.message, 'error');
    else {
      set('avatar_path', path);
      toast(t('تم تحديث الصورة', 'Avatar updated'), 'success');
      await refreshProfile();
    }
  }

  // 1. نفحص إذا السستم الأساسي لسه بحمل الجلسة
  if (loading) {
    return <div className="container loading-page"><div className="spinner" /></div>;
  }

  // 2. إذا خلص تحميل وما في مستخدم، فوراً بنطلعله شاشة "سجل الدخول" بدون ما نعلق على ready
  if (!user) {
    return (
      <div className="container section">
        <div className="empty-state">
          <UserRound size={30} />
          <h3>{t('سجّل الدخول لعرض ملفك الشخصي', 'Sign in to view your profile')}</h3>
          <Link className="btn btn-primary" href="/login">{t('تسجيل الدخول', 'Sign in')}</Link>
        </div>
      </div>
    );
  }

  // 3. إذا المستخدم مسجل دخول، بس لسه بنجيب بياناته من الداتا بيس
  if (!ready) {
    return <div className="container loading-page"><div className="spinner" /></div>;
  }

  return (
    <div className="container section">
      <div className="page-hero">
        <div className="eyebrow">{t('حسابك', 'Your account')}</div>
        <h1>{t('الملف الشخصي', 'Profile')}</h1>
        <p>{t('حدّث بياناتك وراجع الكورسات وطلبات الدفع.', 'Update your details and review your courses and payment requests.')}</p>
      </div>

      <div className="profile-head">
        <div className="avatar-large">
          {form.avatar_path && publicImage(form.avatar_path, 'avatars') ? (
            <img src={publicImage(form.avatar_path, 'avatars')} alt="Avatar" />
          ) : (
            <span>{(form.full_name || user.email || 'D').slice(0, 1).toUpperCase()}</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 4px' }}>{form.full_name || t('طالب Dentify', 'Dentify learner')}</h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>{user.email}</p>
          <label className="btn btn-outline" style={{ marginTop: 10, cursor: 'pointer' }}>
            <Camera size={15} />
            {avatarBusy ? t('جارٍ الرفع...', 'Uploading...') : t('تغيير الصورة', 'Change avatar')}
            <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e => void avatar(e.target.files?.[0])} />
          </label>
        </div>
        <span className={`status ${form.is_active === false ? 'status-inactive' : 'status-active'}`}>
          {form.is_active === false ? t('موقوف', 'Suspended') : t('نشط', 'Active')}
        </span>
      </div>

      <div className="split">
        <section className="panel">
          <h2>{t('بيانات الحساب', 'Account details')}</h2>
          <form onSubmit={save}>
            <div className="form-grid">
              <div className="field full">
                <label>{t('الاسم الكامل', 'Full name')}</label>
                <input required value={form.full_name || ''} onChange={e => set('full_name', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('البريد الإلكتروني', 'Email')}</label>
                <input disabled value={user.email || ''} />
              </div>
              <div className="field">
                <label>{t('رقم الهاتف', 'Phone')}</label>
                <input value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('الجنس', 'Gender')}</label>
                <select value={form.gender || 'prefer_not_to_say'} onChange={e => set('gender', e.target.value)}>
                  <option value="male">{t('ذكر', 'Male')}</option>
                  <option value="female">{t('أنثى', 'Female')}</option>
                  <option value="prefer_not_to_say">{t('أفضل عدم الإفصاح', 'Prefer not to say')}</option>
                </select>
              </div>
              <div className="field">
                <label>{t('الجامعة', 'University')}</label>
                <input value={form.university || ''} onChange={e => set('university', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('التخصص', 'Major')}</label>
                <input value={form.major || ''} onChange={e => set('major', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('السنة الدراسية', 'Academic year')}</label>
                <select value={form.academic_year || 'other'} onChange={e => set('academic_year', e.target.value)}>
                  {[['first', 'First year'], ['second', 'Second year'], ['third', 'Third year'], ['fourth', 'Fourth year'], ['graduate', 'Graduate'], ['school', 'High school'], ['other', 'Other']].map(([v, l]) => (
                    <option value={v} key={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t('المحافظة', 'Governorate')}</label>
                <input value={form.governorate || ''} onChange={e => set('governorate', e.target.value)} />
              </div>
              <div className="field">
                <label>{t('تاريخ الميلاد', 'Date of birth')}</label>
                <input type="date" value={form.date_of_birth || ''} onChange={e => set('date_of_birth', e.target.value)} />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 18 }}>
              <Save size={16} />
              {busy ? t('جارٍ الحفظ...', 'Saving...') : t('حفظ التغييرات', 'Save changes')}
            </button>
          </form>
        </section>

        <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
          <section className="panel">
            <div className="section-head" style={{ marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 19, margin: 0 }}>{t('كورساتي', 'My courses')}</h2>
                <p>{enrollments.length} {t('كورس', 'courses')}</p>
              </div>
              <BookOpen color="var(--primary)" />
            </div>
            {enrollments.length ? enrollments.map(e => {
              const c = e.courses || {};
              return (
                <div className="lesson-row" key={e.id}>
                  <span className="lesson-icon"><BookOpen size={17} /></span>
                  <div className="lesson-row-main">
                    <b>{lang === 'ar' ? (c.title_ar || c.title_en) : (c.title_en || c.title_ar)}</b>
                    <small>{t('مسجّل في مكتبتك', 'In your library')}</small>
                  </div>
                  <Link className="icon-button" href={`/learn/${c.id}`} aria-label="Open course">
                    <ExternalLink size={15} />
                  </Link>
                </div>
              );
            }) : (
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                {t('لم تشترك بأي كورس بعد.', 'You have not enrolled in a course yet.')}{' '}
                <Link href="/#courses" style={{ color: 'var(--primary)', fontWeight: 800 }}>
                  {t('استكشف الكورسات', 'Explore courses')}
                </Link>
              </p>
            )}
          </section>

          <section className="panel">
            <div className="section-head" style={{ marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 19, margin: 0 }}>{t('طلبات الدفع', 'Payment history')}</h2>
                <p>{t('متابعة طلبات CliQ', 'Track your CliQ orders')}</p>
              </div>
              <Clock3 color="var(--primary)" />
            </div>
            {orders.length ? orders.map(o => (
              <div className="admin-row" key={o.id}>
                <div>
                  <strong>{money(o.amount_jod)}</strong>
                  <small>{new Date(o.created_at).toLocaleDateString()}</small>
                  <small>Ref: {o.transfer_reference || '—'}</small>
                </div>
                <span className={`status status-${o.status}`}>{o.status}</span>
              </div>
            )) : (
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                {t('لا توجد طلبات دفع حتى الآن.', 'No payment orders yet.')}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}