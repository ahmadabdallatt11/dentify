'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, MapPin, Phone, CreditCard, Banknote, UploadCloud, CheckCircle2, AlertCircle, Trash2, ShieldCheck, LoaderCircle } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { money } from '@/lib/utils';
import { useApp } from '@/components/Providers';

const GOVERNORATES = [
  'عمان', 'إربد', 'الزرقاء', 'البلقاء', 'المفرق', 'الكرك', 
  'جرش', 'مأدبا', 'عجلون', 'العقبة', 'معان', 'الطفيلة',
  /* [AAU_OPTION] خيار الجامعة الأهلية - امسح هذا السطر إذا أردت إيقاف التوصيل المجاني للجامعة */
  'الجامعة الأهلية (AAU)'
];

export default function CheckoutPage() {
  const router = useRouter();
  const { lang, t, user, toast, settings } = useApp();
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // فورم الدفع والتوصيل
  const [paymentMethod, setPaymentMethod] = useState<'cliq' | 'cod'>('cliq');
  const [phone, setPhone] = useState('');
  const [gov, setGov] = useState('');
  const [area, setArea] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  
  // بيانات كليك
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [transferRef, setTransferRef] = useState('');

  // استعلام شاشة الموبايل عشان نغير التصميم
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/login?next=/cart');
      return;
    }
    loadCart();
  }, [user, router]);

  async function loadCart() {
    const { data: cartData } = await supabaseBrowser().from('cart_items').select('*').eq('user_id', user?.id);
    if (!cartData || cartData.length === 0) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    const courseIds = cartData.filter(i => i.course_id).map(i => i.course_id);
    const productIds = cartData.filter(i => i.product_id).map(i => i.product_id);

    const [coursesRes, productsRes] = await Promise.all([
      courseIds.length ? supabaseBrowser().from('courses').select('*').in('id', courseIds) : { data: [] },
      productIds.length ? supabaseBrowser().from('products').select('*').in('id', productIds) : { data: [] }
    ]);

    const mergedData = cartData.map(item => ({
      ...item,
      course_data: item.course_id ? coursesRes.data?.find((c:any) => c.id === item.course_id) : null,
      product_data: item.product_id ? productsRes.data?.find((p:any) => p.id === item.product_id) : null
    }));

    setCartItems(mergedData);
    setLoading(false);
  }

  // الحسابات الذكية
  const hasProducts = cartItems.some(i => i.product_id != null);
  
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.course_data?.price_jod || item.product_data?.price_jod || 0;
    return sum + (Number(price) * (item.quantity || 1));
  }, 0);

  // حساب التوصيل أوتوماتيك
  let deliveryFee = 0;
  if (hasProducts && gov) {
    /* [AAU_OPTION] بداية شرط الأهلية */
    if (gov === 'الجامعة الأهلية (AAU)') {
      deliveryFee = 0;
    } 
    /* [AAU_OPTION] نهاية شرط الأهلية */
    else if (gov === 'عمان') {
      deliveryFee = 3;
    } else {
      deliveryFee = 5;
    }
  }

  const total = subtotal + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (paymentMethod === 'cliq' && !proofFile) {
      toast(t('الرجاء رفع صورة إيصال التحويل', 'Please upload transfer receipt'), 'error');
      return;
    }

    setSubmitting(true);
    const sb = supabaseBrowser();
    let uploadedPath = null;

    try {
      // 1. رفع صورة الوصل
      if (paymentMethod === 'cliq' && proofFile) {
        const path = `${user.id}/${Date.now()}-${proofFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: uploadError } = await sb.storage.from('payment-proofs').upload(path, proofFile);
        if (uploadError) throw uploadError;
        uploadedPath = path;
      }

      // 2. تجهيز العنوان المدمج
      const fullAddress = hasProducts 
        ? `هاتف: ${phone} | المحافظة: ${gov} | المنطقة: ${area} | الشارع: ${street} | معلم: ${landmark || 'لا يوجد'}`
        : `هاتف: ${phone} | (كورسات رقمية فقط)`;

      // 3. إنشاء الطلب الرئيسي
      const { data: order, error: orderError } = await sb.from('cliq_orders').insert({
        user_id: user.id,
        amount_jod: total,
        status: 'pending',
        proof_path: uploadedPath,
        transfer_reference: transferRef || null,
        payment_method: paymentMethod,
        governorate: hasProducts ? gov : null,
        delivery_fee: deliveryFee,
        delivery_address: fullAddress
      }).select('id').single();

      if (orderError) throw orderError;

      // 4. تفاصيل الطلب
      const orderItems = cartItems.map(i => ({
        order_id: order.id,
        course_id: i.course_id,
        product_id: i.product_id,
        price_jod: i.course_data?.price_jod || i.product_data?.price_jod || 0,
        quantity: i.quantity || 1
      }));

      const { error: itemsError } = await sb.from('cliq_order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // 5. تصفير السلة
      await sb.from('cart_items').delete().eq('user_id', user.id);
      window.dispatchEvent(new Event('cart-updated'));
      
      setSuccess(true);
    } catch (err: any) {
      toast(err.message || t('حدث خطأ أثناء إتمام الطلب', 'Error submitting order'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="container loading-page"><div className="spinner" /></div>;

  if (success) {
    return (
      <div className="container section" style={{ textAlign: 'center', padding: '80px 20px', maxWidth: 600 }}>
        <div style={{ width: 80, height: 80, background: '#dff7e9', color: '#16a34a', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
          <CheckCircle2 size={40} />
        </div>
        <h1 style={{ fontSize: 28, marginBottom: 15 }}>{t('تم استلام طلبك بنجاح!', 'Order received successfully!')}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.8, marginBottom: 30 }}>
          {paymentMethod === 'cliq' 
            ? t('جاري مراجعة الحوالة المالية، سيتم تفعيل طلبك في أقرب وقت.', 'Reviewing payment, your order will be activated soon.')
            : t('تم تأكيد طلبك (الدفع عند الاستلام). سنتواصل معك قريباً لتأكيد التوصيل.', 'Your COD order is confirmed. We will contact you for delivery.')}
        </p>
        <Link href="/profile" className="btn btn-primary" style={{ padding: '12px 30px' }}>{t('متابعة طلبي', 'Track my order')}</Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container section empty-state" style={{ padding: '100px 20px' }}>
        <ShoppingCart size={40} style={{ margin: '0 auto 15px' }} />
        <h2>{t('سلتك فارغة', 'Your cart is empty')}</h2>
        <Link href="/store" className="btn btn-primary" style={{ marginTop: 20 }}>{t('العودة للمتجر', 'Back to store')}</Link>
      </div>
    );
  }

  return (
    <div className="container section" style={{ padding: isMobile ? '20px 15px' : '40px 0' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', 
        gap: isMobile ? 20 : 30 
      }}>
        
        {/* القسم الأيمن: نموذج الدفع والتوصيل */}
        <div style={{ order: isMobile ? 2 : 1 }}>
          <h1 style={{ fontSize: isMobile ? 24 : 28, marginBottom: 20 }}>{t('إتمام الطلب', 'Checkout')}</h1>

          <form id="checkout-form" onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
            
            {/* 1. طرق الدفع */}
            <div className="panel" style={{ padding: isMobile ? 20 : 25 }}>
              <h3 style={{ margin: '0 0 15px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 16 }}><CreditCard size={20} color="var(--primary)"/> {t('طريقة الدفع', 'Payment Method')}</h3>
              
              <div style={{ display: 'grid', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 15, border: paymentMethod === 'cliq' ? '2px solid var(--primary)' : '2px solid var(--line)', borderRadius: 14, cursor: 'pointer', background: paymentMethod === 'cliq' ? 'var(--soft)' : '#fff', transition: 'all 0.2s' }}>
                  <input type="radio" name="payment" checked={paymentMethod === 'cliq'} onChange={() => setPaymentMethod('cliq')} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: 15 }}>{t('تحويل بنكي (CliQ)', 'CliQ Transfer')}</strong>
                    <small style={{ color: 'var(--muted)', fontSize: 11 }}>{t('دفع فوري وآمن', 'Instant and secure payment')}</small>
                  </div>
                </label>

                {hasProducts && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 15, border: paymentMethod === 'cod' ? '2px solid var(--primary)' : '2px solid var(--line)', borderRadius: 14, cursor: 'pointer', background: paymentMethod === 'cod' ? 'var(--soft)' : '#fff', transition: 'all 0.2s' }}>
                    <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: 15 }}>{t('الدفع عند الاستلام (كاش)', 'Cash on Delivery')}</strong>
                      <small style={{ color: 'var(--muted)', fontSize: 11 }}>{t('ادفع نقداً عند استلام طلبك', 'Pay in cash upon delivery')}</small>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* 2. بيانات التواصل والتوصيل */}
            <div className="panel" style={{ padding: isMobile ? 20 : 25 }}>
              <h3 style={{ margin: '0 0 15px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 16 }}><MapPin size={20} color="var(--primary)"/> {hasProducts ? t('بيانات التوصيل', 'Delivery Info') : t('بيانات التواصل', 'Contact Info')}</h3>
              
              <div className="admin-form" style={{ gridTemplateColumns: '1fr', gap: 15 }}>
                <div className="field full">
                  <label style={{ fontSize: 12 }}>{t('رقم الهاتف للتواصل', 'Phone number')} *</label>
                  <input type="tel" required placeholder="079XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: 12 }} />
                </div>

                {hasProducts && (
                  <>
                    <div className="field full">
                      <label style={{ fontSize: 12 }}>{t('المحافظة', 'Governorate')} *</label>
                      <select required value={gov} onChange={e => setGov(e.target.value)} style={{ padding: 12 }}>
                        <option value="" disabled>{t('اختر المحافظة...', 'Select governorate...')}</option>
                        {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 15 }}>
                      <div className="field">
                        <label style={{ fontSize: 12 }}>{t('المنطقة', 'Area')} *</label>
                        <input required placeholder={t('مثال: خلدا', 'e.g. Khalda')} value={area} onChange={e => setArea(e.target.value)} style={{ padding: 12 }} />
                      </div>
                      <div className="field">
                        <label style={{ fontSize: 12 }}>{t('الشارع', 'Street')} *</label>
                        <input required placeholder={t('مثال: وصفي التل', 'e.g. Wasfi Al-Tall')} value={street} onChange={e => setStreet(e.target.value)} style={{ padding: 12 }} />
                      </div>
                    </div>
                    <div className="field full">
                      <label style={{ fontSize: 12 }}>{t('أقرب معلم (اختياري)', 'Nearest landmark (optional)')}</label>
                      <input placeholder={t('مثال: بجانب مسجد الكالوتي', 'e.g. Next to Kalouti Mosque')} value={landmark} onChange={e => setLandmark(e.target.value)} style={{ padding: 12 }} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 3. رفع الإيصال (CliQ) */}
            {paymentMethod === 'cliq' && (
              <div className="panel" style={{ padding: isMobile ? 20 : 25, border: '2px dashed var(--primary)', background: 'var(--soft)' }}>
                <h3 style={{ margin: '0 0 15px', color: 'var(--primary)', fontSize: 16 }}>{t('تفاصيل الدفع (CliQ)', 'CliQ Payment Details')}</h3>
                
                <div style={{ background: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, display: 'grid', gap: 10 }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--muted)' }}>{t('الاسم المستعار (Alias):', 'CliQ Alias:')}</p>
                    <strong style={{ fontSize: 18, userSelect: 'all', color: 'var(--secondary)' }}>{String(settings.cliq_alias || 'غير محدد').replaceAll('"', '')}</strong>
                  </div>
                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--muted)' }}>{t('اسم البنك:', 'Bank Name:')}</p>
                    <strong style={{ fontSize: 14, color: 'var(--secondary)' }}>{String(settings.cliq_bank_name || 'غير محدد').replaceAll('"', '')}</strong>
                  </div>
                </div>
                
                <div className="admin-form" style={{ gridTemplateColumns: '1fr', gap: 12 }}>
                  <div className="field full">
                    <label style={{ fontSize: 12 }}>{t('صورة إشعار التحويل', 'Transfer Receipt Image')} *</label>
                    <label className="btn btn-outline" style={{ background: '#fff', cursor: 'pointer', padding: 12, justifyContent: 'center' }}>
                      <UploadCloud size={18} />
                      {proofFile ? <span style={{fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150}}>{proofFile.name}</span> : t('اضغط لرفع الصورة', 'Click to upload image')}
                      <input type="file" hidden accept="image/*" onChange={e => setProofFile(e.target.files?.[0] || null)} required={paymentMethod === 'cliq'} />
                    </label>
                  </div>
                  <div className="field full">
                    <label style={{ fontSize: 12 }}>{t('الرقم المرجعي (اختياري)', 'Reference Number (optional)')}</label>
                    <input placeholder="e.g. 123456789" value={transferRef} onChange={e => setTransferRef(e.target.value)} style={{ background: '#fff', padding: 12 }} />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* القسم الأيسر: ملخص الفاتورة (موبايل بنزل تحت) */}
        <div style={{ order: isMobile ? 1 : 2, alignSelf: 'start', position: isMobile ? 'static' : 'sticky', top: 100 }}>
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>{t('ملخص الطلب', 'Order Summary')}</h3>
            </div>
            
            <div style={{ padding: isMobile ? 20 : 25 }}>
              <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
                {cartItems.map(item => {
                  const target = item.course_data || item.product_data;
                  if (!target) return null;
                  return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lang === 'ar' ? (target.title_ar || target.title_en) : (target.title_en || target.title_ar)}
                        </strong>
                        {(item.selected_color || item.selected_size) && (
                          <small style={{ display: 'block', color: 'var(--muted)', marginTop: 2 }}>
                            {item.selected_color} {item.selected_color && item.selected_size && '-'} {item.selected_size}
                          </small>
                        )}
                        {item.quantity > 1 && <small style={{ display: 'block', color: 'var(--primary)' }}>Qty: {item.quantity}</small>}
                      </div>
                      <strong style={{ whiteSpace: 'nowrap' }}>{money((target.price_jod || 0) * (item.quantity || 1))}</strong>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 15, display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 13 }}>
                  <span>{t('المجموع الفرعي', 'Subtotal')}</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                
                {hasProducts && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 13 }}>
                    <span>{t('رسوم التوصيل', 'Delivery Fee')}</span>
                    <strong>{deliveryFee === 0 && gov === 'الجامعة الأهلية (AAU)' ? <span style={{color: 'var(--primary)'}}>{t('مجاناً', 'Free')}</span> : money(deliveryFee)}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, marginTop: 5, paddingTop: 12, borderTop: '1px dashed var(--line)' }}>
                  <strong>{t('الإجمالي', 'Total')}</strong>
                  <strong style={{ color: 'var(--primary)' }}>{money(total)}</strong>
                </div>
              </div>

              <button type="submit" form="checkout-form" className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: 15, marginTop: 20 }} disabled={submitting}>
                {submitting ? <LoaderCircle className="spinner" size={20} /> : <><ShieldCheck size={18} /> {t('تأكيد الطلب', 'Confirm Order')}</>}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}