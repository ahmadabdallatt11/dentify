'use client';

import { useState, useEffect } from 'react';
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

  // استعلام ذكي لشاشة الموبايل عشان نرتب التصميم
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      setForm({ ...form, subject: '', message: '' }); // تصفير الرسالة بعد النجاح
    }
  }

  if (success) {
    return (
      <div className="container section" style={{ textAlign: 'center', padding: isMobile ? '60px 15px' : '100px 20px', maxWidth: 600 }}>
        <CheckCircle2 size={60} color="#16a34a" style={{ margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: isMobile ? 22 : 28 }}>{t('تم الإرسال بنجاح', 'Message sent successfully')}</h2>
        <p style={{ color: 'var(--muted)', marginTop: 10, fontSize: isMobile ? 14 : 16 }}>
          {t('شكراً لتواصلك معنا. سنقوم بالرد عليك في أقرب وقت ممكن.', 'Thank you for reaching out. We will get back to you as soon as possible.')}
        </p>
        <button className="btn btn-outline" style={{ marginTop: 30, width: isMobile ? '100%' : 'auto' }} onClick={() => setSuccess(false)}>
          {t('إرسال رسالة أخرى', 'Send another message')}
        </button>
      </div>
    );
  }

  return (
    <div className="container section" style={{ padding: isMobile ? '30px 15px' : '60px 0' }}>
      <div className="page-hero" style={{ textAlign: 'center', marginBottom: isMobile ? 30 : 50 }}>
        <h1 style={{ fontSize: isMobile ? 28 : 40, marginBottom: 10 }}>{t('تواصل معنا', 'Contact Us')}</h1>
        <p style={{ fontSize: isMobile ? 14 : 16 }}>{t('نحن هنا لمساعدتك والإجابة على جميع استفساراتك.', 'We are here to help and answer all your inquiries.')}</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
        gap: isMobile ? 20 : 40 
      }}>
        
        {/* معلومات التواصل */}
        <div style={{ padding: isMobile ? 20 : 30, background: 'var(--soft)', borderRadius: 24, alignSelf: 'start', order: isMobile ? 2 : 1 }}>
          <h2 style={{ marginBottom: 20, fontSize: isMobile ? 18 : 24 }}>{t('معلومات التواصل', 'Contact Information')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 15 : 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div style={{ width: 45, height: 45, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}><Mail size={20} /></div>
              <div style={{ overflow: 'hidden' }}>
                <strong style={{ display: 'block', fontSize: isMobile ? 14 : 16 }}>{t('البريد الإلكتروني', 'Email')}</strong>
                <span style={{ color: 'var(--muted)', fontSize: isMobile ? 13 : 15, display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {String(settings.support_email || 'ameeralnsour007@gmail.com').replaceAll('"', '')}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div style={{ width: 45, height: 45, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}><Phone size={20} /></div>
              <div>
                <strong style={{ display: 'block', fontSize: isMobile ? 14 : 16 }}>{t('رقم الهاتف', 'Phone')}</strong>
                <span style={{ color: 'var(--muted)', fontSize: isMobile ? 13 : 15 }} dir="ltr">+962-798075264</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div style={{ width: 45, height: 45, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}><MapPin size={20} /></div>
              <div>
                <strong style={{ display: 'block', fontSize: isMobile ? 14 : 16 }}>{t('الموقع', 'Location')}</strong>
                <span style={{ color: 'var(--muted)', fontSize: isMobile ? 13 : 15 }}>عمان، الأردن</span>
              </div>
            </div>
          </div>
        </div>

        {/* نموذج المراسلة */}
        <div className="panel" style={{ padding: isMobile ? 20 : 30, order: isMobile ? 1 : 2 }}>
          <form className="admin-form" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 15 }}>
            <div className={`field ${isMobile ? 'full' : ''}`}>
              <label style={{ fontSize: 13 }}>{t('الاسم الكريم', 'Your Name')} *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ padding: 12 }} />
            </div>
            <div className={`field ${isMobile ? 'full' : ''}`}>
              <label style={{ fontSize: 13 }}>{t('البريد الإلكتروني', 'Your Email')} *</label>
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ padding: 12 }} />
            </div>
            <div className="field full">
              <label style={{ fontSize: 13 }}>{t('رقم الهاتف (اختياري)', 'Phone Number (Optional)')}</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ padding: 12 }} dir="ltr" />
            </div>
            <div className="field full">
              <label style={{ fontSize: 13 }}>{t('الموضوع', 'Subject')} *</label>
              <input required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} style={{ padding: 12 }} />
            </div>
            <div className="field full">
              <label style={{ fontSize: 13 }}>{t('رسالتك', 'Your Message')} *</label>
              <textarea required rows={5} value={form.message} onChange={e => setForm({...form, message: e.target.value})} style={{ minHeight: 120, padding: 12 }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy} style={{ padding: 16, fontSize: 16, gridColumn: '1 / -1', marginTop: 10 }}>
              {busy ? <LoaderCircle className="spinner" size={20} /> : <><Send size={18} /> {t('إرسال الرسالة', 'Send Message')}</>}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}