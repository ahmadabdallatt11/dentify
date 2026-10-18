'use client';
import {useEffect,useState,useMemo} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {Package,ShoppingCart,Store} from 'lucide-react';
import {supabaseBrowser} from '@/lib/supabase/client';
import {publicImage,money} from '@/lib/utils';
import {useApp} from '@/components/Providers';

export default function StorePage(){
  const {lang,t,user,toast}=useApp();
  const router = useRouter();
  const [products,setProducts]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [adding,setAdding]=useState<string|null>(null);
  const [activeCategory,setActiveCategory]=useState<string>('all');

  useEffect(()=>{
    supabaseBrowser().from('products').select('*').eq('is_published',true).order('created_at',{ascending:false})
      .then(({data})=>{
        setProducts(data||[]);
        setLoading(false);
      });
  },[]);

  // استخراج الأقسام من المنتجات الموجودة بدون تكرار
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  async function handleAddToCartClick(item: any) {
    if (!user) {
      toast(t('سجّل الدخول أولاً لإضافة العناصر للسلة','Sign in to add this item to your cart'),'info');
      router.push(`/login?next=/store/${encodeURIComponent(item.slug)}`);
      return;
    }
    if (item.stock_quantity < 1) {
      toast(t('عذراً، نفدت الكمية', 'Sorry, out of stock'), 'error');
      return;
    }
    
    // إذا المنتج إلو ألوان أو مقاسات، وديه ع صفحة المنتج عشان يختارهم
    const hasColors = item.colors && item.colors.length > 0;
    const hasSizes = item.sizes && item.sizes.length > 0;
    if (hasColors || hasSizes) {
      router.push(`/store/${encodeURIComponent(item.slug)}`);
      return;
    }

    setAdding(item.id);
    const { error } = await supabaseBrowser().from('cart_items').insert({ user_id: user.id, product_id: item.id, quantity: 1 });
    setAdding(null);
    
    if(error){
      if (error.code === '23505') toast(t('العنصر موجود بالفعل في السلة', 'Item is already in cart'), 'error');
      else toast(error.message,'error');
    } else {
      toast(t('تمت الإضافة للسلة','Added to cart successfully'),'success');
      window.dispatchEvent(new Event('cart-updated'));
    }
  }

  const getProductImg = (path: string) => path ? supabaseBrowser().storage.from('product-images').getPublicUrl(path).data.publicUrl : '';

  return (
    <div className="container section">
      <div className="page-hero" style={{background: 'var(--soft)', padding: '40px 20px', borderRadius: 16, marginBottom: 40}}>
        <div className="eyebrow"><Store size={14}/> {t('متجر دنتيفاي','Dentify Store')}</div>
        <h1>{t('أدوات ومستلزمات الأسنان','Dental Tools & Kits')}</h1>
        <p>{t('جميع ما يحتاجه طالب وممارس طب الأسنان بأعلى جودة.','Everything a dental student and practitioner needs with the highest quality.')}</p>
      </div>

      {loading ? <div className="spinner" style={{margin:'50px auto'}}/> : products.length === 0 ? (
        <div className="empty-state">
          <Package size={30}/>
          <h3>{t('المتجر قيد التجهيز','Store is empty')}</h3>
        </div>
      ) : (
        <>
          {/* فلاتر الأقسام */}
          {categories.length > 1 && (
            <div style={{display:'flex', gap: 10, flexWrap:'wrap', marginBottom: 30, justifyContent: 'center'}}>
              {categories.map(cat => (
                <button 
                  key={cat} 
                  className={`btn ${activeCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                  style={{borderRadius: 50, padding: '6px 16px'}}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'all' ? t('الكل', 'All') : cat}
                </button>
              ))}
            </div>
          )}

          <div className="course-grid">
            {filteredProducts.map(p => (
              <article className="course-card" key={p.id}>
                <Link href={`/store/${encodeURIComponent(p.slug)}`} className="course-cover" style={{display: 'block'}}>
                  {p.image_path ? <img src={getProductImg(p.image_path)} alt={p.title_en} loading="lazy" style={{objectFit: 'contain', padding: 10}}/> : <Package size={54} color="var(--primary)"/>}
                  <span className="cover-badge" style={{background: 'var(--primary)'}}>{p.category || t('منتج','Product')}</span>
                </Link>
                <div className="course-body">
                  <h3><Link href={`/store/${encodeURIComponent(p.slug)}`}>{lang==='ar'?(p.title_ar||p.title_en):(p.title_en||p.title_ar)}</Link></h3>
                  <p style={{fontSize: 13, color: 'var(--muted)', marginTop: 8}}>{lang==='ar'?(p.description_ar||p.description_en):(p.description_en||p.description_ar)}</p>
                  
                  {((p.colors && p.colors.length > 0) || (p.sizes && p.sizes.length > 0)) && (
                    <small style={{display: 'block', color: 'var(--primary)', fontWeight: 'bold', fontSize: 10, marginBottom: 5}}>
                      {t('خيارات متعددة متاحة', 'Multiple options available')}
                    </small>
                  )}

                  <div className="course-meta" style={{marginTop: 'auto', paddingTop: 15}}>
                    <div><strong style={{fontSize: 18}}>{money(p.price_jod)}</strong></div>
                    <div>
                      {/* التعديل صار هون: إخفاء الرقم كلياً وإظهار الحالة بس */}
                      <small style={{color: p.stock_quantity > 0 ? 'var(--primary)' : 'red', fontWeight: 'bold'}}>
                        {p.stock_quantity > 0 ? t('متوفر','In Stock') : t('نفدت الكمية','Out of stock')}
                      </small>
                    </div>
                  </div>
                  
                  <div className="card-actions" style={{marginTop: 15, display: 'flex', gap: 8}}>
                    <Link className="btn btn-outline" href={`/store/${encodeURIComponent(p.slug)}`} style={{flex: 1, padding: 10}}>{t('التفاصيل','Details')}</Link>
                    
                    {p.stock_quantity > 0 ? (
                      <button className="btn btn-primary" style={{flex: 1, padding: 10}} disabled={adding===p.id} onClick={()=>handleAddToCartClick(p)}>
                        {adding===p.id ? <div className="spinner" style={{width:15,height:15,borderWidth:2}}></div> : <><ShoppingCart size={16}/> {t('أضف للسلة','Add to cart')}</>}
                      </button>
                    ) : (
                      <button className="btn btn-outline" style={{flex: 1, borderColor: 'red', color: 'red', padding: 10}} disabled>{t('نفد','Out')}</button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}