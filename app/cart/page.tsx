'use client';

import {useCallback, useEffect, useState} from 'react';
import Link from 'next/link';
import {ArrowLeft, BookOpen, ShoppingBag, Trash2, Package, Plus, Minus} from 'lucide-react';
import {supabaseBrowser} from '@/lib/supabase/client';
import {money, publicImage} from '@/lib/utils';
import {useApp} from '@/components/Providers';

export default function CartPage() {
  const {user, lang, t, toast} = useApp();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string|null>(null);
  const [updating, setUpdating] = useState<string|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    // سحب الكورسات والمنتجات معاً
    const {data, error} = await supabaseBrowser()
      .from('cart_items')
      .select('id, quantity, course_id, product_id, created_at, courses(*), products(*)')
      .eq('user_id', user.id)
      .order('created_at', {ascending: false});
      
    if (error) {
      toast(error.message, 'error');
      setItems([]);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { void load() }, [load]);

  async function remove(id: string) {
    setRemoving(id);
    const {error} = await supabaseBrowser().from('cart_items').delete().eq('id', id);
    setRemoving(null);
    if (error) toast(error.message, 'error');
    else {
      toast(t('تم حذف العنصر من السلة', 'Item removed from cart'), 'success');
      await load();
      window.dispatchEvent(new Event('cart-updated'));
    }
  }

  // دالة تعديل الكمية للمنتجات
  async function updateQuantity(id: string, newQty: number, maxStock: number) {
    if (newQty < 1) return;
    if (newQty > maxStock) {
      toast(t('الكمية المطلوبة تتجاوز المخزون المتوفر', 'Requested quantity exceeds available stock'), 'error');
      return;
    }

    setUpdating(id);
    const {error} = await supabaseBrowser().from('cart_items').update({ quantity: newQty }).eq('id', id);
    setUpdating(null);
    
    if (error) {
      toast(error.message, 'error');
    } else {
      // تحديث الكمية بالواجهة بدون ريلود كامل
      setItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
      window.dispatchEvent(new Event('cart-updated'));
    }
  }

  // حساب الإجمالي (كورس + (سعر المنتج × الكمية))
  const total = items.reduce((sum, item) => {
    if (item.courses) return sum + Number(item.courses.price_jod || 0);
    if (item.products) return sum + (Number(item.products.price_jod || 0) * (item.quantity || 1));
    return sum;
  }, 0);

  // حساب إجمالي عدد العناصر
  const totalItemsCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (loading) return <div className="container loading-page"><div className="spinner"/></div>;
  
  if (!user) return (
    <div className="container section">
      <div className="empty-state">
        <ShoppingBag size={32}/>
        <h3>{t('سجّل الدخول لعرض سلتك', 'Sign in to view your cart')}</h3>
        <Link className="btn btn-primary" href="/login?next=/cart">{t('تسجيل الدخول', 'Sign in')}</Link>
      </div>
    </div>
  );

  return (
    <div className="container section">
      <div className="page-hero">
        <div className="eyebrow">{t('خطوة قبل الإتمام', 'One step before completion')}</div>
        <h1>{t('سلة المشتريات', 'Your cart')}</h1>
        <p>{t('راجع الكورسات والمنتجات التي اخترتها قبل إرسال طلب الدفع عبر CliQ.', 'Review your selected courses and products before submitting a CliQ payment request.')}</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={34}/>
          <h3>{t('سلتك فارغة حالياً', 'Your cart is empty')}</h3>
          <p>{t('استكشف الكورسات والمنتجات وأضف ما يناسبك.', 'Explore the catalog and store to add items.')}</p>
          <div style={{display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap'}}>
            <Link className="btn btn-primary" href="/store">{t('تصفح المتجر', 'Browse store')}</Link>
            <Link className="btn btn-outline" href="/courses">{t('استكشاف الكورسات', 'Explore courses')}</Link>
          </div>
        </div>
      ) : (
        <div className="split">
          <section className="panel">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
              <h2 style={{margin: 0, fontSize: 19}}>{t('العناصر المختارة', 'Selected items')}</h2>
              <span className="status status-student">{totalItemsCount} {t('عناصر', 'items')}</span>
            </div>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              {items.map(item => {
                const isCourse = !!item.course_id;
                const c = isCourse ? item.courses : item.products;
                if (!c) return null; // في حال كان المنتج أو الكورس محذوف
                
                return (
                  <div className="cart-item" key={item.id} style={{display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9'}}>
                    <Link href={isCourse ? `/courses/${c.slug||c.id}` : `/store/${c.slug||c.id}`} className="cart-thumb" style={{width: '70px', height: '70px', background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0}}>
                      {c.image_path ? (
                        <img src={isCourse ? publicImage(c.image_path) : supabaseBrowser().storage.from('product-images').getPublicUrl(c.image_path).data.publicUrl} alt="" style={{width: '100%', height: '100%', objectFit: isCourse ? 'cover' : 'contain'}}/>
                      ) : (
                        isCourse ? <BookOpen size={24} color="var(--muted)"/> : <Package size={24} color="var(--muted)"/>
                      )}
                    </Link>
                    
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                        <span style={{fontSize: '0.7rem', fontWeight: 'bold', background: isCourse ? 'rgba(15, 118, 110, 0.1)' : 'rgba(219, 39, 119, 0.1)', color: isCourse ? 'var(--primary)' : '#db2777', padding: '2px 8px', borderRadius: '50px'}}>
                          {isCourse ? t('كورس', 'Course') : t('منتج', 'Product')}
                        </span>
                      </div>
                      <h3 style={{margin: '0 0 5px', fontSize: '1.05rem'}}>{lang === 'ar' ? (c.title_ar || c.title_en) : (c.title_en || c.title_ar)}</h3>
                      <strong className="price" style={{color: 'var(--secondary)'}}>{money(c.price_jod)}</strong>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px'}}>
                      <button className="icon-button" disabled={removing === item.id} onClick={() => void remove(item.id)} aria-label={t('حذف', 'Remove')} style={{color: '#ef4444', background: '#fee2e2'}}>
                        <Trash2 size={16}/>
                      </button>

                      {/* أزرار الكمية تظهر للمنتجات فقط */}
                      {!isCourse && (
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50px', padding: '2px'}}>
                          <button 
                            className="icon-button" 
                            style={{width: '28px', height: '28px', background: 'transparent', border: 'none'}} 
                            disabled={updating === item.id || item.quantity <= 1} 
                            onClick={() => updateQuantity(item.id, item.quantity - 1, c.stock_quantity)}
                          >
                            <Minus size={14}/>
                          </button>
                          
                          <span style={{fontWeight: 'bold', fontSize: '0.9rem', width: '20px', textAlign: 'center'}}>
                            {updating === item.id ? <div className="spinner" style={{width: 12, height: 12, borderWidth: 2, margin: '0 auto'}}/> : item.quantity}
                          </span>
                          
                          <button 
                            className="icon-button" 
                            style={{width: '28px', height: '28px', background: 'transparent', border: 'none'}} 
                            disabled={updating === item.id || item.quantity >= c.stock_quantity} 
                            onClick={() => updateQuantity(item.id, item.quantity + 1, c.stock_quantity)}
                          >
                            <Plus size={14}/>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{display: 'flex', gap: '10px', marginTop: 25}}>
              <Link href="/courses" className="btn btn-outline" style={{flex: 1, justifyContent: 'center'}}><ArrowLeft size={15}/>{t('كورسات', 'Courses')}</Link>
              <Link href="/store" className="btn btn-outline" style={{flex: 1, justifyContent: 'center'}}><ArrowLeft size={15}/>{t('متجر', 'Store')}</Link>
            </div>
          </section>

          <aside className="panel" style={{position: 'sticky', top: 100, height: 'fit-content'}}>
            <h2 style={{fontSize: 20, marginTop: 0}}>{t('ملخص الطلب', 'Order summary')}</h2>
            
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', padding: '12px 0'}}>
              <span>{t('إجمالي العناصر', 'Total items')}</span>
              <span style={{fontWeight: 'bold', color: 'var(--secondary)'}}>{totalItemsCount}</span>
            </div>
            
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', padding: '12px 0', borderBottom: '1px solid var(--line)'}}>
              <span>{t('الضريبة', 'Tax')}</span>
              <span>{t('تُحدد حسب السياسة', 'As applicable')}</span>
            </div>
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0'}}>
              <b style={{fontSize: '1.2rem', color: 'var(--secondary)'}}>{t('الإجمالي', 'Total')}</b>
              <strong style={{fontSize: '1.8rem', color: 'var(--primary)'}}>{money(total)}</strong>
            </div>
            
            <Link className="btn btn-primary" style={{width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1.1rem'}} href="/checkout">
              {t('المتابعة إلى الدفع', 'Continue to checkout')} <ArrowLeft size={16}/>
            </Link>
            
            <p style={{fontSize: 11, color: 'var(--muted)', lineHeight: 1.8, marginTop: 15, textAlign: 'center'}}>
              {t('يتم تفعيل الكورسات وشحن المنتجات بعد مراجعة إشعار التحويل.', 'Courses are granted and products are shipped after receipt review.')}
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}