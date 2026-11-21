import {useId} from 'react';

type ProfileGlyphName='shirt'|'ball'|'trend'|'shield';

/** Iconos SVG originales y escalables. No dependen de librerías ni de imágenes externas. */
export function ProfileGlyph({name,className}:{name:ProfileGlyphName;className?:string}){
 const gradientId=useId();
 if(name==='shield')return <svg className={className} viewBox="0 0 40 44" fill="none" aria-hidden="true" focusable="false">
  <defs><linearGradient id={gradientId} x1="4" y1="2" x2="38" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor="var(--cyan)"/><stop offset="1" stopColor="var(--violet)"/></linearGradient></defs>
  <path d="M20 2 36 8v13c0 10.5-6.5 17-16 21C10.5 38 4 31.5 4 21V8L20 2Z" fill="rgba(26,48,83,.46)" stroke={`url(#${gradientId})`} strokeWidth="2.3" strokeLinejoin="round"/>
  <path d="M20 6.5 32 11v10c0 7.6-4.4 13.1-12 16.6C12.4 34.1 8 28.6 8 21V11L20 6.5Z" stroke="rgba(234,246,255,.14)" strokeWidth="1"/>
 </svg>;
 return <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
 {name==='shirt'?<path d="m9 4 4-1.5c1.2 3.2 4.8 3.2 6 0L23 4l6 6.5-4.5 4-2.5-2V28H10V12.5l-2.5 2-4.5-4L9 4Z"/>:null}
 {name==='ball'?<><circle cx="16" cy="16" r="12.5"/><path d="m16 9 6 4.5-2.2 7h-7.6l-2.2-7L16 9ZM16 9V3.5M22 13.5l5.2-1.5M19.8 20.5l3.3 5.2M12.2 20.5l-3.3 5.2M10 13.5 4.8 12"/></>:null}
 {name==='trend'?<><path d="M6 26V18M13 26V12M20 26V16M27 26V6"/></>:null}
 </svg>;
}
