import type { Metadata } from 'next';
import './globals.css';
import {Providers} from '@/components/Providers';
import Header from '@/components/Header';
import Link from 'next/link';

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
              <p>Learn with confidence. تعلّم بثقة.</p>
              <div>
                <Link href="/#courses">Courses</Link>
                <Link href="/profile">My learning</Link>
                <Link href="/admin">Admin</Link>
              </div>
              <small>© {new Date().getFullYear()} Dentify. All rights reserved.</small>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}