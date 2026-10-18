'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {BookOpen,GraduationCap,Clock3,ShoppingCart} from 'lucide-react';
import {supabaseBrowser} from '@/lib/supabase/client';
import {publicImage,money} from '@/lib/utils';
import {useApp} from '@/components/Providers';

export default function CoursesPage(){
  const {lang,t,user,toast}=useApp();
  const [courses,setCourses]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [adding,setAdding]=useState<string|null>(null);

  useEffect(()=>{
    // نجيب الكورسات المنشورة
    supabaseBrowser().from('courses').select('*').eq('is_published',true).order('sort_order',{ascending:true})
      .then(({data})=>{
        if(data) {
          // فلترة الكورسات: إما عامة (public)، أو خاصة (private) وتطابق إيميل المستخدم الحالي
          const filteredCourses = data.filter(c => 
            c.visibility === 'public' || 
            (c.visibility === 'private' && user && c.target_email === user.email)
          );
          setCourses(filteredCourses);
        } else {
          setCourses([]);
        }
        setLoading(false);
      });
  },[user]);

  async function addToCart(item: any){
    if(!user){
      toast(t('سجّل الدخول أولاً لإضافة الكورس للسلة','Sign in to add this course to your cart'),'info');
      location.href='/login?next=/cart';
      return;
    }
    setAdding(item.id);
    const { error } = await supabaseBrowser().from('cart_items').insert({ user_id: user.id, course_id: item.id });
    setAdding(null);
    if(error){
      if (error.code === '23505') toast(t('العنصر موجود بالفعل في السلة', 'Item is already in cart'), 'error');
      else toast(error.message,'error');
    } else {
      toast(t('تمت الإضافة للسلة','Added to cart successfully'),'success');
      window.dispatchEvent(new Event('cart-updated'));
    }
  }

  return (
    <div className="container section">
      <div className="page-hero" style={{padding: '40px 20px', borderRadius: 16, marginBottom: 40, background: 'var(--soft)'}}>
        <div className="eyebrow"><BookOpen size={14}/> {t('الكورسات التعليمية','Educational Courses')}</div>
        <h1>{t('اكتشف الكورسات','Explore courses')}</h1>
        <p>{t('محتوى تعليمي أكاديمي ومهني يساعدك تنتقل من المعرفة إلى التطبيق.','Academic and professional content that helps you move from knowledge to practice.')}</p>
      </div>

      {loading ? <div className="spinner" style={{margin:'50px auto'}}/> : courses.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={30}/>
          <h3>{t('لا توجد كورسات حالياً','No courses available')}</h3>
        </div>
      ) : (
        <div className="course-grid">
          {courses.map(c => (
            <article className="course-card" key={c.id}>
              <Link href={`/courses/${encodeURIComponent(c.slug)}`} className="course-cover">
                {c.image_path ? <img src={publicImage(c.image_path)} alt={c.title_en} loading="lazy"/> : <GraduationCap size={54} color="var(--primary)"/>}
                {/* تمييز الكورس البرايفت للمستخدم */}
                <span className="cover-badge" style={c.visibility === 'private' ? {background: 'var(--primary)', color: 'white'} : {}}>
                  {c.visibility === 'private' ? t('كورس خاص', 'PRIVATE') : t('كورس', 'COURSE')}
                </span>
              </Link>
              <div className="course-body">
                <h3><Link href={`/courses/${encodeURIComponent(c.slug)}`}>{lang==='ar'?(c.title_ar||c.title_en):(c.title_en||c.title_ar)}</Link></h3>
                <p>{lang==='ar'?(c.description_ar||c.description_en):(c.description_en||c.description_ar)}</p>
                <div className="course-meta" style={{marginTop: 'auto', paddingTop: 15}}>
                  <div><strong style={{fontSize: 18, color: 'var(--primary)'}}>{money(c.price_jod)}</strong></div>
                  <div>
                    <small>{c.instructor_name||t('فريق Dentify','Dentify team')}</small>
                    <small style={{display:'block', marginTop:4}}><Clock3 size={11} style={{display:'inline',verticalAlign:'middle'}}/> {t('تعلم ذاتي','Self-paced')}</small>
                  </div>
                </div>
                <div className="card-actions" style={{marginTop: 15}}>
                  <Link className="btn btn-outline" href={`/courses/${encodeURIComponent(c.slug)}`}>{t('التفاصيل','Details')}</Link>
                  <button className="btn btn-primary" disabled={adding===c.id} onClick={()=>addToCart(c)}>
                    {adding===c.id ? <div className="spinner" style={{width:15,height:15,borderWidth:2}}></div> : <><ShoppingCart size={16}/> {t('أضف للسلة','Add to cart')}</>}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}