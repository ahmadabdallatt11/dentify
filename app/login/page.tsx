'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Mail, Lock, LoaderCircle, User, Phone, GraduationCap } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useApp } from '@/components/Providers';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get('next') || '/profile';
  const initMode = searchParams?.get('mode') === 'signup' ? 'signup' : 'login';
  
  const { lang, t, user, toast } = useApp();
  
  const [mode, setMode] = useState<'login' | 'signup' | 'recovery'>(initMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // الحقول الإجبارية
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [academicYear, setAcademicYear] = useState('first');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const sb = supabaseBrowser();

    if (mode === 'signup') {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            full_name: fullName,
            phone: phone,
            university: university,
            academic_year: academicYear
          } 
        }
      });

      if (error) {
        toast(error.message, 'error');
      } else {
        if (data?.user?.id) {
          await sb.from('profiles').update({
            phone: phone,
            university: university,
            academic_year: academicYear
          }).eq('id', data.user.id);
        }
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
      <div className="auth-card" style={{ maxWidth: mode === 'signup' ? '700px' : '500px', transition: 'all 0.3s' }}>
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

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '18px'}}>
          
          {mode === 'signup' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', background: 'var(--soft)', padding: 20, borderRadius: 16, marginBottom: 10 }}>
              <div className="field">
                <label>{t('الاسم الكامل', 'Full Name')} *</label>
                <div style={{position: 'relative'}}>
                  <User size={18} color="var(--muted)" style={{position: 'absolute', top: '14px', [lang==='ar'?'right':'left']: '14px'}}/>
                  <input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder={t('مثال: د. أحمد عبدالله', 'e.g. Dr. Ahmed...')} style={{paddingInlineStart: '40px', background: '#fff'}} />
                </div>
              </div>

              <div className="field">
                <label>{t('رقم الهاتف', 'Phone Number')} *</label>
                <div style={{position: 'relative'}}>
                  <Phone size={18} color="var(--muted)" style={{position: 'absolute', top: '14px', [lang==='ar'?'right':'left']: '14px'}}/>
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="079XXXXXXX" style={{paddingInlineStart: '40px', background: '#fff'}} dir="ltr" />
                </div>
              </div>

              {/* قائمة الجامعات המعتمدة في الأردن */}
              <div className="field">
                <label>{t('الجامعة', 'University')} *</label>
                <div style={{position: 'relative'}}>
                  <GraduationCap size={18} color="var(--muted)" style={{position: 'absolute', top: '14px', [lang==='ar'?'right':'left']: '14px'}}/>
                  <select required value={university} onChange={e => setUniversity(e.target.value)} style={{background: '#fff', padding: '13px', paddingInlineStart: '40px', borderRadius: '11px', border: '1px solid #dce3e8', outline: 'none', width: '100%', appearance: 'none'}}>
                    <option value="" disabled>{t('اختر جامعتك...', 'Select your university...')}</option>
                    <optgroup label="الجامعات الحكومية">
                      <option value="الجامعة الأردنية">الجامعة الأردنية</option>
                      <option value="جامعة العلوم والتكنولوجيا الأردنية">جامعة العلوم والتكنولوجيا الأردنية</option>
                      <option value="الجامعة الهاشمية">الجامعة الهاشمية</option>
                      <option value="جامعة مؤتة">جامعة مؤتة</option>
                    </optgroup>
                    <optgroup label="الجامعات الخاصة">
                      <option value="جامعة البترا">جامعة البترا</option>
                      <option value="جامعة عمان الأهلية">جامعة عمان الأهلية</option>
                      <option value="جامعة الزرقاء">جامعة الزرقاء</option>
                      <option value="جامعة العلوم التطبيقية الخاصة">جامعة العلوم التطبيقية الخاصة</option>
                      <option value="جامعة ابن سينا للعلوم الطبية">جامعة ابن سينا للعلوم الطبية</option>
                      <option value="جامعة العقبة للعلوم الطبية">جامعة العقبة للعلوم الطبية</option>
                    </optgroup>
                    <option value="جامعة خارج الأردن / أخرى">جامعة خارج الأردن / أخرى</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>{t('السنة الدراسية', 'Academic Year')} *</label>
                <select required value={academicYear} onChange={e => setAcademicYear(e.target.value)} style={{background: '#fff', padding: '13px', borderRadius: '11px', border: '1px solid #dce3e8', outline: 'none'}}>
                  <option value="first">{t('سنة أولى', 'First year')}</option>
                  <option value="second">{t('سنة ثانية', 'Second year')}</option>
                  <option value="third">{t('سنة ثالثة', 'Third year')}</option>
                  <option value="fourth">{t('سنة رابعة', 'Fourth year')}</option>
                  <option value="fifth">{t('سنة خامسة', 'Fifth year')}</option>
                  <option value="graduate">{t('خريج / طبيب امتياز', 'Graduate / Intern')}</option>
                  <option value="other">{t('أخرى', 'Other')}</option>
                </select>
              </div>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="loading-page"><div className="spinner" /></div>}>
      <LoginContent />
    </Suspense>
  );
}