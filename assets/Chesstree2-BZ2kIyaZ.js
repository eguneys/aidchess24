var H=Object.defineProperty;var L=(s,t,e)=>t in s?H(s,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[t]=e;var l=(s,t,e)=>(L(s,typeof t!="symbol"?t+"":t,e),e);import{d as N,p,h as g,m as T,l as y,w as q,i as _,c as h,S as k,x as c,e as C,M as w,F as m,f as F,g as A,t as v}from"./index-B_QKkqnW.js";import"./Shalala-DpwkvLOr.js";import{I as D,a as P}from"./chess_pgn_logic-BK7Cxuej.js";var I=v("<div class=chesstree>"),M=v("<div class=lines>"),R=v("<div class=line>"),z=v("<span class=index>"),B=v("<div>"),G=v("<span class=collapsed> ..<!> ");class j{constructor(){l(this,"_blacks");l(this,"_whites");this._blacks=g([],{equals:!1}),this._whites=g([],{equals:!1})}replace_all(t){this.blacks=t.blacks.slice(0),this.whites=t.whites.slice(0)}merge_dup(t){p(()=>{t.paths.forEach(e=>this.add_path(e))})}get_for_saving(){return[this.blacks,this.whites]}static set_for_saving(t){let e=new j;return e.blacks=t[0],e.whites=t[1],e}set blacks(t){this._blacks[1](t)}set whites(t){this._whites[1](t)}get blacks(){return this._blacks[0]()}get whites(){return this._whites[0]()}get paths(){return[...this.blacks,...this.whites]}get expand_paths(){let t=[];return this.whites.forEach(e=>{for(let a=0;a<=e.length-1;a+=2){let r=e.slice(0,a+1);t=t.filter(i=>i.join("")!==r.join("")),t.push(r)}}),this.blacks.forEach(e=>{for(let a=1;a<=e.length-1;a+=2){let r=e.slice(0,a+1);t=t.filter(i=>i.join("")!==r.join("")),t.push(r)}}),t}clear(){this.blacks=[],this.whites=[]}remove_path(t){T(()=>{if(t.length%2===0){let e=this.blacks;e=e.filter(a=>a.join("")!==t.join("")),this.blacks=e}else{let e=this.whites;e=e.filter(a=>a.join("")!==t.join("")),this.whites=e}})}add_path(t){T(()=>{if(t.length%2===0){let e=this.blacks;if(e.find(r=>r.join("").startsWith(t.join(""))))return;let a=e.findIndex(r=>t.join("").startsWith(r.join("")));a!==-1?e.splice(a,1,t):e.push(t),this.blacks=e}else{let e=this.whites;if(e.find(r=>r.join("").startsWith(t.join(""))))return;let a=e.findIndex(r=>t.join("").startsWith(r.join("")));a!==-1?e.splice(a,1,t):e.push(t),this.whites=e}})}}const b=class b{constructor(t,e){l(this,"_tree");l(this,"_cursor_path");l(this,"_hidden_paths");l(this,"_revealed_paths");l(this,"_failed_paths");l(this,"_solved_paths");l(this,"reveal_hidden_paths",()=>{p(()=>{this.hidden_paths.forEach(t=>{this.revealed_paths.push(t)}),this._hidden_paths.clear(),this.revealed_paths=this.revealed_paths})});l(this,"reveal_one_random",()=>{var a,r;if(!this.tree)return!1;const t=((r=(a=this.tree)==null?void 0:a._traverse_path(this.cursor_path))==null?void 0:r.children)??[this.tree.root],e=K(t);return e?(p(()=>{this._hidden_paths.remove_path(e.data.path),e.children.forEach(i=>this._hidden_paths.add_path(i.data.path)),this.cursor_path=e.data.path}),!0):!1});l(this,"try_next_uci_fail",t=>{var i,u,o;if(!this.tree)return!1;const e=((i=this.tree)==null?void 0:i._traverse_path(this.cursor_path))??this.tree.root,a=((o=(u=this.tree)==null?void 0:u._traverse_path(this.cursor_path))==null?void 0:o.children)??[this.tree.root],r=a.find(d=>d.data.uci===t)??a.find(d=>Q(d.data)===t);if(r){if(this.failed_paths.find(f=>f.join("")===r.data.path.join(""))){setTimeout(()=>{this.cursor_path=this.cursor_path},100);return}return p(()=>{this._hidden_paths.remove_path(r.data.path),r.children.forEach(f=>this._hidden_paths.add_path(f.data.path)),this._solved_paths.add_path(r.data.path),this.cursor_path=r.data.path}),!0}else{if(this.is_revealed){setTimeout(()=>{this.cursor_path=this.cursor_path},100);return}return this.add_uci(t),this.add_failed_path([...e.data.path,t]),setTimeout(()=>{this.on_wheel(-1)},100),!1}});l(this,"on_wheel",t=>{var a;let e=this.cursor_path;if(t<0)e.length>0&&this.try_set_cursor_path(e.slice(0,-1));else{let r=this.tree;if(r){let i;e.length===0?i=[r.root]:i=(a=r._traverse_path(e))==null?void 0:a.children;let u=i==null?void 0:i.map(o=>o.data.path).find(o=>{var d;return!((d=this.hidden_paths)!=null&&d.some(f=>o.join("").startsWith(f.join(""))))});u&&this.try_set_cursor_path(u)}}});this.initial_fen=t,this._cursor_path=g([],{equals:!1}),this._tree=g(e),this._hidden_paths=new j,this._revealed_paths=g([],{equals:!1}),this._failed_paths=g([],{equals:!1}),this._solved_paths=new j}get hidden_paths(){return this._hidden_paths.paths}get revealed_paths(){return this._revealed_paths[0]()}set revealed_paths(t){this._revealed_paths[1](t)}get failed_paths(){return this._failed_paths[0]()}set failed_paths(t){this._failed_paths[1](t)}get solved_paths(){return this._solved_paths}get solved_paths_expanded(){return this._solved_paths.expand_paths}get initial_color(){var t;return(t=this.tree)==null?void 0:t.initial_color}get cursor_path(){return this._cursor_path[0]()}get tree(){return this._tree[0]()}set cursor_path(t){this._cursor_path[1](t)}set tree(t){this._tree[1](t)}get fen_last_move(){let t=this.tree;if(t){let e=t.get_at(this.cursor_path);if(!e)return;let a=e.after_fen,r=e.uci;return[a,r]}}try_set_cursor_path(t){return this.hidden_paths.find(a=>t.join("").startsWith(a.join("")))?!1:(this.cursor_path=t,!0)}get is_revealed(){return this.hidden_paths.length===0}add_and_reveal_uci(t){this.revealed_paths.push(this.add_uci(t)),this.revealed_paths=this.revealed_paths}add_failed_path(t){let e=this.failed_paths;e=e.filter(a=>a.join("")!==t.join("")),e.push(t),this.failed_paths=e}add_uci(t){let e=this.tree,a=this.cursor_path;return e?e.append_uci(t,a):e=P.make(this.initial_fen,[t]),a=[...a,t],p(()=>{this.tree=e,this.cursor_path=a}),a}drop_failed_paths(){return p(()=>{var a;let t=this.failed_paths;t.forEach(r=>{var i;return(i=this.tree)==null?void 0:i.delete_at(r)});let e=this.cursor_path;for(;e.length>0&&!((a=this.tree)!=null&&a.get_at(e));)e.pop();return this.cursor_path=e,this.failed_paths=[],t})}};l(b,"make",(t,e=(t==null?void 0:t.root.data.before_fen)||D)=>new b(e,t));let W=b;const Z=s=>{let t;return y(()=>{let e=s.lala.cursor_path,a=t.parentElement;if(!a)return;const r=t.querySelector(".on_path_end");if(!r){a.scrollTop=e.length>0?99999:0;return}let i=r.offsetTop-a.offsetHeight/2+r.offsetHeight;a.scrollTo({behavior:"smooth",top:i})}),(()=>{var e=I();return q(a=>t=a,e),_(e,h(k,{get when(){return s.lala.tree},get fallback(){return[]},children:a=>h(x,{on_set_path:r=>s.lala.try_set_cursor_path(r),get cursor_path(){return s.lala.cursor_path},get hidden_paths(){return s.lala.hidden_paths},get revealed_paths(){return s.lala.revealed_paths},get solved_paths(){return s.lala.solved_paths_expanded},get failed_paths(){return s.lala.failed_paths},get lines(){return[a().root]}})})),e})()},x=s=>h(m,{get each(){return s.lines},children:t=>[h(E,c({get data(){return t.data}},s)),h(C,{get children(){return[h(w,{get when(){return t.children.length===1},get children(){return h(x,c(s,{get lines(){return t.children}}))}}),h(w,{get when(){return t.children.length>1},get children(){var e=M();return _(e,h(m,{get each(){return t.children},children:a=>(()=>{var r=R();return _(r,h(x,c(s,{lines:[a],show_index:!0}))),r})()})),e}})]}})]}),E=s=>{let t=`${Math.ceil(s.data.ply/2)}.`;s.data.ply%2===0&&(t+="..");let e=()=>s.cursor_path.join("").startsWith(s.data.path.join("")),a=()=>s.cursor_path.join("")===s.data.path.join(""),r=s.data.path.join(""),i=()=>s.hidden_paths.find(n=>n.join("")===r),u=()=>s.hidden_paths.find(n=>r.startsWith(n.join(""))),o=()=>s.revealed_paths.find(n=>n.join("")===r),d=()=>s.failed_paths.find(n=>n.join("")===r),f=()=>s.solved_paths.find(n=>n.join("")===r),O=()=>["move",a()?"on_path_end":e()?"on_path":"",i()?"on_hidden_path_start":u()?"on_hidden_path":"",o()?"on_revealed_path":"",d()?"on_failed_path":"",f()?"on_solved_path":"",s.collapsed?"collapsed":""].join(" ");return(()=>{var n=B();return n.$$click=()=>s.on_set_path(s.data.path),_(n,h(k,{get when(){return s.show_index||s.data.ply&1},get children(){var S=z();return _(S,t),S}}),null),_(n,()=>s.data.san,null),F(()=>A(n,O())),n})()},tt=s=>{let t;return y(()=>{let e=s.lala.cursor_path,a=t.parentElement;if(!a)return;const r=t.querySelector(".on_path_end");if(!r){a.scrollTop=e.length>0?99999:0;return}let i=r.offsetTop-a.offsetHeight/2+r.offsetHeight;a.scrollTo({behavior:"smooth",top:i})}),(()=>{var e=I();return q(a=>t=a,e),_(e,h(k,{get when(){return s.lala.tree},get fallback(){return[]},children:a=>h($,{on_set_path:r=>s.lala.try_set_cursor_path(r),get cursor_path(){return s.lala.cursor_path},get hidden_paths(){return s.lala.hidden_paths},get revealed_paths(){return s.lala.revealed_paths},get solved_paths(){return s.lala.solved_paths_expanded},get failed_paths(){return s.lala.failed_paths},get lines(){return[a().root]}})})),e})()},$=s=>h(m,{get each(){return s.lines},children:t=>[h(E,c({get data(){return t.data}},s)),h(C,{get children(){return[h(w,{get when(){return t.children.length===1},get children(){return h($,c(s,{get lines(){return t.children},show_index:!1}))}}),h(w,{get when(){return t.children.length>1},get children(){var e=M();return _(e,h(m,{get each(){return t.children},children:a=>(()=>{var r=R();return _(r,h(k,{get when(){return s.cursor_path.join("").startsWith(a.data.path.join(""))},get fallback(){return h(J,c(s,{lines:[a],show_index:!0}))},get children(){return h($,c(s,{lines:[a],show_index:!0}))}})),r})()})),e}})]}})]}),J=s=>h(m,{get each(){return s.lines},children:t=>[h(E,c({get data(){return t.data}},s,{collapsed:!0})),(()=>{var e=G(),a=e.firstChild,r=a.nextSibling;return r.nextSibling,_(e,()=>t.length,r),_(e,()=>t.nb_first_variations,null),e})()]});function K(s){let t=s.length*(s.length+1)/2,e=Math.floor(Math.random()*t)+1,a=0;for(let r=0;r<s.length;r++)if(a+=s.length-r,e<=a)return s[r]}const Q=s=>{let t=s.uci.slice(0,2),e=s.uci[3];if(s.san==="O-O")return t+"g"+e;if(s.san==="O-O-O")return t+"c"+e};N(["click"]);export{tt as C,W as T,j as a,Z as b};