// Apply the saved preference before styles paint; follow the system until a choice is made.
(()=>{
  const root=document.documentElement,key='zenit-theme-v1',system=window.matchMedia('(prefers-color-scheme: dark)');
  let saved=null;
  try{saved=localStorage.getItem(key);}catch{}
  if(saved!=='light'&&saved!=='dark')saved=null;
  const labels={ru:{light:'Светлая',dark:'Тёмная',toLight:'Включить светлую тему',toDark:'Включить тёмную тему'},en:{light:'Light',dark:'Dark',toLight:'Switch to light theme',toDark:'Switch to dark theme'},tr:{light:'Açık',dark:'Koyu',toLight:'Açık temaya geç',toDark:'Koyu temaya geç'}};
  function paint(theme){
    root.dataset.theme=theme;root.style.colorScheme=theme;
    const words=labels[root.lang]||labels.ru,dark=theme==='dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(button=>{
      const label=words[theme]+'. '+words[dark?'toLight':'toDark'];
      button.setAttribute('aria-label',label);button.setAttribute('title',label);button.setAttribute('aria-pressed',String(dark));
      button.querySelector('[data-theme-icon]').textContent=dark?'☾':'☼';
      button.querySelector('[data-theme-label]').textContent=words[theme];
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#071c28':'#f7fafc');
  }
  paint(saved||(system.matches?'dark':'light'));
  function ready(){
    paint(root.dataset.theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(button=>button.addEventListener('click',()=>{
      saved=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem(key,saved);}catch{}paint(saved);
    }));
    new MutationObserver(()=>paint(root.dataset.theme)).observe(root,{attributes:true,attributeFilter:['lang']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
  system.addEventListener('change',()=>{if(!saved)paint(system.matches?'dark':'light');});
  window.addEventListener('storage',event=>{if(event.key===key){saved=['light','dark'].includes(event.newValue)?event.newValue:null;paint(saved||(system.matches?'dark':'light'));}});
})();
