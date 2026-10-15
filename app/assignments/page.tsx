'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, UploadCloud, CheckCircle2, Clock3, AlertCircle, ArrowRight, Download, Wallet, Check } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { money } from '@/lib/utils';
import { useApp } from '@/components/Providers';

export default function AssignmentsPage() {
  const router = useRouter();
  const { lang, t, user, toast, settings } = useApp();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // حالات الدفع
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [payingStatus, setPayingStatus] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/login?next=/assignments');
      return;
    }
    fetchAssignments();
  }, [user]);

  async function fetchAssignments() {
    setLoading(true);
    const { data, error } = await supabaseBrowser()
      .from('assignment_requests')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (error) toast(error.message, 'error');
    else setRequests(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast(t('الرجاء تعبئة العنوان والوصف', 'Please fill title and description'), 'error');
      return;
    }

    setSubmitting(true);
    const sb = supabaseBrowser();
    let filePath = null;

    if (file) {
      const fileExt = file.name.split('.').pop();
      filePath = `${user?.id}/${Date.now()}_assignment.${fileExt}`;
      const { error: uploadError } = await sb.storage.from('assignments').upload(filePath, file);
      if (uploadError) { toast(uploadError.message, 'error'); setSubmitting(false); return; }
    }

    const { error } = await sb.from('assignment_requests').insert({
      user_id: user?.id,
      title: title,
      description: description,
      student_file_path: filePath
    });

    setSubmitting(false);

    if (error) toast(error.message, 'error');
    else {
      toast(t('تم إرسال طلبك بنجاح للتقييم والتسعير', 'Request submitted successfully for evaluation'), 'success');
      setTitle(''); setDescription(''); setFile(null);
      fetchAssignments();
    }
  }

  async function handlePaymentSubmit(reqId: string, e: React.FormEvent) {
    e.preventDefault();
    if (!paymentFile) {
      toast(t('الرجاء إرفاق صورة إشعار التحويل', 'Please attach the transfer receipt'), 'error');
      return;
    }

    setPayingStatus(true);
    const sb = supabaseBrowser();
    
    // 1. رفع صورة الإشعار لمجلد payment-proofs
    const fileExt = paymentFile.name.split('.').pop();
    const proofPath = `${user?.id}/assignment_${reqId}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await sb.storage.from('payment-proofs').upload(proofPath, paymentFile);
    
    if (uploadError) { toast(uploadError.message, 'error'); setPayingStatus(false); return; }

    // 2. تحديث حالة الواجب لـ "تم الدفع"
    const { error } = await sb.from('assignment_requests').update({
      status: 'paid',
      payment_proof: proofPath
    }).eq('id', reqId);

    setPayingStatus(false);

    if (error) toast(error.message, 'error');
    else {
      toast(t('تم إرسال الدفعة بنجاح! جاري العمل على الحل', 'Payment submitted! Solution is in progress'), 'success');
      setPayingId(null); setPaymentFile(null);
      fetchAssignments();
    }
  }

  async function downloadFile(path: string, fileName: string) {
    const { data, error } = await supabaseBrowser().storage.from('assignments').createSignedUrl(path, 60);
    if (error) { toast(t('تعذر تحميل الملف', 'Could not download file'), 'error'); return; }
    if (data?.signedUrl) {
      const a = document.createElement('a'); a.href = data.signedUrl; a.target = '_blank'; a.download = fileName; a.click();
    }
  }

  if (!user) return null;

  // دوال مساعدة لترجمة الحالة وألوانها
  const getStatusUI = (status: string) => {
    switch(status) {
      case 'completed': return { icon: <CheckCircle2 size={14}/>, text: t('تم الحل', 'Completed'), bg: '#dcfce7', color: '#16a34a' };
      case 'paid': return { icon: <Wallet size={14}/>, text: t('تم الدفع - جاري الحل', 'Paid - In Progress'), bg: '#e0f2fe', color: '#0284c7' };
      case 'awaiting_payment': return { icon: <Wallet size={14}/>, text: t('بانتظار الدفع', 'Awaiting Payment'), bg: '#ffedd5', color: '#ea580c' };
      case 'rejected': return { icon: <AlertCircle size={14}/>, text: t('مرفوض', 'Rejected'), bg: '#fee2e2', color: '#dc2626' };
      default: return { icon: <Clock3 size={14}/>, text: t('قيد التقييم والتسعير', 'Pending Evaluation'), bg: '#fef9c3', color: '#ca8a04' };
    }
  };

  return (
    <div className="container section" style={{ padding: '60px 20px', maxWidth: '1000px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
        <Link href="/profile" className="btn btn-outline" style={{ padding: '8px 16px' }}>
          <ArrowRight size={16} style={{ transform: lang === 'ar' ? 'none' : 'rotate(180deg)' }} /> {t('مكتبتي', 'My Library')}
        </Link>
      </div>

      <div className="page-hero" style={{ background: 'var(--secondary)', color: '#fff', padding: '40px', borderRadius: '24px', marginBottom: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '16px' }}><FileText size={28} color="var(--primary)" /></div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>{t('خدمة حل الواجبات', 'Assignments Solution Service')}</h1>
        </div>
        <p style={{ color: '#cbd5e1', fontSize: '1.1rem', maxWidth: '600px', lineHeight: 1.6 }}>
          {t('ارسل لنا تفاصيل الواجب، وسيقوم فريقنا بمراجعته وتسعيره. بعد الدفع عبر كليك، ستبدأ عملية الحل فوراً.', 'Send assignment details, our team will review and quote it. After paying via CliQ, the solution process starts immediately.')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
        
        {/* نموذج تقديم طلب جديد */}
        <div className="panel" style={{ background: '#fff', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--secondary)', marginBottom: '25px' }}>{t('طلب تسعير وحل واجب جديد', 'New Assignment Quote')}</h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="field">
              <label style={{ fontWeight: 'bold' }}>{t('موضوع الواجب', 'Assignment Subject')} *</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} placeholder={t('مثال: حالة تقويم أسنان...', 'e.g. Orthodontic case...')} style={{ padding: '14px', borderRadius: '12px' }} />
            </div>

            <div className="field full">
              <label style={{ fontWeight: 'bold' }}>{t('التفاصيل والمطلوب', 'Details & Requirements')} *</label>
              <textarea required value={description} onChange={e => setDescription(e.target.value)} placeholder={t('اشرح المطلوب بالتفصيل ليتسنى لنا تسعيره...', 'Explain details to get a quote...')} rows={5} style={{ padding: '14px', borderRadius: '12px' }} />
            </div>

            <div className="field full">
              <label style={{ fontWeight: 'bold' }}>{t('المرفقات (اختياري)', 'Attachments (Optional)')}</label>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px', background: file ? '#f0fdf4' : '#f8fafc', border: file ? '2px dashed #16a34a' : '2px dashed #cbd5e1', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <UploadCloud size={30} color={file ? '#16a34a' : 'var(--muted)'} style={{ marginBottom: '10px' }} />
                <span style={{ color: file ? '#16a34a' : 'var(--muted)', fontWeight: 'bold' }}>{file ? file.name : t('اضغط لرفع الملف', 'Click to upload file')}</span>
                <input type="file" hidden accept=".pdf,image/*,.doc,.docx" onChange={e => setFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '16px', fontSize: '1.1rem', justifyContent: 'center', borderRadius: '12px' }}>
              {submitting ? <div className="spinner" style={{ width: 22, height: 22, borderWidth: 3 }}/> : t('إرسال للتقييم والتسعير', 'Submit for Quote')}
            </button>
          </form>
        </div>

        {/* قائمة الطلبات */}
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--secondary)', marginBottom: '25px' }}>{t('طلباتك السابقة', 'Your Requests')}</h2>
          
          {loading ? (
            <div className="spinner" style={{ margin: '50px auto' }}/>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
              <FileText size={40} color="var(--muted)" style={{ margin: '0 auto 15px' }} />
              <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>{t('لم تقم بإرسال أي واجبات بعد.', 'You haven\'t submitted any assignments yet.')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {requests.map(req => {
                const ui = getStatusUI(req.status);
                return (
                  <div key={req.id} style={{ background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: req.status === 'awaiting_payment' ? '2px solid #ea580c' : '1px solid #f1f5f9' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--secondary)' }}>{req.title}</h3>
                      <span style={{ padding: '4px 10px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', background: ui.bg, color: ui.color }}>
                        {ui.icon} {ui.text}
                      </span>
                    </div>

                    {/* إذا الإدارة حطت سعر بانتظار الدفع */}
                    {req.status === 'awaiting_payment' && req.price_jod && (
                      <div style={{ background: '#fff7ed', padding: '20px', borderRadius: '16px', border: '1px dashed #fdba74', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 10px', color: '#ea580c', fontSize: '1.1rem' }}>{t('تكلفة حل الواجب:', 'Solution Cost:')} <strong style={{ fontSize: '1.4rem' }}>{money(req.price_jod)}</strong></h4>
                        
                        {payingId === req.id ? (
                          <form onSubmit={(e) => handlePaymentSubmit(req.id, e)} style={{ marginTop: '15px' }}>
                            <p style={{ fontSize: '0.9rem', color: '#9a3412', marginBottom: '15px' }}>
                              {t('حول المبلغ لـ', 'Transfer to')} <b>{settings.cliq_alias?.replace(/"/g, '') || 'DENTIFYJO'}</b> ({settings.cliq_bank_name?.replace(/"/g, '') || 'Bank'}) {t('ثم ارفع الإشعار:', 'then upload receipt:')}
                            </p>
                            <label className="btn btn-outline" style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '10px', background: '#fff' }}>
                              <UploadCloud size={16}/> {paymentFile ? paymentFile.name : t('إرفاق إشعار كليك', 'Attach CliQ Receipt')}
                              <input type="file" hidden accept="image/*" onChange={e => setPaymentFile(e.target.files?.[0] || null)} />
                            </label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={payingStatus}>
                                {payingStatus ? <div className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }}/> : <><Check size={16}/> {t('تأكيد الدفع', 'Confirm Payment')}</>}
                              </button>
                              <button type="button" className="btn btn-outline" onClick={() => { setPayingId(null); setPaymentFile(null); }}>{t('إلغاء', 'Cancel')}</button>
                            </div>
                          </form>
                        ) : (
                          <button className="btn btn-primary" onClick={() => setPayingId(req.id)} style={{ width: '100%', justifyContent: 'center', background: '#ea580c', borderColor: '#ea580c' }}>
                            <Wallet size={16}/> {t('دفع وتأكيد العمل', 'Pay & Confirm Work')}
                          </button>
                        )}
                      </div>
                    )}

                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '15px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{req.description}</p>

                    {req.student_file_path && (
                      <button onClick={() => downloadFile(req.student_file_path, 'my_assignment')} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem', marginBottom: '15px', background: '#f8fafc' }}>
                        <Download size={14} /> {t('ملفك المرفق', 'Your attachment')}
                      </button>
                    )}

                    {/* رد الإدارة */}
                    {req.admin_reply && (
                      <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '12px', border: '1px solid #bbf7d0', marginTop: '10px' }}>
                        <strong style={{ display: 'block', color: '#16a34a', fontSize: '0.9rem', marginBottom: '5px' }}>{t('رد الإدارة / الحل:', 'Admin Reply / Solution:')}</strong>
                        <p style={{ margin: 0, color: '#15803d', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{req.admin_reply}</p>
                        {req.admin_file_path && (
                          <button onClick={() => downloadFile(req.admin_file_path, 'solution')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem', marginTop: '15px', background: '#16a34a', borderColor: '#16a34a' }}>
                            <Download size={16} /> {t('تحميل ملف الحل', 'Download Solution File')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}