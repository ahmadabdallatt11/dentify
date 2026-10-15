'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  HeartPulse,
  Package,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Users,
  FileText, // ضفنا أيقونة الواجبات هون
} from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { publicImage, money } from '@/lib/utils';
import { useApp } from '@/components/Providers';

export default function Home() {
  const { lang, t, user, toast, profile } = useApp();
  const [courses, setCourses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const storeRail = useRef<HTMLDivElement>(null);
  const courseRail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const sb = supabaseBrowser();
    const minimumSplash = new Promise<void>((resolve) => window.setTimeout(resolve, 900));

    Promise.all([
      sb.from('courses').select('*').eq('is_published', true).order('sort_order', { ascending: true }).limit(3),
      sb.from('products').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(4),
    ]).then(async ([c, p]) => {
      if (!active) return;
      setCourses(c.data || []);
      setProducts(p.data || []);
      await minimumSplash;
      if (!active) return;
      setLoading(false);
    }).catch(async (error: unknown) => {
      console.error('Dentify homepage loading failed:', error);
      await minimumSplash;
      if (!active) return;
      setCourses([]);
      setProducts([]);
      setLoading(false);
    });

    return () => { active = false; };
  }, []);

  async function addToCart(item: any, type: 'course' | 'product') {
    if (!user) {
      toast(t('سجّل الدخول أولاً لإضافة العناصر للسلة', 'Sign in to add this item to your cart'), 'info');
      location.href = '/login?next=/cart';
      return;
    }
    if (type === 'product' && item.stock_quantity < 1) {
      toast(t('عذراً، نفدت الكمية', 'Sorry, out of stock'), 'error');
      return;
    }
    setAdding(item.id);
    const sb = supabaseBrowser();
    const payload = type === 'course'
      ? { user_id: user.id, course_id: item.id }
      : { user_id: user.id, product_id: item.id, quantity: 1 };
const { error } = await sb.from('cart_items').insert(payload as any);    setAdding(null);
    if (error) {
      if (error.code === '23505') toast(t('العنصر موجود بالفعل في السلة', 'Item is already in cart'), 'error');
      else toast(error.message, 'error');
    } else {
      toast(t('تمت الإضافة للسلة', 'Added to cart successfully'), 'success');
      window.dispatchEvent(new Event('cart-updated'));
    }
  }

  const getProductImg = (path: string) => path
    ? supabaseBrowser().storage.from('product-images').getPublicUrl(path).data.publicUrl
    : '';

  function scrollRail(rail: HTMLDivElement | null, direction: -1 | 1) {
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>('.dh-product-card, .dh-course-card');
    const step = card ? card.offsetWidth + 22 : 340;
    rail.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  const isArabic = lang === 'ar';

  return (
    <>
      {loading && (
        <div className="dh-loading-screen" role="status" aria-live="polite" dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="dh-loader-glow dh-loader-glow-one" />
          <div className="dh-loader-glow dh-loader-glow-two" />
          <div className="dh-loader-content">
            <div className="dh-loader-emblem">
              <span className="dh-loader-orbit dh-loader-orbit-one" />
              <span className="dh-loader-orbit dh-loader-orbit-two" />
              <span className="dh-loader-logo"><HeartPulse size={31} strokeWidth={1.8} /></span>
              <span className="dh-loader-spark"><Sparkles size={14} /></span>
            </div>
            <div className="dh-loader-wordmark">Dentify<span>.</span></div>
            <p>{t('نحضّر لك تجربة تعلّم متكاملة', 'Preparing your learning experience')}</p>
            <div className="dh-loader-track"><span /></div>
            <div className="dh-loader-footnote"><span />{t('تعلّم. تطوّر. تميّز.', 'Learn. Practice. Excel.')}</div>
          </div>
        </div>
      )}
      <main className={`dh-home ${loading ? 'dh-is-loading' : 'dh-is-ready'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      
      {/* Hero */}
      <section className="dh-hero">
        <div className="dh-hero-orb dh-hero-orb-one" />
        <div className="dh-hero-orb dh-hero-orb-two" />
        <div className="dh-shell dh-hero-grid">
          <div className="dh-hero-copy">
            <div className="dh-eyebrow"><span className="dh-eyebrow-icon"><Sparkles size={14} /></span>{t('المنصة الأولى والأقوى لطب الأسنان', 'The #1 Elite Dental Platform')}</div>
            <h1>
              {t('طوّر مهاراتك،', 'Build your skills,')}
              <span className="dh-gradient-text">{t('وجهّز عيادتك بالكامل.', 'and equip your clinic.')}</span>
            </h1>
            <p className="dh-hero-description">
              {t('نستثمر في أطباء المستقبل. دنتيفاي توفر لك بيئة متكاملة تجمع بين الكورسات التأسيسية القوية والأدوات المعتمدة، لتكون جاهز للعيادات الجامعية بكل احترافية.', 'Investing in the dentists of tomorrow. Dentify provides an integrated environment combining strong foundational courses with certified tools, getting you ready for university clinics with utmost professionalism.')}
            </p>
            <div className="dh-hero-actions">
              <Link href="/store" className="dh-button dh-button-primary">{t('تصفح المتجر', 'Browse store')}<Package size={19} /></Link>
              <Link href="/courses" className="dh-button dh-button-light">{t('استكشف الكورسات', 'Explore courses')}<ArrowUpLeft size={19} /></Link>
            </div>
            <div className="dh-hero-metrics">
              <span className="dh-metric-divider" />
              <div className="dh-metric-icon dh-metric-icon-green"><ShieldCheck size={19} /></div>
              <div className="dh-metric-copy"><strong>100%</strong><span>{t('ضمان الجودة', 'Quality Guarantee')}</span></div>
            </div>
          </div>

          <div className="dh-hero-art" aria-label={t('رمز بصري لمنصة دنتيفاي لطب الأسنان', 'Dentify dental learning visual')}>
            <div className="dh-art-halo" />
            <div className="dh-art-grid" />
            <div className="dh-orbit-ring dh-orbit-ring-one">
              <span className="dh-orbit-node dh-orbit-node-book"><BookOpen size={19} /></span>
              <span className="dh-orbit-node dh-orbit-node-shield"><ShieldCheck size={18} /></span>
            </div>
            <div className="dh-orbit-ring dh-orbit-ring-two">
              <span className="dh-orbit-satellite" />
            </div>
            <div className="dh-tooth-core">
              <div className="dh-tooth-aura" />
              <svg className="dh-tooth-illustration" viewBox="0 0 240 260" role="img" aria-label={t('رسم توضيحي لسن', 'Illustrated tooth')}>
                <defs>
                  <linearGradient id="dhToothSurface" x1="35" y1="20" x2="198" y2="235" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="0.42" stopColor="#f5fffd" />
                    <stop offset="0.73" stopColor="#c8eee7" />
                    <stop offset="1" stopColor="#7fc9be" />
                  </linearGradient>
                  <linearGradient id="dhToothSide" x1="120" y1="70" x2="195" y2="223" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#d2f1eb" />
                    <stop offset="1" stopColor="#4a9b91" />
                  </linearGradient>
                  <linearGradient id="dhToothShine" x1="65" y1="45" x2="143" y2="154" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                  <filter id="dhToothShadow" x="5" y="0" width="230" height="260" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="14" stdDeviation="11" floodColor="#147e73" floodOpacity="0.18" />
                  </filter>
                </defs>
                <path filter="url(#dhToothShadow)" d="M120 33 C99 17 73 20 56 37 C34 58 35 91 48 122 C58 146 69 161 75 187 C80 208 83 229 96 231 C109 233 112 198 120 178 C128 198 131 233 144 231 C157 229 160 208 165 187 C171 161 182 146 192 122 C205 91 206 58 184 37 C167 20 141 17 120 33 Z" fill="url(#dhToothSurface)" stroke="#b8e3dc" strokeWidth="2" />
                <path d="M120 41 C106 32 89 35 75 45 C59 57 57 79 66 102 C74 122 87 133 91 155 C94 171 96 189 103 190 C110 190 113 160 120 146 C127 160 130 190 137 190 C144 189 146 171 149 155 C153 133 166 122 174 102 C183 79 181 57 165 45 C151 35 134 32 120 41 Z" fill="#ffffff" fillOpacity="0.18" />
                <path d="M120 34 C139 20 166 24 181 42 C196 60 194 83 183 110 C173 135 161 153 156 181 C151 207 148 226 140 229 C132 231 128 202 120 179 Z" fill="url(#dhToothSide)" fillOpacity="0.4" />
                <path d="M64 55 C76 39 94 37 106 43 C84 49 73 67 75 85 C77 103 88 117 91 128 C72 111 55 81 64 55 Z" fill="url(#dhToothShine)" />
                <path d="M84 54 C95 47 107 48 115 53" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.82" />
                <path d="M120 44 C113 76 113 106 120 137" fill="none" stroke="#83cfc3" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.7" />
              </svg>
              <span className="dh-tooth-scan-line" />
              <span className="dh-tooth-crosshair dh-crosshair-one" />
              <span className="dh-tooth-crosshair dh-crosshair-two" />
            </div>
           
            <div className="dh-float-card dh-float-certified"><span className="dh-float-icon"><Award size={19} /></span><span><b>{t('محتوى أكاديمي', 'Academic learning')}</b><small>{t('لخطوتك القادمة', 'For your next step')}</small></span></div>
            <div className="dh-float-card dh-float-kit"><span className="dh-float-icon dh-float-icon-dark"><Package size={19} /></span><span><b>{t('أدواتك بمكان واحد', 'Your essentials, together')}</b><small>{t('تعلّم وجهّز بسهولة', 'Learn and equip with ease')}</small></span></div>
          </div>
        </div>
        <div className="dh-hero-bottom-line" />
      </section>

      {/* Trust strip */}
      <section className="dh-trust-strip">
        <div className="dh-shell dh-trust-inner">
          <p>{t('يثق بنا طلاب وأطباء من أعرق الجامعات', 'Trusted by students and doctors from top universities')}</p>
          <div className="dh-universities"><span>JUST</span><i /><span>JU</span><i /><span>Hashemite</span><i /><span>Yarmouk</span><i /><span>Mutah</span></div>
        </div>
      </section>

      {/* Store preview */}
      <section className="dh-section dh-store-section" id="store-preview">
        <div className="dh-shell">
          <div className="dh-section-heading">
            <div className="dh-section-heading-copy">
              <div className="dh-section-kicker"><span><Package size={15} /></span>{t('متجر دنتيفاي', 'Dentify Store')}</div>
              <h2>{t('أحدث الأدوات والمستلزمات', 'Latest Tools & Kits')}</h2>
              <p>{t('كل ما تحتاجه لتجهيز رحلتك العملية، مختار بعناية.', 'The essentials for your practical journey, carefully selected.')}</p>
            </div>
            <div className="dh-section-tools">
              <div className="dh-rail-controls">
                <button type="button" className="dh-rail-button" onClick={() => scrollRail(storeRail.current, -1)} aria-label={t('تمرير لليسار', 'Scroll left')}><ChevronLeft size={19} /></button>
                <button type="button" className="dh-rail-button" onClick={() => scrollRail(storeRail.current, 1)} aria-label={t('تمرير لليمين', 'Scroll right')}><ChevronRight size={19} /></button>
              </div>
              <Link className="dh-text-link" href="/store">{t('تصفح كل المتجر', 'View all products')}<ArrowUpLeft size={16} /></Link>
            </div>
          </div>

          {loading ? (
            <div className="dh-horizontal-rail dh-loading-rail">{[1, 2, 3, 4].map((n) => <div key={n} className="dh-product-skeleton" />)}</div>
          ) : products.length === 0 ? (
            <div className="dh-empty-state"><span className="dh-empty-icon"><Package size={29} /></span><h3>{t('المتجر قيد التجهيز', 'Store is getting ready')}</h3><p>{t('يتم الآن تزويد المتجر بأفضل المنتجات...', 'Stocking up the store with the best products...')}</p><Link href="/store" className="dh-button dh-button-light">{t('زيارة المتجر', 'Visit the store')}<ArrowUpLeft size={17} /></Link></div>
          ) : (
            <div className="dh-horizontal-rail" ref={storeRail}>
              {products.map((p) => (
                <article className="dh-product-card" key={p.id}>
                  <div className="dh-product-image-wrap">
                    {p.image_path ? <img src={getProductImg(p.image_path)} alt={lang === 'ar' ? (p.title_ar || p.title_en) : (p.title_en || p.title_ar)} loading="lazy" /> : <div className="dh-product-placeholder"><Package size={47} strokeWidth={1.3} /></div>}
                    <span className="dh-product-category">{p.category || t('مستلزمات طبية', 'Medical Supplies')}</span>
                    <span className={`dh-stock-dot ${p.stock_quantity > 0 ? 'is-in-stock' : 'is-out-stock'}`} title={p.stock_quantity > 0 ? t('متوفر للشحن', 'In Stock') : t('نفدت الكمية', 'Out of stock')} />
                  </div>
                  <div className="dh-card-content">
                    <div className="dh-card-overline"><span>{t('اختيار دنتيفاي', 'DENTIFY PICK')}</span><span className="dh-mini-stars"><Star size={12} fill="currentColor" /> 5.0</span></div>
                    <h3>{lang === 'ar' ? (p.title_ar || p.title_en) : (p.title_en || p.title_ar)}</h3>
                    <div className="dh-product-bottom"><strong>{money(p.price_jod)}</strong>{profile?.role === 'admin' ? <small className={`dh-stock-label ${p.stock_quantity > 0 ? 'is-in-stock' : 'is-out-stock'}`}>{t('المخزون:', 'Stock:')} {p.stock_quantity}</small> : <span className={`dh-stock-label ${p.stock_quantity > 0 ? 'is-in-stock' : 'is-out-stock'}`}>{p.stock_quantity > 0 ? t('متوفر للشحن', 'In Stock') : t('نفدت الكمية', 'Out of stock')}</span>}</div>
                    {p.stock_quantity > 0 ? (
                      <button className="dh-add-button" type="button" disabled={adding === p.id} onClick={() => addToCart(p, 'product')}>
                        {adding === p.id ? <span className="dh-button-spinner" /> : <><ShoppingCart size={17} />{t('إضافة للسلة', 'Add to cart')}</>}
                      </button>
                    ) : <button className="dh-add-button dh-add-button-disabled" type="button" disabled>{t('نفدت الكمية', 'Out of stock')}</button>}
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="dh-mobile-hint"><span />{t('اسحب لاستكشاف المزيد', 'Swipe to explore more')}<span /></div>
        </div>
      </section>

      {/* --- تمت إضافة بانر الواجبات هنا بناءً على طلبك --- */}
      <section className="dh-section" style={{ background: '#fff', padding: '40px 0' }}>
        <div className="dh-shell">
          <div style={{ background: 'linear-gradient(135deg, var(--dh-teal) 0%, var(--dh-ink) 100%)', borderRadius: '32px', padding: '50px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '30px', boxShadow: '0 20px 40px rgba(15, 118, 110, 0.2)' }}>
            <div style={{ flex: '1 1 500px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', color: '#5eead4', padding: '6px 16px', borderRadius: '50px', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '20px', border: '1px solid rgba(45, 212, 191, 0.2)' }}>
                <FileText size={16} /> {t('خدمة جديدة', 'New Service')}
              </div>
              <h2 style={{ color: '#fff', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', margin: '0 0 15px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                {t('عالق بواجب أو مشروع؟', 'Stuck with an assignment?')}
              </h2>
              <p style={{ color: '#cbd5e1', fontSize: '1.15rem', margin: 0, lineHeight: 1.7, maxWidth: '600px' }}>
                {t('لا تضيع وقتك. ارسل لنا تفاصيل الواجب أو البحث، وسيقوم فريقنا الطبي المتخصص بتجهيز الحل النموذجي لك بأسرع وقت وأعلى جودة.', 'Don\'t waste your time. Send us the details, and our specialized medical team will prepare the perfect solution for you in no time.')}
              </p>
            </div>
            <div>
              <Link href="/assignments" className="dh-button" style={{ background: '#fff', color: 'var(--dh-ink)', minHeight: '56px', padding: '0 36px', fontSize: '1.15rem', fontWeight: 800, borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                {t('اطلب حلاً الآن', 'Request a Solution')} <ArrowUpLeft size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Courses preview */}
      <section className="dh-section dh-courses-section" id="courses-preview" style={{ background: '#f7faf9' }}>
        <div className="dh-shell">
          <div className="dh-section-heading">
            <div className="dh-section-heading-copy">
              <div className="dh-section-kicker"><span><BookOpen size={15} /></span>{t('أكاديمية دنتيفاي', 'Dentify Academy')}</div>
              <h2>{t('كورسات تصنع الفرق', 'Courses that make a difference')}</h2>
              <p>{t('خطوات عملية تساعدك تطوّر معرفتك وثقتك المهنية.', 'Practical learning to grow your knowledge and confidence.')}</p>
            </div>
            <div className="dh-section-tools">
              <div className="dh-rail-controls">
                <button type="button" className="dh-rail-button" onClick={() => scrollRail(courseRail.current, -1)} aria-label={t('تمرير لليسار', 'Scroll left')}><ChevronLeft size={19} /></button>
                <button type="button" className="dh-rail-button" onClick={() => scrollRail(courseRail.current, 1)} aria-label={t('تمرير لليمين', 'Scroll right')}><ChevronRight size={19} /></button>
              </div>
              <Link className="dh-text-link" href="/courses">{t('عرض كل الكورسات', 'View all courses')}<ArrowUpLeft size={16} /></Link>
            </div>
          </div>

          {loading ? (
            <div className="dh-horizontal-rail dh-loading-rail">{[1, 2, 3].map((n) => <div key={n} className="dh-course-skeleton" />)}</div>
          ) : courses.length === 0 ? (
            <div className="dh-empty-state dh-course-empty"><span className="dh-empty-icon"><GraduationCap size={29} /></span><h3>{t('كورسات جديدة قريباً', 'New courses coming soon')}</h3><p>{t('نعمل على تجهيز محتوى يساعدك تتقدم في مسيرتك المهنية.', 'We are preparing learning content to support your professional journey.')}</p><Link href="/courses" className="dh-button dh-button-light">{t('استكشف الأكاديمية', 'Explore the academy')}<ArrowUpLeft size={17} /></Link></div>
          ) : (
            <div className="dh-horizontal-rail" ref={courseRail}>
              {courses.map((c) => (
                <article className="dh-course-card" key={c.id}>
                  <Link href={`/courses/${encodeURIComponent(c.slug)}`} className="dh-course-image-wrap">
                    {c.image_path && publicImage(c.image_path) ? <img src={publicImage(c.image_path)} alt={lang === 'ar' ? (c.title_ar || c.title_en) : (c.title_en || c.title_ar)} loading="lazy" /> : <div className="dh-course-placeholder"><GraduationCap size={54} strokeWidth={1.2} /></div>}
                    <span className="dh-course-badge">{t('كورس تفاعلي', 'INTERACTIVE COURSE')}</span>
                    <span className="dh-course-play"><ArrowUpLeft size={20} /></span>
                  </Link>
                  <div className="dh-card-content dh-course-content">
                    <div className="dh-card-overline"><span>{t('أكاديمية دنتيفاي', 'DENTIFY ACADEMY')}</span><span className="dh-course-access-chip"><CheckCircle2 size={12} />{t('وصول مدى الحياة', 'LIFETIME ACCESS')}</span></div>
                    <h3><Link href={`/courses/${encodeURIComponent(c.slug)}`}>{lang === 'ar' ? (c.title_ar || c.title_en) : (c.title_en || c.title_ar)}</Link></h3>
                    <p className="dh-course-description">{lang === 'ar' ? (c.description_ar || c.description_en) : (c.description_en || c.description_ar)}</p>
                    <div className="dh-course-details"><div><strong>{money(c.price_jod)}</strong><small>{t('سعر الكورس', 'Course price')}</small></div><span className="dh-instructor"><b>{c.instructor_name || t('فريق Dentify', 'Dentify team')}</b><small><Clock3 size={13} />{t('وصول مدى الحياة', 'Lifetime access')}</small></span></div>
                    <div className="dh-course-actions">
                      <Link className="dh-button dh-button-light" href={`/courses/${encodeURIComponent(c.slug)}`}>{t('التفاصيل', 'Details')}</Link>
                      <button className="dh-button dh-button-primary" type="button" disabled={adding === c.id} onClick={() => addToCart(c, 'course')}>{adding === c.id ? <span className="dh-button-spinner" /> : <>{t('سجل الآن', 'Enroll Now')}<ArrowUpLeft size={16} /></>}</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="dh-mobile-hint"><span />{t('اسحب لاستكشاف المزيد', 'Swipe to explore more')}<span /></div>
        </div>
      </section>

      {/* Why Dentify */}
      <section className="dh-why-section">
        <div className="dh-why-glow" />
        <div className="dh-shell dh-why-inner">
          <div className="dh-why-heading"><div className="dh-section-kicker dh-section-kicker-inverse"><span><Sparkles size={15} /></span>{t('مصممة لرحلتك المهنية', 'BUILT FOR YOUR JOURNEY')}</div><h2>{t('ليش دنتيفاي؟', 'Why Dentify?')}</h2><p>{t('بنينا المنصة عشان نختصر عليك التعب، ونجمعلك كل اللي بتحتاجه كطالب أو طبيب أسنان بمكان واحد وبأعلى المعايير العالمية.', 'We built this platform to save your time and gather everything a dental student or doctor needs in one place with the highest global standards.')}</p></div>
          <div className="dh-feature-grid">
            <article className="dh-feature-card"><div className="dh-feature-icon"><GraduationCap size={25} /></div><h3>{t('محتوى أكاديمي دقيق', 'Accurate Academic Content')}</h3><p>{t('كورسات مصممة بعناية من أطباء ممارسين لربط الجانب النظري بالعملي مباشرة، وبدون حشو.', 'Carefully designed courses by practicing doctors to bridge theory and practice directly, without fluff.')}</p><span className="dh-feature-number">01</span></article>
            <article className="dh-feature-card"><div className="dh-feature-icon"><Package size={25} /></div><h3>{t('مستلزمات مضمونة 100%', '100% Guaranteed Supplies')}</h3><p>{t('أدوات ومواد طب أسنان أصلية ومكفولة، تصلك لباب بيتك أو عيادتك أينما كنت وفي أسرع وقت.', 'Original and guaranteed dental tools and materials, delivered to your door or clinic wherever you are quickly.')}</p><span className="dh-feature-number">02</span></article>
            <article className="dh-feature-card"><div className="dh-feature-icon"><ShieldCheck size={25} /></div><h3>{t('دعم مستمر ومتابعة', 'Continuous Support')}</h3><p>{t('فريقنا معك خطوة بخطوة، سواء للاستفسارات العلمية بالكورسات أو لمتابعة طلبات المتجر الخاصة بك.', 'Our team is with you step by step, whether for scientific inquiries or to track your store orders.')}</p><span className="dh-feature-number">03</span></article>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="dh-final-section">
        <div className="dh-shell">
          <div className="dh-final-card"><div className="dh-final-decoration dh-final-decoration-one" /><div className="dh-final-decoration dh-final-decoration-two" />
            <div className="dh-final-symbol"><HeartPulse size={28} /></div>
            <div className="dh-final-kicker">{t('مستقبلك المهني يبدأ بخطوة', 'YOUR NEXT STEP STARTS HERE')}</div>
            <h2>{t('جاهز ترتقي بمستواك الطبي؟', 'Ready to level up medically?')}</h2>
            <p>{t('أنشئ حسابك الآن مجاناً، وانضم لأقوى مجتمع طبي لأطباء وطلاب الأسنان على منصة دنتيفاي.', 'Create your free account now and join the strongest medical community for dental students and doctors on Dentify.')}</p>
            <div className="dh-final-actions"><Link href={user ? '/profile' : '/login?mode=signup'} className="dh-button dh-button-primary">{t('ابدأ رحلتك مجاناً', 'Start your journey for free')}<ArrowUpLeft size={19} /></Link><Link href="/store" className="dh-final-secondary-link">{t('أو تصفح المستلزمات', 'Or browse supplies')}<ArrowUpLeft size={15} /></Link></div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .dh-loading-screen { position: fixed; z-index: 99999; inset: 0; display: grid; place-items: center; overflow: hidden; color: #143238; background: radial-gradient(ellipse at 50% 40%, #ffffff 0%, #f7fbfa 45%, #edf7f4 100%); animation: dhSplashIn .25s ease-out both; }
        .dh-loader-glow { position: absolute; width: 380px; height: 380px; border-radius: 50%; filter: blur(65px); pointer-events: none; }.dh-loader-glow-one { top: -190px; inset-inline-end: -110px; background: rgba(36,166,153,.16); }.dh-loader-glow-two { bottom: -230px; inset-inline-start: -85px; background: rgba(8,145,178,.12); }
        .dh-loader-content { position: relative; z-index: 1; display: flex; align-items: center; flex-direction: column; padding: 30px; text-align: center; }
        .dh-loader-emblem { position: relative; display: grid; place-items: center; width: 108px; height: 108px; margin-bottom: 24px; }
        .dh-loader-orbit { position: absolute; inset: 4px; border: 1px solid rgba(15,118,110,.24); border-radius: 32px; transform: rotate(45deg); animation: dhLoaderOrbit 2.8s ease-in-out infinite; }.dh-loader-orbit-two { inset: 13px; border-style: dashed; border-color: rgba(15,118,110,.32); border-radius: 50%; animation-direction: reverse; animation-duration: 4s; }
        .dh-loader-logo { position: relative; display: grid; place-items: center; width: 67px; height: 67px; border: 1px solid rgba(255,255,255,.6); border-radius: 23px; color: #fff; background: linear-gradient(145deg, #20b2a2, #075f59); box-shadow: 0 15px 32px rgba(15,118,110,.24); animation: dhLoaderPulse 1.7s ease-in-out infinite; }
        .dh-loader-spark { position: absolute; top: 0; inset-inline-end: 1px; display: grid; place-items: center; width: 28px; height: 28px; border: 3px solid #f5fbf9; border-radius: 50%; color: #0d8d80; background: #d8f3ed; }
        .dh-loader-wordmark { color: #143238; font-size: 2rem; font-weight: 950; letter-spacing: -1.4px; }.dh-loader-wordmark span { color: #15998c; }
        .dh-loader-content > p { margin: 9px 0 23px; color: #75898c; font-size: .91rem; font-weight: 650; }
        .dh-loader-track { width: 180px; height: 4px; overflow: hidden; border-radius: 99px; background: #dcece8; }.dh-loader-track > span { display: block; width: 42%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #08766c, #34c3b2); animation: dhLoaderProgress 1.1s ease-in-out infinite; }
        .dh-loader-footnote { display: inline-flex; align-items: center; gap: 8px; margin-top: 19px; color: #9aabaa; font-size: .68rem; font-weight: 850; letter-spacing: .7px; }.dh-loader-footnote span { width: 6px; height: 6px; border-radius: 50%; background: #20ad9d; box-shadow: 0 0 0 4px rgba(32,173,157,.12); }
        .dh-home.dh-is-ready .dh-hero-copy { animation: dhReveal .58s cubic-bezier(.2,.7,.2,1) both; }.dh-home.dh-is-ready .dh-hero-art { animation: dhReveal .68s cubic-bezier(.2,.7,.2,1) .06s both; }
        .dh-home {
          --dh-ink: var(--secondary, #0f172a);
          --dh-teal: var(--primary, #0f766e);
          --dh-teal-deep: #075e59;
          --dh-muted: #687787;
          --dh-line: #e7eeef;
          color: var(--dh-ink);
          background: #fff;
          overflow: clip;
          font-family: inherit;
        }
        .dh-home *, .dh-home *::before, .dh-home *::after { box-sizing: border-box; }
        .dh-home a { text-decoration: none; }
        .dh-shell { width: min(1180px, calc(100% - 48px)); margin-inline: auto; }
        .dh-hero { position: relative; isolation: isolate; padding: 76px 0 65px; background: linear-gradient(130deg, #f7faf9 0%, #fff 52%, #f0f8f6 100%); }
        .dh-hero-grid { position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1.03fr) minmax(370px, .97fr); align-items: center; gap: clamp(35px, 6vw, 78px); }
        .dh-hero-orb { position: absolute; z-index: -1; border-radius: 50%; pointer-events: none; filter: blur(2px); }
        .dh-hero-orb-one { width: 350px; height: 350px; top: -170px; inset-inline-end: 6%; background: rgba(36, 166, 153, .075); }
        .dh-hero-orb-two { width: 240px; height: 240px; bottom: -110px; inset-inline-start: -90px; background: rgba(8, 145, 178, .055); }
        .dh-hero-copy { max-width: 625px; }
        .dh-eyebrow { display: inline-flex; align-items: center; gap: 9px; padding: 8px 13px 8px 14px; border: 1px solid rgba(15,118,110,.13); border-radius: 100px; color: var(--dh-teal-deep); background: rgba(222, 243, 239, .72); font-size: .84rem; font-weight: 850; }
        .dh-eyebrow-icon { width: 25px; height: 25px; display: grid; place-items: center; border-radius: 50%; color: var(--dh-teal); background: #fff; }
        .dh-hero h1 { margin: 23px 0 18px; color: var(--dh-ink); font-size: clamp(2.6rem, 5vw, 4.65rem); font-weight: 950; letter-spacing: -.065em; line-height: 1.08; }
        .dh-gradient-text { display: block; margin-top: 8px; padding-bottom: 5px; color: var(--dh-teal); background: linear-gradient(100deg, #087d74, #21a99a 70%, #6abbb0); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .dh-hero-description { max-width: 590px; margin: 0; color: #687785; font-size: 1.075rem; line-height: 1.95; }
        .dh-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 29px; }
        .dh-button { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 48px; padding: 0 19px; border: 1px solid transparent; border-radius: 13px; font: inherit; font-size: .93rem; font-weight: 850; line-height: 1.2; text-align: center; cursor: pointer; transition: transform .2s, box-shadow .2s, background .2s, border-color .2s; }
        .dh-button:hover:not(:disabled) { transform: translateY(-2px); }
        .dh-button:focus-visible, .dh-nav-link:focus-visible, .dh-rail-button:focus-visible, .dh-add-button:focus-visible { outline: 3px solid rgba(20, 184, 166, .38); outline-offset: 3px; }
        .dh-button:disabled { cursor: not-allowed; opacity: .7; }
        .dh-button-primary { color: #fff; background: linear-gradient(135deg, #0f8b80, #08635d); box-shadow: 0 10px 23px rgba(15,118,110,.20); }
        .dh-button-primary:hover:not(:disabled) { box-shadow: 0 13px 26px rgba(15,118,110,.26); }
        .dh-button-light { color: #243641; background: #fff; border-color: #e0e8e9; box-shadow: 0 4px 12px rgba(15,23,42,.035); }
        .dh-button-light:hover:not(:disabled) { border-color: rgba(15,118,110,.34); background: #f8fcfb; }
        .dh-hero-metrics { display: flex; align-items: center; gap: 11px; margin-top: 35px; }
        .dh-metric-icon { display: grid; place-items: center; flex: 0 0 40px; width: 40px; height: 40px; border-radius: 13px; color: #087c9b; background: #e2f5fa; }
        .dh-metric-icon-green { color: #0d8b68; background: #e4f7ec; }
        .dh-metric-copy { display: flex; flex-direction: column; gap: 2px; }
        .dh-metric-copy strong { color: var(--dh-ink); font-size: 1.08rem; font-weight: 950; }
        .dh-metric-copy span { color: #84919c; font-size: .78rem; font-weight: 650; }
        .dh-metric-divider { width: 1px; height: 33px; margin: 0 7px; background: #dce6e5; }
        .dh-hero-art { position: relative; display: grid; place-items: center; min-height: 505px; isolation: isolate; }
        .dh-art-halo { position: absolute; z-index: -2; width: 83%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle, rgba(22,163,148,.17), rgba(22,163,148,.03) 58%, transparent 70%); }
        .dh-art-grid { position: absolute; z-index: -1; width: 90%; height: 83%; border-radius: 35px; background:-image: radial-gradient(rgba(15,118,110,.18) .8px, transparent .8px); background-size: 19px 19px; opacity: .42; mask-image: radial-gradient(ellipse, #000 20%, transparent 78%); }
        .dh-orbit-ring { position: absolute; z-index: -1; left: 50%; top: 45%; aspect-ratio: 1; border: 1px solid rgba(31, 145, 132, .19); border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; }
        .dh-orbit-ring-one { width: 82%; animation: dhOrbit 32s linear infinite; }
        .dh-orbit-ring-two { width: 66%; border-style: dashed; border-color: rgba(30, 147, 133, .28); animation: dhOrbitReverse 42s linear infinite; }
        .dh-orbit-node { position: absolute; display: grid; place-items: center; width: 43px; height: 43px; border: 1px solid rgba(255,255,255,.9); border-radius: 15px; color: #08796f; background: #fff; box-shadow: 0 11px 25px rgba(17,75,75,.12); animation: dhOrbitCounter 32s linear infinite; }
        .dh-orbit-node-book { top: 10%; left: 7%; }.dh-orbit-node-shield { right: 4%; bottom: 15%; animation-delay: -12s; }
        .dh-orbit-satellite { position: absolute; top: 14%; right: 6%; width: 12px; height: 12px; border: 3px solid #fff; border-radius: 50%; background: #20aa9c; box-shadow: 0 0 0 7px rgba(32,170,156,.13); }
        .dh-tooth-core { position: relative; z-index: 1; display: grid; place-items: center; width: min(70%, 320px); aspect-ratio: .95; margin-top: -15px; isolation: isolate; animation: dhToothFloat 5.5s ease-in-out infinite; }
        .dh-tooth-aura { position: absolute; z-index: -1; inset: 6%; border-radius: 43% 57% 56% 44% / 43% 43% 57% 57%; background: radial-gradient(ellipse at 48% 42%, rgba(115,221,206,.58), rgba(54,175,162,.15) 44%, transparent 72%); filter: blur(9px); }
        .dh-tooth-illustration { position: relative; width: 100%; height: auto; overflow: visible; filter: drop-shadow(0 24px 24px rgba(19,93,88,.16)); }
        .dh-tooth-scan-line { position: absolute; top: 23%; left: 8%; right: 8%; height: 2px; border-radius: 50%; background: linear-gradient(90deg, transparent, #35cbbb, #fff, #35cbbb, transparent); box-shadow: 0 0 13px rgba(47,197,181,.78); opacity: .75; animation: dhScan 4s ease-in-out infinite; }
        .dh-tooth-crosshair { position: absolute; width: 13px; height: 13px; border: 1px solid rgba(14,142,129,.52); border-radius: 50%; }
        .dh-tooth-crosshair::before, .dh-tooth-crosshair::after { content: ''; position: absolute; background: rgba(14,142,129,.6); }
        .dh-tooth-crosshair::before { width: 20px; height: 1px; top: 5px; left: -5px; }.dh-tooth-crosshair::after { width: 1px; height: 20px; top: -5px; left: 5px; }
        .dh-crosshair-one { top: 23%; right: 9%; }.dh-crosshair-two { left: 2%; bottom: 23%; transform: scale(.75); }
        .dh-float-card { position: absolute; z-index: 2; display: flex; align-items: center; gap: 10px; max-width: 230px; padding: 12px 15px; border: 1px solid rgba(235,243,241,.9); border-radius: 16px; background: rgba(255,255,255,.96); box-shadow: 0 15px 35px rgba(15,45,49,.1); animation: dhFloat 5s ease-in-out infinite; }
        .dh-float-certified { top: 8%; inset-inline-end: -1%; }
        .dh-float-kit { bottom: 8%; inset-inline-start: -2%; animation-delay: -2.5s; }
        .dh-float-icon { display: grid; place-items: center; width: 37px; height: 37px; flex: 0 0 37px; border-radius: 12px; color: var(--dh-teal); background: #e6f6f2; }
        .dh-float-icon-dark { color: #fff; background: var(--dh-ink); }
        .dh-float-card > span:last-child { display: flex; flex-direction: column; gap: 3px; }
        .dh-float-card b { color: #273943; font-size: .78rem; white-space: nowrap; }
        .dh-float-card small { color: #98a5aa; font-size: .68rem; }
        .dh-hero-bottom-line { position: absolute; right: 0; bottom: 0; left: 0; height: 1px; background: linear-gradient(90deg, transparent, #dcece8, transparent); }
        
        .dh-trust-strip { padding: 28px 0; border-bottom: 1px solid #eff3f3; background: #fff; }
        .dh-trust-inner { display: flex; align-items: center; justify-content: space-between; gap: 25px; }
        .dh-trust-inner > p { max-width: 270px; margin: 0; color: #89969d; font-size: .8rem; font-weight: 750; line-height: 1.7; }
        .dh-universities { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: clamp(15px, 2.6vw, 34px); color: #73858b; }
        .dh-universities span { font-size: clamp(.92rem, 1.7vw, 1.2rem); font-weight: 950; letter-spacing: -.4px; opacity: .68; }
        .dh-universities i { width: 4px; height: 4px; border-radius: 50%; background: #c8d5d4; }
        
        .dh-section { padding: 83px 0 76px; }
        .dh-store-section { background: #f7faf9; }
        .dh-courses-section { background: #fff; }
        .dh-section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 29px; }
        .dh-section-heading-copy { min-width: 0; }
        .dh-section-kicker { display: inline-flex; align-items: center; gap: 8px; color: var(--dh-teal); font-size: .79rem; font-weight: 900; }
        .dh-section-kicker > span { display: grid; place-items: center; width: 29px; height: 29px; border-radius: 10px; color: var(--dh-teal); background: #e3f5f1; }
        .dh-section-heading h2 { margin: 12px 0 8px; color: var(--dh-ink); font-size: clamp(1.8rem, 3.1vw, 2.55rem); font-weight: 950; letter-spacing: -.055em; line-height: 1.2; }
        .dh-section-heading-copy > p { margin: 0; color: #86949c; font-size: .96rem; line-height: 1.7; }
        .dh-section-tools { display: flex; align-items: center; gap: 17px; flex-shrink: 0; }
        .dh-rail-controls { display: flex; align-items: center; gap: 7px; }
        .dh-rail-button { display: grid; place-items: center; width: 42px; height: 42px; border: 1px solid #dfe9e7; border-radius: 13px; color: #43575e; background: #fff; cursor: pointer; transition: color .2s, background .2s, border .2s, transform .2s; }
        .dh-rail-button:hover { color: #fff; background: var(--dh-teal); border-color: var(--dh-teal); transform: translateY(-2px); }
        .dh-text-link { display: inline-flex; align-items: center; gap: 8px; padding: 9px 0; color: var(--dh-teal-deep); font-size: .87rem; font-weight: 900; white-space: nowrap; }
        .dh-text-link:hover { color: #12988d; }
        
        .dh-horizontal-rail { display: flex; align-items: stretch; gap: 22px; width: 100%; padding: 6px 2px 23px; overflow-x: auto; overscroll-behavior-inline: contain; scroll-snap-type: x mandatory; scroll-padding-inline: 2px; -webkit-overflow-scrolling: touch; scrollbar-width: thin; scrollbar-color: #c4d9d5 transparent; }
        .dh-horizontal-rail::-webkit-scrollbar { height: 6px; }.dh-horizontal-rail::-webkit-scrollbar-track { background: transparent; }.dh-horizontal-rail::-webkit-scrollbar-thumb { border-radius: 99px; background: #c4d9d5; }
        .dh-product-card, .dh-course-card { flex: 0 0 286px; min-width: 0; overflow: hidden; scroll-snap-align: start; border: 1px solid #e7eeee; border-radius: 21px; background: #fff; box-shadow: 0 7px 22px rgba(20,50,55,.035); transition: transform .25s, box-shadow .25s, border-color .25s; }
        .dh-product-card:hover, .dh-course-card:hover { transform: translateY(-5px); border-color: #d3e7e3; box-shadow: 0 19px 38px rgba(20,50,55,.09); }
        .dh-product-image-wrap, .dh-course-image-wrap { position: relative; display: grid; place-items: center; height: 218px; overflow: hidden; background: linear-gradient(145deg, #eef6f4, #f8fbfa 55%, #eaf4f2); }
        .dh-product-image-wrap > img, .dh-course-image-wrap > img { width: 100%; height: 100%; object-fit: contain; padding: 23px; transition: transform .45s; }
        .dh-product-card:hover .dh-product-image-wrap > img, .dh-course-card:hover .dh-course-image-wrap > img { transform: scale(1.045); }
        .dh-product-placeholder, .dh-course-placeholder { display: grid; place-items: center; width: 100%; height: 100%; color: #75aaa2; background: radial-gradient(circle, #e4f2ef, transparent 62%); }
        .dh-product-category, .dh-course-badge { position: absolute; top: 13px; inset-inline-start: 13px; max-width: calc(100% - 65px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 7px 10px; border: 1px solid rgba(255,255,255,.65); border-radius: 9px; color: #176e66; background: rgba(255,255,255,.86); font-size: .68rem; font-weight: 900; backdrop-filter: blur(12px); }
        .dh-stock-dot { position: absolute; top: 17px; inset-inline-end: 16px; width: 9px; height: 9px; border: 2px solid #fff; border-radius: 50%; box-sizing: content-box; }
        .dh-stock-dot.is-in-stock { background: #25a879; }.dh-stock-dot.is-out-stock { background: #e35c62; }
        .dh-card-content { display: flex; flex-direction: column; padding: 19px 19px 18px; }
        .dh-card-overline { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; color: #96a4a9; font-size: .62rem; font-weight: 950; letter-spacing: 1px; }
        .dh-mini-stars { gap: 4px; color: #d9a337; font-size: .72rem; letter-spacing: 0; }.dh-course-access-chip { display: inline-flex; align-items: center; gap: 4px; color: #16866c; font-size: .58rem; letter-spacing: .2px; white-space: nowrap; }
        .dh-card-content h3 { display: -webkit-box; min-height: 2.8em; margin: 0 0 16px; overflow: hidden; color: #273a43; font-size: 1.08rem; font-weight: 900; line-height: 1.42; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
        .dh-card-content h3 a { color: inherit; }.dh-card-content h3 a:hover { color: var(--dh-teal); }
        .dh-product-bottom { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 42px; margin-top: auto; padding-top: 12px; border-top: 1px solid #eff3f2; }
        .dh-product-bottom > strong { color: var(--dh-teal-deep); font-size: 1.25rem; font-weight: 950; white-space: nowrap; }
        .dh-stock-label { display: inline-flex; align-items: center; justify-content: center; padding: 6px 9px; border-radius: 7px; font-size: .67rem; font-weight: 850; white-space: nowrap; }
        .dh-stock-label.is-in-stock { color: #16835f; background: #e7f7ef; }.dh-stock-label.is-out-stock { color: #b63d45; background: #fff0f0; }
        .dh-add-button { display: flex; align-items: center; justify-content: center; gap: 9px; width: 100%; min-height: 44px; margin-top: 15px; border: 1px solid #0e8278; border-radius: 12px; color: #fff; background: linear-gradient(135deg, #0f8b80, #08635d); font: inherit; font-size: .88rem; font-weight: 850; cursor: pointer; box-shadow: 0 6px 12px rgba(15,118,110,.1); transition: transform .2s, box-shadow .2s; }
        .dh-add-button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 9px 17px rgba(15,118,110,.18); }.dh-add-button:disabled { opacity: .72; cursor: not-allowed; }.dh-add-button-disabled { border-color: #f2d0d1; color: #b44a4e; background: #fff4f4; box-shadow: none; }
        
        .dh-course-card { flex-basis: 352px; }
        .dh-course-image-wrap { height: 205px; }
        .dh-course-image-wrap > img { padding: 0; object-fit: cover; }
        .dh-course-badge { color: #fff; background: rgba(8,99,93,.9); border-color: rgba(255,255,255,.18); font-size: .61rem; letter-spacing: .65px; }
        .dh-course-play { position: absolute; right: 17px; bottom: 16px; display: grid; place-items: center; width: 43px; height: 43px; border: 1px solid rgba(255,255,255,.6); border-radius: 14px; color: #fff; background: rgba(15,118,110,.91); box-shadow: 0 8px 20px rgba(0,0,0,.15); transition: transform .2s; }
        .dh-course-card:hover .dh-course-play { transform: rotate(-6deg) scale(1.05); }
        .dh-course-content h3 { min-height: 0; margin-bottom: 8px; font-size: 1.14rem; }
        .dh-course-description { display: -webkit-box; min-height: 2.8em; margin: 0 0 17px; overflow: hidden; color: #85929a; font-size: .83rem; line-height: 1.65; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
        .dh-course-details { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto; padding: 15px 0; border-top: 1px solid #edf2f1; }
        .dh-course-details > div { display: flex; flex-direction: column; gap: 3px; }.dh-course-details > div > strong { color: var(--dh-ink); font-size: 1.22rem; font-weight: 950; }.dh-course-details small { color: #9aa7ac; font-size: .68rem; }
        .dh-instructor { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; max-width: 55%; text-align: end; }.dh-instructor b { max-width: 100%; overflow: hidden; color: #5a6a72; font-size: .76rem; text-overflow: ellipsis; white-space: nowrap; }.dh-instructor small { display: inline-flex; align-items: center; gap: 4px; }
        .dh-course-actions { display: grid; grid-template-columns: .86fr 1.14fr; gap: 8px; }.dh-course-actions .dh-button { min-height: 43px; padding-inline: 11px; font-size: .81rem; }
        
        .dh-mobile-hint { display: none; align-items: center; justify-content: center; gap: 9px; margin-top: 5px; color: #9aa8ad; font-size: .73rem; font-weight: 700; }.dh-mobile-hint span { width: 20px; height: 1px; background: #d5e1df; }
        .dh-empty-state { display: flex; flex-direction: column; align-items: center; padding: 44px 20px; border: 1px dashed #cbdeda; border-radius: 20px; text-align: center; background: rgba(255,255,255,.8); }.dh-empty-icon { display: grid; place-items: center; width: 58px; height: 58px; margin-bottom: 12px; border-radius: 18px; color: var(--dh-teal); background: #e5f5f1; }.dh-empty-state h3 { margin: 2px 0 5px; color: var(--dh-ink); font-size: 1.13rem; font-weight: 900; }.dh-empty-state p { margin: 0 0 18px; color: #87969b; font-size: .88rem; }.dh-course-empty { background: #f8fbfa; }
        .dh-product-skeleton, .dh-course-skeleton { flex: 0 0 286px; height: 394px; border-radius: 21px; background: linear-gradient(105deg, #edf2f1 25%, #f7faf9 40%, #edf2f1 60%); background-size: 220% 100%; animation: dhShimmer 1.4s ease infinite; }.dh-course-skeleton { flex-basis: 352px; height: 430px; }
        
        .dh-why-section { position: relative; isolation: isolate; overflow: hidden; padding: 82px 0 90px; color: #fff; background: #0d242c; }.dh-why-glow { position: absolute; z-index: -1; top: -280px; inset-inline-start: 22%; width: 650px; height: 500px; border-radius: 50%; background: rgba(21,139,127,.18); filter: blur(70px); }
        .dh-why-inner { position: relative; }.dh-why-heading { max-width: 720px; margin: 0 auto 44px; text-align: center; }.dh-section-kicker-inverse { color: #78ccc1; }.dh-section-kicker-inverse > span { color: #95ded2; background: rgba(47,167,154,.16); }.dh-why-heading h2 { margin: 14px 0 12px; color: #fff; font-size: clamp(2.1rem, 4vw, 3.1rem); font-weight: 950; letter-spacing: -.06em; }.dh-why-heading > p { max-width: 680px; margin: 0 auto; color: #a8b9be; font-size: .99rem; line-height: 1.9; }
        .dh-feature-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 17px; }.dh-feature-card { position: relative; min-height: 248px; overflow: hidden; padding: 27px 25px 30px; border: 1px solid rgba(214,237,234,.12); border-radius: 21px; background: linear-gradient(145deg, rgba(255,255,255,.065), rgba(255,255,255,.025)); transition: transform .25s, border-color .25s, background .25s; }.dh-feature-card:hover { transform: translateY(-5px); border-color: rgba(98,204,190,.38); background: linear-gradient(145deg, rgba(255,255,255,.095), rgba(255,255,255,.035)); }.dh-feature-icon { display: grid; place-items: center; width: 51px; height: 51px; margin-bottom: 22px; border: 1px solid rgba(120,220,205,.22); border-radius: 15px; color: #8be0d2; background: rgba(15,118,110,.28); }.dh-feature-card h3 { position: relative; z-index: 1; margin: 0 0 10px; color: #fff; font-size: 1.11rem; font-weight: 900; }.dh-feature-card p { position: relative; z-index: 1; margin: 0; color: #a7b9be; font-size: .88rem; line-height: 1.85; }.dh-feature-number { position: absolute; right: 15px; bottom: -24px; color: rgba(255,255,255,.035); font-size: 8rem; font-weight: 950; letter-spacing: -.1em; line-height: 1; pointer-events: none; }
        
        .dh-final-section { padding: 77px 0 87px; background: linear-gradient(180deg, #f5f9f8, #fff); }.dh-final-card { position: relative; isolation: isolate; overflow: hidden; max-width: 1000px; margin-inline: auto; padding: clamp(36px, 6vw, 68px) 28px; border: 1px solid #e5eeec; border-radius: 30px; background: linear-gradient(120deg, #fff 10%, #f2faf7 100%); box-shadow: 0 24px 60px rgba(18,55,58,.07); text-align: center; }.dh-final-decoration { position: absolute; z-index: -1; width: 250px; height: 250px; border-radius: 50%; background: rgba(15,118,110,.06); }.dh-final-decoration-one { top: -150px; inset-inline-start: -60px; }.dh-final-decoration-two { right: 25%; bottom: -220px; width: 320px; height: 320px; }.dh-final-symbol { display: grid; place-items: center; width: 59px; height: 59px; margin: 0 auto 15px; border-radius: 19px; color: #fff; background: linear-gradient(140deg, #1da699, #08645d); box-shadow: 0 10px 22px rgba(15,118,110,.22); }.dh-final-kicker { color: var(--dh-teal); font-size: .7rem; font-weight: 950; letter-spacing: 1.8px; }.dh-final-card h2 { margin: 13px 0 13px; color: var(--dh-ink); font-size: clamp(1.9rem, 4vw, 2.9rem); font-weight: 950; letter-spacing: -.055em; line-height: 1.2; }.dh-final-card > p { max-width: 650px; margin: 0 auto 26px; color: #7f8d96; font-size: .98rem; line-height: 1.9; }.dh-final-actions { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 18px; }.dh-final-actions .dh-button { min-height: 51px; padding-inline: 23px; }.dh-final-secondary-link { display: inline-flex; align-items: center; gap: 7px; color: #62747b; font-size: .87rem; font-weight: 800; }.dh-final-secondary-link:hover { color: var(--dh-teal); }
        
        .dh-button-spinner { width: 17px; height: 17px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: dhSpin .7s linear infinite; }
        
        @keyframes dhFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @keyframes dhSpin { to { transform: rotate(360deg); } }
        @keyframes dhShimmer { to { background-position-x: -220%; } }
        @keyframes dhOrbit { to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes dhOrbitReverse { to { transform: translate(-50%, -50%) rotate(-360deg); } }
        @keyframes dhOrbitCounter { to { transform: rotate(-360deg); } }
        @keyframes dhToothFloat { 0%, 100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-10px) rotate(1deg); } }
        @keyframes dhScan { 0%, 100% { top: 18%; opacity: 0; } 15%, 85% { opacity: .7; } 50% { top: 76%; opacity: .85; } }
        @keyframes dhSplashIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dhLoaderOrbit { 0%, 100% { transform: rotate(45deg) scale(.94); } 50% { transform: rotate(135deg) scale(1.05); } }
        @keyframes dhLoaderPulse { 0%, 100% { transform: translateY(0); box-shadow: 0 15px 32px rgba(15,118,110,.24); } 50% { transform: translateY(-4px); box-shadow: 0 20px 36px rgba(15,118,110,.32); } }
        @keyframes dhLoaderProgress { 0% { transform: translateX(-130%); } 100% { transform: translateX(250%); } }
        @keyframes dhReveal { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        
        @media (max-width: 960px) {
          .dh-hero { padding-top: 60px; }.dh-hero-grid { grid-template-columns: minmax(0, 1fr) minmax(320px, .8fr); gap: 22px; }.dh-hero-art { min-height: 435px; }.dh-tooth-core { width: min(70%, 300px); }.dh-float-certified { inset-inline-end: -3%; }.dh-float-kit { inset-inline-start: -4%; }.dh-trust-inner { align-items: flex-start; flex-direction: column; gap: 14px; }.dh-trust-inner > p { max-width: none; }.dh-universities { justify-content: flex-start; }.dh-feature-card { padding: 24px 20px; }
        }
        @media (max-width: 720px) {
          .dh-shell { width: min(100% - 32px, 560px); }
          .dh-hero { padding: 49px 0 44px; }.dh-hero-grid { grid-template-columns: minmax(0, 1fr); gap: 22px; }.dh-hero-copy { text-align: center; }.dh-eyebrow { justify-content: center; font-size: .75rem; }.dh-hero h1 { margin: 20px 0 14px; font-size: clamp(2.5rem, 9.5vw, 3.65rem); letter-spacing: -.06em; }.dh-hero-description { max-width: 560px; margin-inline: auto; font-size: .96rem; line-height: 1.85; }.dh-hero-actions { justify-content: center; margin-top: 22px; }.dh-hero-actions .dh-button { flex: 1 1 155px; max-width: 230px; min-height: 47px; padding-inline: 12px; font-size: .85rem; }.dh-hero-metrics { justify-content: center; gap: 8px; margin-top: 25px; }.dh-metric-icon { width: 35px; height: 35px; flex-basis: 35px; border-radius: 11px; }.dh-metric-copy strong { font-size: .96rem; }.dh-metric-copy span { font-size: .69rem; }.dh-metric-divider { margin: 0 3px; }.dh-hero-art { min-height: 410px; margin-top: 2px; }.dh-tooth-core { width: min(68%, 270px); }.dh-art-caption { bottom: 4%; }.dh-orbit-note { font-size: .65rem; padding: 8px 10px; }.dh-orbit-note-top { top: 3%; left: 0; }.dh-orbit-note-bottom { right: 0; bottom: 17%; }.dh-float-card { gap: 7px; padding: 9px 10px; }.dh-float-icon { width: 31px; height: 31px; flex-basis: 31px; border-radius: 10px; }.dh-float-card b { font-size: .69rem; }.dh-float-card small { font-size: .61rem; }.dh-float-certified { top: 4%; inset-inline-end: 0; }.dh-float-kit { bottom: 4%; inset-inline-start: 0; }
          .dh-trust-strip { padding: 23px 0; }.dh-trust-inner { align-items: center; text-align: center; }.dh-trust-inner > p { font-size: .77rem; }.dh-universities { justify-content: center; gap: 12px; }.dh-universities span { font-size: .83rem; }.dh-universities i { width: 3px; height: 3px; }
          .dh-section { padding: 54px 0 48px; }.dh-section-heading { align-items: flex-start; flex-direction: column; gap: 17px; margin-bottom: 22px; }.dh-section-heading h2 { margin-top: 9px; font-size: clamp(1.7rem, 7vw, 2.3rem); }.dh-section-heading-copy > p { font-size: .85rem; }.dh-section-tools { width: 100%; justify-content: space-between; gap: 12px; }.dh-rail-controls { display: none; }.dh-text-link { font-size: .82rem; }
          .dh-horizontal-rail { gap: 14px; margin-inline: -16px; width: calc(100% + 32px); padding: 4px 16px 18px; scroll-padding-inline: 16px; }.dh-product-card { flex-basis: min(78vw, 300px); border-radius: 18px; }.dh-course-card { flex-basis: min(86vw, 340px); border-radius: 18px; }.dh-product-image-wrap { height: 200px; }.dh-course-image-wrap { height: 190px; }.dh-card-content { padding: 16px; }.dh-card-content h3 { font-size: 1rem; }.dh-course-content h3 { font-size: 1.05rem; }.dh-mobile-hint { display: flex; }.dh-product-skeleton { flex-basis: min(78vw, 300px); height: 380px; }.dh-course-skeleton { flex-basis: min(86vw, 340px); height: 420px; }.dh-empty-state { margin-inline: 0; padding: 35px 18px; }
          .dh-why-section { padding: 56px 0 62px; }.dh-why-heading { margin-bottom: 28px; }.dh-why-heading h2 { font-size: 2.25rem; }.dh-why-heading > p { font-size: .88rem; }.dh-feature-grid { grid-template-columns: minmax(0, 1fr); gap: 12px; }.dh-feature-card { min-height: 0; padding: 22px; border-radius: 17px; }.dh-feature-icon { width: 45px; height: 45px; margin-bottom: 16px; }.dh-feature-card h3 { font-size: 1.03rem; }.dh-feature-card p { font-size: .84rem; }.dh-feature-number { font-size: 6rem; }
          .dh-final-section { padding: 48px 0 57px; }.dh-final-card { padding: 38px 20px; border-radius: 23px; }.dh-final-symbol { width: 51px; height: 51px; border-radius: 16px; }.dh-final-card h2 { font-size: clamp(1.75rem, 7.3vw, 2.4rem); }.dh-final-card > p { margin-bottom: 23px; font-size: .88rem; }.dh-final-actions { flex-direction: column; gap: 13px; }.dh-final-actions .dh-button { width: 100%; max-width: 310px; }
        }
        @media (max-width: 390px) {
          .dh-shell { width: calc(100% - 24px); }.dh-hero h1 { font-size: 2.42rem; }.dh-hero-metrics { gap: 6px; }.dh-metric-copy span { max-width: 90px; }.dh-metric-divider { margin-inline: 1px; }.dh-tooth-core { width: 66%; }.dh-art-caption { width: min(90%, 320px); padding: 10px 11px; }.dh-caption-copy b { font-size: .72rem; }.dh-float-card { max-width: 190px; }.dh-float-certified { inset-inline-end: -4px; }.dh-float-kit { inset-inline-start: -4px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dh-home *, .dh-home *::before, .dh-home *::after, .dh-loading-screen *, .dh-loading-screen *::before, .dh-loading-screen *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .01ms !important; }
        }
      `}</style>
      </main>
    </>
  );
}