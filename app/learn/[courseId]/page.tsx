'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlayCircle, ArrowRight, ArrowLeft, BookOpen, Lock, ShieldAlert, CheckCircle2, ChevronRight, Menu, X } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useApp } from '@/components/Providers';

export default function ClassroomPage() {
  const params = useParams();
  const rawId = params?.id || params?.slug || (params && Object.values(params)[0]);
  const courseId = typeof rawId === 'string' ? rawId : '';

  const router = useRouter();
  const { lang, t, user, profile, loading: authLoading } = useApp();

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?next=/learn/${courseId}`);
      return;
    }

    async function loadClassroom() {
      try {
        const sb = supabaseBrowser();
        
        // 1. جلب بيانات الكورس
        const { data: cData, error: cErr } = await sb.from('courses').select('*').eq('id', courseId).maybeSingle();
        if (cErr || !cData) {
          setLoading(false);
          return;
        }
        setCourse(cData);

        // 2. التحقق من الصلاحيات (هل هو أدمن أو طالب مشترك؟)
        let isAuth = false;
        if (profile?.role === 'admin') {
          isAuth = true;
        } else {
          const { data: eData } = await sb.from('enrollments').select('*').eq('course_id', cData.id).eq('user_id', user.id).maybeSingle();
          if (eData) isAuth = true;
        }

        setAuthorized(isAuth);

        if (!isAuth) {
          setLoading(false);
          return;
        }

        // 3. جلب الدروس
        const { data: lData } = await sb.from('course_lessons').select('*').eq('course_id', cData.id).order('sort_order', { ascending: true });
        const fetchedLessons = lData || [];
        setLessons(fetchedLessons);

        if (fetchedLessons.length > 0) {
          setActiveLesson(fetchedLessons[0]);
        }
      } catch (error) {
        console.error('Classroom error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadClassroom();
  }, [courseId, user, profile, authLoading, router]);

  // جلب رابط الفيديو السري (Signed URL) لما يختار درس جديد
  useEffect(() => {
    async function loadVideoUrl() {
      if (!activeLesson?.video_path) {
        setVideoUrl(null);
        return;
      }

      // إذا كان رابط خارجي (يوتيوب أو غيره)
      if (activeLesson.video_path.startsWith('http')) {
        setVideoUrl(activeLesson.video_path);
        return;
      }

      // إذا كان فيديو محمي جوا الـ Storage تبع Supabase
      const sb = supabaseBrowser();
      const { data, error } = await sb.storage.from('course-videos').createSignedUrl(activeLesson.video_path, 3600); // الرابط بشتغل لساعة بس
      
      if (error) {
        console.error('Error fetching video:', error);
        setVideoUrl(null);
      } else if (data) {
        setVideoUrl(data.signedUrl);
      }
    }

    loadVideoUrl();
  }, [activeLesson]);

  if (authLoading || loading) return <div className="loading-page" style={{ height: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a' }}><div className="spinner" style={{borderColor: 'rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)'}}/></div>;

  if (!course) return (
    <div className="empty-state" style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc'}}>
      <ShieldAlert size={60} color="var(--muted)" style={{marginBottom: 20}}/>
      <h2>{t('الكورس غير موجود', 'Course not found')}</h2>
      <Link href="/profile" className="btn btn-primary" style={{marginTop: 20}}>{t('العودة למكتبتي', 'Back to my library')}</Link>
    </div>
  );

  if (!authorized) return (
    <div className="empty-state" style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc'}}>
      <Lock size={60} color="#ef4444" style={{marginBottom: 20}}/>
      <h2 style={{color: 'var(--secondary)'}}>{t('غير مصرح لك بالدخول', 'Unauthorized Access')}</h2>
      <p style={{color: 'var(--muted)', maxWidth: 400, textAlign: 'center', margin: '10px 0 30px'}}>{t('يجب عليك الاشتراك في هذا الكورس أولاً حتى تتمكن من مشاهدة محتواه.', 'You must enroll in this course first to watch its content.')}</p>
      <Link href={`/courses/${course.slug}`} className="btn btn-primary">{t('الذهاب لصفحة الكورس', 'Go to course page')}</Link>
    </div>
  );

  return (
    <div className="classroom-layout" style={{display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#0f172a', color: '#f8fafc'}}>
      
      {/* Header قاعة المحاضرات */}
      <header style={{background: '#1e293b', borderBottom: '1px solid #334155', padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
          <Link href="/profile" style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.95rem', fontWeight: 'bold', transition: 'color 0.2s'}} className="hover-text-white">
            {lang === 'ar' ? <ArrowRight size={18}/> : <ArrowLeft size={18}/>}
            {t('العودة للمكتبة', 'Back to Library')}
          </Link>
          <div style={{width: '1px', height: '24px', background: '#334155'}}></div>
          <h1 style={{fontSize: '1.1rem', margin: 0, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <BookOpen size={18} color="var(--primary)"/>
            {lang === 'ar' ? course.title_ar : course.title_en}
          </h1>
        </div>
        <button className="btn-mobile-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)} style={{background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer'}}>
          {sidebarOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </header>

      {/* المحتوى الرئيسي */}
      <div style={{display: 'flex', flex: 1, overflow: 'hidden', position: 'relative'}}>
        
        {/* منطقة الفيديو والشرح */}
        <main style={{flex: 1, overflowY: 'auto', padding: '0', display: 'flex', flexDirection: 'column'}}>
          
          {/* مشغل الفيديو */}
          <div style={{width: '100%', background: '#000', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
            {videoUrl ? (
              <video 
                key={videoUrl} 
                controls 
                controlsList="nodownload"
                style={{width: '100%', height: '100%', objectFit: 'contain'}}
                autoPlay
              >
                <source src={videoUrl} type="video/mp4" />
                {t('متصفحك لا يدعم مشغل الفيديو.', 'Your browser does not support the video tag.')}
              </video>
            ) : (
              <div style={{textAlign: 'center', color: '#64748b'}}>
                <PlayCircle size={60} style={{margin: '0 auto 15px', opacity: 0.5}}/>
                <p>{activeLesson?.video_path ? t('جارٍ تحميل الفيديو...', 'Loading video...') : t('لا يوجد فيديو لهذا الدرس', 'No video for this lesson')}</p>
              </div>
            )}
          </div>

          {/* تفاصيل الدرس */}
          <div style={{padding: '40px', maxWidth: '1000px', margin: '0 auto', width: '100%'}}>
            <h2 style={{fontSize: '1.8rem', fontWeight: 800, marginBottom: '20px', color: '#fff'}}>
              {activeLesson ? (lang === 'ar' ? activeLesson.title_ar : activeLesson.title_en) : ''}
            </h2>
            <div style={{background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155'}}>
              <h3 style={{fontSize: '1.2rem', color: '#94a3b8', marginBottom: '15px'}}>{t('ملاحظات الدرس', 'Lesson Notes')}</h3>
              <div style={{lineHeight: 1.8, color: '#cbd5e1', fontSize: '1.05rem', whiteSpace: 'pre-wrap'}}>
                {activeLesson ? (lang === 'ar' ? activeLesson.description_ar : activeLesson.description_en) || t('لا توجد ملاحظات إضافية لهذا الدرس.', 'No additional notes for this lesson.') : ''}
              </div>
            </div>
          </div>
        </main>

        {/* القائمة الجانبية للدروس (Sidebar) */}
        <aside className={`classroom-sidebar ${sidebarOpen ? 'open' : ''}`} style={{width: '350px', background: '#1e293b', borderInlineStart: '1px solid #334155', display: 'flex', flexDirection: 'column', zIndex: 40}}>
          <div style={{padding: '20px', borderBottom: '1px solid #334155'}}>
            <h3 style={{margin: 0, fontSize: '1.1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <PlayCircle size={18}/> {t('قائمة الدروس', 'Course Content')}
            </h3>
            <div style={{marginTop: '15px', background: '#0f172a', borderRadius: '50px', height: '6px', overflow: 'hidden'}}>
               {/* نسبة مئوية وهمية للتقدم - بتقدر نربطها بالداتا بيس لقدام */}
               <div style={{background: 'var(--primary)', height: '100%', width: '10%'}}></div>
            </div>
          </div>
          
          <div style={{flex: 1, overflowY: 'auto', padding: '10px'}}>
            {lessons.map((lesson, idx) => {
              const isActive = activeLesson?.id === lesson.id;
              return (
                <button 
                  key={lesson.id}
                  onClick={() => {
                    setActiveLesson(lesson);
                    setSidebarOpen(false); // تسكير القائمة عالتلفون بعد الاختيار
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '15px', width: '100%', padding: '15px', 
                    background: isActive ? 'rgba(15, 118, 110, 0.2)' : 'transparent', 
                    border: '1px solid', borderColor: isActive ? 'rgba(45, 212, 191, 0.3)' : 'transparent',
                    borderRadius: '12px', cursor: 'pointer', textAlign: lang === 'ar' ? 'right' : 'left',
                    color: isActive ? '#fff' : '#cbd5e1', transition: 'all 0.2s', marginBottom: '5px'
                  }}
                  className="hover-bg-slate"
                >
                  <div style={{width: '32px', height: '32px', borderRadius: '50%', background: isActive ? 'var(--primary)' : '#334155', color: isActive ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.85rem', fontWeight: 'bold'}}>
                    {idx + 1}
                  </div>
                  <div style={{flex: 1}}>
                    <strong style={{display: 'block', fontSize: '0.95rem', marginBottom: '4px', fontWeight: isActive ? 700 : 500}}>
                      {lang === 'ar' ? lesson.title_ar : lesson.title_en}
                    </strong>
                    {lesson.duration_seconds > 0 && (
                      <span style={{fontSize: '0.75rem', color: isActive ? '#5eead4' : '#64748b'}}>
                        {Math.floor(lesson.duration_seconds / 60)} {t('دقيقة', 'mins')}
                      </span>
                    )}
                  </div>
                  {isActive && <ChevronRight size={18} color="var(--primary)" style={{transform: lang === 'ar' ? 'rotate(180deg)' : 'none'}}/>}
                </button>
              )
            })}
          </div>
        </aside>
      </div>

      {/* تصميم مخصص للموبايل والـ Hover */}
      <style dangerouslySetInnerHTML={{__html: `
        .hover-text-white:hover { color: #fff !important; }
        .hover-bg-slate:hover { background: #334155 !important; }
        .btn-mobile-sidebar { display: none !important; }
        
        @media (max-width: 900px) {
          .btn-mobile-sidebar { display: block !important; }
          .classroom-sidebar {
            position: absolute;
            top: 0; bottom: 0; right: ${lang === 'ar' ? '0' : 'auto'}; left: ${lang === 'ar' ? 'auto' : '0'};
            transform: translateX(${lang === 'ar' ? '100%' : '-100%'});
            transition: transform 0.3s ease;
            box-shadow: 0 0 50px rgba(0,0,0,0.5);
          }
          .classroom-sidebar.open {
            transform: translateX(0);
          }
        }
      `}} />
    </div>
  );
}