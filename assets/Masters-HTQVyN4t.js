import{j as C,k as S,h as x,l as y,b as k,i as t,c,F as R,f,g as E,S as b,p as F,d as M,t as i,s as P}from"./index-BJpzf9IE.js";/* empty css                   */import{S as j}from"./studyrepo-DWUYRPbt.js";import"./chess_pgn_logic-3ui-LPsv.js";var A=i("<div class=progress><div class=bar></div><h3>"),L=i("<div class=list-wrap><h1 class=header>Masters</h1><div class=list><div><h3 class=title></h3></div><ul>"),N=i("<div class=repertoire>"),q=i("<li><div><h3></h3> "),z=i("<div class=board-wrap>"),B=i("<div class=replay-wrap><div class=replay-header><div class=title><h5></h5><h4></h4></div><h3 class=lichess><a target=_blank>lichess</a></h3></div><div class=replay>");const w=h=>(()=>{var l=A(),n=l.firstChild,_=n.nextSibling;return t(_,()=>`%${h.width}`),f(p=>P(n,`width: ${h.width}%`,p)),l})(),J=()=>{const h=C(),[l]=S(h.id,j.read_study),[n,_]=x();y(()=>{var e;let s=(e=l())==null?void 0:e.chapters[0].name;_(s)});const p=k(()=>{var s;return(s=l())==null?void 0:s.chapters.find(e=>e.name===n())});return(()=>{var s=N();return t(s,c(b,{get when(){return!l.loading},fallback:"Loading...",get children(){var e=L(),$=e.firstChild,o=$.nextSibling,a=o.firstChild,m=a.firstChild,v=a.nextSibling;return t(m,()=>l().name),t(a,c(w,{width:30}),null),t(v,c(R,{get each(){return l().chapters},children:d=>(()=>{var r=q(),u=r.firstChild,g=u.firstChild;return g.nextSibling,r.$$click=()=>_(d.name),t(g,()=>d.name),t(u,c(w,{width:0}),null),f(()=>E(r,n()===d.name?"active":"")),r})()})),e}}),null),t(s,c(b,{get when(){return p()},children:e=>[z(),(()=>{var $=B(),o=$.firstChild,a=o.firstChild,m=a.firstChild,v=m.nextSibling,d=a.nextSibling,r=d.firstChild;return t(m,()=>l().name),t(v,()=>e().name),f(()=>F(r,"href",e().site)),$})()]}),null),s})()};M(["click"]);export{J as default};