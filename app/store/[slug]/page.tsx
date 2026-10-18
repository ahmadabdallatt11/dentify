'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Package, ArrowRight, ArrowLeft, Minus, Plus, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { money } from '@/lib/utils';
import { useApp } from '@/components/Providers';

export default function ProductDetailsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { lang, t, user, toast } = useApp();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [notFound, setNotFound] = useState(false);
  
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!slug) return;
    const decodedSlug = decodeURIComponent(slug);
    supabaseBrowser().from('products').select('*').eq('slug', decodedSlug).eq('is_published', true).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProduct(data);
          if (data.colors?.length > 0) setSelectedColor(''); // إجباري يختار
          if (data.sizes?.length > 0) setSelectedSize(''); // إجباري يختار
          setLoading(false);
        } else {
          supabaseBrowser().from('products').select('*').eq('id', decodedSlug).eq('is_published', true).maybeSingle()
            .then(({ data: idData }) => {
              if (idData) {
                setProduct(idData);
                if (idData.colors?.length > 0) setSelectedColor('');
                if (idData.sizes?.length > 0) setSelectedSize('');
              } else setNotFound(true);
              setLoading(false);
            });
        }
      });
  }, [slug]);

  async function addToCart() {
    if (!user) {
      toast(t('سجّل الدخول أولاً', 'Sign in first'), 'info');
      router.push('/login?next=/store/' + slug);
      return;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      toast(t('الرجاء تحديد اللون أولاً', 'Please select a color first'), 'error');
      return;
    }
    if (product.sizes?.length > 0 && !selectedSize) {
      toast(t('الرجاء تحديد المقاس أولاً', 'Please select a size first'), 'error');
      return;
    }
    setAdding(true);
    const { error } = await supabaseBrowser().from('cart_items').insert({
      user_id: user.id, product_id: product.id, quantity: qty, selected_color: selectedColor || null, selected_size: selectedSize || null
    });
    setAdding(false);
    if (error) toast(error.message, 'error');
    else {
      toast(t('تمت الإضافة للسلة بنجاح', 'Added to cart successfully'), 'success');
      window.dispatchEvent(new Event('cart-updated'));
    }
  }

  if (loading) return <div className="container loading-page"><div className="spinner" /></div>;
  if (notFound || !product) return (
      <div className="container section" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <AlertCircle size={60} color="#ef4444" style={{ margin: '0 auto 20px' }} />
        <h2>{t('المنتج غير موجود', 'Product not found')}</h2>
        <Link href="/store" className="btn btn-primary" style={{marginTop: 20}}>{t('العودة للمتجر', 'Back to store')}</Link>
      </div>
  );

  const title = lang === 'ar' ? (product.title_ar || product.title_en) : (product.title_en || product.title_ar);
  const description = lang === 'ar' ? (product.description_ar || product.description_en) : (product.description_en || product.description_ar);
  const imageUrl = product.image_path ? supabaseBrowser().storage.from('product-images').getPublicUrl(product.image_path).data.publicUrl : null;

  return (
    <div className="container section">
      <Link href="/store" className="btn btn-outline" style={{ display: 'inline-flex', marginBottom: 30, background: '#fff' }}>
        {lang === 'ar' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />} {t('العودة للمتجر', 'Back to store')}
      </Link>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'start' }}>
        <div className="panel" style={{ padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fff', borderRadius: 24 }}>
          {imageUrl ? <img src={imageUrl} alt={title} style={{ width: '100%', maxHeight: 450, objectFit: 'contain', borderRadius: 16 }} /> : <Package size={80} style={{ opacity: 0.2 }} />}
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>{product.category || t('منتج طبي', 'Dental Product')}</span>
          <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', margin: '10px 0 15px', color: 'var(--secondary)' }}>{title}</h1>
          <strong style={{ fontSize: '2rem', color: 'var(--primary)', display: 'block', marginBottom: 20 }}>{money(product.price_jod)}</strong>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: product.stock_quantity > 0 ? '#16a34a' : '#dc2626', marginBottom: 30, fontWeight: 800 }}>
            <ShieldCheck size={16} />{product.stock_quantity > 0 ? t('متوفر في المخزون', 'In stock') : t('نفدت الكمية', 'Out of stock')}
          </div>

          <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: 15, whiteSpace: 'pre-wrap', marginBottom: 35 }}>{description}</p>
          
          {product.colors && product.colors.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <strong style={{ display: 'block', marginBottom: 10, fontSize: 14 }}>{t('اللون المطلوب:', 'Select Color:')}</strong>
              <select value={selectedColor} onChange={e => setSelectedColor(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '2px solid var(--line)', background: '#fff', fontSize: 15, outline: 'none' }}>
                <option value="" disabled>{t('اختر اللون...', 'Choose color...')}</option>
                {product.colors.map((color: string) => <option key={color} value={color}>{color}</option>)}
              </select>
            </div>
          )}
          
          {product.sizes && product.sizes.length > 0 && (
            <div style={{ marginBottom: 30 }}>
              <strong style={{ display: 'block', marginBottom: 10, fontSize: 14 }}>{t('المقاس المطلوب:', 'Select Size:')}</strong>
              <select value={selectedSize} onChange={e => setSelectedSize(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '2px solid var(--line)', background: '#fff', fontSize: 15, outline: 'none' }}>
                <option value="" disabled>{t('اختر المقاس...', 'Choose size...')}</option>
                {product.sizes.map((size: string) => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 15, alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', borderRadius: 14, background: '#fff', padding: '4px' }}>
              <button className="icon-button" style={{ border: 'none', background: 'transparent' }} onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}><Minus size={16}/></button>
              <strong style={{ width: 40, textAlign: 'center', fontSize: 16 }}>{qty}</strong>
              <button className="icon-button" style={{ border: 'none', background: 'transparent' }} onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))} disabled={qty >= product.stock_quantity}><Plus size={16}/></button>
            </div>
            <button className="btn btn-primary" style={{ flex: 1, padding: '16px', fontSize: 16 }} disabled={adding || product.stock_quantity <= 0} onClick={addToCart}>
              {adding ? <div className="spinner" style={{width: 20, height: 20, borderWidth: 2}}/> : <><ShoppingCart size={18}/> {product.stock_quantity > 0 ? t('أضف للسلة', 'Add to cart') : t('نفدت الكمية', 'Out of stock')}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}