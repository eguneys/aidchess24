import{a as M,m as K,g as C,n as S,q as y,i as o,c as d,j as R,F as j,S as D,o as O,r as q,v as B,b as Q,k as x,d as U,t as _,I as W}from"./index-DtDj3l3v.js";import{S as Y,C as z}from"./Chessboard-C-a4dFIu.js";import{T as H,C as J}from"./Chesstree2-CtmN7WsG.js";import{R as V,S as X}from"./studyrepo-BOobqToQ.js";import{s as Z}from"./scroll-DnAhRpRC.js";var ee=_("<div class=explorer><div class=e-studies><h3>Studies</h3><select></select><div class=e-chapters><h3>Chapters</h3></div></div><div class=e-chapter-wrap>"),G=_("<option>"),te=_("<span> Loading ... "),ae=_("<select>"),re=_("<span>Loading..."),ne=_("<div class=explorer-chapter><div class=board-wrap></div><div class=replay-wrap><div class=replay-header><h3></h3></div><div class=replay><div class=replay-v></div><div class=replay-jump><button data-icon=></button><button data-icon=></button><button data-icon=></button><button data-icon=></button></div><div class=replay-tools>");const _e=()=>{let h=V.all.filter(s=>s.study_id!==""&&s.category!=="Tactics");const[E,w]=M(0),[f]=K(()=>h[E()].study_id,s=>X.read_study(s)),[m,b]=M(0),a=C(()=>f()?.chapters),t=C(()=>a()?.[m()]);return S(y(f,()=>{b(0)})),(()=>{var s=ee(),v=s.firstChild,u=v.firstChild,e=u.nextSibling,r=e.nextSibling;r.firstChild;var p=v.nextSibling;return e.addEventListener("change",l=>w(parseInt(l.currentTarget.value))),o(e,d(j,{each:h,children:(l,c)=>(()=>{var i=G();return o(i,()=>l.study_name),R(()=>i.value=c()),i})()})),o(r,d(D,{get when(){return a()},get fallback(){return te()},children:l=>(()=>{var c=ae();return c.addEventListener("change",i=>b(parseInt(i.currentTarget.value))),o(c,d(j,{get each(){return l()},children:(i,$)=>(()=>{var g=G();return o(g,()=>i.name),R(()=>g.value=$()),g})()})),c})()}),null),o(p,d(D,{get when(){return t()},get fallback(){return re()},children:l=>d(se,{get pgn_chapter(){return l()}})})),s})()},se=h=>{const E=O(),w=()=>!1,f=()=>"white",m=()=>h.pgn_chapter,b=C(()=>m().pgn),a=new Y,t=C(()=>H.make(b().tree));S(y(()=>t().fen_last_move,e=>{if(e){let[r,p]=e;a.on_set_fen_uci(r,p)}else a.on_set_fen_uci(W)})),S(y(()=>a.on_wheel,e=>{e&&t().on_wheel(e)}));const s=e=>{e.key};S(y(()=>t().tree?.get_at(t().cursor_path),e=>{e&&E.move(e)})),q(()=>{document.addEventListener("keypress",s)}),B(()=>{document.removeEventListener("keypress",s)});const v=Z(e=>{const r=e.target;r.tagName!=="PIECE"&&r.tagName!=="SQUARE"&&r.tagName!=="CG-BOARD"||(e.preventDefault(),a.set_on_wheel(Math.sign(e.deltaY)))});let u;return q(()=>{u.addEventListener("wheel",v,{passive:!1})}),B(()=>{u.removeEventListener("wheel",v)}),(()=>{var e=ne(),r=e.firstChild,p=r.nextSibling,l=p.firstChild,c=l.firstChild,i=l.nextSibling,$=i.firstChild,g=$.nextSibling,k=g.firstChild,L=k.nextSibling,I=L.nextSibling,N=I.nextSibling;return Q(n=>u=n,e),o(r,d(z,{get orientation(){return f()},get movable(){return w()},get doPromotion(){return a.promotion},get onMoveAfter(){return a.on_move_after},get fen_uci(){return a.fen_uci},get color(){return a.turnColor},get dests(){return a.dests}})),o(c,()=>m().name),o($,d(J,{get lala(){return t()}})),k.$$click=()=>t().navigate_first(),L.$$click=()=>t().navigate_prev(),I.$$click=()=>t().navigate_next(),N.$$click=()=>t().navigate_last(),R(n=>{var T="fbt first"+(t().can_navigate_prev?"":" disabled"),P="fbt prev"+(t().can_navigate_prev?"":" disabled"),A="fbt next"+(t().can_navigate_next?"":" disabled"),F="fbt last"+(t().can_navigate_next?"":" disabled");return T!==n.e&&x(k,n.e=T),P!==n.t&&x(L,n.t=P),A!==n.a&&x(I,n.a=A),F!==n.o&&x(N,n.o=F),n},{e:void 0,t:void 0,a:void 0,o:void 0}),e})()};U(["click"]);export{_e as default};