var Zt=Object.defineProperty;var Yt=(s,t,e)=>t in s?Zt(s,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[t]=e;var L=(s,t,e)=>(Yt(s,typeof t!="symbol"?t+"":t,e),e);import{o as Pt,l as Jt}from"./index-DvOnxsF_.js";const tt=["a","b","c","d","e","f","g","h"],Ut=["1","2","3","4","5","6","7","8"],M=["white","black"],E=["pawn","knight","bishop","rook","queen","king"],Xt=["a","h"],V=s=>"role"in s,l=s=>s!==void 0,k=s=>s==="white"?"black":"white",I=s=>s>>3,w=s=>s&7,ct=(s,t)=>0<=s&&s<8&&0<=t&&t<8?s+8*t:void 0,v=s=>{switch(s){case"pawn":return"p";case"knight":return"n";case"bishop":return"b";case"rook":return"r";case"queen":return"q";case"king":return"k"}};function G(s){switch(s.toLowerCase()){case"p":return"pawn";case"n":return"knight";case"b":return"bishop";case"r":return"rook";case"q":return"queen";case"k":return"king";default:return}}function U(s){if(s.length===2)return ct(s.charCodeAt(0)-97,s.charCodeAt(1)-49)}const A=s=>tt[w(s)]+Ut[I(s)],qt=s=>{if(s[1]==="@"&&s.length===4){const t=G(s[0]),e=U(s.slice(2));if(t&&l(e))return{role:t,to:e}}else if(s.length===4||s.length===5){const t=U(s.slice(0,2)),e=U(s.slice(2,4));let n;if(s.length===5&&(n=G(s[4]),!n))return;if(l(t)&&l(e))return{from:t,to:e,promotion:n}}},xt=s=>V(s)?`${v(s.role).toUpperCase()}@${A(s.to)}`:A(s.from)+A(s.to)+(s.promotion?v(s.promotion):""),wt=(s,t)=>s==="white"?t==="a"?2:6:t==="a"?58:62,gt=(s,t)=>s==="white"?t==="a"?3:5:t==="a"?59:61,Bt=s=>(s=s-(s>>>1&1431655765),s=(s&858993459)+(s>>>2&858993459),Math.imul(s+(s>>>4)&252645135,16843009)>>24),lt=s=>(s=s>>>8&16711935|(s&16711935)<<8,s>>>16&65535|(s&65535)<<16),vt=s=>(s=s>>>1&1431655765|(s&1431655765)<<1,s=s>>>2&858993459|(s&858993459)<<2,s=s>>>4&252645135|(s&252645135)<<4,lt(s));class o{constructor(t,e){this.lo=t|0,this.hi=e|0}static fromSquare(t){return t>=32?new o(0,1<<t-32):new o(1<<t,0)}static fromRank(t){return new o(255,0).shl64(8*t)}static fromFile(t){return new o(16843009<<t,16843009<<t)}static empty(){return new o(0,0)}static full(){return new o(4294967295,4294967295)}static corners(){return new o(129,2164260864)}static center(){return new o(402653184,24)}static backranks(){return new o(255,4278190080)}static backrank(t){return t==="white"?new o(255,0):new o(0,4278190080)}static lightSquares(){return new o(1437226410,1437226410)}static darkSquares(){return new o(2857740885,2857740885)}complement(){return new o(~this.lo,~this.hi)}xor(t){return new o(this.lo^t.lo,this.hi^t.hi)}union(t){return new o(this.lo|t.lo,this.hi|t.hi)}intersect(t){return new o(this.lo&t.lo,this.hi&t.hi)}diff(t){return new o(this.lo&~t.lo,this.hi&~t.hi)}intersects(t){return this.intersect(t).nonEmpty()}isDisjoint(t){return this.intersect(t).isEmpty()}supersetOf(t){return t.diff(this).isEmpty()}subsetOf(t){return this.diff(t).isEmpty()}shr64(t){return t>=64?o.empty():t>=32?new o(this.hi>>>t-32,0):t>0?new o(this.lo>>>t^this.hi<<32-t,this.hi>>>t):this}shl64(t){return t>=64?o.empty():t>=32?new o(0,this.lo<<t-32):t>0?new o(this.lo<<t,this.hi<<t^this.lo>>>32-t):this}bswap64(){return new o(lt(this.hi),lt(this.lo))}rbit64(){return new o(vt(this.hi),vt(this.lo))}minus64(t){const e=this.lo-t.lo,n=(e&t.lo&1)+(t.lo>>>1)+(e>>>1)>>>31;return new o(e,this.hi-(t.hi+n))}equals(t){return this.lo===t.lo&&this.hi===t.hi}size(){return Bt(this.lo)+Bt(this.hi)}isEmpty(){return this.lo===0&&this.hi===0}nonEmpty(){return this.lo!==0||this.hi!==0}has(t){return(t>=32?this.hi&1<<t-32:this.lo&1<<t)!==0}set(t,e){return e?this.with(t):this.without(t)}with(t){return t>=32?new o(this.lo,this.hi|1<<t-32):new o(this.lo|1<<t,this.hi)}without(t){return t>=32?new o(this.lo,this.hi&~(1<<t-32)):new o(this.lo&~(1<<t),this.hi)}toggle(t){return t>=32?new o(this.lo,this.hi^1<<t-32):new o(this.lo^1<<t,this.hi)}last(){if(this.hi!==0)return 63-Math.clz32(this.hi);if(this.lo!==0)return 31-Math.clz32(this.lo)}first(){if(this.lo!==0)return 31-Math.clz32(this.lo&-this.lo);if(this.hi!==0)return 63-Math.clz32(this.hi&-this.hi)}withoutFirst(){return this.lo!==0?new o(this.lo&this.lo-1,this.hi):new o(0,this.hi&this.hi-1)}moreThanOne(){return this.hi!==0&&this.lo!==0||(this.lo&this.lo-1)!==0||(this.hi&this.hi-1)!==0}singleSquare(){return this.moreThanOne()?void 0:this.last()}*[Symbol.iterator](){let t=this.lo,e=this.hi;for(;t!==0;){const n=31-Math.clz32(t&-t);t^=1<<n,yield n}for(;e!==0;){const n=31-Math.clz32(e&-e);e^=1<<n,yield 32+n}}*reversed(){let t=this.lo,e=this.hi;for(;e!==0;){const n=31-Math.clz32(e);e^=1<<n,yield 32+n}for(;t!==0;){const n=31-Math.clz32(t);t^=1<<n,yield n}}}const et=(s,t)=>{let e=o.empty();for(const n of t){const i=s+n;0<=i&&i<64&&Math.abs(w(s)-w(i))<=2&&(e=e.with(i))}return e},O=s=>{const t=[];for(let e=0;e<64;e++)t[e]=s(e);return t},te=O(s=>et(s,[-9,-8,-7,-1,1,7,8,9])),ee=O(s=>et(s,[-17,-15,-10,-6,6,10,15,17])),se={white:O(s=>et(s,[7,9])),black:O(s=>et(s,[-7,-9]))},nt=s=>te[s],it=s=>ee[s],J=(s,t)=>se[s][t],ut=O(s=>o.fromFile(w(s)).without(s)),ft=O(s=>o.fromRank(I(s)).without(s)),dt=O(s=>{const t=new o(134480385,2151686160),e=8*(I(s)-w(s));return(e>=0?t.shl64(e):t.shr64(-e)).without(s)}),pt=O(s=>{const t=new o(270549120,16909320),e=8*(I(s)+w(s)-7);return(e>=0?t.shl64(e):t.shr64(-e)).without(s)}),kt=(s,t,e)=>{let n=e.intersect(t),i=n.bswap64();return n=n.minus64(s),i=i.minus64(s.bswap64()),n.xor(i.bswap64()).intersect(t)},ne=(s,t)=>kt(o.fromSquare(s),ut[s],t),ie=(s,t)=>{const e=ft[s];let n=t.intersect(e),i=n.rbit64();return n=n.minus64(o.fromSquare(s)),i=i.minus64(o.fromSquare(63-s)),n.xor(i.rbit64()).intersect(e)},W=(s,t)=>{const e=o.fromSquare(s);return kt(e,dt[s],t).xor(kt(e,pt[s],t))},$=(s,t)=>ne(s,t).xor(ie(s,t)),bt=(s,t)=>W(s,t).xor($(s,t)),re=(s,t,e)=>{switch(s.role){case"pawn":return J(s.color,t);case"knight":return it(t);case"bishop":return W(t,e);case"rook":return $(t,e);case"queen":return bt(t,e);case"king":return nt(t)}},Qt=(s,t)=>{const e=o.fromSquare(t);return ft[s].intersects(e)?ft[s].with(s):pt[s].intersects(e)?pt[s].with(s):dt[s].intersects(e)?dt[s].with(s):ut[s].intersects(e)?ut[s].with(s):o.empty()},Z=(s,t)=>Qt(s,t).intersect(o.full().shl64(s).xor(o.full().shl64(t))).withoutFirst();class Q{constructor(){}static default(){const t=new Q;return t.reset(),t}reset(){this.occupied=new o(65535,4294901760),this.promoted=o.empty(),this.white=new o(65535,0),this.black=new o(0,4294901760),this.pawn=new o(65280,16711680),this.knight=new o(66,1107296256),this.bishop=new o(36,603979776),this.rook=new o(129,2164260864),this.queen=new o(8,134217728),this.king=new o(16,268435456)}static empty(){const t=new Q;return t.clear(),t}clear(){this.occupied=o.empty(),this.promoted=o.empty();for(const t of M)this[t]=o.empty();for(const t of E)this[t]=o.empty()}clone(){const t=new Q;t.occupied=this.occupied,t.promoted=this.promoted;for(const e of M)t[e]=this[e];for(const e of E)t[e]=this[e];return t}getColor(t){if(this.white.has(t))return"white";if(this.black.has(t))return"black"}getRole(t){for(const e of E)if(this[e].has(t))return e}get(t){const e=this.getColor(t);if(!e)return;const n=this.getRole(t),i=this.promoted.has(t);return{color:e,role:n,promoted:i}}take(t){const e=this.get(t);return e&&(this.occupied=this.occupied.without(t),this[e.color]=this[e.color].without(t),this[e.role]=this[e.role].without(t),e.promoted&&(this.promoted=this.promoted.without(t))),e}set(t,e){const n=this.take(t);return this.occupied=this.occupied.with(t),this[e.color]=this[e.color].with(t),this[e.role]=this[e.role].with(t),e.promoted&&(this.promoted=this.promoted.with(t)),n}has(t){return this.occupied.has(t)}*[Symbol.iterator](){for(const t of this.occupied)yield[t,this.get(t)]}pieces(t,e){return this[t].intersect(this[e])}rooksAndQueens(){return this.rook.union(this.queen)}bishopsAndQueens(){return this.bishop.union(this.queen)}kingOf(t){return this.pieces(t,"king").singleSquare()}}class C{constructor(){}static empty(){const t=new C;for(const e of E)t[e]=0;return t}static fromBoard(t,e){const n=new C;for(const i of E)n[i]=t.pieces(e,i).size();return n}clone(){const t=new C;for(const e of E)t[e]=this[e];return t}equals(t){return E.every(e=>this[e]===t[e])}add(t){const e=new C;for(const n of E)e[n]=this[n]+t[n];return e}subtract(t){const e=new C;for(const n of E)e[n]=this[n]-t[n];return e}nonEmpty(){return E.some(t=>this[t]>0)}isEmpty(){return!this.nonEmpty()}hasPawns(){return this.pawn>0}hasNonPawns(){return this.knight>0||this.bishop>0||this.rook>0||this.queen>0||this.king>0}size(){return this.pawn+this.knight+this.bishop+this.rook+this.queen+this.king}}class P{constructor(t,e){this.white=t,this.black=e}static empty(){return new P(C.empty(),C.empty())}static fromBoard(t){return new P(C.fromBoard(t,"white"),C.fromBoard(t,"black"))}clone(){return new P(this.white.clone(),this.black.clone())}equals(t){return this.white.equals(t.white)&&this.black.equals(t.black)}add(t){return new P(this.white.add(t.white),this.black.add(t.black))}subtract(t){return new P(this.white.subtract(t.white),this.black.subtract(t.black))}count(t){return this.white[t]+this.black[t]}size(){return this.white.size()+this.black.size()}isEmpty(){return this.white.isEmpty()&&this.black.isEmpty()}nonEmpty(){return!this.isEmpty()}hasPawns(){return this.white.hasPawns()||this.black.hasPawns()}hasNonPawns(){return this.white.hasNonPawns()||this.black.hasNonPawns()}}class Y{constructor(t,e){this.white=t,this.black=e}static default(){return new Y(3,3)}clone(){return new Y(this.white,this.black)}equals(t){return this.white===t.white&&this.black===t.black}}class St{unwrap(t,e){const n=this._chain(i=>u.ok(t?t(i):i),i=>e?u.ok(e(i)):u.err(i));if(n.isErr)throw n.error;return n.value}map(t,e){return this._chain(n=>u.ok(t(n)),n=>u.err(e?e(n):n))}chain(t,e){return this._chain(t,e||(n=>u.err(n)))}}class oe extends St{constructor(t){super(),this.value=void 0,this.isOk=!0,this.isErr=!1,this.value=t}_chain(t,e){return t(this.value)}}class he extends St{constructor(t){super(),this.error=void 0,this.isOk=!1,this.isErr=!0,this.error=t}_chain(t,e){return e(this.error)}}var u;(function(s){s.ok=function(t){return new oe(t)},s.err=function(t){return new he(t||new Error)},s.all=function(t){if(Array.isArray(t)){const i=[];for(let r=0;r<t.length;r++){const h=t[r];if(h.isErr)return h;i.push(h.value)}return s.ok(i)}const e={},n=Object.keys(t);for(let i=0;i<n.length;i++){const r=t[n[i]];if(r.isErr)return r;e[n[i]]=r.value}return s.ok(e)}})(u||(u={}));var _;(function(s){s.Empty="ERR_EMPTY",s.OppositeCheck="ERR_OPPOSITE_CHECK",s.PawnsOnBackrank="ERR_PAWNS_ON_BACKRANK",s.Kings="ERR_KINGS",s.Variant="ERR_VARIANT"})(_||(_={}));class F extends Error{}const ae=(s,t,e,n)=>e[t].intersect($(s,n).intersect(e.rooksAndQueens()).union(W(s,n).intersect(e.bishopsAndQueens())).union(it(s).intersect(e.knight)).union(nt(s).intersect(e.king)).union(J(k(t),s).intersect(e.pawn)));class B{constructor(){}static default(){const t=new B;return t.castlingRights=o.corners(),t.rook={white:{a:0,h:7},black:{a:56,h:63}},t.path={white:{a:new o(14,0),h:new o(96,0)},black:{a:new o(0,234881024),h:new o(0,1610612736)}},t}static empty(){const t=new B;return t.castlingRights=o.empty(),t.rook={white:{a:void 0,h:void 0},black:{a:void 0,h:void 0}},t.path={white:{a:o.empty(),h:o.empty()},black:{a:o.empty(),h:o.empty()}},t}clone(){const t=new B;return t.castlingRights=this.castlingRights,t.rook={white:{a:this.rook.white.a,h:this.rook.white.h},black:{a:this.rook.black.a,h:this.rook.black.h}},t.path={white:{a:this.path.white.a,h:this.path.white.h},black:{a:this.path.black.a,h:this.path.black.h}},t}add(t,e,n,i){const r=wt(t,e),h=gt(t,e);this.castlingRights=this.castlingRights.with(i),this.rook[t][e]=i,this.path[t][e]=Z(i,h).with(h).union(Z(n,r).with(r)).without(n).without(i)}static fromSetup(t){const e=B.empty(),n=t.castlingRights.intersect(t.board.rook);for(const i of M){const r=o.backrank(i),h=t.board.kingOf(i);if(!l(h)||!r.has(h))continue;const a=n.intersect(t.board[i]).intersect(r),c=a.first();l(c)&&c<h&&e.add(i,"a",h,c);const f=a.last();l(f)&&h<f&&e.add(i,"h",h,f)}return e}discardRook(t){if(this.castlingRights.has(t)){this.castlingRights=this.castlingRights.without(t);for(const e of M)for(const n of Xt)this.rook[e][n]===t&&(this.rook[e][n]=void 0)}}discardColor(t){this.castlingRights=this.castlingRights.diff(o.backrank(t)),this.rook[t].a=void 0,this.rook[t].h=void 0}}class ce{constructor(t){this.rules=t}reset(){this.board=Q.default(),this.pockets=void 0,this.turn="white",this.castles=B.default(),this.epSquare=void 0,this.remainingChecks=void 0,this.halfmoves=0,this.fullmoves=1}setupUnchecked(t){this.board=t.board.clone(),this.board.promoted=o.empty(),this.pockets=void 0,this.turn=t.turn,this.castles=B.fromSetup(t),this.epSquare=le(this,t.epSquare),this.remainingChecks=void 0,this.halfmoves=t.halfmoves,this.fullmoves=t.fullmoves}kingAttackers(t,e,n){return ae(t,e,this.board,n)}playCaptureAt(t,e){this.halfmoves=0,e.role==="rook"&&this.castles.discardRook(t),this.pockets&&this.pockets[k(e.color)][e.promoted?"pawn":e.role]++}ctx(){const t=this.isVariantEnd(),e=this.board.kingOf(this.turn);if(!l(e))return{king:e,blockers:o.empty(),checkers:o.empty(),variantEnd:t,mustCapture:!1};const n=$(e,o.empty()).intersect(this.board.rooksAndQueens()).union(W(e,o.empty()).intersect(this.board.bishopsAndQueens())).intersect(this.board[k(this.turn)]);let i=o.empty();for(const h of n){const a=Z(e,h).intersect(this.board.occupied);a.moreThanOne()||(i=i.union(a))}const r=this.kingAttackers(e,k(this.turn),this.board.occupied);return{king:e,blockers:i,checkers:r,variantEnd:t,mustCapture:!1}}clone(){var t,e;const n=new this.constructor;return n.board=this.board.clone(),n.pockets=(t=this.pockets)===null||t===void 0?void 0:t.clone(),n.turn=this.turn,n.castles=this.castles.clone(),n.epSquare=this.epSquare,n.remainingChecks=(e=this.remainingChecks)===null||e===void 0?void 0:e.clone(),n.halfmoves=this.halfmoves,n.fullmoves=this.fullmoves,n}validate(){if(this.board.occupied.isEmpty())return u.err(new F(_.Empty));if(this.board.king.size()!==2)return u.err(new F(_.Kings));if(!l(this.board.kingOf(this.turn)))return u.err(new F(_.Kings));const t=this.board.kingOf(k(this.turn));return l(t)?this.kingAttackers(t,this.turn,this.board.occupied).nonEmpty()?u.err(new F(_.OppositeCheck)):o.backranks().intersects(this.board.pawn)?u.err(new F(_.PawnsOnBackrank)):u.ok(void 0):u.err(new F(_.Kings))}dropDests(t){return o.empty()}dests(t,e){if(e=e||this.ctx(),e.variantEnd)return o.empty();const n=this.board.get(t);if(!n||n.color!==this.turn)return o.empty();let i,r;if(n.role==="pawn"){i=J(this.turn,t).intersect(this.board[k(this.turn)]);const h=this.turn==="white"?8:-8,a=t+h;if(0<=a&&a<64&&!this.board.occupied.has(a)){i=i.with(a);const c=this.turn==="white"?t<16:t>=48,f=a+h;c&&!this.board.occupied.has(f)&&(i=i.with(f))}l(this.epSquare)&&fe(this,t,e)&&(r=o.fromSquare(this.epSquare))}else n.role==="bishop"?i=W(t,this.board.occupied):n.role==="knight"?i=it(t):n.role==="rook"?i=$(t,this.board.occupied):n.role==="queen"?i=bt(t,this.board.occupied):i=nt(t);if(i=i.diff(this.board[this.turn]),l(e.king)){if(n.role==="king"){const h=this.board.occupied.without(t);for(const a of i)this.kingAttackers(a,k(this.turn),h).nonEmpty()&&(i=i.without(a));return i.union(Mt(this,"a",e)).union(Mt(this,"h",e))}if(e.checkers.nonEmpty()){const h=e.checkers.singleSquare();if(!l(h))return o.empty();i=i.intersect(Z(h,e.king).with(h))}e.blockers.has(t)&&(i=i.intersect(Qt(t,e.king)))}return r&&(i=i.union(r)),i}isVariantEnd(){return!1}variantOutcome(t){}hasInsufficientMaterial(t){return this.board[t].intersect(this.board.pawn.union(this.board.rooksAndQueens())).nonEmpty()?!1:this.board[t].intersects(this.board.knight)?this.board[t].size()<=2&&this.board[k(t)].diff(this.board.king).diff(this.board.queen).isEmpty():this.board[t].intersects(this.board.bishop)?(!this.board.bishop.intersects(o.darkSquares())||!this.board.bishop.intersects(o.lightSquares()))&&this.board.pawn.isEmpty()&&this.board.knight.isEmpty():!0}toSetup(){var t,e;return{board:this.board.clone(),pockets:(t=this.pockets)===null||t===void 0?void 0:t.clone(),turn:this.turn,castlingRights:this.castles.castlingRights,epSquare:ue(this),remainingChecks:(e=this.remainingChecks)===null||e===void 0?void 0:e.clone(),halfmoves:Math.min(this.halfmoves,150),fullmoves:Math.min(Math.max(this.fullmoves,1),9999)}}isInsufficientMaterial(){return M.every(t=>this.hasInsufficientMaterial(t))}hasDests(t){t=t||this.ctx();for(const e of this.board[this.turn])if(this.dests(e,t).nonEmpty())return!0;return this.dropDests(t).nonEmpty()}isLegal(t,e){if(V(t))return!this.pockets||this.pockets[this.turn][t.role]<=0||t.role==="pawn"&&o.backranks().has(t.to)?!1:this.dropDests(e).has(t.to);{if(t.promotion==="pawn"||t.promotion==="king"&&this.rules!=="antichess"||!!t.promotion!==(this.board.pawn.has(t.from)&&o.backranks().has(t.to)))return!1;const n=this.dests(t.from,e);return n.has(t.to)||n.has(de(this,t).to)}}isCheck(){const t=this.board.kingOf(this.turn);return l(t)&&this.kingAttackers(t,k(this.turn),this.board.occupied).nonEmpty()}isEnd(t){return(t?t.variantEnd:this.isVariantEnd())?!0:this.isInsufficientMaterial()||!this.hasDests(t)}isCheckmate(t){return t=t||this.ctx(),!t.variantEnd&&t.checkers.nonEmpty()&&!this.hasDests(t)}isStalemate(t){return t=t||this.ctx(),!t.variantEnd&&t.checkers.isEmpty()&&!this.hasDests(t)}outcome(t){const e=this.variantOutcome(t);return e||(t=t||this.ctx(),this.isCheckmate(t)?{winner:k(this.turn)}:this.isInsufficientMaterial()||this.isStalemate(t)?{winner:void 0}:void 0)}allDests(t){t=t||this.ctx();const e=new Map;if(t.variantEnd)return e;for(const n of this.board[this.turn])e.set(n,this.dests(n,t));return e}play(t){const e=this.turn,n=this.epSquare,i=Wt(this,t);if(this.epSquare=void 0,this.halfmoves+=1,e==="black"&&(this.fullmoves+=1),this.turn=k(e),V(t))this.board.set(t.to,{role:t.role,color:e}),this.pockets&&this.pockets[e][t.role]--,t.role==="pawn"&&(this.halfmoves=0);else{const r=this.board.take(t.from);if(!r)return;let h;if(r.role==="pawn"){this.halfmoves=0,t.to===n&&(h=this.board.take(t.to+(e==="white"?-8:8)));const a=t.from-t.to;Math.abs(a)===16&&8<=t.from&&t.from<=55&&(this.epSquare=t.from+t.to>>1),t.promotion&&(r.role=t.promotion,r.promoted=!!this.pockets)}else if(r.role==="rook")this.castles.discardRook(t.from);else if(r.role==="king"){if(i){const a=this.castles.rook[e][i];if(l(a)){const c=this.board.take(a);this.board.set(wt(e,i),r),c&&this.board.set(gt(e,i),c)}}this.castles.discardColor(e)}if(!i){const a=this.board.set(t.to,r)||h;a&&this.playCaptureAt(t.to,a)}}this.remainingChecks&&this.isCheck()&&(this.remainingChecks[e]=Math.max(this.remainingChecks[e]-1,0))}}class yt extends ce{constructor(){super("chess")}static default(){const t=new this;return t.reset(),t}static fromSetup(t){const e=new this;return e.setupUnchecked(t),e.validate().map(n=>e)}clone(){return super.clone()}}const le=(s,t)=>{if(!l(t))return;const e=s.turn==="white"?5:2,n=s.turn==="white"?8:-8;if(I(t)!==e||s.board.occupied.has(t+n))return;const i=t-n;if(!(!s.board.pawn.has(i)||!s.board[k(s.turn)].has(i)))return t},ue=s=>{if(!l(s.epSquare))return;const t=s.ctx(),n=s.board.pieces(s.turn,"pawn").intersect(J(k(s.turn),s.epSquare));for(const i of n)if(s.dests(i,t).has(s.epSquare))return s.epSquare},fe=(s,t,e)=>{if(!l(s.epSquare)||!J(s.turn,t).has(s.epSquare))return!1;if(!l(e.king))return!0;const n=s.turn==="white"?8:-8,i=s.epSquare-n;return s.kingAttackers(e.king,k(s.turn),s.board.occupied.toggle(t).toggle(i).with(s.epSquare)).without(i).isEmpty()},Mt=(s,t,e)=>{if(!l(e.king)||e.checkers.nonEmpty())return o.empty();const n=s.castles.rook[s.turn][t];if(!l(n)||s.castles.path[s.turn][t].intersects(s.board.occupied))return o.empty();const i=wt(s.turn,t),r=Z(e.king,i),h=s.board.occupied.without(e.king);for(const f of r)if(s.kingAttackers(f,k(s.turn),h).nonEmpty())return o.empty();const a=gt(s.turn,t),c=s.board.occupied.toggle(e.king).toggle(n).toggle(a);return s.kingAttackers(i,k(s.turn),c).nonEmpty()?o.empty():o.fromSquare(n)},Wt=(s,t)=>{if(V(t))return;const e=t.to-t.from;if(!(Math.abs(e)!==2&&!s.board[s.turn].has(t.to))&&s.board.king.has(t.from))return e>0?"h":"a"},de=(s,t)=>{const e=Wt(s,t);if(!e)return t;const n=s.castles.rook[s.turn][e];return{from:t.from,to:l(n)?n:t.to}},pe=(s,t)=>{const e=new Map,n=s.ctx();for(const[i,r]of s.allDests(n))if(r.nonEmpty()){const h=Array.from(r,A);i===n.king&&w(i)===4&&(r.has(0)?h.push("c1"):r.has(56)&&h.push("c8"),r.has(7)?h.push("g1"):r.has(63)&&h.push("g8")),e.set(A(i),h)}return e},ke="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",me=ke+" w KQkq -",we=me+" 0 1";var d;(function(s){s.Fen="ERR_FEN",s.Board="ERR_BOARD",s.Pockets="ERR_POCKETS",s.Turn="ERR_TURN",s.Castling="ERR_CASTLING",s.EpSquare="ERR_EP_SQUARE",s.RemainingChecks="ERR_REMAINING_CHECKS",s.Halfmoves="ERR_HALFMOVES",s.Fullmoves="ERR_FULLMOVES"})(d||(d={}));class m extends Error{}const ge=(s,t,e)=>{let n=s.indexOf(t);for(;e-- >0&&n!==-1;)n=s.indexOf(t,n+t.length);return n},D=s=>/^\d{1,4}$/.test(s)?parseInt(s,10):void 0,$t=s=>{const t=G(s);return t&&{role:t,color:s.toLowerCase()===s?"black":"white"}},ot=s=>{const t=Q.empty();let e=7,n=0;for(let i=0;i<s.length;i++){const r=s[i];if(r==="/"&&n===8)n=0,e--;else{const h=parseInt(r,10);if(h>0)n+=h;else{if(n>=8||e<0)return u.err(new m(d.Board));const a=n+e*8,c=$t(r);if(!c)return u.err(new m(d.Board));s[i+1]==="~"&&(c.promoted=!0,i++),t.set(a,c),n++}}}return e!==0||n!==8?u.err(new m(d.Board)):u.ok(t)},It=s=>{if(s.length>64)return u.err(new m(d.Pockets));const t=P.empty();for(const e of s){const n=$t(e);if(!n)return u.err(new m(d.Pockets));t[n.color][n.role]++}return u.ok(t)},be=(s,t)=>{let e=o.empty();if(t==="-")return u.ok(e);for(const n of t){const i=n.toLowerCase(),r=n===i?"black":"white",h=r==="white"?0:7;if("a"<=i&&i<="h")e=e.with(ct(i.charCodeAt(0)-97,h));else if(i==="k"||i==="q"){const a=s[r].intersect(o.backrank(r)).intersect(s.rook.union(s.king)),c=i==="k"?a.last():a.first();e=e.with(l(c)&&s.rook.has(c)?c:ct(i==="k"?7:0,h))}else return u.err(new m(d.Castling))}return M.some(n=>o.backrank(n).intersect(e).size()>2)?u.err(new m(d.Castling)):u.ok(e)},Tt=s=>{const t=s.split("+");if(t.length===3&&t[0]===""){const e=D(t[1]),n=D(t[2]);return!l(e)||e>3||!l(n)||n>3?u.err(new m(d.RemainingChecks)):u.ok(new Y(3-e,3-n))}else if(t.length===2){const e=D(t[0]),n=D(t[1]);return!l(e)||e>3||!l(n)||n>3?u.err(new m(d.RemainingChecks)):u.ok(new Y(e,n))}else return u.err(new m(d.RemainingChecks))},rt=s=>{const t=s.split(/[\s_]+/),e=t.shift();let n,i=u.ok(void 0);if(e.endsWith("]")){const a=e.indexOf("[");if(a===-1)return u.err(new m(d.Fen));n=ot(e.slice(0,a)),i=It(e.slice(a+1,-1))}else{const a=ge(e,"/",7);a===-1?n=ot(e):(n=ot(e.slice(0,a)),i=It(e.slice(a+1)))}let r;const h=t.shift();if(!l(h)||h==="w")r="white";else if(h==="b")r="black";else return u.err(new m(d.Turn));return n.chain(a=>{const c=t.shift(),f=l(c)?be(a,c):u.ok(o.empty()),p=t.shift();let b;if(l(p)&&p!=="-"&&(b=U(p),!l(b)))return u.err(new m(d.EpSquare));let g=t.shift(),y;l(g)&&g.includes("+")&&(y=Tt(g),g=t.shift());const R=l(g)?D(g):0;if(!l(R))return u.err(new m(d.Halfmoves));const T=t.shift(),z=l(T)?D(T):1;if(!l(z))return u.err(new m(d.Fullmoves));const N=t.shift();let K=u.ok(void 0);if(l(N)){if(l(y))return u.err(new m(d.RemainingChecks));K=Tt(N)}else l(y)&&(K=y);return t.length>0?u.err(new m(d.Fen)):i.chain(Ct=>f.chain(X=>K.map(q=>({board:a,pockets:Ct,turn:r,castlingRights:X,remainingChecks:q,epSquare:b,halfmoves:R,fullmoves:Math.max(1,z)}))))})},ye=s=>{let t=v(s.role);return s.color==="white"&&(t=t.toUpperCase()),s.promoted&&(t+="~"),t},Ee=s=>{let t="",e=0;for(let n=7;n>=0;n--)for(let i=0;i<8;i++){const r=i+n*8,h=s.get(r);h?(e>0&&(t+=e,e=0),t+=ye(h)):e++,i===7&&(e>0&&(t+=e,e=0),n!==0&&(t+="/"))}return t},zt=s=>E.map(t=>v(t).repeat(s[t])).join(""),Ce=s=>zt(s.white).toUpperCase()+zt(s.black),Re=(s,t)=>{let e="";for(const n of M){const i=o.backrank(n);let r=s.kingOf(n);l(r)&&!i.has(r)&&(r=void 0);const h=s.pieces(n,"rook").intersect(i);for(const a of t.intersect(i).reversed())if(a===h.first()&&l(r)&&a<r)e+=n==="white"?"Q":"q";else if(a===h.last()&&l(r)&&r<a)e+=n==="white"?"K":"k";else{const c=tt[w(a)];e+=n==="white"?c.toUpperCase():c}}return e||"-"},_e=s=>`${s.white}+${s.black}`,Ae=(s,t)=>[Ee(s.board)+(s.pockets?`[${Ce(s.pockets)}]`:""),s.turn[0],Re(s.board,s.castlingRights),l(s.epSquare)?A(s.epSquare):"-",...s.remainingChecks?[_e(s.remainingChecks)]:[],Math.max(0,Math.min(s.halfmoves,9999)),Math.max(1,Math.min(s.fullmoves,9999))].join(" "),Oe=(s,t)=>{let e="";if(V(t))t.role!=="pawn"&&(e=v(t.role).toUpperCase()),e+="@"+A(t.to);else{const n=s.board.getRole(t.from);if(!n)return"--";if(n==="king"&&(s.board[s.turn].has(t.to)||Math.abs(t.to-t.from)===2))e=t.to>t.from?"O-O":"O-O-O";else{const i=s.board.occupied.has(t.to)||n==="pawn"&&w(t.from)!==w(t.to);if(n!=="pawn"){e=v(n).toUpperCase();let r;if(n==="king"?r=nt(t.to).intersect(s.board.king):n==="queen"?r=bt(t.to,s.board.occupied).intersect(s.board.queen):n==="rook"?r=$(t.to,s.board.occupied).intersect(s.board.rook):n==="bishop"?r=W(t.to,s.board.occupied).intersect(s.board.bishop):r=it(t.to).intersect(s.board.knight),r=r.intersect(s.board[s.turn]).without(t.from),r.nonEmpty()){const h=s.ctx();for(const a of r)s.dests(a,h).has(t.to)||(r=r.without(a));if(r.nonEmpty()){let a=!1,c=r.intersects(o.fromRank(I(t.from)));r.intersects(o.fromFile(w(t.from)))?a=!0:c=!0,c&&(e+=tt[w(t.from)]),a&&(e+=Ut[I(t.from)])}}}else i&&(e=tt[w(t.from)]);i&&(e+="x"),e+=A(t.to),t.promotion&&(e+="="+v(t.promotion).toUpperCase())}}return e},Ne=(s,t)=>{var e;const n=Oe(s,t);return s.play(t),!((e=s.outcome())===null||e===void 0)&&e.winner?n+"#":s.isCheck()?n+"+":n},Pe=(s,t)=>Ne(s.clone(),t),Kt=(s,t)=>{const e=s.ctx(),n=t.match(/^([NBRQK])?([a-h])?([1-8])?[-x]?([a-h][1-8])(?:=?([nbrqkNBRQK]))?[+#]?$/);if(!n){let p;if(t==="O-O"||t==="O-O+"||t==="O-O#"?p="h":(t==="O-O-O"||t==="O-O-O+"||t==="O-O-O#")&&(p="a"),p){const y=s.castles.rook[s.turn][p];return!l(e.king)||!l(y)||!s.dests(e.king,e).has(y)?void 0:{from:e.king,to:y}}const b=t.match(/^([pnbrqkPNBRQK])?@([a-h][1-8])[+#]?$/);if(!b)return;const g={role:b[1]?G(b[1]):"pawn",to:U(b[2])};return s.isLegal(g,e)?g:void 0}const i=n[1]?G(n[1]):"pawn",r=U(n[4]),h=n[5]?G(n[5]):void 0;if(!!h!==(i==="pawn"&&o.backranks().has(r))||h==="king"&&s.rules!=="antichess")return;let a=s.board.pieces(s.turn,i);i==="pawn"&&!n[2]?a=a.intersect(o.fromFile(w(r))):n[2]&&(a=a.intersect(o.fromFile(n[2].charCodeAt(0)-97))),n[3]&&(a=a.intersect(o.fromRank(n[3].charCodeAt(0)-49)));const c=i==="pawn"?o.fromFile(w(r)):o.empty();a=a.intersect(c.union(re({color:k(s.turn),role:i},r,s.board.occupied)));let f;for(const p of a)if(s.dests(p,e).has(r)){if(l(f))return;f=p}if(l(f))return{from:f,to:r,promotion:h}},xe=(s=Et)=>({headers:s(),moves:new jt});class jt{constructor(){this.children=[]}*mainlineNodes(){let t=this;for(;t.children.length;){const e=t.children[0];yield e,t=e}}*mainline(){for(const t of this.mainlineNodes())yield t.data}end(){let t=this;for(;t.children.length;)t=t.children[0];return t}}class Be extends jt{constructor(t){super(),this.data=t}}const Et=()=>new Map([["Event","?"],["Site","?"],["Date","????.??.??"],["Round","?"],["White","?"],["Black","?"],["Result","*"]]),Lt="\uFEFF",ht=s=>/^\s*$/.test(s),at=s=>s.startsWith("%");class ve extends Error{}class Me{constructor(t,e=Et,n=1e6){this.emitGame=t,this.initHeaders=e,this.maxBudget=n,this.lineBuf=[],this.resetGame(),this.state=0}resetGame(){this.budget=this.maxBudget,this.found=!1,this.state=1,this.game=xe(this.initHeaders),this.stack=[{parent:this.game.moves,root:!0}],this.commentBuf=[]}consumeBudget(t){if(this.budget-=t,this.budget<0)throw new ve("ERR_PGN_BUDGET")}parse(t,e){if(!(this.budget<0))try{let n=0;for(;;){const i=t.indexOf(`
`,n);if(i===-1)break;const r=i>n&&t[i-1]==="\r"?i-1:i;this.consumeBudget(i-n),this.lineBuf.push(t.slice(n,r)),n=i+1,this.handleLine()}this.consumeBudget(t.length-n),this.lineBuf.push(t.slice(n)),e!=null&&e.stream||(this.handleLine(),this.emit(void 0))}catch(n){this.emit(n)}}handleLine(){let t=!0,e=this.lineBuf.join("");this.lineBuf=[];t:for(;;)switch(this.state){case 0:e.startsWith(Lt)&&(e=e.slice(Lt.length)),this.state=1;case 1:if(ht(e)||at(e))return;this.found=!0,this.state=2;case 2:{if(at(e))return;let n=!0;for(;n;)n=!1,e=e.replace(/^\s*\[([A-Za-z0-9][A-Za-z0-9_+#=:-]*)\s+"((?:[^"\\]|\\"|\\\\)*)"\]/,(i,r,h)=>(this.consumeBudget(200),this.game.headers.set(r,h.replace(/\\"/g,'"').replace(/\\\\/g,"\\")),n=!0,t=!1,""));if(ht(e))return;this.state=3}case 3:{if(t){if(at(e))return;if(ht(e))return this.emit(void 0)}const n=/(?:[NBKRQ]?[a-h]?[1-8]?[-x]?[a-h][1-8](?:=?[nbrqkNBRQK])?|[pnbrqkPNBRQK]?@[a-h][1-8]|O-O-O|0-0-0|O-O|0-0)[+#]?|--|Z0|0000|@@@@|{|;|\$\d{1,4}|[?!]{1,2}|\(|\)|\*|1-0|0-1|1\/2-1\/2/g;let i;for(;i=n.exec(e);){const r=this.stack[this.stack.length-1];let h=i[0];if(h===";")return;if(h.startsWith("$"))this.handleNag(parseInt(h.slice(1),10));else if(h==="!")this.handleNag(1);else if(h==="?")this.handleNag(2);else if(h==="!!")this.handleNag(3);else if(h==="??")this.handleNag(4);else if(h==="!?")this.handleNag(5);else if(h==="?!")this.handleNag(6);else if(h==="1-0"||h==="0-1"||h==="1/2-1/2"||h==="*")this.stack.length===1&&h!=="*"&&this.game.headers.set("Result",h);else if(h==="(")this.consumeBudget(100),this.stack.push({parent:r.parent,root:!1});else if(h===")")this.stack.length>1&&this.stack.pop();else if(h==="{"){const a=n.lastIndex,c=e[a]===" "?a+1:a;e=e.slice(c),this.state=4;continue t}else this.consumeBudget(100),h==="Z0"||h==="0000"||h==="@@@@"?h="--":h.startsWith("0")&&(h=h.replace(/0/g,"O")),r.node&&(r.parent=r.node),r.node=new Be({san:h,startingComments:r.startingComments}),r.startingComments=void 0,r.root=!1,r.parent.children.push(r.node)}return}case 4:{const n=e.indexOf("}");if(n===-1){this.commentBuf.push(e);return}else{const i=n>0&&e[n-1]===" "?n-1:n;this.commentBuf.push(e.slice(0,i)),this.handleComment(),e=e.slice(n),this.state=3,t=!1}}}}handleNag(t){var e;this.consumeBudget(50);const n=this.stack[this.stack.length-1];n.node&&((e=n.node.data).nags||(e.nags=[]),n.node.data.nags.push(t))}handleComment(){var t,e;this.consumeBudget(100);const n=this.stack[this.stack.length-1],i=this.commentBuf.join(`
`);this.commentBuf=[],n.node?((t=n.node.data).comments||(t.comments=[]),n.node.data.comments.push(i)):n.root?((e=this.game).comments||(e.comments=[]),this.game.comments.push(i)):(n.startingComments||(n.startingComments=[]),n.startingComments.push(i))}emit(t){if(this.state===4&&this.handleComment(),t)return this.emitGame(this.game,t);this.found&&this.emitGame(this.game,void 0),this.resetGame()}}const Ie=(s,t=Et)=>{const e=[];return new Me(n=>e.push(n),t,NaN).parse(s),e},Te=(s,t)=>s==="white"?t:-t,Ht=s=>2/(1+Math.exp(-.00368208*s))-1,ze=s=>Ht(Math.min(Math.max(-1e3,s),1e3)),Ke=s=>{const e=(21-Math.min(10,Math.abs(s)))*100*(s>0?1:-1);return Ht(e)},Le=s=>typeof s.mate<"u"?Ke(s.mate):ze(s.cp),Ft=(s,t)=>Te(s,Le(t)),Fe=(s,t,e)=>103.1668*Math.exp(-.04354*(Ft(s,t)*100-Ft(s,e)*100))-3.1669;class De{async request_move_data(t,e){console.log(t,e);let n={cp:Math.random()*1e3},i={cp:n.cp-Math.random()*200},r=Fe("white",n,i),h=Qe(e).slice(0,4);return{before_cp:n,after_cp:i,accuracy:r,multi_pvs4:h}}}const Ge=new De,Ue=s=>rt(s).unwrap().turn;function Qe(s){let t=yt.fromSetup(rt(s).unwrap()).unwrap(),e=[];for(let[n,i]of pe(t))e.push(...i.map(r=>n+r));return e}const st=class st{constructor(t,e){this.headers=t,this.tree=e}get event(){return this.headers.event}get site(){return this.headers.site}get white(){return this.headers.white}get black(){return this.headers.black}get puzzle(){return this.headers.puzzle}get section(){return this.headers.section}get chapter(){return this.headers.chapter}get fen(){return this.headers.fen}};L(st,"make_many",t=>Ie(t).map(e=>{let n=e.headers.get("Event"),i=e.headers.get("Site"),r=e.headers.get("White"),h=e.headers.get("Black"),a=e.headers.get("Puzzle"),c=e.headers.get("Section"),f=e.headers.get("Chapter"),p=e.headers.get("FEN"),b=e.moves.children[0],g=p??we,y=b.data.san,R=yt.fromSetup(rt(g).unwrap()).unwrap(),T=Kt(R,y),z=xt(T),N=mt.make(g,[z]);K(N,b,R,[]);function K(X,q,Rt,_t){let At=Kt(Rt,q.data.san),Ot=Rt.clone();Ot.play(At);let Nt=xt(At);X.append_uci(Nt,_t),q.children.forEach(Vt=>{K(X,Vt,Ot,[..._t,Nt])})}return new st({event:n,site:i,white:r,black:h,puzzle:a,section:c,chapter:f,fen:p},N)}));let Dt=st;const j=class j{constructor(t){L(this,"_children");this.data=t,this._children=Jt([])}static color_of(t){return Ue(t.data.before_fen)}get clone(){let t=new j({...this.data});return t.children=this.children.map(e=>e.clone),t}get all_leaves(){return this.children.length===0?[this]:this.children.flatMap(t=>t.all_leaves)}get length(){if(this.children.length>1)return 1;if(this.children.length===0)return 0;let t=1,e=this.children[0];for(;(e==null?void 0:e.children.length)===1;)t++,e=e.children[0];return t}get nb_first_variations(){var t;return((t=this.children_first_variations)==null?void 0:t.length)??0}get first_node_with_variations(){if(this.children.length!==0)return this.children.length===1?this.children[0].first_node_with_variations:this}get children_first_variations(){var t;return(t=this.first_node_with_variations)==null?void 0:t.children}get children(){return this._children[0]()}set children(t){this._children[1](t)}};L(j,"make",t=>new j(t));let S=j;const H=class H{constructor(t){this.root=t}get clone(){return new H(this.root.clone)}get progress_paths(){function t(n,i,r){i.push(n.data.path),n.children.length===0?r.push(i):n.children.length===1?t(n.children[0],i,r):(r.push(i),n.children.forEach(h=>{t(h,[],r)}))}let e=[];return t(this.root,[],e),e}_traverse_path(t){let e,n=[this.root];for(let i of t)e=n.find(r=>r.data.uci===i),n=(e==null?void 0:e.children)||this.root;return e}get_children(t){let e=this._traverse_path(t);return e==null?void 0:e.children.map(n=>n.data)}get_at(t){let e=this._traverse_path(t);return e==null?void 0:e.data}delete_at(t){const e=this._traverse_path(t.slice(0,-1));e&&(e.children=e.children.filter(n=>n.data.path.join("")!==t.join("")))}};L(H,"make",t=>{function e(a,c){let f=a.data.path.length,p=a.length,b=a.nb_first_variations,g=-c*100+1/(f/40)*10+p/20*10+(b+1)*100,y=S.make({path:a.data.path,uci:a.data.uci,score:g}),R=a.children.length+c,T=R*(R+1)/2;return y.children=a.children.map((z,N)=>e(z,(N+c)/T)),y}function n(a){return a.data.score+a.children.map(f=>n(f)).reduce((f,p)=>f+p,0)}function i(a,c){a.data.score/=c,a.children.forEach(f=>i(f,c))}let r=e(t.root,1),h=n(r);return i(r,h),new H(r)});let Gt=H;const x=class x{constructor(t){this.root=t}get initial_color(){return S.color_of(this.root)}get clone(){return new x(this.root.clone)}static make_data(t,e,n,i){let r=rt(t).unwrap(),h=yt.fromSetup(r).unwrap(),a=qt(e),c=Pe(h,a);return h.play(a),{path:[...i,e],ply:n,before_fen:t,san:c,after_fen:Ae(h.toSetup()),uci:e}}_traverse_path(t){let e,n=[this.root];for(let i of t){if(e=n.find(r=>r.data.uci===i),!e)return;n=e.children}return e}_find_path(t){let e=[],n=[],i=this.root,r=[i],h=!1;for(let a of t)if(h)n.push(a);else{let c=r.find(f=>f.data.uci===a);c?(e.push(a),i=c,r=Pt(()=>i.children)):(h=!0,n.push(a))}return[e,i,n]}get all_leaves(){return this.root.all_leaves.map(t=>t.data)}get_children(t){let e=this._traverse_path(t);return e==null?void 0:e.children.map(n=>n.data)}async request_ceval_and_get_at(t){let e=this.get_at(t);if(e)return e.eval_accuracy=await Ge.request_move_data(e.before_fen,e.after_fen),e}collect_branch_sums(t){let e=[],n=[this.root],i=!1;for(let r of t){let h=n.find(a=>a.data.uci===r);if(!h)return;i&&(e.push(h.data),i=!1),h.children.length>1&&(i=!0),n=h.children}return e}get_at(t){let e=this._traverse_path(t);return e==null?void 0:e.data}delete_at(t){const e=this._traverse_path(t.slice(0,-1));e&&(e.children=e.children.filter(n=>n.data.path.join("")!==t.join("")))}append_uci(t,e=[]){this.append_ucis([...e,t])}append_ucis(t){let[e,n,i]=this._find_path(t);for(let r of i){let h=S.make(x.make_data(n.data.after_fen,r,n.data.ply+1,e)),a=Pt(()=>n.children);n.children=[...a,h],n=h,e=[...e,r]}}};L(x,"make",(t,e)=>{let n=e[0],i=e.slice(1),r=new x(S.make(x.make_data(t,n,1,[])));return r.append_ucis(i),r});let mt=x;export{yt as C,we as I,Gt as M,Dt as P,mt as a,U as b,pe as c,qt as d,Ue as f,Ae as m,rt as p};