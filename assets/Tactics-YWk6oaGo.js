import{h as b,j as g,k as w,l as C,b as S,i as l,c as h,S as p,f as u,s as y,t as i,m as x}from"./index-wjfFEESx.js";/* empty css                   */import{S as R}from"./studyrepo-wgSve_Q5.js";const k=i("<div class=progress><div class=bar></div><h3>"),E=i("<div class=list-wrap><h1 class=header>Tactics</h1><div class=list><div><h3 class=title></h3></div><div><p>Current Run"),O=i("<div class=repertoire>"),P=i("<div class=board-wrap>"),j=i("<div class=replay-wrap><div class=replay-header><div class=title><h5></h5><h4>3/50</h4></div><h3 class=lichess><a target=_blank>lichess</a></h3></div><div class=replay>"),f=a=>(()=>{const t=k(),n=t.firstChild,_=n.nextSibling;return l(_,()=>`${a.width}/${a.nb}`),u(o=>x(n,`width: ${a.width/a.nb*100}%`,o)),t})(),T=()=>{const a=b(),[t]=g(a.id,R.read_study),[n,_]=w();C(()=>{var e;let s=(e=t())==null?void 0:e.chapters[0].name;_(s)});const o=S(()=>{var s;return(s=t())==null?void 0:s.chapters.find(e=>e.name===n())});return(()=>{const s=O();return l(s,h(p,{get when(){return!t.loading},fallback:"Loading...",get children(){const e=E(),c=e.firstChild,$=c.nextSibling,r=$.firstChild,m=r.firstChild,d=r.nextSibling;return d.firstChild,l(m,()=>t().name),l(r,h(f,{width:3,nb:10}),null),l(d,h(f,{width:3,nb:50}),null),e}}),null),l(s,h(p,{get when(){return o()},children:e=>[P(),(()=>{const c=j(),$=c.firstChild,r=$.firstChild,m=r.firstChild,d=r.nextSibling,v=d.firstChild;return l(m,()=>t().name),u(()=>y(v,"href",e().site)),c})()]}),null),s})()};export{T as default};