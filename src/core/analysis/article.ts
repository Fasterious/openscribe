/**
 * L'interactivité de la page HTML du rapport (la version article : export et Observatoire), sans cadre ni
 * bibliothèque. Un clic sur un renvoi (« P12 ») déplie ses verbatims sous le paragraphe ; un clic sur un verbatim
 * déplie la réponse entière, la question et le passage cité en gras ; un « ? » ou une marque (« fragile »)
 * déplie son explication. Sans script (impression, lecteur hors ligne), la page reste complète.
 *
 * Les réponses viennent d'un bloc de données de la page (`os-data`) : { q: questions, c: { contribution:
 * [question, texte] }, i: { idée: [contribution, [[début, fin], …]] } }.
 */
export const ARTICLE_SCRIPT = `(function(){
var data=document.getElementById('os-data');if(!data)return;var D=JSON.parse(data.textContent);
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function context(id){var x=D.i[id];if(!x)return null;var c=D.c[x[0]];var box=el('div','ctx');
if(c[0]>=0)box.appendChild(el('p','ctx-q','En réponse à « '+D.q[c[0]]+' »'));
var p=el('p','ctx-t'),t=c[1],pos=0;x[1].forEach(function(s){p.appendChild(document.createTextNode(t.slice(pos,s[0])));p.appendChild(el('strong',null,t.slice(s[0],s[1])));pos=s[1]});
p.appendChild(document.createTextNode(t.slice(pos)));box.appendChild(p);return box}
function quote(id,text){var q=el('span','q',text);q.dataset.i=id;q.tabIndex=0;q.setAttribute('role','button');q.setAttribute('aria-expanded','false');return q}
function toggle(trigger,build){var open=trigger.osPanel;
if(open&&open.isConnected){open.remove();trigger.setAttribute('aria-expanded','false');return}
var panel=build();if(!panel)return;panel.classList.add('panel');
var fold=el('button','fold','Replier');fold.type='button';fold.onclick=function(){panel.remove();trigger.setAttribute('aria-expanded','false');trigger.focus()};panel.appendChild(fold);
var at=trigger.closest('li')||trigger.closest('p')||trigger;if(at.tagName==='LI')at.appendChild(panel);else at.after(panel);
trigger.osPanel=panel;trigger.setAttribute('aria-expanded','true');
var r=panel.getBoundingClientRect();if(r.top>window.innerHeight-80||r.bottom<0)panel.scrollIntoView({block:'nearest',behavior:'smooth'})}
document.addEventListener('click',function(ev){var t=ev.target.closest&&ev.target.closest('.ref,.q,.help,.mark');if(!t)return;
if(t.classList.contains('ref')){ev.preventDefault();toggle(t,function(){var w=el('div');t.dataset.i.split(',').forEach(function(id){var src=document.getElementById(id);var line=el('p','ref-line');line.appendChild(el('span','who',t.textContent));line.appendChild(quote(id,src?src.textContent:''));w.appendChild(line)});return w});return}
if(t.classList.contains('q')){toggle(t,function(){return context(t.id||t.dataset.i)});return}
toggle(t,function(){var w=el('div');w.appendChild(el('p','tip',t.dataset.help));return w})});
document.addEventListener('keydown',function(ev){if((ev.key==='Enter'||ev.key===' ')&&ev.target.classList&&ev.target.classList.contains('q')){ev.preventDefault();ev.target.click()}});
window.addEventListener('beforeprint',function(){document.querySelectorAll('details:not([open])').forEach(function(d){d.open=true;d.dataset.closed='1'})});
window.addEventListener('afterprint',function(){document.querySelectorAll('details[data-closed]').forEach(function(d){d.open=false;delete d.dataset.closed})});
})();`

/** Un JSON posé dans une balise <script> : rien ne doit pouvoir la refermer. */
export const scriptJson = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c')
