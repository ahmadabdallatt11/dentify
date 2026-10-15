export const money = (n: number) => new Intl.NumberFormat('en-JO', { style: 'currency', currency: 'JOD', maximumFractionDigits: 2 }).format(Number(n || 0));
export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^\w\u0600-\u06ff -]/g,'').replace(/\s+/g,'-').slice(0,70);
export function publicImage(path?: string | null, bucket = 'course-images') {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}` : '';
}
export function errorText(e: any) { return e?.message || 'Something went wrong. Please try again.'; }
