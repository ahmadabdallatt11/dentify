'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UploadCloud, CheckCircle2, ArrowLeft, Wallet } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useApp } from '@/components/Providers';
import { money } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, lang, t, toast, settings } = useApp();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [ref, setRef] = useState('');

  useEffect(() => {
    if (!user) {
      router.replace('/login?next=/checkout');
      return;
    }
    
    async function fetchTotal() {
      const { data, error } = await supabaseBrowser()
        .from('cart_items')
        .select('quantity, courses(price_jod), products(price_jod)')
        .eq('user_id', user.id);
      
      if (error || !data || data.length === 0) {
        router.replace('/cart');
        return;
      }

      // حساب الإجمالي الدقيق للكورسات والمنتجات مع الكمية
      const sum = data.reduce((acc, item: any) => {
        if (item.courses) return acc + Number(item.courses.price_jod);
        if (item.products) return acc + (Number(item.products.price_jod) * item.quantity);
        return acc;
      }, 0);
      
      setTotal(sum);
      setLoading(false);
    }
    
    fetchTotal();
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast(t('الرجاء إرفاق صورة إشعار التحويل', 'Please attach the transfer receipt'), 'error');
      return;
    }
    if (!ref.trim()) {
      toast(t('الرجاء إدخال رقم المرجع', 'Please enter the transfer reference'), 'error');
      return;
    }

    setSubmitting(true);
    const sb = supabaseBrowser();
    
    // 1. رفع صورة إشعار الحوالة
    const fileExt = file.name.split('.').pop();
    const filePath = `${user?.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await sb.storage.from('payment-proofs').upload(filePath, file);
    
    if (uploadError) {
      toast(uploadError.message, 'error');
      setSubmitting(false);
      return;
    }

    // 2. أمر سحري: تحويل السلة لفاتورة وخصم المخزون أوتوماتيكياً من السيرفر
    const { error: rpcError } = await sb.rpc('create_cliq_order_from_cart', {
      p_transfer_reference: ref,
      p_proof_path: filePath
    });

    setSubmitting(false);

    if (rpcError) {
      toast(rpcError.message, 'error');
    } else {
      toast(t('تم إرسال طلبك بنجاح! سيتم المراجعة قريباً', 'Order submitted successfully! Will be reviewed soon'), 'success');
      // تصفير عداد السلة اللي فوق
      window.dispatchEvent(new Event('cart-updated'));
      router.push('/profile');
    }
  }

  if (loading) return <div className="container loading-page"><div className="spinner" /></div>;

  return (
    <div className="container section" style={{ maxWidth: '600px', padding: '60px 20px' }}>
      <div className="panel" style={{ padding: '40px', borderRadius: '24px', background: '#fff', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '60px', height: '60px', background: '#e0f2fe', color: '#0284c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
            <Wallet size={30} />
          </div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--secondary)', marginBottom: '10px' }}>{t('الدفع عبر CliQ', 'Pay via CliQ')}</h1>
          <p style={{ color: 'var(--muted)' }}>{t('يرجى تحويل المبلغ الإجمالي إلى حسابنا، ثم إرفاق الإشعار هنا.', 'Please transfer the total amount to our account, then attach the receipt.')}</p>
        </div>

        <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{t('المبلغ المطلوب', 'Total Amount')}</span>
            <strong style={{ fontSize: '1.6rem', color: 'var(--primary)' }}>{money(total)}</strong>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '1.05rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>{t('الاسم المستعار (Alias)', 'CliQ Alias')}</span>
              <strong style={{ color: 'var(--secondary)' }}>{settings.cliq_alias?.replace(/"/g, '') || 'DENTIFYJO'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>{t('اسم البنك', 'Bank Name')}</span>
              <strong style={{ color: 'var(--secondary)' }}>{settings.cliq_bank_name?.replace(/"/g, '') || 'Bank al Etihad'}</strong>
            </div>
          </div>
          
          {settings.cliq_qr_url && settings.cliq_qr_url !== '""' && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <img src={settings.cliq_qr_url.replace(/"/g, '')} alt="CliQ QR" style={{ width: '150px', height: '150px', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '5px', background: '#fff' }} />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="field">
            <label style={{ fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '8px', display: 'block' }}>{t('رقم المرجع (Reference No.)', 'Transfer Reference')} *</label>
            <input 
              required 
              placeholder={t('أدخل رقم مرجع الحوالة', 'Enter reference number')}
              value={ref}
              onChange={e => setRef(e.target.value)}
              style={{ padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', width: '100%', fontSize: '1rem' }}
            />
          </div>

          <div className="field">
            <label style={{ fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '8px', display: 'block' }}>{t('إشعار التحويل (صورة)', 'Transfer Receipt (Image)')} *</label>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', background: file ? '#f0fdf4' : '#f8fafc', border: file ? '2px dashed #16a34a' : '2px dashed #cbd5e1', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <UploadCloud size={35} color={file ? '#16a34a' : 'var(--muted)'} style={{ marginBottom: '12px' }} />
              <span style={{ color: file ? '#16a34a' : 'var(--muted)', fontWeight: 'bold', fontSize: '1.05rem' }}>
                {file ? file.name : t('اضغط لرفع الإشعار من جهازك', 'Click to upload receipt')}
              </span>
              <input 
                type="file" 
                hidden 
                accept="image/*" 
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ padding: '18px', fontSize: '1.15rem', justifyContent: 'center', borderRadius: '16px', marginTop: '15px', boxShadow: '0 10px 20px rgba(15, 118, 110, 0.2)' }}
            disabled={submitting}
          >
            {submitting ? <div className="spinner" style={{ width: 22, height: 22, borderWidth: 3 }}/> : <><CheckCircle2 size={22}/> {t('تأكيد الدفع وإرسال الطلب', 'Confirm & Submit Order')}</>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '25px' }}>
          <Link href="/cart" style={{ color: 'var(--muted)', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
            <ArrowLeft size={16} /> {t('العودة للسلة والتعديل', 'Back to cart')}
          </Link>
        </div>
      </div>
    </div>
  );
}