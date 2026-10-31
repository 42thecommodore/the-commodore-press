/* The house keeps the holidays — a small drawing beside the name on the masthead, the way a
   shop window gets a wreath. Seven, the major ones only: New Year, Valentine's Day, Easter, the
   Fourth of July, Halloween, Thanksgiving, Christmas. Each shows for its day, or the few days a
   household keeps it, and then the masthead is plain again.

   Drawn in ink, with the press mark's hairline: never in colour, because oxblood means a
   correction and nothing else, and a red heart or a red tree would say the wrong thing.
   The date is the reader's own, read in their browser; the site is built once, so a build-time
   date would leave last week's pumpkin up. `?day=12-25` on the front door shows any one.

   Drawn once, here: the library gets it as {{SEASON_FN}} (theme/press.js), and
   `npm run check` holds the calendar. Self-contained on purpose — the build inlines its source. */
export function season(d){
  const y=d.getFullYear(), md=(d.getMonth()+1)*100+d.getDate();
  // Easter Sunday, by the anonymous Gregorian computus
  const a=y%19,b=Math.floor(y/100),c=y%100,dd=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),
    g=Math.floor((b-f+1)/3),h=(19*a+b-dd-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,
    m=Math.floor((a+11*h+22*l)/451),em=Math.floor((h+l-7*m+114)/31),ed=(h+l-7*m+114)%31+1;
  const easter=em*100+ed;
  // Thanksgiving, the fourth Thursday of November, kept through the Sunday (which can fall in December)
  const tg=Math.round((new Date(y,d.getMonth(),d.getDate())-new Date(y,10,22+(11-new Date(y,10,1).getDay())%7))/864e5);
  const S=(id,line,draw)=>({id,line,svg:`<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${draw}</svg>`});
  if(md===1231||md===101) return S("new-year","Happy New Year.",
    `<path d="M14.2 11h4.2M13.26 13.26l2.97 2.97M11 14.2v4.2M8.74 13.26l-2.97 2.97M7.8 11H3.6M8.74 8.74 5.77 5.77M11 7.8V3.6M13.26 8.74l2.97-2.97"/><circle cx="11" cy="11" r=".9" fill="currentColor" stroke="none"/>`);
  if(md===214) return S("valentine","Happy Valentine's Day.",
    `<path d="M11 18.5S4 14.2 4 9.4C4 7 5.7 5.5 7.6 5.5c1.5 0 2.7.9 3.4 2.1.7-1.2 1.9-2.1 3.4-2.1 1.9 0 3.6 1.5 3.6 3.9 0 4.8-7 9.1-7 9.1Z"/>`);
  if(md===easter) return S("easter","Happy Easter.",
    `<path d="M11 3.5c-3.3 0-6 5.3-6 9.4 0 3.4 2.7 5.6 6 5.6s6-2.2 6-5.6c0-4.1-2.7-9.4-6-9.4Z"/><path d="M5.3 12c1.1-.9 2.3-.9 3.4 0s2.3.9 3.4 0 2.3-.9 3.4 0 1.1.5 1.5.4"/>`);
  if(md===704) return S("fourth","Happy Fourth of July.",
    `<path d="M11 3.8l1.88 5.01 5.35.24-4.19 3.34 1.43 5.16L11 14.6l-4.47 2.95 1.43-5.16-4.19-3.34 5.35-.24Z"/>`);
  if(md>=1025&&md<=1031) return S("halloween","Happy Halloween.",
    `<path d="M11 6.5c-4.2 0-7 2.6-7 6.2S6.8 19 11 19s7-2.7 7-6.3-2.8-6.2-7-6.2Z"/><path d="M11 6.5c0-1.6.6-2.8 1.8-3.4"/><path d="M7.6 11.8 8.9 10l1.1 1.8ZM12 11.8l1.1-1.8 1.3 1.8Z" fill="currentColor" stroke="none"/><path d="M8 14.6c1.8 1.3 4.2 1.3 6 0"/>`);
  if(tg>=0&&tg<=3) return S("thanksgiving","Happy Thanksgiving.",
    `<path d="M5 17C5 9.5 9.5 5 18 4.5 17.6 13 13 17.5 5 17Z"/><path d="M5 17l8.5-8.5"/>`);
  if(md>=1218&&md<=1226) return S("christmas","Merry Christmas.",
    `<path d="M11 3.5 6 10.5h2.6L5 16h12l-3.6-5.5H16Z"/><path d="M11 16v2.8"/>`);
  return null;
}
