'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BookOpen, ShoppingCart, UserRound, Menu, X, LogOut, Globe, GraduationCap, Trash2, ArrowLeft } from 'lucide-react';
import { useApp } from './Providers';
import { supabaseBrowser } from '@/lib/supabase/client';
import { money } from '@/lib/utils';

export default function Header() {
  const { user, profile, lang, setLang, t, toast, settings } = useApp();
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartLoading, setCartLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
const links = [
  { href: '/', label: t('الرئيسية', 'Home') },
  { href: '/courses', label: t('الكورسات', 'Courses') },
  { href: '/store', label: t('المتجر', 'Store') },
  { href: '/assignments', label: t('حل الواجبات', 'Assignments') },
  { href: '/profile', label: t('حسابي', 'My profile') },
];
  const brand = String(settings.brand_name || 'Dentify').replaceAll('"', '');
  async function logout() {
    const { error } = await supabaseBrowser().auth.signOut();
    if (error) toast(error.message, 'error');
    else { toast(t('تم تسجيل الخروج', 'Signed out'), 'success'); router.push('/'); router.refresh(); }
    setOpen(false);
  }
  async function showCart() {
    setCartOpen(true);
    if (!user) return;
    setCartLoading(true);
    const { data, error } = await supabaseBrowser().from('cart_items').select('id,course_id,courses(id,title_ar,title_en,price_jod,slug)').eq('user_id', user.id);
    setCartLoading(false);
    if (error) toast(error.message, 'error'); else setCartItems(data || []);
  }
  async function removeCartItem(id: string) {
    const { error } = await supabaseBrowser().from('cart_items').delete().eq('id', id);
    if (error) toast(error.message, 'error'); else { setCartItems(items => items.filter(item => item.id !== id)); toast(t('تم حذف الكورس من السلة', 'Course removed from cart'), 'success'); }
  }
  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.courses?.price_jod || 0), 0);
  useEffect(() => { setOpen(false); setCartOpen(false); }, [pathname]);
  return <>
    <header className="header"><div className="nav-wrap">
      <Link href="/" className="brand" onClick={() => setOpen(false)}><span className="brand-mark">{settings.logo_url ? <img src={String(settings.logo_url).replaceAll('"', '')} alt="" /> : <GraduationCap size={24} />}</span><span><b>{brand}</b></span></Link>
      <nav className="desktop-links">{links.map(link => <Link className={pathname === link.href ? 'active' : ''} key={link.href} href={link.href}>{link.label}</Link>)}{profile?.role === 'admin' && <Link href="/admin">{t('الإدارة', 'Admin')}</Link>}</nav>
      <div className="nav-actions"><button className="icon-button language-button" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} aria-label="Change language"><Globe size={17} /><span>{lang === 'ar' ? 'EN' : 'عربي'}</span></button><button className="icon-button cart-icon" onClick={() => void showCart()} aria-label={t('افتح السلة', 'Open cart')}><ShoppingCart size={19} /></button>{user ? <button className="btn btn-dark desktop-login" onClick={logout}><LogOut size={16} />{t('خروج', 'Sign out')}</button> : <Link className="btn btn-dark desktop-login" href="/login">{t('دخول', 'Sign in')}</Link>}<button className="icon-button menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'}>{open ? <X /> : <Menu />}</button></div>
    </div>{open && <div className="mobile-drawer"><div className="drawer-user">{user ? <><span className="avatar-mini"><UserRound size={20} /></span><div><b>{profile?.full_name || user.email}</b><small>{user.email}</small></div></> : <><b>{t('أهلاً بك في Dentify', 'Welcome to Dentify')}</b><Link href="/login" onClick={() => setOpen(false)}>{t('تسجيل الدخول أو إنشاء حساب', 'Sign in or create account')}</Link></>}</div>{links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}{profile?.role === 'admin' && <Link href="/admin" onClick={() => setOpen(false)}>{t('لوحة الإدارة', 'Admin dashboard')}</Link>}{user && <button className="drawer-logout" onClick={logout}><LogOut size={16} />{t('تسجيل الخروج', 'Sign out')}</button>}</div>}</header>
    {cartOpen && <div className="drawer-backdrop" onClick={() => setCartOpen(false)}><aside className="cart-drawer" dir={lang === 'ar' ? 'rtl' : 'ltr'} onClick={e => e.stopPropagation()}><div className="cart-drawer-head"><div><h2>{t('سلة المشتريات', 'Your cart')}</h2><small>{t('كورساتك المختارة', 'Your selected courses')}</small></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close cart"><X size={18} /></button></div>{!user ? <div className="empty-state" style={{padding:25}}><ShoppingCart size={28} /><h3>{t('سجّل الدخول لعرض سلتك', 'Sign in to view your cart')}</h3><Link className="btn btn-primary" href="/login?next=/cart">{t('تسجيل الدخول', 'Sign in')}</Link></div> : cartLoading ? <div className="loading-page"><div className="spinner" /></div> : cartItems.length === 0 ? <div className="empty-state" style={{padding:25}}><BookOpen size={28} /><h3>{t('السلة فارغة', 'Your cart is empty')}</h3><Link className="btn btn-primary" href="/#courses">{t('استكشف الكورسات', 'Explore courses')}</Link></div> : <><div className="cart-drawer-items">{cartItems.map(item => <div className="cart-drawer-item" key={item.id}><div style={{flex:1,minWidth:0}}><b>{lang === 'ar' ? (item.courses?.title_ar || item.courses?.title_en) : (item.courses?.title_en || item.courses?.title_ar)}</b><small>{money(item.courses?.price_jod)}</small></div><button className="icon-button" onClick={() => void removeCartItem(item.id)} aria-label={t('حذف', 'Remove')}><Trash2 size={15} /></button></div>)}</div><div className="cart-drawer-footer"><div><span>{t('الإجمالي', 'Total')}</span><strong>{money(cartTotal)}</strong></div><Link className="btn btn-primary" href="/cart">{t('عرض السلة والمتابعة', 'View cart & continue')} <ArrowLeft size={16} /></Link></div></>}</aside></div>}
  </>;
}
