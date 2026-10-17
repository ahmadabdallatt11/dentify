'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Mail, Lock, LoaderCircle } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useApp } from '@/components/Providers';

// فصلنا الكود جوا كمبوننت داخلي عشان فيرسل يرضى يغلفه
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get('next') || '/profile';
  const initMode = searchParams?.get('mode') === 'signup' ? 'signup' : 'login';
  
  const { lang, t, user, toast } = useApp();
  
  const [mode, setMode] = useState<'login' | 'signup' | 'recovery'>(initMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const sb = supabaseBrowser();

    if (mode === 'signup') {
      const { error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (error) toast(error.message, 'error');
      else {
        toast(t('تم إنشاء الحساب بنجاح', 'Account created successfully'), 'success');
        router.refresh();
      }
    } 
    else if (mode === 'login') {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) toast(t('بيانات الدخول غير صحيحة', 'Invalid login credentials'), 'error');
      else {
        toast(t('تم تسجيل الدخول', 'Signed in successfully'), 'success');
        router.refresh();
      }
    } 
    else if (mode === 'recovery') {
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) toast(error.message, 'error');
      else {
        toast(t('تم إرسال رابط استعادة كلمة المرور إلى بريدك', 'Password reset link sent to your email'), 'success');
        setMode('login');
      }
    }
    
    setLoading(false);
  }

  return (
    <div className="container form-page">
      <div className="auth-card">
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          <ShieldCheck size={45} color="var(--primary)" style={{margin: '0 auto 15px'}}/>
          <h1>
            {mode === 'login' ? t('تسجيل الدخول', 'Sign In') : 
             mode === 'signup' ? t('إنشاء حساب جديد', 'Create Account') : 
             t('استعادة كلمة المرور', 'Reset Password')}
          </h1>
          <p>
            {mode === 'login' ? t('مرحباً بك مجدداً في منصة دنتيفاي', 'Welcome back to Dentify') : 
             mode === 'signup' ? t('انضم لأكبر مجتمع طبي لأطباء الأسنان', 'Join the largest dental community') : 
             t('أدخل بريدك الإلكتروني وسنرسل لك رابطاً لتغيير كلمة المرور', 'Enter your email and we will send you a reset link')}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
          {mode === 'signup' && (
            <div className="field">
              <label>{t('الاسم الكامل', 'Full Name')} *</label>
              <input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder={t('د. أحمد عبدالله...', 'Dr. Ahmed...')} />
            </div>
          )}
          
          <div className="field">
            <label>{t('البريد الإلكتروني', 'Email Address')} *</label>
            <div style={{position: 'relative'}}>
              <Mail size={18} color="var(--muted)" style={{position: 'absolute', top: '14px', [lang==='ar'?'right':'left']: '14px'}}/>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@example.com" style={{paddingInlineStart: '40px'}} dir="ltr" />
            </div>
          </div>

          {mode !== 'recovery' && (
            <div className="field">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <label>{t('كلمة المرور', 'Password')} *</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('recovery')} style={{background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', padding: 0}}>
                    {t('نسيت كلمة المرور؟', 'Forgot Password?')}
                  </button>
                )}
              </div>
              <div style={{position: 'relative'}}>
                <Lock size={18} color="var(--muted)" style={{position: 'absolute', top: '14px', [lang==='ar'?'right':'left']: '14px'}}/>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} style={{paddingInlineStart: '40px'}} dir="ltr" />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{padding: '16px', fontSize: '1.1rem', marginTop: '10px'}}>
            {loading ? <LoaderCircle className="spinner" size={22}/> : mode === 'recovery' ? t('إرسال الرابط', 'Send Reset Link') : mode === 'login' ? t('دخول', 'Sign In') : t('إنشاء الحساب', 'Sign Up')}
          </button>
        </form>

        <div className="form-switch">
          {mode === 'recovery' ? (
            <p>{t('تذكرت كلمة المرور؟', 'Remember your password?')} <button onClick={() => setMode('login')}>{t('العودة لتسجيل الدخول', 'Back to Sign In')}</button></p>
          ) : mode === 'login' ? (
            <p>{t('ليس لديك حساب؟', 'Don\'t have an account?')} <button onClick={() => setMode('signup')}>{t('سجل الآن مجاناً', 'Sign up for free')}</button></p>
          ) : (
            <p>{t('لديك حساب بالفعل؟', 'Already have an account?')} <button onClick={() => setMode('login')}>{t('تسجيل الدخول', 'Sign in')}</button></p>
          )}
        </div>
      </div>
    </div>
  );
}

// هاي الصفحة الرئيسية اللي غلفنا فيها الكود بـ Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="loading-page"><div className="spinner" /></div>}>
      <LoginContent />
    </Suspense>
  );
}