var O=Object.defineProperty;var H=(e,t,a)=>t in e?O(e,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):e[t]=a;var d=(e,t,a)=>(H(e,typeof t!="symbol"?t+"":t,a),a);import{d as I,n as y,v as W,i as o,c as s,S,w as c,e as C,M as w,F as m,f as L,g as N,t as p,h as f,q as F}from"./index-CxHiKD4N.js";import"./Shalala-DqhI9Nj9.js";import{I as A,a as D}from"./chess_pgn_logic-C5I8toKp.js";var E=p("<div class=chesstree>"),M=p("<div class=lines>"),R=p("<div class=line>"),P=p("<span class=index>"),z=p("<div>"),B=p("<span class=collapsed> ..<!> ");const $=class ${constructor(t,a){d(this,"_tree");d(this,"_cursor_path");d(this,"_hidden_paths");d(this,"_revealed_paths");d(this,"_failed_paths");d(this,"_solved_paths");d(this,"reveal_hidden_paths",()=>{this.revealed_paths=this.hidden_paths,this.hidden_paths=[]});d(this,"reveal_one_random",()=>{var r,h;if(!this.tree)return!1;const t=((h=(r=this.tree)==null?void 0:r._traverse_path(this.cursor_path))==null?void 0:h.children)??[this.tree.root],a=J(t);if(a){let n=this.hidden_paths;n=n.filter(_=>_.join("")!==a.data.path.join(""));let u=a.children.map(_=>_.data.path);return n.push(...u),this.hidden_paths=n,this.cursor_path=a.data.path,!0}return!1});d(this,"try_next_uci_fail",t=>{var n,u,_;if(!this.tree)return!1;const a=((n=this.tree)==null?void 0:n._traverse_path(this.cursor_path))??this.tree.root,r=((_=(u=this.tree)==null?void 0:u._traverse_path(this.cursor_path))==null?void 0:_.children)??[this.tree.root],h=r.find(i=>i.data.uci===t)??r.find(i=>K(i.data)===t);if(h){let i=this.hidden_paths;i=i.filter(v=>v.join("")!==h.data.path.join(""));let g=h.children.map(v=>v.data.path);i.push(...g),this.hidden_paths=i;let j=this.solved_paths;return j.push(r[0].data.path),this.solved_paths=j,this.cursor_path=h.data.path,!0}else{if(this.is_revealed){setTimeout(()=>{this.cursor_path=this.cursor_path},100);return}return this.add_uci(t),this.failed_paths.push([...a.data.path,t]),setTimeout(()=>{this.on_wheel(-1)},100),!1}});d(this,"on_wheel",t=>{var r;let a=this.cursor_path;if(t<0)a.length>0&&this.try_set_cursor_path(a.slice(0,-1));else{let h=this.tree;if(h){let n;a.length===0?n=[h.root]:n=(r=h._traverse_path(a))==null?void 0:r.children;let u=n==null?void 0:n.map(_=>_.data.path).find(_=>{var i;return!((i=this.hidden_paths)!=null&&i.some(g=>_.join("").startsWith(g.join(""))))});u&&this.try_set_cursor_path(u)}}});this.initial_fen=t,this._cursor_path=f([],{equals:!1}),this._tree=f(a),this._hidden_paths=f([],{equals:!1}),this._revealed_paths=f([],{equals:!1}),this._failed_paths=f([],{equals:!1}),this._solved_paths=f([],{equals:!1})}get initial_color(){var t;return(t=this.tree)==null?void 0:t.initial_color}get solved_paths(){return this._solved_paths[0]()}set solved_paths(t){this._solved_paths[1](t)}get failed_paths(){return this._failed_paths[0]()}set failed_paths(t){this._failed_paths[1](t)}get revealed_paths(){return this._revealed_paths[0]()}set revealed_paths(t){this._revealed_paths[1](t)}get hidden_paths(){return this._hidden_paths[0]()}set hidden_paths(t){this._hidden_paths[1](t)}get cursor_path(){return this._cursor_path[0]()}get tree(){return this._tree[0]()}set cursor_path(t){this._cursor_path[1](t)}set tree(t){this._tree[1](t)}try_set_cursor_path(t){return this.hidden_paths.find(r=>t.join("").startsWith(r.join("")))?!1:(this.cursor_path=t,!0)}get fen_last_move(){let t=this.tree;if(t){let a=t.get_at(this.cursor_path);if(!a)return;let r=a.after_fen,h=a.uci;return[r,h]}}get is_revealed(){return this.hidden_paths.length===0}add_uci(t){let a=this.tree,r=this.cursor_path;a?a.append_uci(t,r):a=D.make(this.initial_fen,[t]),r=[...r,t],F(()=>{this.tree=a,this.cursor_path=r})}};d($,"make",(t,a=(t==null?void 0:t.root.data.before_fen)||A)=>new $(a,t));let q=$;const Y=e=>{let t;return y(()=>{let a=e.lala.cursor_path,r=t.parentElement;if(!r)return;const h=t.querySelector(".on_path_end");if(!h){r.scrollTop=a.length>0?99999:0;return}let n=h.offsetTop-r.offsetHeight/2+h.offsetHeight;r.scrollTo({behavior:"smooth",top:n})}),(()=>{var a=E();return W(r=>t=r,a),o(a,s(S,{get when(){return e.lala.tree},get fallback(){return[]},children:r=>s(x,{on_set_path:h=>e.lala.try_set_cursor_path(h),get cursor_path(){return e.lala.cursor_path},get hidden_paths(){return e.lala.hidden_paths},get revealed_paths(){return e.lala.revealed_paths},get solved_paths(){return e.lala.solved_paths},get failed_paths(){return e.lala.failed_paths},get lines(){return[r().root]}})})),a})()},x=e=>s(m,{get each(){return e.lines},children:t=>[s(k,c({get data(){return t.data}},e)),s(C,{get children(){return[s(w,{get when(){return t.children.length===1},get children(){return s(x,c(e,{get lines(){return t.children}}))}}),s(w,{get when(){return t.children.length>1},get children(){var a=M();return o(a,s(m,{get each(){return t.children},children:r=>(()=>{var h=R();return o(h,s(x,c(e,{lines:[r],show_index:!0}))),h})()})),a}})]}})]}),k=e=>{let t=`${Math.ceil(e.data.ply/2)}.`;e.data.ply%2===0&&(t+="..");let a=()=>e.cursor_path.join("").startsWith(e.data.path.join("")),r=()=>e.cursor_path.join("")===e.data.path.join(""),h=e.data.path.join(""),n=()=>e.hidden_paths.find(l=>l.join("")===h),u=()=>e.hidden_paths.find(l=>h.startsWith(l.join(""))),_=()=>e.revealed_paths.find(l=>l.join("")===h),i=()=>e.revealed_paths.find(l=>h.startsWith(l.join(""))),g=()=>e.failed_paths.find(l=>l.join("")===h),j=()=>e.solved_paths.find(l=>l.join("")===h),v=()=>["move",r()?"on_path_end":a()?"on_path":"",n()?"on_hidden_path_start":u()?"on_hidden_path":"",_()?"on_revealed_path_start":i()?"on_revealed_path":"",g()?"on_failed_path":"",j()?"on_solved_path":"",e.collapsed?"collapsed":""].join(" ");return(()=>{var l=z();return l.$$click=()=>e.on_set_path(e.data.path),o(l,s(S,{get when(){return e.show_index||e.data.ply&1},get children(){var T=P();return o(T,t),T}}),null),o(l,()=>e.data.san,null),L(()=>N(l,v())),l})()},Z=e=>{let t;return y(()=>{let a=e.lala.cursor_path,r=t.parentElement;if(!r)return;const h=t.querySelector(".on_path_end");if(!h){r.scrollTop=a.length>0?99999:0;return}let n=h.offsetTop-r.offsetHeight/2+h.offsetHeight;r.scrollTo({behavior:"smooth",top:n})}),(()=>{var a=E();return W(r=>t=r,a),o(a,s(S,{get when(){return e.lala.tree},get fallback(){return[]},children:r=>s(b,{on_set_path:h=>e.lala.try_set_cursor_path(h),get cursor_path(){return e.lala.cursor_path},get hidden_paths(){return e.lala.hidden_paths},get revealed_paths(){return e.lala.revealed_paths},get solved_paths(){return e.lala.solved_paths},get failed_paths(){return e.lala.failed_paths},get lines(){return[r().root]}})})),a})()},b=e=>s(m,{get each(){return e.lines},children:t=>[s(k,c({get data(){return t.data}},e)),s(C,{get children(){return[s(w,{get when(){return t.children.length===1},get children(){return s(b,c(e,{get lines(){return t.children},show_index:!1}))}}),s(w,{get when(){return t.children.length>1},get children(){var a=M();return o(a,s(m,{get each(){return t.children},children:r=>(()=>{var h=R();return o(h,s(S,{get when(){return e.cursor_path.join("").startsWith(r.data.path.join(""))},get fallback(){return s(G,c(e,{lines:[r],show_index:!0}))},get children(){return s(b,c(e,{lines:[r],show_index:!0}))}})),h})()})),a}})]}})]}),G=e=>s(m,{get each(){return e.lines},children:t=>[s(k,c({get data(){return t.data}},e,{collapsed:!0})),(()=>{var a=B(),r=a.firstChild,h=r.nextSibling;return h.nextSibling,o(a,()=>t.length,h),o(a,()=>t.nb_first_variations,null),a})()]});function J(e){let t=e.length*(e.length+1)/2,a=Math.floor(Math.random()*t)+1,r=0;for(let h=0;h<e.length;h++)if(r+=e.length-h,a<=r)return e[h]}const K=e=>{let t=e.uci.slice(0,2),a=e.uci[3];if(e.san==="O-O")return t+"g"+a;if(e.san==="O-O-O")return t+"c"+a};I(["click"]);export{Z as C,q as T,Y as a};