'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, LoaderCircle, CheckCircle2 } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useApp } from '@/components/Providers';

export default function ContactPage() {
  const { t, user, profile, settings } = useApp();
  
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    name: profile?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    subject: '',
    message: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    
    const { error } = await supabaseBrowser().from('contact_messages').insert({
      user_id: user?.id || null,
      name: form.name,
      email: form.email,
      phone: form.phone,
      subject: form.subject,
      message: form.message
    });

    setBusy(false);
    
    if (error) {
      alert(t('حدث خطأ أثناء إرسال الرسالة', 'Error sending message'));
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="container section" style={{ textAlign: 'center', padding: '100px 20px', maxWidth: 600 }}>
        <CheckCircle2 size={60} color="#16a34a" style={{ margin: '0 auto 20px' }} />
        <h2>{t('تم الإرسال بنجاح', 'Message sent successfully')}</h2>
        <p style={{ color: 'var(--muted)', marginTop: 10 }}>{t('شكراً لتواصلك معنا. سنقوم بالرد عليك في أقرب وقت ممكن.', 'Thank you for reaching out. We will get back to you as soon as possible.')}</p>
        <button className="btn btn-outline" style={{ marginTop: 30 }} onClick={() => setSuccess(false)}>{t('إرسال رسالة أخرى', 'Send another message')}</button>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="page-hero" style={{ textAlign: 'center', marginBottom: 50 }}>
        <h1>{t('تواصل معنا', 'Contact Us')}</h1>
        <p>{t('نحن هنا لمساعدتك والإجابة على جميع استفساراتك.', 'We are here to help and answer all your inquiries.')}</p>
      </div>

      <div className="split" style={{ gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        {/* معلومات التواصل */}
        <div style={{ padding: 30, background: 'var(--soft)', borderRadius: 24, alignSelf: 'start' }}>
          <h2 style={{ marginBottom: 20 }}>{t('معلومات التواصل', 'Contact Information')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div style={{ width: 45, height: 45, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Mail size={20} /></div>
              <div><strong style={{ display: 'block' }}>{t('البريد الإلكتروني', 'Email')}</strong><span style={{ color: 'var(--muted)' }}>{String(settings.support_email || 'ameeralnsour007@gmail.com').replaceAll('"', '')}</span></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div style={{ width: 45, height: 45, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Phone size={20} /></div>
              <div><strong style={{ display: 'block' }}>{t('رقم الهاتف', 'Phone')}</strong><span style={{ color: 'var(--muted)' }}>+962-798075264</span></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div style={{ width: 45, height: 45, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><MapPin size={20} /></div>
              <div><strong style={{ display: 'block' }}>{t('الموقع', 'Location')}</strong><span style={{ color: 'var(--muted)' }}>عمان، الأردن</span></div>
            </div>
          </div>
        </div>

        {/* نموذج المراسلة */}
        <div className="panel" style={{ padding: 30 }}>
          <form className="admin-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div className="field">
              <label>{t('الاسم الكريم', 'Your Name')} *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="field">
              <label>{t('البريد الإلكتروني', 'Your Email')} *</label>
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className="field full">
              <label>{t('رقم الهاتف (اختياري)', 'Phone Number (Optional)')}</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div className="field full">
              <label>{t('الموضوع', 'Subject')} *</label>
              <input required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
            </div>
            <div className="field full">
              <label>{t('رسالتك', 'Your Message')} *</label>
              <textarea required rows={5} value={form.message} onChange={e => setForm({...form, message: e.target.value})} style={{ minHeight: 120 }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy} style={{ padding: 15, fontSize: 16 }}>
              {busy ? <LoaderCircle className="spinner" size={20} /> : <><Send size={18} /> {t('إرسال الرسالة', 'Send Message')}</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}