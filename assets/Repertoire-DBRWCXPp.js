var Le=Object.defineProperty;var je=(h,t,i)=>t in h?Le(h,t,{enumerable:!0,configurable:!0,writable:!0,value:i}):h[t]=i;var N=(h,t,i)=>(je(h,typeof t!="symbol"?t+"":t,i),i);import{j as Qe,k as Ne,l as L,u as Ye,i as u,c as p,S as Y,e as m,m as b,a as Ae,F as te,g as U,h as D,s as ke,n as Oe,o as I,p as F,q as Fe,r as Se,v as ie,M as X,w as y,f as Ge,d as We,t as l}from"./index-DvOnxsF_.js";/* empty css                   */import{S as Be,R as He}from"./studyrepo-CHfHmhdT.js";import{S as Ke,C as Ue}from"./Shalala-C35YzlRZ.js";import{T as Ve,a as de,C as Je}from"./Chesstree2-ORBmFsOF.js";import{M as Xe,I as Ze}from"./chess_pgn_logic-DWOrzBUn.js";import{O as et,S as tt,D as st,a as xe}from"./SessionStore-BkS1fqq_.js";import{s as rt}from"./scroll-DnAhRpRC.js";var at=l("<div class=progress-wrap><div class=progress><div class=bar></div></div><h5>%"),it=l("<div class=repertoire>"),lt=l("<div class=sections-wrap><h2 class=title> <span>%</span></h2><div class=sections-scroll><div class=sections>"),nt=l("<a class=delete> Delete Study "),_t=l("<div class=tools>"),ot=l("<div class=section><input type=radio name=accordion><label> <span class=progress>%</span></label><div class=chapters>"),ct=l("<div><div class=title><span class=no>.</span> <!> "),ht=l("<div class=board-wrap>"),ut=l("<div class=eval-gauge>"),Ce=l("<small> Click on variations to expand. "),dt=l("<small> Your goal is to guess every move correctly to pass the quiz. "),mt=l("<div class=in_mode><button><span> Take Quiz </span></button><button><span> Play Deathmatch "),pt=l("<h2>Deathmatch Mode"),Me=l("<span class=passed>passed"),vt=l("<small> Deathmatch "),gt=l("<small> Your score: "),Ee=l("<small> Progress +<!>% "),ft=l("<div class=in_mode><button><span> Restart Deathmatch </span></button><button class=end2><span> End Deathmatch "),$t=l("<small> Quiz "),zt=l("<small> Your score: <!> out of 15 correct"),qt=l("<div class=past>"),bt=l("<div class=in_mode><button><span> Restart Quiz </span></button><button class=end2><span> End Quiz "),yt=l("<small> Your goal is to guess every move correctly to fill up the progress bar. "),wt=l("<div class=in_mode><button><span> Play all Moves </span></button><button><span> Play as Match "),kt=l("<h2>Play as Match"),Pe=l("<small> End of practice. "),Te=l("<small> Congratulations. "),St=l("<div class=in_mode><button><span> Rematch </span></button><button class=end2><span> End Practice "),xt=l("<h2>Play all moves"),Ct=l("<div class=in_mode><button><span> Clear </span></button><button class=end2><span> End Practice "),Mt=l("<div class=replay-wrap><div class=replay-header><div class=title><h4></h4><h5></h5></div></div><div class=replay><div class=replay-v></div><div class=branch-sums><button data-icon=></button><button data-icon=></button></div><div class=replay-jump><button data-icon=></button><button data-icon=></button><button data-icon=></button><button data-icon=></button></div><div class=tools><div class=tabs><h3>Practice</h3><h3>Quiz</h3></div><div class=content>"),Et=l('<div class=line><span class="fill white"></span><span class="fill black">'),Pt=l("<span class=index>"),Tt=l("<div class=fbt>"),Rt=l("<small>You will play the moves from the opening."),Dt=l("<small>If you go out of book, game ends."),It=l("<div class=in_mode><button class=end2><span> End Deathmatch "),Re=l("<span class=failed>failed"),Lt=l("<h3>Quiz Mode"),jt=l("<small>You are given 15 random positions from the opening."),Qt=l("<small>Guess the correct move."),Nt=l("<h2> of 15"),Yt=l("<div class=in_mode><button class=end2><span> End Quiz "),At=l("<span>"),Ot=l("<small> Try to guess the moves for <!>."),Ft=l("<small> AI will play the next move, picking a random variation. "),Gt=l("<small> Moves will be hidden once the game is started. "),Wt=l("<small>Try to guess the moves for both sides."),Bt=l("<small>Moves will be hidden once you start.");const Ht=["#afacc6","#0d2b45","#203c56","#544e68","#8d697a","#d08159"],Kt=h=>Ht[Math.floor((1-h/10)*6)],Ut=h=>`${Math.floor(h/2)+1}.`+(h%2===0?"..":"");class Vt{constructor(){N(this,"_mode");N(this,"_match_color");N(this,"_practice_end_result");N(this,"_quiz_quiz_ls_paths",[]);N(this,"_quiz_quiz_ls");N(this,"_quiz_deathmatch_fail");N(this,"_quiz_deathmatch_result_path");this._mode=L(void 0,{equals:!1}),this._match_color=L("white"),this._quiz_quiz_ls=L([],{equals:!1}),this._quiz_deathmatch_fail=L(0),this._quiz_deathmatch_result_path=L([]),this._practice_end_result=L(!1)}get mode(){return this._mode[0]()}set mode(t){this._mode[1](t)}get match_color(){return this._match_color[0]()}set match_color(t){this._match_color[1](t)}flip_match_color(){this.match_color=this.match_color==="white"?"black":"white"}get practice_end_result(){return this._practice_end_result[0]()}set practice_end_result(t){this._practice_end_result[1](t)}get i_quiz_quiz(){return this.quiz_quiz_ls.length+1}restart_match(){y(()=>{this.practice_end_result=!1,this.mode="match",this.flip_match_color()})}restart_moves(){y(()=>{this.practice_end_result=!1,this.mode="moves",this.flip_match_color()})}end_match_or_moves(){y(()=>{this.practice_end_result=!1,this.mode=void 0})}restart_quiz(){y(()=>{this.quiz_quiz_ls=[],this._quiz_quiz_ls_paths=[],this.mode="quiz-quiz"})}end_quiz(){y(()=>{this.quiz_quiz_ls=[],this._quiz_quiz_ls_paths=[],this.mode="quiz"})}quiz_pass_one(t){y(()=>{this.quiz_quiz_ls.push(1),this.quiz_quiz_ls=this.quiz_quiz_ls,this._quiz_quiz_ls_paths.push(t)})}quiz_fail_one(t){y(()=>{this.quiz_quiz_ls.push(-1),this.quiz_quiz_ls=this.quiz_quiz_ls,this._quiz_quiz_ls_paths.push(t)})}get quiz_pass(){return this.quiz_quiz_ls.filter(t=>t>0).length}get quiz_quiz_ls(){return this._quiz_quiz_ls[0]()}set quiz_quiz_ls(t){this._quiz_quiz_ls[1](t)}set quiz_deathmatch_fail_result(t){this._quiz_deathmatch_fail[1](t)}get quiz_deathmatch_fail_result(){return this._quiz_deathmatch_fail[0]()}get quiz_deathmatch_result_path(){return this._quiz_deathmatch_result_path[0]()}set quiz_deathmatch_result_path(t){this._quiz_deathmatch_result_path[1](t)}restart_deathmatch(){y(()=>{this.flip_match_color(),this.quiz_deathmatch_fail_result=0,this.mode="quiz-deathmatch"})}end_deathmatch(){y(()=>{this.quiz_deathmatch_fail_result=0,this.mode="quiz",this.flip_match_color()})}}const Jt=h=>(()=>{var t=at(),i=t.firstChild,d=i.firstChild,o=i.nextSibling,f=o.firstChild;return u(o,()=>h.width,f),U(C=>ie(d,`width: ${h.width}%`,C)),t})();class Xt{constructor(t){this.sections=t}get progress(){let t=this.sections.length;return this.sections.map(i=>Math.round(i.progress/t)).reduce((i,d)=>i+d)}section_by_name(t){return this.sections.find(i=>i.name===t)}}class Zt{constructor(t){N(this,"m_progress");this.chapters=t,this.m_progress=m(()=>{let i=this.chapters.length;return this.chapters.map(d=>Math.round(d.progress/i)).reduce((d,o)=>d+o)})}get name(){return this.chapters[0].section}get progress(){return this.m_progress()}chapter_by_name(t){return this.chapters.find(i=>i.chapter===t)}}class K{constructor(t,i,d,o,f){this.study_id=t,this.section=i,this.chapter=d,this.score_tree=o,this.solved_paths=f}static load_from_store(t,i,d){var C,k;let o=new xe(t.id,i,d),f=(k=(C=t.sections.find(M=>M.name===i))==null?void 0:C.chapters.find(M=>M.name===d))==null?void 0:k.pgn.tree;if(f)return K.make(t.id,i,d,f,de.set_for_saving(o.solved_paths))}static save_paths_to_store(t){let i=new xe(t.study_id,t.section,t.chapter);i.solved_paths=t.solved_paths.get_for_saving(),i.practice_progress=t.progress}static make(t,i,d,o,f=new de){return new K(t,i,d,Xe.make(o),f)}get clone(){return new K(this.study_id,this.section,this.chapter,this.score_tree,this.solved_paths.clone)}get progress(){return Math.round(this.solved_paths.paths.map(t=>I(()=>{var i;return(i=this.score_tree.get_at(t))==null?void 0:i.score})??0).reduce((t,i)=>t+i,0)*100)}get progress_map(){let t=I(()=>this.score_tree.progress_paths);const i=I(()=>t.map(d=>[d.filter(o=>o.length%2===1).map(o=>this.score_tree.get_at(o).score).reduce((o,f)=>o+f,0),d.filter(o=>o.length%2===0).map(o=>this.score_tree.get_at(o).score).reduce((o,f)=>o+f,0)]));return t.map((d,o)=>{let f=d[0],C=d[d.length-1],k=i[o][0],M=i[o][1],G=m(()=>this.solved_paths.paths),s=m(()=>G().filter(v=>d.some(E=>E.join("")===v.join("")))),w=m(()=>s().filter(v=>v.length%2===1).map(v=>this.score_tree.get_at(v).score).reduce((v,E)=>v+E,0)),a=m(()=>s().filter(v=>v.length%2===0).map(v=>this.score_tree.get_at(v).score).reduce((v,E)=>v+E,0));return{color:Kt(f.length/20+C.length/10),total:k+M,black:m(()=>a()/M),white:m(()=>w()/k),path:C}}).reverse()}clone_merge_stats(t){let i=I(()=>this.clone);return i.solved_paths.merge_dup(t.solved_paths),i}merge_and_save_stats(t){this.solved_paths.merge_dup(t.solved_paths),this.save_stats()}save_stats(){K.save_paths_to_store(this)}}const hs=()=>{const h=Qe(),[t]=Ne(h.id,Be.read_section_study);let[i,d]=L();return(()=>{var o=it();return Ye(f=>d(f),o),u(o,p(Y,{get when(){return t()},fallback:"Loading...",get children(){return p(es,{get el_rep(){return i()},get section_study(){return t()}})}})),o})()},es=h=>{let t=m(()=>h.section_study.sections),i=new et(h.section_study.id),d=0,o=t().findIndex($=>$.name===tt.i_section);o===-1&&(o=t().findIndex($=>$.name===i.i_section_name),o===-1?o=0:d=i.i_chapter_index);const[f,C]=L(o),k=m(()=>t()[f()]),M=m(()=>k().chapters),[G,s]=L(d),w=$=>{y(()=>{s(0),C($)})};b(()=>{i.i_section_name=k().name}),b(()=>{i.i_chapter_index=G()});const a=m(()=>M()[G()]);let v=m(()=>{const $=h.section_study;return new Xt($.sections.map(P=>new Zt(P.chapters.map(V=>K.load_from_store($,P.name,V.name)))))});const E=new st(h.section_study.id);b(()=>{E.progress=v().progress}),b(()=>{E.sections_progress=v().sections.map($=>[$.name,$.progress])});const le=Ae(),se=()=>{He.delete_imported_study(h.section_study.id),console.log("done"),le("/repertoires")};return[(()=>{var $=lt(),P=$.firstChild,V=P.firstChild,S=V.nextSibling,A=S.firstChild,re=P.nextSibling,ne=re.firstChild;return u(P,()=>h.section_study.name,V),u(S,()=>v().progress,A),u(ne,p(te,{get each(){return t()},children:(J,W)=>(()=>{var Z=ot(),B=Z.firstChild,T=B.nextSibling,j=T.firstChild,ee=j.nextSibling,ae=ee.firstChild,r=T.nextSibling;return T.$$click=()=>w(W()),u(T,()=>J.name,j),u(ee,()=>v().section_by_name(J.name).progress,ae),u(r,p(te,{get each(){return J.chapters},children:(n,g)=>(()=>{var z=ct(),R=z.firstChild,q=R.firstChild,O=q.firstChild,H=q.nextSibling,Q=H.nextSibling;return Q.nextSibling,z.$$click=()=>s(g()),u(q,()=>g()+1,O),u(R,()=>n.name,Q),u(z,p(Jt,{get width(){return v().section_by_name(J.name).chapter_by_name(n.name).progress}}),null),U(()=>D(z,"chapter"+(g()===G()?" active":""))),z})()})),U(n=>{var g=`accordion-${W()}`,z=f()===W()?"active":"",R=`accordion-${W()}`;return g!==n.e&&ke(B,"id",n.e=g),z!==n.t&&D(T,n.t=z),R!==n.a&&ke(T,"for",n.a=R),n},{e:void 0,t:void 0,a:void 0}),U(()=>B.checked=f()===W()),Z})()})),$})(),p(ts,{get el_rep(){return h.el_rep},get stats(){return v().section_by_name(k().name).chapter_by_name(a().name)},get study(){return h.section_study},get section(){return k()},get chapter(){return a()}}),(()=>{var $=_t();return u($,p(Y,{get when(){return h.section_study.imported},get children(){var P=nt();return P.$$click=()=>se(),P}})),$})()]},ts=h=>{const t=Oe();t.setVolume(.2);const i=m(()=>h.study),d=m(()=>h.section),o=m(()=>h.chapter),f=m(()=>i().name),C=m(()=>d().name),k=m(()=>o().name),M=m(()=>o().pgn),G=m(()=>M().tree.initial_color);let s=new Vt,w=new Ke;const a=m(()=>(s.mode,Ve.make(M().tree.clone))),v=m(()=>{let r=a().tree;return I(()=>K.make(f(),C(),k(),r,new de))});let E=m(()=>h.stats);const[le,se]=L(!1),$=m(()=>{if(s.mode==="quiz-quiz")return s.i_quiz_quiz===16});let P=m(()=>{let r=E(),n=v(),g=I(()=>r.progress);return r.clone_merge_stats(n).progress-g});const V=m(()=>v().progress_map);let[S,A]=L(!1);const re=r=>{let n=s.mode;if(r==="practice"){if(n===void 0||n==="match"||n==="moves")return" active"}else if(n==="quiz"||n==="quiz-quiz"||n==="quiz-deathmatch")return" active";return""},ne=m(()=>s.mode!==void 0&&!$()&&!s.practice_end_result&&!s.quiz_deathmatch_fail_result),J=m(()=>a().collect_branch_sums(a().cursor_path)),W=m(F(()=>s.quiz_deathmatch_result_path,r=>{var z,R;let n=r.length,g=(R=(z=a().tree)==null?void 0:z.all_leaves.map(q=>q.path).filter(q=>!a().failed_paths.find(O=>O.join("")===q.join(""))).filter(q=>q.join("").startsWith(r.join("")))[0])==null?void 0:R.length;return`${n} out of ${g}`}));b(()=>{if(s.mode==="quiz-quiz"){let r=$();s.quiz_quiz_ls[s.quiz_quiz_ls.length-1]<0&&(se(!0),setTimeout(()=>{se(!1)},500)),r?(t.play("victory"),I(()=>{a().clear_failed_paths(),a()._hidden_paths.clear()})):(A(!0),setTimeout(()=>{y(()=>I(()=>{a().set_random_cursor_hide_rest(),s.match_color=a().cursor_after_color;let g=a().cursor_path;j(g.slice(0,-1)),setTimeout(()=>{a().cursor_path=g,A(!1)},200)}))},100))}}),b(()=>{let{mode:r,match_color:n}=s;r==="quiz-deathmatch"&&n!==G()&&setTimeout(()=>{I(()=>{a().reveal_one_random()})},400)}),b(()=>{a().solved_paths.replace_all(E().solved_paths)}),b(()=>{I(()=>v()).solved_paths.replace_all(a().solved_paths)}),b(F(()=>[E(),v()],(r,n)=>{if(n){let[g,z]=n;g.merge_and_save_stats(z)}})),b(F(()=>w.add_uci,r=>{if(S()||!r)return;a().try_next_uci_fail(r)?(Z(),s.mode==="quiz-quiz"&&s.quiz_pass_one(a().cursor_path)):((s.mode==="match"||s.mode==="moves")&&(A(!0),setTimeout(()=>{a().on_wheel(-1),A(!1)},100)),s.mode==="quiz-quiz"&&(s.quiz_fail_one(a().cursor_path.slice(0,-1)),t.play("error")),s.mode==="quiz-deathmatch"&&(s.quiz_deathmatch_fail_result=-1,s.quiz_deathmatch_result_path=a().cursor_path.slice(0,-1),a()._hidden_paths.clear()))})),b(F(()=>s.quiz_deathmatch_fail_result,r=>{(r>0||r<0)&&t.play("victory")})),b(F(()=>s.practice_end_result,r=>{r&&t.play("victory")})),b(()=>{let{mode:r,match_color:n}=s;r==="match"&&n==="black"&&I(()=>{Z()})}),b(F(()=>a().fen_last_move,r=>{if(r){let[n,g]=r;w.on_set_fen_uci(n,g)}else w.on_set_fen_uci(M().fen??Ze)}));const Z=()=>{let r=()=>a().is_cursor_path_at_a_leaf;r()?s.mode==="quiz-deathmatch"?(s.quiz_deathmatch_fail_result=1,s.quiz_deathmatch_result_path=a().cursor_path):(s.mode==="match"||s.mode==="moves")&&(s.practice_end_result=!0):(s.mode==="match"||s.mode==="quiz-deathmatch")&&(A(!0),setTimeout(()=>{a().reveal_one_random(),r()&&(s.mode==="quiz-deathmatch"?(s.quiz_deathmatch_fail_result=1,s.quiz_deathmatch_result_path=a().cursor_path):(s.mode==="match"||s.mode==="moves")&&(s.practice_end_result=!0)),A(!1)},400))};b(()=>{s.match_color=i().orientation??"white"});let B=!1;b(F(()=>{var r;return(r=a().tree)==null?void 0:r.get_at(a().cursor_path)},r=>{if(r){if(B){B=!1;return}t.move(r)}}));const T=r=>{S()||(s.mode=r)},j=r=>{B=!0,a().cursor_path=r};b(F(()=>w.on_wheel,r=>{r&&a().on_wheel(r)}));const ee=r=>{r.key==="f"&&s.flip_match_color()};Fe(()=>{document.addEventListener("keypress",ee)}),Se(()=>{document.removeEventListener("keypress",ee)});const ae=rt(r=>{const n=r.target;n.tagName!=="PIECE"&&n.tagName!=="SQUARE"&&n.tagName!=="CG-BOARD"||(r.preventDefault(),w.set_on_wheel(Math.sign(r.deltaY)))});return b(()=>{const r=h.el_rep;r&&(r.addEventListener("wheel",ae,{passive:!1}),Se(()=>{r.removeEventListener("wheel",ae)}))}),[(()=>{var r=ht();return u(r,p(Ue,{get orientation(){return s.match_color},get movable(){return ne()},get doPromotion(){return w.promotion},get onMoveAfter(){return w.on_move_after},get fen_uci(){return w.fen_uci},get color(){return w.turnColor},get dests(){return w.dests}})),r})(),(()=>{var r=ut();return u(r,p(te,{get each(){return V()},children:n=>(()=>{var g=Et(),z=g.firstChild,R=z.nextSibling;return g.$$click=q=>a().try_set_cursor_path(n.path),U(q=>{var O=`background: ${n.color}; height: ${n.total*100}%`,H=`height: ${n.white()*100}%`,Q=`height: ${n.black()*100}%`;return q.e=ie(g,O,q.e),q.t=ie(z,H,q.t),q.a=ie(R,Q,q.a),q},{e:void 0,t:void 0,a:void 0}),g})()})),r})(),(()=>{var r=Mt(),n=r.firstChild,g=n.firstChild,z=g.firstChild,R=z.nextSibling,q=n.nextSibling,O=q.firstChild,H=O.nextSibling,Q=H.firstChild,_e=Q.nextSibling,me=H.nextSibling,oe=me.firstChild,ce=oe.nextSibling,he=ce.nextSibling,pe=he.nextSibling,De=me.nextSibling,ve=De.firstChild,ue=ve.firstChild,ge=ue.nextSibling,Ie=ve.nextSibling;return u(z,C),u(R,k),u(O,p(Je,{get lala(){return a()}})),Q.$$click=()=>a().navigate_up(),_e.$$click=()=>a().navigate_down(),u(H,p(te,{get each(){return J()},children:e=>(()=>{var _=Tt();return _.$$click=()=>a().try_set_cursor_path(e.path),u(_,p(Y,{get when(){return e.ply&1},get children(){var c=Pt();return u(c,()=>Ut(e.ply)),c}}),null),u(_,()=>e.san,null),_})()}),null),oe.$$click=()=>a().navigate_first(),ce.$$click=()=>a().navigate_prev(),he.$$click=()=>a().navigate_next(),pe.$$click=()=>a().navigate_last(),ue.$$click=()=>s.end_match_or_moves(),ge.$$click=()=>T("quiz"),u(Ie,p(Ge,{get children(){return[p(X,{get when(){return s.mode==="quiz"},get children(){return[Ce(),dt(),(()=>{var e=mt(),_=e.firstChild,c=_.nextSibling;return _.$$click=()=>T("quiz-quiz"),c.$$click=()=>T("quiz-deathmatch"),e})()]}}),p(X,{get when(){return s.mode==="quiz-deathmatch"},get children(){return[pt(),p(Y,{get when(){return s.quiz_deathmatch_fail_result!==0},get fallback(){return[Rt(),Dt(),(()=>{var e=It(),_=e.firstChild;return _.$$click=()=>{y(()=>{let c=a().cursor_path.slice(0,-1);s.end_deathmatch(),a()._hidden_paths.clear(),j(c)})},e})()]},get children(){return[(()=>{var e=vt();return e.firstChild,u(e,p(Y,{get when(){return s.quiz_deathmatch_fail_result>0},get fallback(){return Re()},get children(){return[" ",Me()]}}),null),e})(),(()=>{var e=gt();return e.firstChild,u(e,W,null),e})(),(()=>{var e=Ee(),_=e.firstChild,c=_.nextSibling;return c.nextSibling,u(e,P,c),e})(),(()=>{var e=ft(),_=e.firstChild,c=_.nextSibling;return _.$$click=()=>s.restart_deathmatch(),c.$$click=()=>{y(()=>{let x=a().cursor_path.slice(0,-1);s.end_deathmatch(),a()._hidden_paths.clear(),j(x)})},e})()]}})]}}),p(X,{get when(){return s.mode==="quiz-quiz"},get children(){return p(Y,{get when(){return $()},get fallback(){return[Lt(),jt(),Qt(),(()=>{var e=Nt(),_=e.firstChild;return u(e,()=>s.i_quiz_quiz,_),U(()=>D(e,le()?"error":"")),e})(),(()=>{var e=Yt(),_=e.firstChild;return _.$$click=()=>{y(()=>{let c=a().cursor_path;s.end_quiz(),a()._hidden_paths.clear(),j(c)})},e})()]},get children(){return[(()=>{var e=$t();return e.firstChild,u(e,p(Y,{get when(){return s.quiz_pass>10},get fallback(){return Re()},get children(){return[" ",Me()]}}),null),e})(),(()=>{var e=zt(),_=e.firstChild,c=_.nextSibling;return c.nextSibling,u(e,()=>s.quiz_pass,c),e})(),(()=>{var e=Ee(),_=e.firstChild,c=_.nextSibling;return c.nextSibling,u(e,P,c),e})(),(()=>{var e=qt();return u(e,p(te,{get each(){return s.quiz_quiz_ls},children:(_,c)=>(()=>{var x=At();return x.$$click=()=>a().cursor_path=s._quiz_quiz_ls_paths[c()],D(x,"move "+(_>0?"success":"error")),u(x,()=>c()+1),x})()})),e})(),(()=>{var e=bt(),_=e.firstChild,c=_.nextSibling;return _.$$click=()=>s.restart_quiz(),c.$$click=()=>{y(()=>{let x=a().cursor_path;s.end_quiz(),a()._hidden_paths.clear(),j(x)})},e})()]}})}}),p(X,{get when(){return s.mode===void 0},get children(){return[Ce(),yt(),(()=>{var e=wt(),_=e.firstChild,c=_.nextSibling;return _.$$click=()=>T("moves"),c.$$click=()=>T("match"),e})()]}}),p(X,{get when(){return s.mode==="match"},get children(){return[kt(),p(Y,{get when(){return s.practice_end_result},get fallback(){return[(()=>{var e=Ot(),_=e.firstChild,c=_.nextSibling;return c.nextSibling,u(e,()=>s.match_color,c),e})(),Ft(),Gt()]},get children(){return[Pe(),Te()]}}),(()=>{var e=St(),_=e.firstChild,c=_.nextSibling;return _.$$click=()=>s.restart_match(),c.$$click=()=>{let x=a().cursor_path;s.end_match_or_moves(),a()._hidden_paths.clear(),j(x)},e})()]}}),p(X,{get when(){return s.mode==="moves"},get children(){return[xt(),p(Y,{get when(){return s.practice_end_result},get fallback(){return[Wt(),Bt()]},get children(){return[Pe(),Te()]}}),(()=>{var e=Ct(),_=e.firstChild,c=_.nextSibling;return _.$$click=()=>{s.restart_moves()},c.$$click=()=>s.end_match_or_moves(),e})()]}})]}})),U(e=>{var _=S()||!a().can_navigate_up,c="fbt prev"+(!S()&&a().can_navigate_up?"":" disabled"),x=S()||!a().can_navigate_down,fe="fbt prev"+(!S()&&a().can_navigate_down?"":" disabled"),$e="fbt first"+(!S()&&a().can_navigate_prev?"":" disabled"),ze="fbt prev"+(!S()&&a().can_navigate_prev?"":" disabled"),qe="fbt next"+(!S()&&a().can_navigate_next?"":" disabled"),be="fbt last"+(!S()&&a().can_navigate_next?"":" disabled"),ye="tab"+re("practice"),we="tab"+re("quiz");return _!==e.e&&(Q.disabled=e.e=_),c!==e.t&&D(Q,e.t=c),x!==e.a&&(_e.disabled=e.a=x),fe!==e.o&&D(_e,e.o=fe),$e!==e.i&&D(oe,e.i=$e),ze!==e.n&&D(ce,e.n=ze),qe!==e.s&&D(he,e.s=qe),be!==e.h&&D(pe,e.h=be),ye!==e.r&&D(ue,e.r=ye),we!==e.d&&D(ge,e.d=we),e},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0,h:void 0,r:void 0,d:void 0}),r})()]};We(["click"]);export{hs as default};