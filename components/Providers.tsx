'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase/client';

type Profile = Record<string, any> | null;
type AppCtx = { session: Session|null; user: User|null; profile: Profile; loading: boolean; lang: 'ar'|'en'; setLang:(l:'ar'|'en')=>void; t:(ar:string,en:string)=>string; toast:(message:string,type?:'success'|'error'|'info')=>void; refreshProfile:()=>Promise<void>; settings:Record<string,any>; refreshSettings:()=>Promise<void> };
const Ctx = createContext<AppCtx | null>(null);
export function Providers({children}:{children:React.ReactNode}) {
 const [session,setSession]=useState<Session|null>(null),[profile,setProfile]=useState<Profile>(null),[loading,setLoading]=useState(true);
 const [lang,setLangState]=useState<'ar'|'en'>('ar'),[messages,setMessages]=useState<{id:number;message:string;type:string}[]>([]),[settings,setSettings]=useState<Record<string,any>>({});
 const toast=useCallback((message:string,type:'success'|'error'|'info'='info')=>{const id=Date.now()+Math.random();setMessages(m=>[...m,{id,message,type}]);setTimeout(()=>setMessages(m=>m.filter(x=>x.id!==id)),3800)},[]);
 const setLang=useCallback((l:'ar'|'en')=>{setLangState(l);if(typeof window!=='undefined')localStorage.setItem('dentify-language',l);document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr'},[]);
 const refreshProfile=useCallback(async()=>{try{const {data:{user}}=await supabaseBrowser().auth.getUser();if(!user){setProfile(null);return;}const {data,error}=await supabaseBrowser().from('profiles').select('*').eq('id',user.id).maybeSingle();if(error)throw error;setProfile(data as any)}catch(e){console.error(e)}},[]);
 const refreshSettings=useCallback(async()=>{try{const {data,error}=await supabaseBrowser().from('site_settings').select('key,value');if(error)throw error;const next:Record<string,any>={};(data||[]).forEach((r:any)=>{next[r.key]=r.value});setSettings(next);document.documentElement.style.setProperty('--primary',String(next.primary_color||'#0F766E').replaceAll('"',''));document.documentElement.style.setProperty('--secondary',String(next.secondary_color||'#0F172A').replaceAll('"',''))}catch(e){console.warn('Could not load site settings',e)}},[]);
 useEffect(()=>{const saved=typeof window!=='undefined'?localStorage.getItem('dentify-language'):null;setLang(saved==='en'?'en':'ar');let alive=true;const sb=supabaseBrowser();sb.auth.getSession().then(async({data})=>{if(!alive)return;setSession(data.session);if(data.session){await refreshProfile()}setLoading(false)}).catch(()=>setLoading(false));const {data:{subscription}}=sb.auth.onAuthStateChange((_event,next)=>{setSession(next);if(next){queueMicrotask(()=>void refreshProfile())}else setProfile(null);setLoading(false)});void refreshSettings();return()=>{alive=false;subscription.unsubscribe()}},[refreshProfile,refreshSettings,setLang]);
 const value=useMemo<AppCtx>(()=>({session,user:session?.user||null,profile,loading,lang,setLang,t:(ar,en)=>lang==='ar'?ar:en,toast,refreshProfile,settings,refreshSettings}),[session,profile,loading,lang,setLang,toast,refreshProfile,settings,refreshSettings]);
 return <Ctx.Provider value={value}>{children}<div className="toast-stack" aria-live="polite">{messages.map(m=><div key={m.id} className={`toast toast-${m.type}`} role="status">{m.message}</div>)}</div></Ctx.Provider>
}
export function useApp(){const v=useContext(Ctx);if(!v)throw new Error('useApp must be used within Providers');return v}
