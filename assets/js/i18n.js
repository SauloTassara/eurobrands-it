const supported=['es','it','en'];

export function languageFromPreferences(){
  const saved=localStorage.getItem('eurobrands-language');
  if(supported.includes(saved))return saved;
  const candidates=navigator.languages?.length?navigator.languages:[navigator.language||'en'];
  for(const value of candidates){
    const base=String(value).toLowerCase().split('-')[0];
    if(supported.includes(base))return base;
  }
  return'en';
}

export function bindLanguageLinks(){
  document.querySelectorAll('[data-language]').forEach(link=>{
    link.addEventListener('click',()=>localStorage.setItem('eurobrands-language',link.dataset.language));
  });
}
