import{a as x,i as a,c as u,u as $,S as w,d as C,t as i,b as k,F as S}from"./index-BAagO4GW.js";import{R as f}from"./studyrepo-B4dt2qed.js";import"./chess_pgn_logic-YxUjynLU.js";var b=i("<div class=category><h1></h1><ul>"),I=i("<li class=soon><h3></h3><span>Coming Soon"),N=i("<li><h3>"),P=i('<input style=padding:0.2em;margin:0.2em; type=text placeholder="Short Id">'),F=i('<textarea placeholder="Paste Study PGN"rows=10 cols=40>'),R=i("<div class=repertoires><div class=categories><div class=category><h1>Import New Study </h1><div style=display:flex;flex-flow:column;gap:0.2em;><button style=align-self:flex-end;padding:1em;>Import"),G=i('<input style=padding:0.2em;margin:0.3em; type=text placeholder="lichess study link">'),E=i("<a style=cursor:pointer;> or Paste PGN ");const y=o=>{const h=k();return(()=>{var p=b(),d=p.firstChild,_=d.nextSibling;return a(d,()=>o.name),a(_,u(S,{get each(){return o.list},children:l=>u(w,{get fallback(){return(()=>{var s=N(),e=s.firstChild;return s.$$click=()=>h(`/${l.category.toLowerCase()}/${l.study_link}`),a(e,()=>l.study_name),s})()},get when(){return l.study_link===""},get children(){var s=I(),e=s.firstChild;return a(e,()=>l.study_name),s}})})),p})()};function V(){let o=f;const h=async()=>{let e;if(l()){let r=_.value;if(e=d.value,r.length<3||r.length>20||e.length<30)return;f.save_import_pgn(r,e)}else{let n=p.value.match(/lichess.org\/study\/(\w*)\/?/);if(!n){p.value="Incorrect lichess study";return}let g=n[1];e=await fetch(`https://lichess.org/api/study/${g}.pgn`).then(m=>m.text()),f.save_import_pgn(g,e)}window.location.reload()};let p,d,_;const[l,s]=x(!1);return(()=>{var e=R(),r=e.firstChild,n=r.firstChild,g=n.firstChild,m=g.nextSibling,v=m.firstChild;return a(r,u(y,{name:"Openings",get list(){return o.openings}}),n),a(r,u(y,{name:"Masters",get list(){return o.masters}}),n),a(r,u(y,{name:"Imported",get list(){return o.imported[0]()}}),n),a(m,u(w,{get when(){return l()},get fallback(){return[(()=>{var t=G();return $(c=>p=c,t),t})(),(()=>{var t=E();return t.$$click=()=>{s(!0)},t})()]},get children(){return[(()=>{var t=P();return $(c=>_=c,t),t})(),(()=>{var t=F();return $(c=>d=c,t),t})()]}}),v),v.$$click=()=>h(),e})()}C(["click"]);export{V as default};