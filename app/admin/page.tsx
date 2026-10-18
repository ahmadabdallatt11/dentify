'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, BookOpen, Check, Download, Edit3, ImagePlus, LayoutDashboard, LoaderCircle, Palette, Plus, Save, Search, ShieldCheck, Trash2, UploadCloud, Users, Wallet, X, Store, Package, FileText, DownloadCloud, TrendingUp, Truck, Printer, MessageSquare, Mail } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { money, publicImage, slugify } from '@/lib/utils';
import { useApp } from '@/components/Providers';

const tabs = [
  ['overview', 'Overview'],
  ['users', 'Users'],
  ['courses', 'Courses & lessons'],
  ['products', 'Store & Products'],
  ['assignments', 'Assignments'],
  ['payments', 'New Payments'], 
  ['orders', 'Orders & Tracking'], 
  ['messages', 'Contact Messages'], // تبويب رسائل التواصل
  ['brand', 'Site customizer']
];

function csvDownload(rows: any[], name: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const text = [
    keys.map(escape).join(','),
    ...rows.map(r => keys.map(k => escape(r[k])).join(','))
  ].join('\r\n');
  const blob = new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const { user, profile, loading: authLoading, lang, t, toast, settings, refreshSettings } = useApp();
  
  const [tab, setTab] = useState('overview');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');
  
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]); // حالة الرسائل الجديدة
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [receiptUrls, setReceiptUrls] = useState<Record<string, string>>({});
  const [quotePrices, setQuotePrices] = useState<Record<string, string>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, { reply: string; status: 'completed' | 'rejected'; file: File | null }>>({});
  const [assignmentAction, setAssignmentAction] = useState<string | null>(null);
  
  const [courseForm, setCourseForm] = useState<any>({ title_ar: '', title_en: '', slug: '', description_ar: '', description_en: '', price_jod: '0', is_published: false, sort_order: 0, image_path: '', instructor_name: '', visibility: 'public', target_email: '' });
  const [lessonForm, setLessonForm] = useState<any>({ title_ar: '', title_en: '', description_ar: '', description_en: '', video_path: '', duration_seconds: 0, sort_order: 0, is_preview: false });
  
  // أضفنا brands و types لتهيئة الفورم مع colors و sizes
  const [productForm, setProductForm] = useState<any>({ title_ar: '', title_en: '', slug: '', description_ar: '', description_en: '', price_jod: '0', stock_quantity: '0', category: '', is_published: false, image_path: '', colors: [], sizes: [], brands: [], types: [] });
  
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [brandInput, setBrandInput] = useState(''); 
  const [typeInput, setTypeInput] = useState(''); 

  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [brandForm, setBrandForm] = useState<any>({ brand_name: 'Dentify', logo_url: '', primary_color: '#0F766E', secondary_color: '#0F172A', cliq_alias: '', cliq_bank_name: '', support_email: '' });

  const load = useCallback(async () => {
    if (!user || profile?.role !== 'admin') return;
    setBusy(true);
    const sb = supabaseBrowser();
    const [u, c, p, o, a, m] = await Promise.all([
      sb.from('profiles').select('*').not('email', 'like', '%@deleted.invalid').order('created_at', { ascending: false }),
      sb.from('courses').select('*').order('created_at', { ascending: false }),
      sb.from('products').select('*').order('created_at', { ascending: false }),
      sb.from('cliq_orders').select('*, profiles!cliq_orders_user_id_fkey(full_name,email), cliq_order_items(*, courses(title_ar,title_en,slug), products(title_ar,title_en))').order('created_at', { ascending: false }),
      sb.from('assignment_requests').select('*, profiles(full_name, email, university)').order('created_at', { ascending: false }),
      sb.from('contact_messages').select('*').order('created_at', { ascending: false }) // استدعاء الرسائل
    ]);
    
    if (u.error) toast(u.error.message, 'error');
    if (c.error) toast(c.error.message, 'error');
    if (p.error) toast(p.error.message, 'error');
    if (o.error) toast(o.error.message, 'error');
    if (a.error) toast(a.error.message, 'error');
    if (m.error) toast(m.error.message, 'error');

    setUsers(u.data || []);
    setCourses(c.data || []);
    setProducts(p.data || []);
    setOrders(o.data || []);
    setAssignments(a.data || []);
    setMessages(m.data || []);

    setBrandForm({
      brand_name: String(settings.brand_name || 'Dentify').replaceAll('"', ''),
      logo_url: String(settings.logo_url || '').replaceAll('"', ''),
      primary_color: String(settings.primary_color || '#0F766E').replaceAll('"', ''),
      secondary_color: String(settings.secondary_color || '#0F172A').replaceAll('"', ''),
      cliq_alias: String(settings.cliq_alias || '').replaceAll('"', ''),
      cliq_bank_name: String(settings.cliq_bank_name || '').replaceAll('"', ''),
      support_email: String(settings.support_email || '').replaceAll('"', '')
    });
    setBusy(false);
  }, [user, profile?.role, toast, settings]);

  useEffect(() => { void load() }, [load]);

  useEffect(() => {
    if (tab === 'courses' && selectedCourse) {
      supabaseBrowser()
        .from('course_lessons')
        .select('*')
        .eq('course_id', selectedCourse)
        .order('sort_order')
        .then(({ data, error }) => {
          if (error) toast(error.message, 'error');
          setLessons(data || []);
        });
    }
  }, [tab, selectedCourse, toast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sb = supabaseBrowser();
      const next: Record<string, string> = {};
      
      if (tab === 'payments') {
        const pending = orders.filter(o => o.proof_path && !receiptUrls[o.id]);
        for (const o of pending) {
          const { data } = await sb.storage.from('payment-proofs').createSignedUrl(o.proof_path, 600);
          if (data?.signedUrl) next[o.id] = data.signedUrl;
        }
      }
      
      if (tab === 'assignments') {
        const paidAssignments = assignments.filter(a => a.payment_proof && !receiptUrls[a.id]);
        for (const a of paidAssignments) {
          const { data } = await sb.storage.from('payment-proofs').createSignedUrl(a.payment_proof, 600);
          if (data?.signedUrl) next[a.id] = data.signedUrl;
        }
      }
      
      if (!cancelled && Object.keys(next).length > 0) {
        setReceiptUrls(prev => ({ ...prev, ...next }));
      }
    })();
    return () => { cancelled = true };
  }, [tab, orders, assignments, receiptUrls]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (`${u.full_name || ''} ${u.email || ''} ${u.phone || ''} ${u.university || ''} ${u.major || ''}`).toLowerCase().includes(search.toLowerCase()) && 
      (!genderFilter || u.gender === genderFilter) && 
      (!yearFilter || u.academic_year === yearFilter) && 
      (!universityFilter || u.university === universityFilter)
    );
  }, [users, search, genderFilter, yearFilter, universityFilter]);

  const students = users.filter(u => u.role !== 'admin');
  const male = students.filter(u => u.gender === 'male').length;
  const female = students.filter(u => u.gender === 'female').length;
  
  const universityCounts = students.reduce((acc: any, u) => { 
    if(u.university) acc[u.university] = (acc[u.university] || 0) + 1; 
    return acc; 
  }, {});
  
  const topUniversities = Object.entries(universityCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);

  const totalRevenue = useMemo(() => {
    const ordersRev = orders.filter(o => o.status === 'approved').reduce((sum, o) => sum + Number(o.amount_jod || 0), 0);
    const assignRev = assignments.filter(a => a.status === 'completed' || a.status === 'paid').reduce((sum, a) => sum + Number(a.price_jod || 0), 0);
    return ordersRev + assignRev;
  }, [orders, assignments]);

  async function changeUser(id: string, patch: any) {
    const { error } = await supabaseBrowser().from('profiles').update(patch).eq('id', id);
    if (error) toast(error.message, 'error');
    else { 
      toast(t('تم تحديث المستخدم', 'User updated'), 'success'); 
      await load(); 
    }
  }

  async function deleteUser(id: string) {
    if (!confirm(t('سيتم حذف حساب المستخدم نهائياً. هل تريد المتابعة؟', 'This permanently deletes the user account. Continue?'))) return;
    const { data: { session } } = await supabaseBrowser().auth.getSession();
    if (!session) { 
      toast(t('انتهت الجلسة، سجّل الدخول مجدداً', 'Session expired, please sign in again'), 'error'); 
      return; 
    }
    const response = await fetch('/api/admin/users/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + session.access_token } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) toast(result.error || t('تعذر حذف الحساب', 'Could not delete account'), 'error');
    else { 
      toast(result.message || t('تم حذف الحساب', 'Account deleted'), 'success'); 
      await load(); 
    }
  }

  async function saveCourse(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      title_ar: courseForm.title_ar,
      title_en: courseForm.title_en,
      slug: courseForm.slug || slugify(courseForm.title_en || courseForm.title_ar),
      description_ar: courseForm.description_ar,
      description_en: courseForm.description_en,
      price_jod: Number(courseForm.price_jod || 0),
      is_published: !!courseForm.is_published,
      sort_order: Number(courseForm.sort_order || 0),
      image_path: courseForm.image_path || null,
      instructor_name: courseForm.instructor_name || null,
      visibility: courseForm.visibility || 'public',
      target_email: courseForm.visibility === 'private' ? (courseForm.target_email || null) : null
    };
    const sb = supabaseBrowser();
    const result = editingCourse
      ? await sb.from('courses').update(payload).eq('id', editingCourse)
      : await sb.from('courses').insert(payload);
    setBusy(false);
    if (result.error) toast(result.error.message, 'error');
    else {
      toast(t('تم حفظ الكورس', 'Course saved'), 'success');
      setCourseForm({ title_ar: '', title_en: '', slug: '', description_ar: '', description_en: '', price_jod: '0', is_published: false, sort_order: 0, image_path: '', instructor_name: '', visibility: 'public', target_email: '' });
      setEditingCourse(null);
      await load();
    }
  }

  async function uploadCourseImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      toast(t('اختر صورة أقل من 5 ميغابايت', 'Choose an image under 5 MB'), 'error');
      return;
    }
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabaseBrowser().storage.from('course-images').upload(path, file, { upsert: true, contentType: file.type });
    if (error) toast(error.message, 'error');
    else {
      setCourseForm((f: any) => ({ ...f, image_path: path }));
      toast(t('تم رفع الصورة', 'Image uploaded'), 'success');
    }
  }

  async function removeCourse(id: string) {
    if (!confirm(t('حذف هذا الكورس وكل دروسه؟', 'Delete this course and all its lessons?'))) return;
    const { error } = await supabaseBrowser().from('courses').delete().eq('id', id);
    if (error) toast(error.message, 'error');
    else {
      toast(t('تم حذف الكورس', 'Course deleted'), 'success');
      if (selectedCourse === id) setSelectedCourse('');
      await load();
    }
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      title_ar: productForm.title_ar,
      title_en: productForm.title_en,
      slug: productForm.slug || slugify(productForm.title_en || productForm.title_ar),
      description_ar: productForm.description_ar,
      description_en: productForm.description_en,
      price_jod: Number(productForm.price_jod || 0),
      stock_quantity: Number(productForm.stock_quantity || 0),
      category: productForm.category || null,
      is_published: !!productForm.is_published,
      image_path: productForm.image_path || null,
      colors: productForm.colors,
      sizes: productForm.sizes,
      brands: productForm.brands, // جديد
      types: productForm.types // جديد
    };
    const sb = supabaseBrowser();
    const result = editingProduct
      ? await sb.from('products').update(payload).eq('id', editingProduct)
      : await sb.from('products').insert(payload);
    setBusy(false);
    if (result.error) toast(result.error.message, 'error');
    else {
      toast(t('تم حفظ المنتج', 'Product saved'), 'success');
      setProductForm({ title_ar: '', title_en: '', slug: '', description_ar: '', description_en: '', price_jod: '0', stock_quantity: '0', category: '', is_published: false, image_path: '', colors: [], sizes: [], brands: [], types: [] });
      setEditingProduct(null);
      await load();
    }
  }

  // دوال الـ Tags للألوان والأحجام والشركات والأنواع
  const addColor = () => { if(colorInput.trim() && !productForm.colors?.includes(colorInput.trim())) { setProductForm({...productForm, colors: [...(productForm.colors||[]), colorInput.trim()]}); setColorInput(''); } };
  const removeColor = (c: string) => setProductForm({...productForm, colors: (productForm.colors||[]).filter((x:string) => x !== c)});
  
  const addSize = () => { if(sizeInput.trim() && !productForm.sizes?.includes(sizeInput.trim())) { setProductForm({...productForm, sizes: [...(productForm.sizes||[]), sizeInput.trim()]}); setSizeInput(''); } };
  const removeSize = (s: string) => setProductForm({...productForm, sizes: (productForm.sizes||[]).filter((x:string) => x !== s)});

  const addBrand = () => { if(brandInput.trim() && !productForm.brands?.includes(brandInput.trim())) { setProductForm({...productForm, brands: [...(productForm.brands||[]), brandInput.trim()]}); setBrandInput(''); } };
  const removeBrand = (b: string) => setProductForm({...productForm, brands: (productForm.brands||[]).filter((x:string) => x !== b)});
  
  const addType = () => { if(typeInput.trim() && !productForm.types?.includes(typeInput.trim())) { setProductForm({...productForm, types: [...(productForm.types||[]), typeInput.trim()]}); setTypeInput(''); } };
  const removeType = (t: string) => setProductForm({...productForm, types: (productForm.types||[]).filter((x:string) => x !== t)});

  async function uploadProductImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      toast(t('اختر صورة أقل من 5 ميغابايت', 'Choose an image under 5 MB'), 'error');
      return;
    }
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabaseBrowser().storage.from('product-images').upload(path, file, { upsert: true, contentType: file.type });
    if (error) toast(error.message, 'error');
    else {
      setProductForm((f: any) => ({ ...f, image_path: path }));
      toast(t('تم رفع الصورة', 'Image uploaded'), 'success');
    }
  }

  async function removeProduct(id: string) {
    if (!confirm(t('إخفاء أو حذف هذا المنتج؟', 'Delete or unpublish this product?'))) return;
    const { error } = await supabaseBrowser().from('products').delete().eq('id', id);
    if (error) toast(error.message, 'error');
    else {
      toast(t('تم الحذف', 'Product deleted'), 'success');
      await load();
    }
  }

  async function saveLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse) {
      toast(t('اختر كورساً أولاً', 'Choose a course first'), 'error');
      return;
    }
    const payload = {
      course_id: selectedCourse,
      title_ar: lessonForm.title_ar,
      title_en: lessonForm.title_en,
      description_ar: lessonForm.description_ar,
      description_en: lessonForm.description_en,
      video_path: lessonForm.video_path || null,
      duration_seconds: Number(lessonForm.duration_seconds || 0),
      sort_order: Number(lessonForm.sort_order || 0),
      is_preview: !!lessonForm.is_preview
    };
    const result = editingLesson
      ? await supabaseBrowser().from('course_lessons').update(payload).eq('id', editingLesson)
      : await supabaseBrowser().from('course_lessons').insert(payload);
    
    if (result.error) toast(result.error.message, 'error');
    else {
      toast(t('تم حفظ الدرس', 'Lesson saved'), 'success');
      setLessonForm({ title_ar: '', title_en: '', description_ar: '', description_en: '', video_path: '', duration_seconds: 0, sort_order: lessons.length + 1, is_preview: false });
      setEditingLesson(null);
      const { data } = await supabaseBrowser().from('course_lessons').select('*').eq('course_id', selectedCourse).order('sort_order');
      setLessons(data || []);
    }
  }

  async function uploadVideo(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('video/') || file.size > 500 * 1024 * 1024) {
      toast(t('اختر فيديو أقل من 500 ميغابايت', 'Choose a video under 500 MB'), 'error');
      return;
    }
    const path = `${selectedCourse}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabaseBrowser().storage.from('course-videos').upload(path, file, { upsert: true, contentType: file.type });
    if (error) toast(error.message, 'error');
    else {
      setLessonForm((f: any) => ({ ...f, video_path: path }));
      toast(t('تم رفع الفيديو', 'Video uploaded'), 'success');
    }
  }

  async function deleteLesson(id: string) {
    if (!confirm(t('حذف هذا الدرس؟', 'Delete this lesson?'))) return;
    const { error } = await supabaseBrowser().from('course_lessons').delete().eq('id', id);
    if (error) toast(error.message, 'error');
    else {
      setLessons(ls => ls.filter(l => l.id !== id));
      toast(t('تم حذف الدرس', 'Lesson deleted'), 'success');
    }
  }

  async function reviewOrder(order: any, status: 'approved' | 'rejected') {
    const note = status === 'rejected' ? prompt(t('سبب الرفض (اختياري)', 'Reason for rejection (optional)')) || '' : null;
    const { error } = await supabaseBrowser().rpc('review_cliq_order', { p_order_id: order.id, p_status: status, p_admin_note: note });
    if (error) { toast(error.message, 'error'); return; }
    toast(status === 'approved' ? t('تمت الموافقة وتم التفعيل', 'Approved and granted') : t('تم الرفض', 'Order rejected'), 'success');
    await load();
  }

  async function saveBrand(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const sb = supabaseBrowser();
    const rows = Object.entries(brandForm).map(([key, value]) => ({ key, value, updated_by: user?.id || null }));
    const { error } = await sb.from('site_settings').upsert(rows, { onConflict: 'key' });
    setBusy(false);
    if (error) toast(error.message, 'error');
    else {
      toast(t('تم حفظ إعدادات الهوية', 'Brand settings saved'), 'success');
      await refreshSettings();
    }
  }

  async function quoteAssignment(req: any) {
    const rawPrice = quotePrices[req.id] ?? '';
    const price = Number(rawPrice);
    if (!rawPrice.trim() || !Number.isFinite(price) || price <= 0) {
      toast(t('أدخل سعراً صحيحاً أكبر من صفر.', 'Enter a valid price greater than zero.'), 'error');
      return;
    }
    setAssignmentAction(req.id);
    const { error } = await supabaseBrowser().from('assignment_requests')
      .update({ price_jod: Math.round(price * 100) / 100, status: 'awaiting_payment' })
      .eq('id', req.id).eq('status', 'pending');
    setAssignmentAction(null);
    if (error) { toast(error.message, 'error'); return; }
    toast(t('تم إرسال السعر للطالب.', 'Quote sent to the student.'), 'success');
    await load();
  }

  async function replyAndSolve(req: any) {
    const draft = replyDrafts[req.id] ?? { reply: '', status: 'completed' as const, file: null };
    if (!draft.reply.trim()) {
      toast(t('اكتب رد الإدارة أو تفاصيل الحل أولاً.', 'Enter an admin reply or solution details first.'), 'error');
      return;
    }
    if (draft.file && draft.file.size > 25 * 1024 * 1024) {
      toast(t('الحد الأقصى للملف 25 ميجابايت.', 'Maximum solution file size is 25 MB.'), 'error');
      return;
    }
    setAssignmentAction(req.id);
    const sb = supabaseBrowser();
    let uploadedPath: string | null = null;
    try {
      if (draft.file) {
        const safeName = draft.file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'solution-file';
        uploadedPath = `admin_replies/${req.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await sb.storage.from('assignments').upload(uploadedPath, draft.file, {
          upsert: false,
          contentType: draft.file.type || 'application/octet-stream'
        });
        if (uploadError) throw uploadError;
      }
      const patch: Record<string, any> = { admin_reply: draft.reply.trim(), status: draft.status };
      if (uploadedPath) patch.admin_file_path = uploadedPath;
      const { error } = await sb.from('assignment_requests').update(patch).eq('id', req.id).eq('status', 'paid');
      if (error) {
        if (uploadedPath) await sb.storage.from('assignments').remove([uploadedPath]);
        throw error;
      }
      toast(draft.status === 'completed' ? t('تم تسليم الحل للطالب.', 'Solution delivered to the student.') : t('تم رفض الطلب.', 'Request rejected.'), 'success');
      setReplyDrafts(prev => ({ ...prev, [req.id]: { reply: '', status: 'completed', file: null } }));
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : t('تعذر حفظ الرد والحل.', 'Could not save the reply and solution.'), 'error');
    } finally {
      setAssignmentAction(null);
    }
  }

  async function downloadAssignmentFile(path: string, fileName: string) {
    const { data, error } = await supabaseBrowser().storage.from('assignments').createSignedUrl(path, 60);
    if (error) { toast(t('تعذر تحميل الملف', 'Could not download file'), 'error'); return; }
    if (data?.signedUrl) {
      const a = document.createElement('a'); 
      a.href = data.signedUrl; 
      a.target = '_blank'; 
      a.download = fileName; 
      a.click();
    }
  }

  // تحديث حالة الطلب
  async function updateOrderStatus(id: string, newStatus: string) {
    const { error } = await supabaseBrowser().from('cliq_orders').update({ status: newStatus }).eq('id', id);
    if (error) toast(error.message, 'error');
    else { toast(t('تم تحديث حالة الطلب', 'Order status updated'), 'success'); await load(); }
  }

  // دوال رسائل التواصل
  async function updateMessageStatus(id: string, newStatus: string) {
    const { error } = await supabaseBrowser().from('contact_messages').update({ status: newStatus }).eq('id', id);
    if (error) toast(error.message, 'error'); else { toast(t('تم تحديث حالة الرسالة', 'Message status updated'), 'success'); await load(); }
  }

  async function deleteMessage(id: string) {
    if (!confirm(t('هل أنت متأكد من حذف هذه الرسالة؟', 'Are you sure you want to delete this message?'))) return;
    const { error } = await supabaseBrowser().from('contact_messages').delete().eq('id', id);
    if (error) toast(error.message, 'error'); else { toast(t('تم حذف الرسالة', 'Message deleted'), 'success'); await load(); }
  }

  // طباعة الفاتورة PDF
  function printInvoice(order: any) {
    const win = window.open('', '_blank');
    if(!win) return;
    
    const itemsHtml = order.cliq_order_items.map((i:any) => `
      <tr>
        <td>
          <strong style="font-size: 14px">${i.courses ? '🎓 ' + (i.courses.title_ar || i.courses.title_en) : i.products ? '📦 ' + (i.products.title_ar || i.products.title_en) : 'عنصر'}</strong>
          ${i.selected_color || i.selected_size || i.selected_brand || i.selected_type ? `
            <div style="font-size: 12px; color: #64748b; margin-top: 5px;">
              ${i.selected_brand ? `الشركة: ${i.selected_brand} | ` : ''}
              ${i.selected_type ? `النوع: ${i.selected_type} | ` : ''}
              ${i.selected_color ? `اللون: ${i.selected_color} | ` : ''} 
              ${i.selected_size ? `المقاس: ${i.selected_size}` : ''}
            </div>` : ''}
        </td>
        <td style="text-align: center;">${i.quantity || 1}</td>
        <td style="text-align: center;">${i.price_jod} د.أ</td>
        <td style="text-align: center; font-weight: bold;">${(i.price_jod * (i.quantity || 1)).toFixed(2)} د.أ</td>
      </tr>
    `).join('');

    win.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>فاتورة رقم ${order.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; direction: rtl; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #0f766e; padding-bottom: 20px; }
            .header h1 { color: #0f766e; margin: 0; font-size: 32px; }
            .info-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; line-height: 1.8; font-size: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px; }
            th { background: #f1f5f9; color: #334155; text-align: center; font-weight: bold; }
            .totals { margin-top: 30px; text-align: left; background: #f8fafc; padding: 20px; border-radius: 8px; }
            .total-line { font-size: 16px; margin-bottom: 10px; color: #475569; }
            .grand-total { font-size: 24px; font-weight: bold; color: #0f766e; border-top: 2px dashed #cbd5e1; padding-top: 15px; margin-top: 10px; }
            .btn-print { display: block; margin: 30px auto 0; padding: 12px 25px; background: #0f766e; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(15,118,110,0.2); }
            .btn-print:hover { background: #115e59; }
            @media print { .invoice-box { border: none; box-shadow: none; padding: 0; } .btn-print { display: none; } body { padding: 0; background: white; } }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <h1>${settings.brand_name || 'Dentify'}</h1>
              <p style="color: #64748b; font-size: 14px; margin-top: 5px;">فاتورة طلب إلكتروني | Official Invoice</p>
            </div>
            
            <div class="info-box">
              <div style="display: flex; justify-content: space-between;">
                <div>
                  <p style="margin: 5px 0;"><strong>اسم العميل:</strong> ${order.profiles?.full_name || order.profiles?.email || 'طالب'}</p>
                  <p style="margin: 5px 0;"><strong>رقم الطلب (Ref):</strong> #${order.id.slice(0,8).toUpperCase()}</p>
                  <p style="margin: 5px 0;"><strong>تاريخ الطلب:</strong> ${new Date(order.created_at).toLocaleString('ar-JO')}</p>
                </div>
                <div style="text-align: left;">
                  <p style="margin: 5px 0;"><strong>طريقة الدفع:</strong> ${order.payment_method === 'cod' ? 'الدفع عند الاستلام (كاش)' : 'حوالة بنكية مؤكدة (CliQ)'}</p>
                  <p style="margin: 5px 0; color: #0f766e; font-weight: bold;">الحالة: ${order.status === 'approved' ? 'مؤكد' : order.status === 'shipped' ? 'قيد التوصيل' : 'مكتمل'}</p>
                </div>
              </div>
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 5px 0;"><strong>العنوان والتواصل:</strong> ${order.delivery_address || 'توصيل غير مطلوب'}</p>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th style="text-align: right;">وصف العنصر (Item)</th>
                  <th>الكمية (Qty)</th>
                  <th>السعر الإفرادي</th>
                  <th>المجموع (Subtotal)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="totals">
              ${order.delivery_fee ? `<div class="total-line">رسوم التوصيل: ${order.delivery_fee} د.أ</div>` : ''}
              <div class="grand-total">الإجمالي المستحق: ${order.amount_jod} د.أ</div>
            </div>
            
            <button class="btn-print" onclick="window.print()">🖨️ طباعة أو حفظ كـ PDF</button>
          </div>
        </body>
      </html>
    `);
    win.document.close();
  }

  if (authLoading) return <div className="container loading-page"><div className="spinner"/></div>;
  if (!user || profile?.role !== 'admin') return <div className="container section"><div className="empty-state"><ShieldCheck size={32}/><h3>{t('هذه الصفحة مخصصة للإدارة', 'Admin access only')}</h3><Link className="btn btn-outline" href="/">{t('العودة للرئيسية', 'Back home')}</Link></div></div>;

  return (
    <div className="container section">
      <div className="page-hero">
        <div className="eyebrow"><ShieldCheck size={14}/>{t('مساحة الإدارة', 'Administration')}</div>
        <h1>{t('لوحة تحكم Dentify', 'Dentify admin dashboard')}</h1>
        <p>{t('إدارة الطلاب، المتجر، الكورسات، طلبات الدفع وحل الواجبات من مكان واحد.', 'Manage students, store, courses, payments, and assignments in one place.')}</p>
      </div>

      <div className="admin-layout">
        <aside className="admin-side">
          {tabs.map(([id, label]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              {id === 'overview' ? <LayoutDashboard size={16}/> : id === 'users' ? <Users size={16}/> : id === 'courses' ? <BookOpen size={16}/> : id === 'products' ? <Store size={16}/> : id === 'assignments' ? <FileText size={16}/> : id === 'payments' ? <Wallet size={16}/> : id === 'orders' ? <Truck size={16}/> : id === 'messages' ? <MessageSquare size={16}/> : <Palette size={16}/>}
              <span>{t(({overview:'نظرة عامة', users:'المستخدمون', courses:'الكورسات والدروس', products:'المتجر والمنتجات', assignments:'طلبات الواجبات', payments:'طلبات جديدة', orders:'تتبع الفواتير والطلبات', messages:'رسائل التواصل', brand:'تخصيص الموقع'} as any)[id], label)}</span>
              {id === 'payments' && orders.filter(o => o.status === 'pending').length > 0 && (
                <span style={{background: '#ef4444', color: '#fff', borderRadius: '50px', padding: '2px 6px', fontSize: '0.7rem', marginLeft: 'auto', fontWeight: 'bold'}}>
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
              {id === 'messages' && messages.filter(m => m.status === 'new').length > 0 && (
                <span style={{background: '#ef4444', color: '#fff', borderRadius: '50px', padding: '2px 6px', fontSize: '0.7rem', marginLeft: 'auto', fontWeight: 'bold'}}>
                  {messages.filter(m => m.status === 'new').length}
                </span>
              )}
            </button>
          ))}
        </aside>
        
        <section className="admin-content">
          {busy && <div className="status status-pending" style={{marginBottom: 12}}><LoaderCircle size={13}/>{t('جارٍ التنفيذ...', 'Processing...')}</div>}
          
          {tab === 'overview' && (
            <>
              <div className="metric-grid">
                <div className="metric"><span>{t('إجمالي الطلاب', 'Total students')}</span><strong>{students.length}</strong><small><Users size={12} style={{display:'inline',verticalAlign:'middle'}}/> {t('حسابات الطلاب', 'Student accounts')}</small></div>
                <div className="metric"><span>{t('إجمالي الأرباح', 'Total Revenue')}</span><strong style={{color: 'var(--primary)'}}>{money(totalRevenue)}</strong><small><TrendingUp size={12} style={{display:'inline',verticalAlign:'middle'}}/> {t('مدفوعات مؤكدة', 'Confirmed payments')}</small></div>
                <div className="metric"><span>{t('الكورسات والمنتجات', 'Courses & Products')}</span><strong>{courses.length + products.length}</strong><small><BookOpen size={12} style={{display:'inline',verticalAlign:'middle'}}/> {t('عنصر نشط', 'active items')}</small></div>
                <div className="metric"><span>{t('واجبات معلقة', 'Pending assignments')}</span><strong>{assignments.filter(a => a.status === 'pending' || a.status === 'paid').length}</strong><small style={{color: '#ef4444'}}><FileText size={12} style={{display:'inline',verticalAlign:'middle'}}/> {t('تحتاج إجراء', 'needs action')}</small></div>
              </div>
              <div className="panel">
                <h2>{t('أكثر الجامعات تسجيلاً', 'Top universities')}</h2>
                {topUniversities.length ? topUniversities.map(([name, count]: any) => (
                  <div key={name} style={{margin: '14px 0'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:7}}><b>{name}</b><span>{count}</span></div>
                    <div className="progress"><span style={{width:`${Math.max(3, count / (topUniversities[0][1] as number) * 100)}%`}}/></div>
                  </div>
                )) : <p style={{color:'var(--muted)',fontSize:12}}>{t('لا توجد بيانات كافية بعد.', 'Not enough data yet.')}</p>}
              </div>
            </>
          )}

          {tab === 'users' && (
            <>
              <div className="section-head">
                <div><h2>{t('إدارة المستخدمين', 'User management')}</h2><p>{t('بيانات الحسابات المسجلة وصلاحياتها.', 'Registered accounts and their access levels.')}</p></div>
                <button className="btn btn-primary" onClick={() => csvDownload(filteredUsers.map(u => ({full_name:u.full_name,email:u.email,phone:u.phone,university:u.university,major:u.major,gender:u.gender,academic_year:u.academic_year,governorate:u.governorate,role:u.role,is_active:u.is_active,created_at:u.created_at})), 'dentify-users.csv')}><Download size={16}/>{t('تصدير CSV / Excel', 'Export CSV / Excel')}</button>
              </div>
              <div className="toolbar">
                <div style={{position:'relative',flex:1,minWidth:180}}>
                  <Search size={16} style={{position:'absolute',top:13,insetInlineStart:13,color:'var(--muted)'}}/>
                  <input className="search-input" style={{paddingInlineStart:38}} placeholder={t('ابحث بالاسم أو البريد...', 'Search name or email...')} value={search} onChange={e => setSearch(e.target.value)}/>
                </div>
                <select className="search-input" style={{maxWidth:190}} value={universityFilter} onChange={e => setUniversityFilter(e.target.value)}>
                  <option value="">{t('كل الجامعات', 'All universities')}</option>
                  {Array.from(new Set(users.map(u => u.university).filter(Boolean))).sort().map((u:any) => <option key={u}>{u}</option>)}
                </select>
                <select className="search-input" style={{maxWidth:140}} value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
                  <option value="">{t('كل الأجناس', 'All genders')}</option><option value="male">{t('ذكر', 'Male')}</option><option value="female">{t('أنثى', 'Female')}</option>
                </select>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>{t('المستخدم', 'User')}</th><th>{t('الهاتف', 'Phone')}</th><th>{t('الجامعة / التخصص', 'University / Major')}</th><th>{t('الحالة', 'Status')}</th><th>{t('إجراءات', 'Actions')}</th></tr></thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td><b>{u.full_name||'—'}</b><small style={{display:'block',color:'var(--muted)'}}>{u.email}</small></td>
                        <td>{u.phone||'—'}</td>
                        <td>{u.university||'—'}<small style={{display:'block',color:'var(--muted)'}}>{u.major||'—'}</small></td>
                        <td><span className={`status ${u.is_active?'status-active':'status-inactive'}`}>{u.is_active?'Active':'Suspended'}</span><small style={{display:'block',color:'var(--muted)'}}>{u.role}</small></td>
                        <td>
                          <div className="row-actions">
                            <button className="btn btn-outline" onClick={() => changeUser(u.id,{is_active:!u.is_active})}>{u.is_active?t('حظر', 'Suspend'):t('تفعيل', 'Activate')}</button>
                            <button className="btn btn-outline" disabled={u.id === user.id} onClick={() => changeUser(u.id,{role:u.role==='admin'?'student':'admin'})}>{u.role === 'admin' ? t('إزالة الأدمن', 'Demote') : t('ترقية أدمن', 'Promote')}</button>
                            <button className="icon-button" disabled={u.id === user.id} onClick={() => void deleteUser(u.id)} aria-label="Delete"><Trash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'courses' && (
            <>
              <div className="section-head">
                <div><h2>{t('إدارة الكورسات', 'Course management')}</h2></div>
                <button className="btn btn-outline" onClick={() => { 
                  setEditingCourse(null); 
                  setCourseForm({title_ar:'',title_en:'',slug:'',description_ar:'',description_en:'',price_jod:'0',is_published:false,sort_order:courses.length,image_path:'',instructor_name:'',visibility:'public',target_email:''}); 
                }}><Plus size={16}/>{t('كورس جديد', 'New course')}</button>
              </div>
              <div className="panel">
                <h3 style={{marginTop:0}}>{editingCourse ? t('تعديل الكورس', 'Edit course') : t('بيانات الكورس', 'Course details')}</h3>
                <form className="admin-form" onSubmit={saveCourse}>
                  <div className="field"><label>{t('العنوان بالعربية', 'Arabic title')} *</label><input required value={courseForm.title_ar} onChange={e => setCourseForm((f:any) => ({...f, title_ar: e.target.value, slug: f.slug || slugify(e.target.value)}))}/></div>
                  <div className="field"><label>{t('العنوان بالإنجليزية', 'English title')} *</label><input required value={courseForm.title_en} onChange={e => setCourseForm((f:any) => ({...f, title_en: e.target.value, slug: f.slug || slugify(e.target.value)}))}/></div>
                  <div className="field"><label>{t('اسم المدرّس', 'Instructor')}</label><input value={courseForm.instructor_name||''} onChange={e => setCourseForm((f:any) => ({...f, instructor_name: e.target.value}))}/></div>
                  <div className="field"><label>Slug</label><input required value={courseForm.slug} onChange={e => setCourseForm((f:any) => ({...f, slug: slugify(e.target.value)}))}/></div>
                  <div className="field"><label>{t('السعر بالدينار', 'Price in JOD')} *</label><input type="number" min="0" step="0.01" required value={courseForm.price_jod} onChange={e => setCourseForm((f:any) => ({...f, price_jod: e.target.value}))}/></div>
                  
                  <div className="field">
                    <label>{t('ظهور الكورس (الخصوصية)', 'Course Visibility')}</label>
                    <select value={courseForm.visibility || 'public'} onChange={e => setCourseForm((f:any) => ({...f, visibility: e.target.value}))}>
                      <option value="public">{t('عام للجميع (يظهر في المكتبة)', 'Public (Visible to all)')}</option>
                      <option value="unlisted">{t('مخفي برابط (لا يظهر بالمكتبة)', 'Unlisted (Hidden link)')}</option>
                      <option value="private">{t('خاص (لطالب محدد فقط)', 'Private (Specific student)')}</option>
                    </select>
                  </div>
                  
                  {courseForm.visibility === 'private' && (
                    <div className="field">
                      <label>{t('إيميل الطالب المخصص', 'Target Student Email')} *</label>
                      <input type="email" required placeholder="student@example.com" value={courseForm.target_email || ''} onChange={e => setCourseForm((f:any) => ({...f, target_email: e.target.value}))}/>
                    </div>
                  )}

                  <div className="field full"><label>{t('الوصف بالعربية', 'Arabic description')}</label><textarea value={courseForm.description_ar} onChange={e => setCourseForm((f:any) => ({...f, description_ar: e.target.value}))}/></div>
                  <div className="field full"><label>{t('الوصف بالإنجليزية', 'English description')}</label><textarea value={courseForm.description_en} onChange={e => setCourseForm((f:any) => ({...f, description_en: e.target.value}))}/></div>
                  <div className="field">
                    <label>{t('صورة الغلاف', 'Cover image')}</label>
                    <label className="btn btn-outline" style={{cursor:'pointer',justifyContent:'center'}}><ImagePlus size={16}/>{courseForm.image_path ? courseForm.image_path : t('رفع صورة', 'Upload image')}<input type="file" hidden accept="image/*" onChange={e => void uploadCourseImage(e.target.files?.[0])}/></label>
                    {courseForm.image_path && <img src={publicImage(courseForm.image_path)} alt="Cover" style={{width:120,height:70,objectFit:'cover',borderRadius:8,marginTop:8}}/>}
                  </div>
                  <div className="field">
                    <label>{t('ترتيب العرض', 'Display order')}</label><input type="number" value={courseForm.sort_order} onChange={e => setCourseForm((f:any) => ({...f, sort_order: e.target.value}))}/>
                    <label style={{display:'flex',gap:8,alignItems:'center',marginTop:8}}><input type="checkbox" checked={!!courseForm.is_published} onChange={e => setCourseForm((f:any) => ({...f, is_published: e.target.checked}))}/>{t('نشر الكورس', 'Publish course')}</label>
                  </div>
                  <div className="field full" style={{display:'flex',gap:9}}>
                    <button className="btn btn-primary" type="submit" disabled={busy}><Save size={15}/>{t('حفظ الكورس', 'Save course')}</button>
                    {editingCourse && <button className="btn btn-outline" type="button" onClick={() => { setEditingCourse(null); setCourseForm({title_ar:'',title_en:'',slug:'',description_ar:'',description_en:'',price_jod:'0',is_published:false,sort_order:0,image_path:'',instructor_name:'',visibility:'public',target_email:''}); }}><X size={15}/>{t('إلغاء', 'Cancel')}</button>}
                  </div>
                </form>
              </div>
              <div className="admin-list">
                {courses.map(c => (
                  <div className="admin-row" key={c.id}>
                    <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}>
                      <div className="cart-thumb" style={{width:58,height:52,flexShrink:0}}>{c.image_path && publicImage(c.image_path) ? <img src={publicImage(c.image_path)} alt=""/> : <BookOpen size={21}/>}</div>
                      <div>
                        <strong>{c.title_en} / {c.title_ar}</strong>
                        <small style={{display: 'block', color: c.visibility === 'private' ? 'var(--primary)' : c.visibility === 'unlisted' ? '#ef4444' : 'var(--muted)'}}>
                          {c.is_published ? 'Published' : 'Draft'} · {c.visibility === 'private' ? `Private (${c.target_email})` : c.visibility === 'unlisted' ? 'Unlisted' : 'Public'}
                        </small>
                      </div>
                    </div>
                    <div className="row-actions">
                      <button className="btn btn-outline" onClick={() => { setSelectedCourse(c.id); setEditingCourse(c.id); setCourseForm({...c, price_jod: String(c.price_jod)}); }}><Edit3 size={13}/>{t('تعديل', 'Edit')}</button>
                      <button className="btn btn-soft" onClick={() => { setSelectedCourse(c.id); setEditingLesson(null); setLessonForm({title_ar:'',title_en:'',description_ar:'',description_en:'',video_path:'',duration_seconds:0,sort_order:0,is_preview:false}); }}><BookOpen size={13}/>{t('الدروس', 'Lessons')}</button>
                      <button className="icon-button" onClick={() => void removeCourse(c.id)} aria-label="Delete"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedCourse && (
                <div className="panel" style={{marginTop:20}}>
                  <div className="section-head">
                    <div><h2>{t('إدارة الدروس', 'Lesson management')}</h2><p>{courses.find(c => c.id === selectedCourse)?.title_en}</p></div>
                    <button className="icon-button" onClick={() => setSelectedCourse('')} aria-label="Close"><X size={17}/></button>
                  </div>
                  <form className="admin-form" onSubmit={saveLesson}>
                    <div className="field"><label>{t('عنوان الدرس بالعربية', 'Arabic lesson title')} *</label><input required value={lessonForm.title_ar} onChange={e => setLessonForm((f:any) => ({...f, title_ar: e.target.value}))}/></div>
                    <div className="field"><label>{t('عنوان الدرس بالإنجليزية', 'English lesson title')} *</label><input required value={lessonForm.title_en} onChange={e => setLessonForm((f:any) => ({...f, title_en: e.target.value}))}/></div>
                    <div className="field full"><label>{t('شرح الدرس بالعربية', 'Arabic notes')}</label><textarea value={lessonForm.description_ar} onChange={e => setLessonForm((f:any) => ({...f, description_ar: e.target.value}))}/></div>
                    <div className="field full"><label>{t('شرح الدرس بالإنجليزية', 'English notes')}</label><textarea value={lessonForm.description_en} onChange={e => setLessonForm((f:any) => ({...f, description_en: e.target.value}))}/></div>
                    <div className="field full">
                      <label>{t('رابط الفيديو أو مسار Storage', 'Video URL or Storage path')}</label>
                      <input value={lessonForm.video_path || ''} onChange={e => setLessonForm((f:any) => ({...f, video_path: e.target.value}))} placeholder="https://… or course-id/video.mp4"/>
                      <label className="btn btn-outline" style={{cursor:'pointer',justifyContent:'center',marginTop:8}}><UploadCloud size={15}/>{t('أو ارفع فيديو', 'Or upload video')}<input type="file" hidden accept="video/mp4,video/webm,video/quicktime" onChange={e => void uploadVideo(e.target.files?.[0])}/></label>
                    </div>
                    <div className="field"><label>{t('المدة بالثواني', 'Duration in seconds')}</label><input type="number" min="0" value={lessonForm.duration_seconds} onChange={e => setLessonForm((f:any) => ({...f, duration_seconds: e.target.value}))}/></div>
                    <div className="field">
                      <label>{t('ترتيب الدرس', 'Sort order')}</label><input type="number" value={lessonForm.sort_order} onChange={e => setLessonForm((f:any) => ({...f, sort_order: e.target.value}))}/>
                      <label style={{display:'flex',gap:8,alignItems:'center',marginTop:8}}><input type="checkbox" checked={!!lessonForm.is_preview} onChange={e => setLessonForm((f:any) => ({...f, is_preview: e.target.checked}))}/>{t('معاينة مجانية', 'Free preview')}</label>
                    </div>
                    <div className="field full" style={{display:'flex',gap:8}}>
                      <button className="btn btn-primary" type="submit"><Save size={15}/>{editingLesson ? t('حفظ تعديل الدرس', 'Save lesson') : t('إضافة الدرس', 'Add lesson')}</button>
                      {editingLesson && <button className="btn btn-outline" type="button" onClick={() => { setEditingLesson(null); setLessonForm({title_ar:'',title_en:'',description_ar:'',description_en:'',video_path:'',duration_seconds:0,sort_order:lessons.length+1,is_preview:false}); }}>{t('إلغاء', 'Cancel')}</button>}
                    </div>
                  </form>
                  <div className="admin-list">
                    {lessons.map((l, i) => (
                      <div className="admin-row" key={l.id}>
                        <div><strong>{i + 1}. {l.title_en} / {l.title_ar}</strong><small>{l.is_preview ? 'Free preview' : 'Enrolled users'} · {l.duration_seconds || 0}s</small></div>
                        <div className="row-actions">
                          <button className="btn btn-outline" onClick={() => { setEditingLesson(l.id); setLessonForm({...l}); }}><Edit3 size={13}/>{t('تعديل', 'Edit')}</button>
                          <button className="icon-button" onClick={() => void deleteLesson(l.id)}><Trash2 size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'products' && (
            <>
              <div className="section-head"><div><h2>{t('إدارة المتجر', 'Store management')}</h2></div><button className="btn btn-outline" onClick={() => { setEditingProduct(null); setProductForm({title_ar:'',title_en:'',slug:'',description_ar:'',description_en:'',price_jod:'0',stock_quantity:'0',category:'',is_published:false,image_path:'', colors:[], sizes:[], brands:[], types:[]}); }}><Plus size={16}/>{t('منتج جديد', 'New product')}</button></div>
              <div className="panel">
                <h3 style={{marginTop:0}}>{editingProduct ? t('تعديل المنتج', 'Edit product') : t('بيانات المنتج', 'Product details')}</h3>
                <form className="admin-form" onSubmit={saveProduct}>
                  <div className="field"><label>{t('اسم المنتج بالعربية', 'Arabic title')} *</label><input required value={productForm.title_ar} onChange={e => setProductForm((f:any) => ({...f, title_ar: e.target.value, slug: f.slug || slugify(e.target.value)}))}/></div>
                  <div className="field"><label>{t('اسم المنتج بالإنجليزية', 'English title')} *</label><input required value={productForm.title_en} onChange={e => setProductForm((f:any) => ({...f, title_en: e.target.value, slug: f.slug || slugify(e.target.value)}))}/></div>
                  <div className="field"><label>Slug</label><input required value={productForm.slug} onChange={e => setProductForm((f:any) => ({...f, slug: slugify(e.target.value)}))}/></div>
                  <div className="field"><label>{t('السعر بالدينار', 'Price in JOD')} *</label><input type="number" min="0" step="0.01" required value={productForm.price_jod} onChange={e => setProductForm((f:any) => ({...f, price_jod: e.target.value}))}/></div>
                  <div className="field"><label>{t('الكمية (المخزون)', 'Stock')} *</label><input type="number" min="0" required value={productForm.stock_quantity} onChange={e => setProductForm((f:any) => ({...f, stock_quantity: e.target.value}))}/></div>
                  <div className="field"><label>{t('التصنيف', 'Category')}</label><input value={productForm.category || ''} onChange={e => setProductForm((f:any) => ({...f, category: e.target.value}))} placeholder="Tools, Kits, etc."/></div>
                  
                  {/* نظام الـ Tags للعلامات التجارية (Brands) */}
                  <div className="field">
                    <label>{t('الشركات المصنعة (Brands)', 'Available Brands')}</label>
                    <div style={{display: 'flex', gap: 10}}>
                      <input value={brandInput} onChange={e => setBrandInput(e.target.value)} placeholder="مثال: 3M, GC" style={{flex: 1}} onKeyDown={e => { if(e.key==='Enter') { e.preventDefault(); addBrand(); } }}/>
                      <button type="button" className="btn btn-outline" onClick={addBrand}>{t('إضافة', 'Add')}</button>
                    </div>
                    <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10}}>
                      {(productForm.brands || []).map((b: string) => (
                        <span key={b} style={{background: 'var(--soft)', color: 'var(--primary)', padding: '5px 12px', borderRadius: 50, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5}}>
                          {b} <X size={12} style={{cursor: 'pointer'}} onClick={() => removeBrand(b)} />
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* نظام الـ Tags للنوع والشكل (Types) */}
                  <div className="field">
                    <label>{t('النوع أو الشكل', 'Type / Variant')}</label>
                    <div style={{display: 'flex', gap: 10}}>
                      <input value={typeInput} onChange={e => setTypeInput(e.target.value)} placeholder="مثال: خشن، ناعم" style={{flex: 1}} onKeyDown={e => { if(e.key==='Enter') { e.preventDefault(); addType(); } }}/>
                      <button type="button" className="btn btn-outline" onClick={addType}>{t('إضافة', 'Add')}</button>
                    </div>
                    <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10}}>
                      {(productForm.types || []).map((tType: string) => (
                        <span key={tType} style={{background: 'var(--soft)', color: 'var(--primary)', padding: '5px 12px', borderRadius: 50, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5}}>
                          {tType} <X size={12} style={{cursor: 'pointer'}} onClick={() => removeType(tType)} />
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* نظام الـ Tags للألوان */}
                  <div className="field">
                    <label>{t('الألوان المتاحة', 'Available Colors')}</label>
                    <div style={{display: 'flex', gap: 10}}>
                      <input value={colorInput} onChange={e => setColorInput(e.target.value)} placeholder="مثال: أزرق" style={{flex: 1}} onKeyDown={e => { if(e.key==='Enter') { e.preventDefault(); addColor(); } }}/>
                      <button type="button" className="btn btn-outline" onClick={addColor}>{t('إضافة', 'Add')}</button>
                    </div>
                    <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10}}>
                      {(productForm.colors || []).map((c: string) => (
                        <span key={c} style={{background: 'var(--soft)', color: 'var(--primary)', padding: '5px 12px', borderRadius: 50, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5}}>
                          {c} <X size={12} style={{cursor: 'pointer'}} onClick={() => removeColor(c)} />
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* نظام الـ Tags للمقاسات */}
                  <div className="field">
                    <label>{t('المقاسات المتاحة', 'Available Sizes')}</label>
                    <div style={{display: 'flex', gap: 10}}>
                      <input value={sizeInput} onChange={e => setSizeInput(e.target.value)} placeholder="مثال: XL" style={{flex: 1}} onKeyDown={e => { if(e.key==='Enter') { e.preventDefault(); addSize(); } }}/>
                      <button type="button" className="btn btn-outline" onClick={addSize}>{t('إضافة', 'Add')}</button>
                    </div>
                    <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10}}>
                      {(productForm.sizes || []).map((s: string) => (
                        <span key={s} style={{background: 'var(--soft)', color: 'var(--primary)', padding: '5px 12px', borderRadius: 50, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5}}>
                          {s} <X size={12} style={{cursor: 'pointer'}} onClick={() => removeSize(s)} />
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="field full"><label>{t('الوصف بالعربية', 'Arabic description')}</label><textarea value={productForm.description_ar} onChange={e => setProductForm((f:any) => ({...f, description_ar: e.target.value}))}/></div>
                  <div className="field full"><label>{t('الوصف بالإنجليزية', 'English description')}</label><textarea value={productForm.description_en} onChange={e => setProductForm((f:any) => ({...f, description_en: e.target.value}))}/></div>
                  <div className="field">
                    <label>{t('صورة المنتج', 'Product image')}</label>
                    <label className="btn btn-outline" style={{cursor:'pointer',justifyContent:'center'}}><ImagePlus size={16}/>{productForm.image_path ? productForm.image_path : t('رفع صورة', 'Upload image')}<input type="file" hidden accept="image/*" onChange={e => void uploadProductImage(e.target.files?.[0])}/></label>
                    {productForm.image_path && <img src={supabaseBrowser().storage.from('product-images').getPublicUrl(productForm.image_path).data.publicUrl} alt="Product" style={{width:80,height:80,objectFit:'cover',borderRadius:8,marginTop:8}}/>}
                  </div>
                  <div className="field"><label style={{display:'flex',gap:8,alignItems:'center',marginTop:28}}><input type="checkbox" checked={!!productForm.is_published} onChange={e => setProductForm((f:any) => ({...f, is_published: e.target.checked}))}/>{t('نشر المنتج بالمتجر', 'Publish product')}</label></div>
                  <div className="field full" style={{display:'flex',gap:9}}>
                    <button className="btn btn-primary" type="submit" disabled={busy}><Save size={15}/>{t('حفظ المنتج', 'Save product')}</button>
                    {editingProduct && <button className="btn btn-outline" type="button" onClick={() => { setEditingProduct(null); setProductForm({title_ar:'',title_en:'',slug:'',description_ar:'',description_en:'',price_jod:'0',stock_quantity:'0',category:'',is_published:false,image_path:'', colors:[], sizes:[], brands:[], types:[]}); }}><X size={15}/>{t('إلغاء', 'Cancel')}</button>}
                  </div>
                </form>
              </div>
              <div className="admin-list">
                {products.map(p => (
                  <div className="admin-row" key={p.id}>
                    <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}>
                      <div className="cart-thumb" style={{width:58,height:52,flexShrink:0}}>{p.image_path ? <img src={supabaseBrowser().storage.from('product-images').getPublicUrl(p.image_path).data.publicUrl} alt=""/> : <Package size={21}/>}</div>
                      <div><strong>{p.title_en} / {p.title_ar}</strong><small>{money(p.price_jod)} · {t('المخزون', 'Stock')}: {p.stock_quantity}</small></div>
                    </div>
                    <div className="row-actions">
                      <button className="btn btn-outline" onClick={() => { setEditingProduct(p.id); setProductForm({...p, price_jod: String(p.price_jod), stock_quantity: String(p.stock_quantity), colors: p.colors || [], sizes: p.sizes || [], brands: p.brands || [], types: p.types || []}); }}><Edit3 size={13}/>{t('تعديل', 'Edit')}</button>
                      <button className="icon-button" onClick={() => void removeProduct(p.id)}><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'assignments' && (
            <>
              <div className="section-head">
                <div>
                  <h2>{t('تسعير وحل الواجبات', 'Assignment pricing & solutions')}</h2>
                  <p>{t('قيّم الطلب، حدّد السعر، راجع إيصال الدفع، ثم ارفع الحل أو ارفض الطلب.', 'Quote requests, review payment receipts, then submit a solution or reject the request.')}</p>
                </div>
                <button className="btn btn-outline" onClick={() => void load()} disabled={busy}><Activity size={15}/>{t('تحديث', 'Refresh')}</button>
              </div>

              {assignments.length === 0 ? (
                <div className="empty-state"><FileText size={30}/><h3>{t('لا توجد طلبات واجبات', 'No assignment requests')}</h3></div>
              ) : (
                <div className="admin-list">
                  {assignments.map(req => {
                    const draft = replyDrafts[req.id] ?? { reply: req.admin_reply || '', status: 'completed' as const, file: null };
                    const statusLabel: Record<string, { ar: string; en: string }> = {
                      pending: { ar: 'بانتظار التسعير', en: 'Needs quote' },
                      awaiting_payment: { ar: 'بانتظار دفع الطالب', en: 'Awaiting student payment' },
                      paid: { ar: 'مدفوع — جاهز للحل', en: 'Paid — ready to solve' },
                      in_progress: { ar: 'قيد الحل', en: 'In progress' },
                      completed: { ar: 'مكتمل', en: 'Completed' },
                      rejected: { ar: 'مرفوض', en: 'Rejected' }
                    };
                    return (
                      <article className="panel" key={req.id} style={{ border: req.status === 'pending' || req.status === 'paid' ? '1px solid #fcd34d' : '1px solid #f1f5f9', background: req.status === 'pending' || req.status === 'paid' ? '#fffeF5' : '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 15 }}>
                          <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', background: 'rgba(15, 118, 110, 0.1)', padding: '4px 10px', borderRadius: 50 }}>{req.profiles?.university || t('طالب', 'Student')}</span>
                            <h3 style={{ margin: '10px 0 5px', fontSize: '1.2rem', color: 'var(--secondary)' }}>{req.title}</h3>
                            <strong style={{ display: 'block', fontSize: '0.95rem', color: '#475569' }}>{req.profiles?.full_name || req.profiles?.email || req.user_id}</strong>
                            {req.profiles?.email && <small style={{ display: 'block', color: 'var(--muted)', marginTop: 4 }}>{req.profiles.email}</small>}
                            <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', marginTop: 12, color: '#475569', lineHeight: 1.7 }}>{req.description}</p>
                            <small style={{ color: 'var(--muted)', marginTop: 5, display: 'block' }}>{new Date(req.created_at).toLocaleString()}</small>
                          </div>
                          <div style={{ textAlign: 'end' }}>
                            <span className={`status status-${req.status === 'completed' ? 'active' : req.status === 'rejected' ? 'inactive' : 'student'}`} style={{ display: 'inline-block', marginBottom: 8 }}>{t(statusLabel[req.status]?.ar || req.status, statusLabel[req.status]?.en || req.status)}</span>
                            {req.price_jod != null && <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--primary)' }}>{money(req.price_jod)}</strong>}
                          </div>
                        </div>

                        {req.student_file_path && <button onClick={() => void downloadAssignmentFile(req.student_file_path, 'student_assignment')} className="btn btn-outline" style={{ marginTop: 15, background: '#fff' }}><DownloadCloud size={16}/>{t('تحميل ملف الطالب', 'Download student file')}</button>}

                        {req.status === 'pending' && (
                          <form onSubmit={e => { e.preventDefault(); void quoteAssignment(req); }} style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #e2e8f0' }}>
                            <h4 style={{ marginBottom: 10, fontWeight: 800 }}>{t('تحديد سعر الواجب', 'Set assignment price')}</h4>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 7 }}>{t('السعر بالدينار الأردني (JOD)', 'Price in Jordanian dinars (JOD)')}</label>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              <input type="number" min="0.01" step="0.01" required value={quotePrices[req.id] ?? ''} onChange={e => setQuotePrices(prev => ({ ...prev, [req.id]: e.target.value }))} placeholder="e.g. 10.00" style={{ flex: '1 1 180px', minWidth: 0, padding: '11px 12px', border: '1px solid #cbd5e1', borderRadius: 10, background: '#fff' }} />
                              <button type="submit" className="btn btn-primary" disabled={assignmentAction === req.id}><Save size={15}/>{assignmentAction === req.id ? t('جارٍ الحفظ...', 'Saving...') : t('إرسال السعر للطالب', 'Send quote')}</button>
                            </div>
                          </form>
                        )}

                        {req.status === 'awaiting_payment' && <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: '#eff6ff', color: '#1e3a8a' }}><strong>{t('بانتظار الطالب لرفع إيصال CliQ', 'Waiting for the student to upload a CliQ receipt')}</strong><p style={{ marginTop: 5 }}>{t('السعر المحدد:', 'Quoted price:')} {money(req.price_jod || 0)}</p></div>}

                        {req.status === 'paid' && (
                          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                              <h4 style={{ fontWeight: 800 }}>{t('إيصال الدفع والحل', 'Payment receipt & solution')}</h4>
                              {req.payment_proof && receiptUrls[req.id] ? <a href={receiptUrls[req.id]} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ background: '#fff' }}><ImagePlus size={15}/>{t('عرض إيصال CliQ', 'View CliQ receipt')}</a> : <span style={{ fontSize: 12, color: '#64748b' }}>{t('رابط الإيصال غير متاح؛ حدّث الصفحة.', 'Receipt link unavailable; refresh the page.')}</span>}
                            </div>
                            <form onSubmit={e => { e.preventDefault(); void replyAndSolve(req); }} style={{ marginTop: 14, display: 'grid', gap: 12 }}>
                              <label style={{ display: 'block' }}><span style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 7 }}>{t('رد الإدارة / تفاصيل الحل', 'Admin reply / solution details')}</span><textarea required rows={5} maxLength={15000} value={draft.reply} onChange={e => setReplyDrafts(prev => ({ ...prev, [req.id]: { ...draft, reply: e.target.value } }))} placeholder={t('اكتب ملاحظاتك أو تفاصيل التسليم...', 'Write your reply or delivery details...')} style={{ width: '100%', resize: 'vertical', padding: 12, border: '1px solid #cbd5e1', borderRadius: 10, background: '#fff' }}/></label>
                              <label style={{ display: 'block' }}><span style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 7 }}>{t('ملف الحل (اختياري)', 'Solution file (optional)')}</span><input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp" onChange={e => setReplyDrafts(prev => ({ ...prev, [req.id]: { ...draft, file: e.target.files?.[0] ?? null } }))} style={{ display: 'block', width: '100%', padding: 10, border: '1px dashed #cbd5e1', borderRadius: 10, background: '#fff' }}/><small style={{ display: 'block', marginTop: 5, color: 'var(--muted)' }}>{t('حتى 25 ميجابايت. الملف سيُحفظ في مساحة التخزين الخاصة.', 'Up to 25 MB. The file is stored privately.')}</small></label>
                              <label style={{ display: 'block' }}><span style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 7 }}>{t('الإجراء النهائي', 'Final action')}</span><select value={draft.status} onChange={e => setReplyDrafts(prev => ({ ...prev, [req.id]: { ...draft, status: e.target.value as 'completed' | 'rejected' } }))} style={{ width: '100%', padding: 11, border: '1px solid #cbd5e1', borderRadius: 10, background: '#fff' }}><option value="completed">{t('تم الحل وتسليمه', 'Completed and delivered')}</option><option value="rejected">{t('رفض الطلب', 'Reject request')}</option></select></label>
                              <button type="submit" className="btn btn-primary" disabled={assignmentAction === req.id}><Save size={15}/>{assignmentAction === req.id ? t('جارٍ الحفظ...', 'Saving...') : draft.status === 'completed' ? t('إرسال الحل وإكمال الطلب', 'Submit solution & complete') : t('حفظ الرد ورفض الطلب', 'Save reply & reject')}</button>
                            </form>
                          </div>
                        )}

                        {(req.status === 'completed' || req.status === 'rejected') && <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#f8fafc' }}><strong>{t('رد الإدارة', 'Admin reply')}</strong><p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{req.admin_reply || t('لا يوجد رد.', 'No reply provided.')}</p>{req.admin_file_path && <button onClick={() => void downloadAssignmentFile(req.admin_file_path, 'assignment_solution')} className="btn btn-outline" style={{ marginTop: 12, background: '#fff' }}><DownloadCloud size={16}/>{t('تحميل ملف الحل', 'Download solution file')}</button>}</div>}
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {tab === 'payments' && (
            <>
              <div className="section-head"><div><h2>{t('الطلبات المعلقة', 'New Payments')}</h2></div><button className="btn btn-outline" onClick={() => void load()}><Activity size={15}/>{t('تحديث', 'Refresh')}</button></div>
              {orders.filter(o => o.status === 'pending').length === 0 ? (
                <div className="empty-state"><Wallet size={30}/><h3>{t('لا توجد طلبات معلقة', 'No pending orders')}</h3></div>
              ) : (
                <div className="admin-list">
                  {orders.filter(o => o.status === 'pending').map(o => (
                    <div className="panel" key={o.id}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',gap:12,flexWrap:'wrap'}}>
                        <div><strong style={{fontSize:15}}>{o.profiles?.full_name || o.profiles?.email || o.user_id}</strong><p style={{fontSize:11,color:'var(--muted)',margin:'5px 0'}}>Ref: {o.transfer_reference || '—'} · {new Date(o.created_at).toLocaleString()}</p><strong style={{fontSize:22}}>{money(o.amount_jod)}</strong></div>
                        <span className={`status status-${o.status}`}>{o.status}</span>
                      </div>
                      {o.proof_path && receiptUrls[o.id] && <a href={receiptUrls[o.id]} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:7,color:'var(--primary)',fontSize:12,fontWeight:800,marginTop:12}}><ImagePlus size={16}/>{t('عرض إشعار الدفع', 'View payment receipt')}</a>}
                      {Array.isArray(o.cliq_order_items) && o.cliq_order_items.map((item: any) => <div key={item.id} style={{fontSize:11,color:'var(--muted)',marginTop:7}}>• {item.courses ? `🎓 ${item.courses.title_en}` : item.products ? `📦 ${item.products.title_en} (Qty: ${item.quantity})` : 'Item'} {item.selected_color || item.selected_size || item.selected_brand || item.selected_type ? `(${item.selected_brand||''} ${item.selected_type||''} ${item.selected_color||''} ${item.selected_size||''})` : ''} — {money(item.price_jod * item.quantity)}</div>)}
                      <div className="row-actions" style={{marginTop:15}}>
                        <button className="btn btn-primary" onClick={() => void reviewOrder(o, 'approved')}><Check size={15}/>{t('موافقة وتفعيل', 'Approve')}</button>
                        <button className="btn btn-outline" onClick={() => void reviewOrder(o, 'rejected')}><X size={15}/>{t('رفض', 'Reject')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'orders' && (
            <>
              <div className="section-head">
                <div><h2>{t('متابعة الطلبات والفواتير', 'Orders & Tracking')}</h2><p>{t('إصدار الفواتير وتحديث حالة الشحن للطلبات المعتمدة.', 'Print invoices and update shipping status for approved orders.')}</p></div>
                <button className="btn btn-outline" onClick={() => void load()}><Activity size={15}/>{t('تحديث', 'Refresh')}</button>
              </div>
              {orders.filter(o => o.status !== 'pending').length === 0 ? (
                <div className="empty-state"><Truck size={30}/><h3>{t('لا توجد طلبات معتمدة', 'No approved orders')}</h3></div>
              ) : (
                <div className="admin-list">
                  {orders.filter(o => o.status !== 'pending').map(o => (
                    <div className="panel" key={o.id} style={{ display: 'grid', gap: 15 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <strong style={{ fontSize: 16 }}>{o.profiles?.full_name || o.profiles?.email || 'طالب'}</strong>
                          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '5px 0' }}>Ref: #{o.id.slice(0,8)} · {new Date(o.created_at).toLocaleString()}</p>
                          <strong style={{ fontSize: 20, color: 'var(--primary)' }}>{money(o.amount_jod)}</strong>
                        </div>
                        <div style={{ textAlign: 'end' }}>
                          <span className={`status status-${o.status === 'rejected' ? 'inactive' : 'active'}`} style={{ marginBottom: 10 }}>
                            {o.payment_method === 'cod' ? 'الدفع كاش (COD)' : 'حوالة كليك'}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, fontSize: 12, lineHeight: 1.6 }}>
                        <strong style={{ display: 'block', marginBottom: 5 }}>العنوان والتواصل:</strong>
                        {o.delivery_address || 'توصيل غير مطلوب'}
                      </div>

                      <div className="row-actions" style={{ borderTop: '1px solid var(--line)', paddingTop: 15, marginTop: 5 }}>
                        <select 
                          className="search-input" 
                          style={{ width: 'auto', padding: '8px 15px', fontWeight: 'bold', color: o.status === 'delivered' ? 'green' : 'var(--secondary)' }} 
                          value={o.status} 
                          onChange={async e => {
                            const { error } = await supabaseBrowser().from('cliq_orders').update({ status: e.target.value }).eq('id', o.id);
                            if (error) toast(error.message, 'error'); else load();
                          }}
                        >
                          <option value="approved">{t('قيد التجهيز', 'Processing')}</option>
                          <option value="shipped">{t('تم الشحن / مع المندوب', 'Shipped')}</option>
                          <option value="delivered">{t('تم التوصيل بنجاح', 'Delivered')}</option>
                          <option value="rejected">{t('طلب ملغي / مرفوض', 'Cancelled')}</option>
                        </select>
                        <button className="btn btn-primary" onClick={() => printInvoice(o)} style={{ marginLeft: 'auto' }}>
                          <Printer size={15} /> {t('فاتورة PDF', 'Invoice PDF')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'messages' && (
            <>
              <div className="section-head">
                <div><h2>{t('رسائل التواصل', 'Contact Messages')}</h2><p>{t('رد على استفسارات الطلاب والزوار.', 'Reply to student and visitor inquiries.')}</p></div>
                <button className="btn btn-outline" onClick={() => void load()} disabled={busy}><Activity size={15}/>{t('تحديث', 'Refresh')}</button>
              </div>
              {messages.length === 0 ? (
                <div className="empty-state"><MessageSquare size={30}/><h3>{t('لا توجد رسائل', 'No messages')}</h3></div>
              ) : (
                <div className="admin-list">
                  {messages.map(msg => (
                    <article className="panel" key={msg.id} style={{ borderInlineStart: msg.status === 'new' ? '4px solid var(--primary)' : '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <strong style={{ fontSize: 16 }}>{msg.name}</strong>
                          <span style={{ fontSize: 12, color: 'var(--muted)', marginInlineStart: 10, display: 'inline-block' }}>{msg.email} {msg.phone ? `| ${msg.phone}` : ''}</span>
                          <h4 style={{ margin: '8px 0 5px', color: 'var(--secondary)', fontSize: 15 }}>{msg.subject}</h4>
                        </div>
                        <span className={`status status-${msg.status === 'new' ? 'pending' : msg.status === 'replied' ? 'active' : 'student'}`} style={{ height: 'fit-content' }}>
                          {msg.status === 'new' ? 'جديدة' : msg.status === 'replied' ? 'تم الرد' : 'مقروءة'}
                        </span>
                      </div>
                      <p style={{ whiteSpace: 'pre-wrap', fontSize: 14, color: '#475569', background: '#f8fafc', padding: 15, borderRadius: 8 }}>{msg.message}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTop: '1px solid var(--line)', flexWrap: 'wrap', gap: 10 }}>
                        <small style={{ color: 'var(--muted)' }}>{new Date(msg.created_at).toLocaleString()}</small>
                        <div className="row-actions">
                          <a href={`mailto:${msg.email}?subject=RE: ${msg.subject}`} className="btn btn-primary" onClick={async () => { if(msg.status === 'new') { await supabaseBrowser().from('contact_messages').update({ status: 'read' }).eq('id', msg.id); load(); } }}><Mail size={15}/> {t('رد عبر الإيميل', 'Reply via Email')}</a>
                          {msg.status === 'new' && <button className="btn btn-outline" onClick={async () => { await supabaseBrowser().from('contact_messages').update({ status: 'read' }).eq('id', msg.id); load(); }}><Check size={15}/> {t('تحديد كمقروءة', 'Mark as read')}</button>}
                          {msg.status !== 'replied' && <button className="btn btn-outline" onClick={async () => { await supabaseBrowser().from('contact_messages').update({ status: 'replied' }).eq('id', msg.id); load(); }}><Check size={15}/> {t('تحديد كتم الرد', 'Mark as replied')}</button>}
                          <button className="icon-button" onClick={async () => { if(confirm(t('حذف الرسالة نهائياً؟', 'Delete this message permanently?'))) { await supabaseBrowser().from('contact_messages').delete().eq('id', msg.id); load(); } }}><Trash2 size={14}/></button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'brand' && (
            <>
              <div className="section-head"><div><h2>{t('تخصيص الهوية', 'Brand customizer')}</h2></div></div>
              <div className="panel">
                <form className="admin-form" onSubmit={saveBrand}>
                  <div className="field"><label>{t('اسم المنصة', 'Brand name')}</label><input required value={brandForm.brand_name} onChange={e => setBrandForm((f:any) => ({...f, brand_name: e.target.value}))}/></div>
                  <div className="field"><label>{t('رابط اللوغو', 'Logo URL')}</label><input value={brandForm.logo_url} onChange={e => setBrandForm((f:any) => ({...f, logo_url: e.target.value}))}/></div>
                  <div className="field"><label>{t('اللون الأساسي', 'Primary color')}</label><div style={{display:'flex',gap:9}}><input type="color" value={/^#[0-9a-f]{6}$/i.test(brandForm.primary_color) ? brandForm.primary_color : '#0F766E'} onChange={e => setBrandForm((f:any) => ({...f, primary_color: e.target.value}))} style={{width:54,padding:4}}/><input required value={brandForm.primary_color} onChange={e => setBrandForm((f:any) => ({...f, primary_color: e.target.value}))}/></div></div>
                  <div className="field"><label>{t('اللون الثانوي', 'Secondary color')}</label><div style={{display:'flex',gap:9}}><input type="color" value={/^#[0-9a-f]{6}$/i.test(brandForm.secondary_color) ? brandForm.secondary_color : '#0F172A'} onChange={e => setBrandForm((f:any) => ({...f, secondary_color: e.target.value}))} style={{width:54,padding:4}}/><input required value={brandForm.secondary_color} onChange={e => setBrandForm((f:any) => ({...f, secondary_color: e.target.value}))}/></div></div>
                  <div className="field"><label>{t('CliQ Alias', 'CliQ alias')}</label><input value={brandForm.cliq_alias} onChange={e => setBrandForm((f:any) => ({...f, cliq_alias: e.target.value}))}/></div>
                  <div className="field"><label>{t('اسم البنك', 'Bank name')}</label><input value={brandForm.cliq_bank_name} onChange={e => setBrandForm((f:any) => ({...f, cliq_bank_name: e.target.value}))}/></div>
                  <div className="field full"><button className="btn btn-primary" type="submit" disabled={busy}><Save size={16}/>{t('حفظ الإعدادات', 'Save settings')}</button></div>
                </form>
              </div>
            </>
          )}

        </section>
      </div>
    </div>
  );
}