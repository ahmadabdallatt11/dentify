'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, PlayCircle, Lock, ShoppingCart, CheckCircle2, Clock3, GraduationCap, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { publicImage, money } from '@/lib/utils';
import { useApp } from '@/components/Providers';

export default function CourseDetailsPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const router = useRouter();
  const { lang, t, user, toast, profile } = useApp();

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    
    async function fetchCourseData() {
      try {
        setLoading(true);
        const sb = supabaseBrowser();
        const decodedSlug = decodeURIComponent(slug);

        // جلب بيانات الكورس
        const { data: cData, error: cErr } = await sb.from('courses').select('*').eq('slug', decodedSlug).maybeSingle();

        if (cErr || !cData) {
          setCourse(null);
          setLoading(false);
          return;
        }
        
        setCourse(cData);

        // جلب الدروس التابعة للكورس
        const { data: lData } = await sb.from('course_lessons').select('*').eq('course_id', cData.id).order('sort_order', { ascending: true });
        setLessons(lData || []);

        // فحص حالة الاشتراك
        if (user) {
          const { data: eData } = await sb.from('enrollments').select('*').eq('course_id', cData.id).eq('user_id', user.id).maybeSingle();
          if (eData || profile?.role === 'admin') setIsEnrolled(true);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCourseData();
  }, [slug, user, profile]);

  async function addToCart() {
    if (!user) {
      toast(t('سجّل الدخول أولاً لإضافة الكورس للسلة', 'Sign in to add this course to your cart'), 'info');
      router.push('/login?next=/cart');
      return;
    }
    setAdding(true);
    const sb = supabaseBrowser();
    const { error } = await sb.from('cart_items').insert({ user_id: user.id, course_id: course.id });
    setAdding(false);
    
    if (error) {
      if (error.code === '23505') {
        toast(t('الكورس موجود بالفعل في السلة', 'Course is already in cart'), 'error');
      } else {
        toast(error.message, 'error');
      }
    } else {
      toast(t('تمت الإضافة للسلة بنجاح', 'Added to cart successfully'), 'success');
      window.dispatchEvent(new Event('cart-updated'));
    }
  }

  if (loading) return <div className="container loading-page"><div className="spinner" style={{margin: '100px auto'}}/></div>;
  
  if (!course) return (
    <div className="container section">
      <div className="empty-state" style={{padding: '100px 20px', textAlign: 'center', background: '#fff', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginTop: '40px'}}>
        <BookOpen size={60} color="var(--muted)" style={{margin: '0 auto 20px'}}/>
        <h2 style={{fontSize: '1.8rem', color: 'var(--secondary)'}}>{t('الكورس غير موجود', 'Course not found')}</h2>
        <p style={{color: 'var(--muted)', marginBottom: '30px', fontSize: '1rem'}}>{t('عذراً، قد يكون الرابط خاطئاً أو تم حذف الكورس من الإدارة.', 'Sorry, the link might be broken or the course was removed by admin.')}</p>
        <Link href="/courses" className="btn btn-primary" style={{padding: '12px 24px', fontSize: '1rem'}}>{t('العودة للكورسات', 'Back to courses')}</Link>
      </div>
    </div>
  );

  return (
    <div className="course-details-page" style={{background: '#f8fafc', minHeight: '100vh', paddingBottom: '80px'}}>
      
      {/* هيرو تفاصيل الكورس العلوية */}
      <div style={{background: 'linear-gradient(135deg, var(--secondary) 0%, #0f172a 100%)', color: '#fff', paddingTop: '60px', paddingBottom: '140px', position: 'relative'}}>
        <div className="container">
          <div style={{maxWidth: '850px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 600}}>
              <Link href="/courses" style={{color: '#94a3b8', transition: 'color 0.2s'}} className="hover-text-white">{t('أكاديمية دنتيفاي', 'Dentify Academy')}</Link>
              <ArrowRight size={14} style={{transform: lang === 'ar' ? 'rotate(180deg)' : 'none'}}/>
              <span style={{color: 'var(--primary)'}}>{t('تفاصيل الكورس', 'Course Details')}</span>
            </div>

            <h1 style={{fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, marginBottom: '20px', lineHeight: 1.3, letterSpacing: '-0.5px'}}>
              {lang === 'ar' ? course.title_ar : course.title_en}
            </h1>
            
            <p style={{fontSize: '1.1rem', color: '#cbd5e1', lineHeight: 1.7, marginBottom: '30px', opacity: 0.9}}>
              {lang === 'ar' ? course.description_ar : course.description_en}
            </p>
            
            <div style={{display: 'flex', alignItems: 'center', gap: '25px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <GraduationCap size={20} color="#fff"/>
                </div>
                <div>
                  <small style={{display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600}}>{t('المدرب', 'Instructor')}</small>
                  <strong style={{fontSize: '1rem'}}>{course.instructor_name || t('فريق Dentify', 'Dentify Team')}</strong>
                </div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <Clock3 size={20} color="#fff"/>
                </div>
                <div>
                  <small style={{display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600}}>{t('مدة الوصول', 'Access')}</small>
                  <strong style={{fontSize: '1rem'}}>{t('مدى الحياة', 'Lifetime')}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{marginTop: '-70px', position: 'relative', zIndex: 10}}>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 350px', gap: '40px', alignItems: 'start'}} className="course-layout-grid">
          
          {/* العمود الأيمن (عن الكورس ومحتواه) */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '30px'}}>
            <div className="panel" style={{background: '#fff', padding: '35px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9'}}>
              <h2 style={{fontSize: '1.4rem', marginBottom: '20px', color: 'var(--secondary)', fontWeight: 800}}>{t('عن هذا الكورس', 'About this course')}</h2>
              <div style={{lineHeight: 1.8, color: '#475569', fontSize: '1rem', whiteSpace: 'pre-wrap'}}>
                {lang === 'ar' ? course.description_ar : course.description_en}
              </div>
            </div>

            <div className="panel" style={{background: '#fff', padding: '35px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h2 style={{fontSize: '1.4rem', margin: 0, color: 'var(--secondary)', fontWeight: 800}}>{t('محتوى الكورس', 'Course Content')}</h2>
                <span style={{background: '#f1f5f9', color: '#475569', padding: '6px 16px', borderRadius: '50px', fontWeight: 'bold', fontSize: '0.9rem'}}>
                  {lessons.length} {t('حصص تعليمية', 'lessons')}
                </span>
              </div>
              
              {lessons.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1'}}>
                  <PlayCircle size={40} color="#94a3b8" style={{margin: '0 auto 15px'}}/>
                  <h3 style={{color: '#475569', fontSize: '1.1rem', marginBottom: '10px'}}>{t('المحتوى قيد التجهيز', 'Content is being prepared')}</h3>
                  <p style={{color: '#94a3b8', margin: 0, fontSize: '0.95rem'}}>{t('سيتم رفع الحصص والمذكرات قريباً.', 'Lessons and notes will be uploaded soon.')}</p>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  {lessons.map((lesson, idx) => (
                    <div key={lesson.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: lesson.is_preview || isEnrolled ? '#fff' : '#f8fafc', borderRadius: '16px', border: lesson.is_preview || isEnrolled ? '1px solid #e2e8f0' : '1px solid #f1f5f9', transition: 'all 0.2s'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                        <div style={{width: '40px', height: '40px', borderRadius: '50%', background: lesson.is_preview || isEnrolled ? 'rgba(15, 118, 110, 0.1)' : '#e2e8f0', color: lesson.is_preview || isEnrolled ? 'var(--primary)' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          {isEnrolled || lesson.is_preview ? <PlayCircle size={20}/> : <Lock size={20}/>}
                        </div>
                        <div>
                          <strong style={{display: 'block', fontSize: '1rem', color: lesson.is_preview || isEnrolled ? 'var(--secondary)' : '#64748b', marginBottom: '4px', fontWeight: 700}}>
                            {idx + 1}. {lang === 'ar' ? lesson.title_ar : lesson.title_en}
                          </strong>
                          <div style={{display: 'flex', gap: '15px', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600}}>
                            {(lesson.duration_seconds > 0) && (
                              <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><Clock3 size={12}/> {Math.floor(lesson.duration_seconds / 60)} {t('دقيقة', 'mins')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {lesson.is_preview && !isEnrolled && (
                        <span style={{background: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800}}>
                          {t('معاينة', 'Preview')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* العمود الأيسر (بطاقة الشراء العائمة) */}
          <div style={{position: 'sticky', top: '100px'}}>
            <div className="panel" style={{background: '#fff', padding: '10px', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9'}}>
              <div style={{height: '200px', background: '#f1f5f9', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px'}}>
                {course.image_path ? (
                  <img src={publicImage(course.image_path)} alt="Cover" style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
                ) : (
                  <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><BookOpen size={50} color="#cbd5e1"/></div>
                )}
              </div>
              
              <div style={{padding: '0 20px 20px'}}>
                {isEnrolled ? (
                  <div style={{textAlign: 'center'}}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#f0fdf4', color: '#16a34a', padding: '10px 16px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '15px', fontSize: '0.95rem'}}>
                      <CheckCircle2 size={18}/> {t('تم تفعيل اشتراكك', 'You are enrolled')}
                    </div>
                    {/* التوجيه الصحيح لقاعة المحاضرات */}
                    <Link href={`/learn/${course.id}`} className="btn btn-primary" style={{width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1.05rem', borderRadius: '12px'}}>
                      <PlayCircle size={20}/> {t('الانتقال لقاعة المحاضرات', 'Go to Classroom')}
                    </Link>
                  </div>
                ) : (
                  <>
                    <div style={{display: 'flex', alignItems: 'flex-end', gap: '10px', marginBottom: '20px'}}>
                      <div style={{fontSize: '2.2rem', fontWeight: 900, color: 'var(--secondary)', lineHeight: 1}}>
                        {money(course.price_jod)}
                      </div>
                    </div>

                    <button 
                      className="btn btn-primary" 
                      style={{width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1.1rem', fontWeight: 800, borderRadius: '12px', boxShadow: '0 10px 20px rgba(15, 118, 110, 0.2)'}}
                      disabled={adding}
                      onClick={addToCart}
                    >
                      {adding ? <div className="spinner" style={{width: 20, height: 20, borderWidth: 3}}/> : <><ShoppingCart size={20}/> {t('التسجيل في الكورس', 'Enroll in Course')}</>}
                    </button>
                    
                    <ul style={{listStyle: 'none', padding: 0, margin: '25px 0 0', display: 'flex', flexDirection: 'column', gap: '12px', color: '#475569', fontSize: '0.95rem', fontWeight: 600}}>
                      <li style={{display: 'flex', alignItems: 'center', gap: '10px'}}><CheckCircle2 size={18} color="var(--primary)"/> {t('وصول كامل لجميع الحصص', 'Full access to all lessons')}</li>
                      <li style={{display: 'flex', alignItems: 'center', gap: '10px'}}><CheckCircle2 size={18} color="var(--primary)"/> {t('مشاهدة مرنة عبر الهاتف أو اللابتوب', 'Watch flexibly on mobile or laptop')}</li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 950px) {
          .course-layout-grid { grid-template-columns: 1fr !important; }
          .course-layout-grid > div:last-child { order: -1; position: relative !important; top: 0 !important; margin-bottom: 20px; }
        }
      `}} />
    </div>
  );
}