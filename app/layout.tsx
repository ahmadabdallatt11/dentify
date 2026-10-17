import type { Metadata } from 'next';
// @ts-ignore — Next.js handles global CSS imports at build time.
import './main.css';
import {Providers} from '@/components/Providers';
import Header from '@/components/Header';
import Link from 'next/link';
import { Instagram } from 'lucide-react';
export const metadata:Metadata={
  title:'Dentify | Learn with confidence',
  description:'A modern bilingual learning platform for students and professionals.'
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <Header/>
          <main className="app-main">{children}</main>
          <footer className="footer">
            <div className="footer-inner">
              <Link href="/" className="footer-brand">Dentify<span>®</span></Link>
              <p>Your friend throughout your journey</p>
              <div>
                <Link href="/#courses">Courses</Link>
                <Link href="/profile">My learning</Link>
                <Link href="/admin">Admin</Link>
<a href="https://www.instagram.com/dentify0?vrfl=MXE4eTZwbjlrOHNlNA==" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center' }} aria-label="Instagram Dentify">
  <Instagram size={20} />
</a>
              </div>
              <small>© {new Date().getFullYear()} Dentify. All rights reserved.</small>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}