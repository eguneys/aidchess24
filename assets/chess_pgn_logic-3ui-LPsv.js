var Vt=Object.defineProperty;var jt=(n,t,e)=>t in n?Vt(n,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):n[t]=e;var T=(n,t,e)=>(jt(n,typeof t!="symbol"?t+"":t,e),e);import{r as Ot,h as Zt}from"./index-BJpzf9IE.js";const q=["a","b","c","d","e","f","g","h"],Ft=["1","2","3","4","5","6","7","8"],B=["white","black"],y=["pawn","knight","bishop","rook","queen","king"],Yt=["a","h"],H=n=>"role"in n,c=n=>n!==void 0,p=n=>n==="white"?"black":"white",M=n=>n>>3,b=n=>n&7,ct=(n,t)=>0<=n&&n<8&&0<=t&&t<8?n+8*t:void 0,x=n=>{switch(n){case"pawn":return"p";case"knight":return"n";case"bishop":return"b";case"rook":return"r";case"queen":return"q";case"king":return"k"}};function F(n){switch(n.toLowerCase()){case"p":return"pawn";case"n":return"knight";case"b":return"bishop";case"r":return"rook";case"q":return"queen";case"k":return"king";default:return}}function G(n){if(n.length===2)return ct(n.charCodeAt(0)-97,n.charCodeAt(1)-49)}const D=n=>q[b(n)]+Ft[M(n)],Jt=n=>{if(n[1]==="@"&&n.length===4){const t=F(n[0]),e=G(n.slice(2));if(t&&c(e))return{role:t,to:e}}else if(n.length===4||n.length===5){const t=G(n.slice(0,2)),e=G(n.slice(2,4));let i;if(n.length===5&&(i=F(n[4]),!i))return;if(c(t)&&c(e))return{from:t,to:e,promotion:i}}},_t=n=>H(n)?`${x(n.role).toUpperCase()}@${D(n.to)}`:D(n.from)+D(n.to)+(n.promotion?x(n.promotion):""),wt=(n,t)=>n==="white"?t==="a"?2:6:t==="a"?58:62,gt=(n,t)=>n==="white"?t==="a"?3:5:t==="a"?59:61,Pt=n=>(n=n-(n>>>1&1431655765),n=(n&858993459)+(n>>>2&858993459),Math.imul(n+(n>>>4)&252645135,16843009)>>24),lt=n=>(n=n>>>8&16711935|(n&16711935)<<8,n>>>16&65535|(n&65535)<<16),Nt=n=>(n=n>>>1&1431655765|(n&1431655765)<<1,n=n>>>2&858993459|(n&858993459)<<2,n=n>>>4&252645135|(n&252645135)<<4,lt(n));class o{constructor(t,e){this.lo=t|0,this.hi=e|0}static fromSquare(t){return t>=32?new o(0,1<<t-32):new o(1<<t,0)}static fromRank(t){return new o(255,0).shl64(8*t)}static fromFile(t){return new o(16843009<<t,16843009<<t)}static empty(){return new o(0,0)}static full(){return new o(4294967295,4294967295)}static corners(){return new o(129,2164260864)}static center(){return new o(402653184,24)}static backranks(){return new o(255,4278190080)}static backrank(t){return t==="white"?new o(255,0):new o(0,4278190080)}static lightSquares(){return new o(1437226410,1437226410)}static darkSquares(){return new o(2857740885,2857740885)}complement(){return new o(~this.lo,~this.hi)}xor(t){return new o(this.lo^t.lo,this.hi^t.hi)}union(t){return new o(this.lo|t.lo,this.hi|t.hi)}intersect(t){return new o(this.lo&t.lo,this.hi&t.hi)}diff(t){return new o(this.lo&~t.lo,this.hi&~t.hi)}intersects(t){return this.intersect(t).nonEmpty()}isDisjoint(t){return this.intersect(t).isEmpty()}supersetOf(t){return t.diff(this).isEmpty()}subsetOf(t){return this.diff(t).isEmpty()}shr64(t){return t>=64?o.empty():t>=32?new o(this.hi>>>t-32,0):t>0?new o(this.lo>>>t^this.hi<<32-t,this.hi>>>t):this}shl64(t){return t>=64?o.empty():t>=32?new o(0,this.lo<<t-32):t>0?new o(this.lo<<t,this.hi<<t^this.lo>>>32-t):this}bswap64(){return new o(lt(this.hi),lt(this.lo))}rbit64(){return new o(Nt(this.hi),Nt(this.lo))}minus64(t){const e=this.lo-t.lo,i=(e&t.lo&1)+(t.lo>>>1)+(e>>>1)>>>31;return new o(e,this.hi-(t.hi+i))}equals(t){return this.lo===t.lo&&this.hi===t.hi}size(){return Pt(this.lo)+Pt(this.hi)}isEmpty(){return this.lo===0&&this.hi===0}nonEmpty(){return this.lo!==0||this.hi!==0}has(t){return(t>=32?this.hi&1<<t-32:this.lo&1<<t)!==0}set(t,e){return e?this.with(t):this.without(t)}with(t){return t>=32?new o(this.lo,this.hi|1<<t-32):new o(this.lo|1<<t,this.hi)}without(t){return t>=32?new o(this.lo,this.hi&~(1<<t-32)):new o(this.lo&~(1<<t),this.hi)}toggle(t){return t>=32?new o(this.lo,this.hi^1<<t-32):new o(this.lo^1<<t,this.hi)}last(){if(this.hi!==0)return 63-Math.clz32(this.hi);if(this.lo!==0)return 31-Math.clz32(this.lo)}first(){if(this.lo!==0)return 31-Math.clz32(this.lo&-this.lo);if(this.hi!==0)return 63-Math.clz32(this.hi&-this.hi)}withoutFirst(){return this.lo!==0?new o(this.lo&this.lo-1,this.hi):new o(0,this.hi&this.hi-1)}moreThanOne(){return this.hi!==0&&this.lo!==0||(this.lo&this.lo-1)!==0||(this.hi&this.hi-1)!==0}singleSquare(){return this.moreThanOne()?void 0:this.last()}*[Symbol.iterator](){let t=this.lo,e=this.hi;for(;t!==0;){const i=31-Math.clz32(t&-t);t^=1<<i,yield i}for(;e!==0;){const i=31-Math.clz32(e&-e);e^=1<<i,yield 32+i}}*reversed(){let t=this.lo,e=this.hi;for(;e!==0;){const i=31-Math.clz32(e);e^=1<<i,yield 32+i}for(;t!==0;){const i=31-Math.clz32(t);t^=1<<i,yield i}}}const tt=(n,t)=>{let e=o.empty();for(const i of t){const s=n+i;0<=s&&s<64&&Math.abs(b(n)-b(s))<=2&&(e=e.with(s))}return e},A=n=>{const t=[];for(let e=0;e<64;e++)t[e]=n(e);return t},Xt=A(n=>tt(n,[-9,-8,-7,-1,1,7,8,9])),qt=A(n=>tt(n,[-17,-15,-10,-6,6,10,15,17])),te={white:A(n=>tt(n,[7,9])),black:A(n=>tt(n,[-7,-9]))},it=n=>Xt[n],st=n=>qt[n],Z=(n,t)=>te[n][t],ut=A(n=>o.fromFile(b(n)).without(n)),ft=A(n=>o.fromRank(M(n)).without(n)),dt=A(n=>{const t=new o(134480385,2151686160),e=8*(M(n)-b(n));return(e>=0?t.shl64(e):t.shr64(-e)).without(n)}),kt=A(n=>{const t=new o(270549120,16909320),e=8*(M(n)+b(n)-7);return(e>=0?t.shl64(e):t.shr64(-e)).without(n)}),pt=(n,t,e)=>{let i=e.intersect(t),s=i.bswap64();return i=i.minus64(n),s=s.minus64(n.bswap64()),i.xor(s.bswap64()).intersect(t)},ee=(n,t)=>pt(o.fromSquare(n),ut[n],t),ne=(n,t)=>{const e=ft[n];let i=t.intersect(e),s=i.rbit64();return i=i.minus64(o.fromSquare(n)),s=s.minus64(o.fromSquare(63-n)),i.xor(s.rbit64()).intersect(e)},S=(n,t)=>{const e=o.fromSquare(n);return pt(e,dt[n],t).xor(pt(e,kt[n],t))},W=(n,t)=>ee(n,t).xor(ne(n,t)),bt=(n,t)=>S(n,t).xor(W(n,t)),ie=(n,t,e)=>{switch(n.role){case"pawn":return Z(n.color,t);case"knight":return st(t);case"bishop":return S(t,e);case"rook":return W(t,e);case"queen":return bt(t,e);case"king":return it(t)}},Gt=(n,t)=>{const e=o.fromSquare(t);return ft[n].intersects(e)?ft[n].with(n):kt[n].intersects(e)?kt[n].with(n):dt[n].intersects(e)?dt[n].with(n):ut[n].intersects(e)?ut[n].with(n):o.empty()},V=(n,t)=>Gt(n,t).intersect(o.full().shl64(n).xor(o.full().shl64(t))).withoutFirst();class U{constructor(){}static default(){const t=new U;return t.reset(),t}reset(){this.occupied=new o(65535,4294901760),this.promoted=o.empty(),this.white=new o(65535,0),this.black=new o(0,4294901760),this.pawn=new o(65280,16711680),this.knight=new o(66,1107296256),this.bishop=new o(36,603979776),this.rook=new o(129,2164260864),this.queen=new o(8,134217728),this.king=new o(16,268435456)}static empty(){const t=new U;return t.clear(),t}clear(){this.occupied=o.empty(),this.promoted=o.empty();for(const t of B)this[t]=o.empty();for(const t of y)this[t]=o.empty()}clone(){const t=new U;t.occupied=this.occupied,t.promoted=this.promoted;for(const e of B)t[e]=this[e];for(const e of y)t[e]=this[e];return t}getColor(t){if(this.white.has(t))return"white";if(this.black.has(t))return"black"}getRole(t){for(const e of y)if(this[e].has(t))return e}get(t){const e=this.getColor(t);if(!e)return;const i=this.getRole(t),s=this.promoted.has(t);return{color:e,role:i,promoted:s}}take(t){const e=this.get(t);return e&&(this.occupied=this.occupied.without(t),this[e.color]=this[e.color].without(t),this[e.role]=this[e.role].without(t),e.promoted&&(this.promoted=this.promoted.without(t))),e}set(t,e){const i=this.take(t);return this.occupied=this.occupied.with(t),this[e.color]=this[e.color].with(t),this[e.role]=this[e.role].with(t),e.promoted&&(this.promoted=this.promoted.with(t)),i}has(t){return this.occupied.has(t)}*[Symbol.iterator](){for(const t of this.occupied)yield[t,this.get(t)]}pieces(t,e){return this[t].intersect(this[e])}rooksAndQueens(){return this.rook.union(this.queen)}bishopsAndQueens(){return this.bishop.union(this.queen)}kingOf(t){return this.pieces(t,"king").singleSquare()}}class R{constructor(){}static empty(){const t=new R;for(const e of y)t[e]=0;return t}static fromBoard(t,e){const i=new R;for(const s of y)i[s]=t.pieces(e,s).size();return i}clone(){const t=new R;for(const e of y)t[e]=this[e];return t}equals(t){return y.every(e=>this[e]===t[e])}add(t){const e=new R;for(const i of y)e[i]=this[i]+t[i];return e}nonEmpty(){return y.some(t=>this[t]>0)}isEmpty(){return!this.nonEmpty()}hasPawns(){return this.pawn>0}hasNonPawns(){return this.knight>0||this.bishop>0||this.rook>0||this.queen>0||this.king>0}size(){return this.pawn+this.knight+this.bishop+this.rook+this.queen+this.king}}class K{constructor(t,e){this.white=t,this.black=e}static empty(){return new K(R.empty(),R.empty())}static fromBoard(t){return new K(R.fromBoard(t,"white"),R.fromBoard(t,"black"))}clone(){return new K(this.white.clone(),this.black.clone())}equals(t){return this.white.equals(t.white)&&this.black.equals(t.black)}add(t){return new K(this.white.add(t.white),this.black.add(t.black))}count(t){return this.white[t]+this.black[t]}size(){return this.white.size()+this.black.size()}isEmpty(){return this.white.isEmpty()&&this.black.isEmpty()}nonEmpty(){return!this.isEmpty()}hasPawns(){return this.white.hasPawns()||this.black.hasPawns()}hasNonPawns(){return this.white.hasNonPawns()||this.black.hasNonPawns()}}class j{constructor(t,e){this.white=t,this.black=e}static default(){return new j(3,3)}clone(){return new j(this.white,this.black)}equals(t){return this.white===t.white&&this.black===t.black}}class Dt{unwrap(t,e){const i=this._chain(s=>u.ok(t?t(s):s),s=>e?u.ok(e(s)):u.err(s));if(i.isErr)throw i.error;return i.value}map(t,e){return this._chain(i=>u.ok(t(i)),i=>u.err(e?e(i):i))}chain(t,e){return this._chain(t,e||(i=>u.err(i)))}}class se extends Dt{constructor(t){super(),this.value=void 0,this.isOk=!0,this.isErr=!1,this.value=t}_chain(t,e){return t(this.value)}}class re extends Dt{constructor(t){super(),this.error=void 0,this.isOk=!1,this.isErr=!0,this.error=t}_chain(t,e){return e(this.error)}}var u;(function(n){n.ok=function(t){return new se(t)},n.err=function(t){return new re(t||new Error)},n.all=function(t){if(Array.isArray(t)){const s=[];for(let r=0;r<t.length;r++){const h=t[r];if(h.isErr)return h;s.push(h.value)}return n.ok(s)}const e={},i=Object.keys(t);for(let s=0;s<i.length;s++){const r=t[i[s]];if(r.isErr)return r;e[i[s]]=r.value}return n.ok(e)}})(u||(u={}));var C;(function(n){n.Empty="ERR_EMPTY",n.OppositeCheck="ERR_OPPOSITE_CHECK",n.PawnsOnBackrank="ERR_PAWNS_ON_BACKRANK",n.Kings="ERR_KINGS",n.Variant="ERR_VARIANT"})(C||(C={}));class z extends Error{}const oe=(n,t,e,i)=>e[t].intersect(W(n,i).intersect(e.rooksAndQueens()).union(S(n,i).intersect(e.bishopsAndQueens())).union(st(n).intersect(e.knight)).union(it(n).intersect(e.king)).union(Z(p(t),n).intersect(e.pawn)));class N{constructor(){}static default(){const t=new N;return t.castlingRights=o.corners(),t.rook={white:{a:0,h:7},black:{a:56,h:63}},t.path={white:{a:new o(14,0),h:new o(96,0)},black:{a:new o(0,234881024),h:new o(0,1610612736)}},t}static empty(){const t=new N;return t.castlingRights=o.empty(),t.rook={white:{a:void 0,h:void 0},black:{a:void 0,h:void 0}},t.path={white:{a:o.empty(),h:o.empty()},black:{a:o.empty(),h:o.empty()}},t}clone(){const t=new N;return t.castlingRights=this.castlingRights,t.rook={white:{a:this.rook.white.a,h:this.rook.white.h},black:{a:this.rook.black.a,h:this.rook.black.h}},t.path={white:{a:this.path.white.a,h:this.path.white.h},black:{a:this.path.black.a,h:this.path.black.h}},t}add(t,e,i,s){const r=wt(t,e),h=gt(t,e);this.castlingRights=this.castlingRights.with(s),this.rook[t][e]=s,this.path[t][e]=V(s,h).with(h).union(V(i,r).with(r)).without(i).without(s)}static fromSetup(t){const e=N.empty(),i=t.castlingRights.intersect(t.board.rook);for(const s of B){const r=o.backrank(s),h=t.board.kingOf(s);if(!c(h)||!r.has(h))continue;const a=i.intersect(t.board[s]).intersect(r),l=a.first();c(l)&&l<h&&e.add(s,"a",h,l);const f=a.last();c(f)&&h<f&&e.add(s,"h",h,f)}return e}discardRook(t){if(this.castlingRights.has(t)){this.castlingRights=this.castlingRights.without(t);for(const e of B)for(const i of Yt)this.rook[e][i]===t&&(this.rook[e][i]=void 0)}}discardColor(t){this.castlingRights=this.castlingRights.diff(o.backrank(t)),this.rook[t].a=void 0,this.rook[t].h=void 0}}class he{constructor(t){this.rules=t}reset(){this.board=U.default(),this.pockets=void 0,this.turn="white",this.castles=N.default(),this.epSquare=void 0,this.remainingChecks=void 0,this.halfmoves=0,this.fullmoves=1}setupUnchecked(t){this.board=t.board.clone(),this.board.promoted=o.empty(),this.pockets=void 0,this.turn=t.turn,this.castles=N.fromSetup(t),this.epSquare=ae(this,t.epSquare),this.remainingChecks=void 0,this.halfmoves=t.halfmoves,this.fullmoves=t.fullmoves}kingAttackers(t,e,i){return oe(t,e,this.board,i)}playCaptureAt(t,e){this.halfmoves=0,e.role==="rook"&&this.castles.discardRook(t),this.pockets&&this.pockets[p(e.color)][e.promoted?"pawn":e.role]++}ctx(){const t=this.isVariantEnd(),e=this.board.kingOf(this.turn);if(!c(e))return{king:e,blockers:o.empty(),checkers:o.empty(),variantEnd:t,mustCapture:!1};const i=W(e,o.empty()).intersect(this.board.rooksAndQueens()).union(S(e,o.empty()).intersect(this.board.bishopsAndQueens())).intersect(this.board[p(this.turn)]);let s=o.empty();for(const h of i){const a=V(e,h).intersect(this.board.occupied);a.moreThanOne()||(s=s.union(a))}const r=this.kingAttackers(e,p(this.turn),this.board.occupied);return{king:e,blockers:s,checkers:r,variantEnd:t,mustCapture:!1}}clone(){var t,e;const i=new this.constructor;return i.board=this.board.clone(),i.pockets=(t=this.pockets)===null||t===void 0?void 0:t.clone(),i.turn=this.turn,i.castles=this.castles.clone(),i.epSquare=this.epSquare,i.remainingChecks=(e=this.remainingChecks)===null||e===void 0?void 0:e.clone(),i.halfmoves=this.halfmoves,i.fullmoves=this.fullmoves,i}validate(){if(this.board.occupied.isEmpty())return u.err(new z(C.Empty));if(this.board.king.size()!==2)return u.err(new z(C.Kings));if(!c(this.board.kingOf(this.turn)))return u.err(new z(C.Kings));const t=this.board.kingOf(p(this.turn));return c(t)?this.kingAttackers(t,this.turn,this.board.occupied).nonEmpty()?u.err(new z(C.OppositeCheck)):o.backranks().intersects(this.board.pawn)?u.err(new z(C.PawnsOnBackrank)):u.ok(void 0):u.err(new z(C.Kings))}dropDests(t){return o.empty()}dests(t,e){if(e=e||this.ctx(),e.variantEnd)return o.empty();const i=this.board.get(t);if(!i||i.color!==this.turn)return o.empty();let s,r;if(i.role==="pawn"){s=Z(this.turn,t).intersect(this.board[p(this.turn)]);const h=this.turn==="white"?8:-8,a=t+h;if(0<=a&&a<64&&!this.board.occupied.has(a)){s=s.with(a);const l=this.turn==="white"?t<16:t>=48,f=a+h;l&&!this.board.occupied.has(f)&&(s=s.with(f))}c(this.epSquare)&&le(this,t,e)&&(r=o.fromSquare(this.epSquare))}else i.role==="bishop"?s=S(t,this.board.occupied):i.role==="knight"?s=st(t):i.role==="rook"?s=W(t,this.board.occupied):i.role==="queen"?s=bt(t,this.board.occupied):s=it(t);if(s=s.diff(this.board[this.turn]),c(e.king)){if(i.role==="king"){const h=this.board.occupied.without(t);for(const a of s)this.kingAttackers(a,p(this.turn),h).nonEmpty()&&(s=s.without(a));return s.union(xt(this,"a",e)).union(xt(this,"h",e))}if(e.checkers.nonEmpty()){const h=e.checkers.singleSquare();if(!c(h))return o.empty();s=s.intersect(V(h,e.king).with(h))}e.blockers.has(t)&&(s=s.intersect(Gt(t,e.king)))}return r&&(s=s.union(r)),s}isVariantEnd(){return!1}variantOutcome(t){}hasInsufficientMaterial(t){return this.board[t].intersect(this.board.pawn.union(this.board.rooksAndQueens())).nonEmpty()?!1:this.board[t].intersects(this.board.knight)?this.board[t].size()<=2&&this.board[p(t)].diff(this.board.king).diff(this.board.queen).isEmpty():this.board[t].intersects(this.board.bishop)?(!this.board.bishop.intersects(o.darkSquares())||!this.board.bishop.intersects(o.lightSquares()))&&this.board.pawn.isEmpty()&&this.board.knight.isEmpty():!0}toSetup(){var t,e;return{board:this.board.clone(),pockets:(t=this.pockets)===null||t===void 0?void 0:t.clone(),turn:this.turn,castlingRights:this.castles.castlingRights,epSquare:ce(this),remainingChecks:(e=this.remainingChecks)===null||e===void 0?void 0:e.clone(),halfmoves:Math.min(this.halfmoves,150),fullmoves:Math.min(Math.max(this.fullmoves,1),9999)}}isInsufficientMaterial(){return B.every(t=>this.hasInsufficientMaterial(t))}hasDests(t){t=t||this.ctx();for(const e of this.board[this.turn])if(this.dests(e,t).nonEmpty())return!0;return this.dropDests(t).nonEmpty()}isLegal(t,e){if(H(t))return!this.pockets||this.pockets[this.turn][t.role]<=0||t.role==="pawn"&&o.backranks().has(t.to)?!1:this.dropDests(e).has(t.to);{if(t.promotion==="pawn"||t.promotion==="king"&&this.rules!=="antichess"||!!t.promotion!==(this.board.pawn.has(t.from)&&o.backranks().has(t.to)))return!1;const i=this.dests(t.from,e);return i.has(t.to)||i.has(ue(this,t).to)}}isCheck(){const t=this.board.kingOf(this.turn);return c(t)&&this.kingAttackers(t,p(this.turn),this.board.occupied).nonEmpty()}isEnd(t){return(t?t.variantEnd:this.isVariantEnd())?!0:this.isInsufficientMaterial()||!this.hasDests(t)}isCheckmate(t){return t=t||this.ctx(),!t.variantEnd&&t.checkers.nonEmpty()&&!this.hasDests(t)}isStalemate(t){return t=t||this.ctx(),!t.variantEnd&&t.checkers.isEmpty()&&!this.hasDests(t)}outcome(t){const e=this.variantOutcome(t);return e||(t=t||this.ctx(),this.isCheckmate(t)?{winner:p(this.turn)}:this.isInsufficientMaterial()||this.isStalemate(t)?{winner:void 0}:void 0)}allDests(t){t=t||this.ctx();const e=new Map;if(t.variantEnd)return e;for(const i of this.board[this.turn])e.set(i,this.dests(i,t));return e}play(t){const e=this.turn,i=this.epSquare,s=Qt(this,t);if(this.epSquare=void 0,this.halfmoves+=1,e==="black"&&(this.fullmoves+=1),this.turn=p(e),H(t))this.board.set(t.to,{role:t.role,color:e}),this.pockets&&this.pockets[e][t.role]--,t.role==="pawn"&&(this.halfmoves=0);else{const r=this.board.take(t.from);if(!r)return;let h;if(r.role==="pawn"){this.halfmoves=0,t.to===i&&(h=this.board.take(t.to+(e==="white"?-8:8)));const a=t.from-t.to;Math.abs(a)===16&&8<=t.from&&t.from<=55&&(this.epSquare=t.from+t.to>>1),t.promotion&&(r.role=t.promotion,r.promoted=!!this.pockets)}else if(r.role==="rook")this.castles.discardRook(t.from);else if(r.role==="king"){if(s){const a=this.castles.rook[e][s];if(c(a)){const l=this.board.take(a);this.board.set(wt(e,s),r),l&&this.board.set(gt(e,s),l)}}this.castles.discardColor(e)}if(!s){const a=this.board.set(t.to,r)||h;a&&this.playCaptureAt(t.to,a)}}this.remainingChecks&&this.isCheck()&&(this.remainingChecks[e]=Math.max(this.remainingChecks[e]-1,0))}}class Ut extends he{constructor(){super("chess")}static default(){const t=new this;return t.reset(),t}static fromSetup(t){const e=new this;return e.setupUnchecked(t),e.validate().map(i=>e)}clone(){return super.clone()}}const ae=(n,t)=>{if(!c(t))return;const e=n.turn==="white"?5:2,i=n.turn==="white"?8:-8;if(M(t)!==e||n.board.occupied.has(t+i))return;const s=t-i;if(!(!n.board.pawn.has(s)||!n.board[p(n.turn)].has(s)))return t},ce=n=>{if(!c(n.epSquare))return;const t=n.ctx(),i=n.board.pieces(n.turn,"pawn").intersect(Z(p(n.turn),n.epSquare));for(const s of i)if(n.dests(s,t).has(n.epSquare))return n.epSquare},le=(n,t,e)=>{if(!c(n.epSquare)||!Z(n.turn,t).has(n.epSquare))return!1;if(!c(e.king))return!0;const i=n.turn==="white"?8:-8,s=n.epSquare-i;return n.kingAttackers(e.king,p(n.turn),n.board.occupied.toggle(t).toggle(s).with(n.epSquare)).without(s).isEmpty()},xt=(n,t,e)=>{if(!c(e.king)||e.checkers.nonEmpty())return o.empty();const i=n.castles.rook[n.turn][t];if(!c(i)||n.castles.path[n.turn][t].intersects(n.board.occupied))return o.empty();const s=wt(n.turn,t),r=V(e.king,s),h=n.board.occupied.without(e.king);for(const f of r)if(n.kingAttackers(f,p(n.turn),h).nonEmpty())return o.empty();const a=gt(n.turn,t),l=n.board.occupied.toggle(e.king).toggle(i).toggle(a);return n.kingAttackers(s,p(n.turn),l).nonEmpty()?o.empty():o.fromSquare(i)},Qt=(n,t)=>{if(H(t))return;const e=t.to-t.from;if(!(Math.abs(e)!==2&&!n.board[n.turn].has(t.to))&&n.board.king.has(t.from))return e>0?"h":"a"},ue=(n,t)=>{const e=Qt(n,t);if(!e)return t;const i=n.castles.rook[n.turn][e];return{from:t.from,to:c(i)?i:t.to}},fe="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",de=fe+" w KQkq -",ke=de+" 0 1";var d;(function(n){n.Fen="ERR_FEN",n.Board="ERR_BOARD",n.Pockets="ERR_POCKETS",n.Turn="ERR_TURN",n.Castling="ERR_CASTLING",n.EpSquare="ERR_EP_SQUARE",n.RemainingChecks="ERR_REMAINING_CHECKS",n.Halfmoves="ERR_HALFMOVES",n.Fullmoves="ERR_FULLMOVES"})(d||(d={}));class m extends Error{}const pe=(n,t,e)=>{let i=n.indexOf(t);for(;e-- >0&&i!==-1;)i=n.indexOf(t,i+t.length);return i},L=n=>/^\d{1,4}$/.test(n)?parseInt(n,10):void 0,St=n=>{const t=F(n);return t&&{role:t,color:n.toLowerCase()===n?"black":"white"}},ot=n=>{const t=U.empty();let e=7,i=0;for(let s=0;s<n.length;s++){const r=n[s];if(r==="/"&&i===8)i=0,e--;else{const h=parseInt(r,10);if(h>0)i+=h;else{if(i>=8||e<0)return u.err(new m(d.Board));const a=i+e*8,l=St(r);if(!l)return u.err(new m(d.Board));n[s+1]==="~"&&(l.promoted=!0,s++),t.set(a,l),i++}}}return e!==0||i!==8?u.err(new m(d.Board)):u.ok(t)},Bt=n=>{if(n.length>64)return u.err(new m(d.Pockets));const t=K.empty();for(const e of n){const i=St(e);if(!i)return u.err(new m(d.Pockets));t[i.color][i.role]++}return u.ok(t)},me=(n,t)=>{let e=o.empty();if(t==="-")return u.ok(e);for(const i of t){const s=i.toLowerCase(),r=i===s?"black":"white",h=r==="white"?0:7;if("a"<=s&&s<="h")e=e.with(ct(s.charCodeAt(0)-97,h));else if(s==="k"||s==="q"){const a=n[r].intersect(o.backrank(r)).intersect(n.rook.union(n.king)),l=s==="k"?a.last():a.first();e=e.with(c(l)&&n.rook.has(l)?l:ct(s==="k"?7:0,h))}else return u.err(new m(d.Castling))}return B.some(i=>o.backrank(i).intersect(e).size()>2)?u.err(new m(d.Castling)):u.ok(e)},Mt=n=>{const t=n.split("+");if(t.length===3&&t[0]===""){const e=L(t[1]),i=L(t[2]);return!c(e)||e>3||!c(i)||i>3?u.err(new m(d.RemainingChecks)):u.ok(new j(3-e,3-i))}else if(t.length===2){const e=L(t[0]),i=L(t[1]);return!c(e)||e>3||!c(i)||i>3?u.err(new m(d.RemainingChecks)):u.ok(new j(e,i))}else return u.err(new m(d.RemainingChecks))},Et=n=>{const t=n.split(/[\s_]+/),e=t.shift();let i,s=u.ok(void 0);if(e.endsWith("]")){const a=e.indexOf("[");if(a===-1)return u.err(new m(d.Fen));i=ot(e.slice(0,a)),s=Bt(e.slice(a+1,-1))}else{const a=pe(e,"/",7);a===-1?i=ot(e):(i=ot(e.slice(0,a)),s=Bt(e.slice(a+1)))}let r;const h=t.shift();if(!c(h)||h==="w")r="white";else if(h==="b")r="black";else return u.err(new m(d.Turn));return i.chain(a=>{const l=t.shift(),f=c(l)?me(a,l):u.ok(o.empty()),k=t.shift();let E;if(c(k)&&k!=="-"&&(E=G(k),!c(E)))return u.err(new m(d.EpSquare));let w=t.shift(),g;c(w)&&w.includes("+")&&(g=Mt(w),w=t.shift());const I=c(w)?L(w):0;if(!c(I))return u.err(new m(d.Halfmoves));const O=t.shift(),_=c(O)?L(O):1;if(!c(_))return u.err(new m(d.Fullmoves));const rt=t.shift();let v=u.ok(void 0);if(c(rt)){if(c(g))return u.err(new m(d.RemainingChecks));v=Mt(rt)}else c(g)&&(v=g);return t.length>0?u.err(new m(d.Fen)):s.chain(Y=>f.chain(J=>v.map(X=>({board:a,pockets:Y,turn:r,castlingRights:J,remainingChecks:X,epSquare:E,halfmoves:I,fullmoves:Math.max(1,_)}))))})},we=n=>{let t=x(n.role);return n.color==="white"&&(t=t.toUpperCase()),n.promoted&&(t+="~"),t},ge=n=>{let t="",e=0;for(let i=7;i>=0;i--)for(let s=0;s<8;s++){const r=s+i*8,h=n.get(r);h?(e>0&&(t+=e,e=0),t+=we(h)):e++,s===7&&(e>0&&(t+=e,e=0),i!==0&&(t+="/"))}return t},It=n=>y.map(t=>x(t).repeat(n[t])).join(""),be=n=>It(n.white).toUpperCase()+It(n.black),Ee=(n,t)=>{let e="";for(const i of B){const s=o.backrank(i);let r=n.kingOf(i);c(r)&&!s.has(r)&&(r=void 0);const h=n.pieces(i,"rook").intersect(s);for(const a of t.intersect(s).reversed())if(a===h.first()&&c(r)&&a<r)e+=i==="white"?"Q":"q";else if(a===h.last()&&c(r)&&r<a)e+=i==="white"?"K":"k";else{const l=q[b(a)];e+=i==="white"?l.toUpperCase():l}}return e||"-"},ye=n=>`${n.white}+${n.black}`,Re=(n,t)=>[ge(n.board)+(n.pockets?`[${be(n.pockets)}]`:""),n.turn[0],Ee(n.board,n.castlingRights),c(n.epSquare)?D(n.epSquare):"-",...n.remainingChecks?[ye(n.remainingChecks)]:[],...t!=null&&t.epd?[]:[Math.max(0,Math.min(n.halfmoves,9999)),Math.max(1,Math.min(n.fullmoves,9999))]].join(" "),Ce=(n,t)=>{let e="";if(H(t))t.role!=="pawn"&&(e=x(t.role).toUpperCase()),e+="@"+D(t.to);else{const i=n.board.getRole(t.from);if(!i)return"--";if(i==="king"&&(n.board[n.turn].has(t.to)||Math.abs(t.to-t.from)===2))e=t.to>t.from?"O-O":"O-O-O";else{const s=n.board.occupied.has(t.to)||i==="pawn"&&b(t.from)!==b(t.to);if(i!=="pawn"){e=x(i).toUpperCase();let r;if(i==="king"?r=it(t.to).intersect(n.board.king):i==="queen"?r=bt(t.to,n.board.occupied).intersect(n.board.queen):i==="rook"?r=W(t.to,n.board.occupied).intersect(n.board.rook):i==="bishop"?r=S(t.to,n.board.occupied).intersect(n.board.bishop):r=st(t.to).intersect(n.board.knight),r=r.intersect(n.board[n.turn]).without(t.from),r.nonEmpty()){const h=n.ctx();for(const a of r)n.dests(a,h).has(t.to)||(r=r.without(a));if(r.nonEmpty()){let a=!1,l=r.intersects(o.fromRank(M(t.from)));r.intersects(o.fromFile(b(t.from)))?a=!0:l=!0,l&&(e+=q[b(t.from)]),a&&(e+=Ft[M(t.from)])}}}else s&&(e=q[b(t.from)]);s&&(e+="x"),e+=D(t.to),t.promotion&&(e+="="+x(t.promotion).toUpperCase())}}return e},Ae=(n,t)=>{var e;const i=Ce(n,t);return n.play(t),!((e=n.outcome())===null||e===void 0)&&e.winner?i+"#":n.isCheck()?i+"+":i},Oe=(n,t)=>Ae(n.clone(),t),vt=(n,t)=>{const e=n.ctx(),i=t.match(/^([NBRQK])?([a-h])?([1-8])?[-x]?([a-h][1-8])(?:=?([nbrqkNBRQK]))?[+#]?$/);if(!i){let k;if(t==="O-O"||t==="O-O+"||t==="O-O#"?k="h":(t==="O-O-O"||t==="O-O-O+"||t==="O-O-O#")&&(k="a"),k){const g=n.castles.rook[n.turn][k];return!c(e.king)||!c(g)||!n.dests(e.king,e).has(g)?void 0:{from:e.king,to:g}}const E=t.match(/^([pnbrqkPNBRQK])?@([a-h][1-8])[+#]?$/);if(!E)return;const w={role:E[1]?F(E[1]):"pawn",to:G(E[2])};return n.isLegal(w,e)?w:void 0}const s=i[1]?F(i[1]):"pawn",r=G(i[4]),h=i[5]?F(i[5]):void 0;if(!!h!==(s==="pawn"&&o.backranks().has(r))||h==="king"&&n.rules!=="antichess")return;let a=n.board.pieces(n.turn,s);s==="pawn"&&!i[2]?a=a.intersect(o.fromFile(b(r))):i[2]&&(a=a.intersect(o.fromFile(i[2].charCodeAt(0)-97))),i[3]&&(a=a.intersect(o.fromRank(i[3].charCodeAt(0)-49)));const l=s==="pawn"?o.fromFile(b(r)):o.empty();a=a.intersect(l.union(ie({color:p(n.turn),role:s},r,n.board.occupied)));let f;for(const k of a)if(n.dests(k,e).has(r)){if(c(f))return;f=k}if(c(f))return{from:f,to:r,promotion:h}},_e=(n=yt)=>({headers:n(),moves:new Wt});class Wt{constructor(){this.children=[]}*mainline(){let t=this;for(;t.children.length;){const e=t.children[0];yield e.data,t=e}}}class Pe extends Wt{constructor(t){super(),this.data=t}}const yt=()=>new Map([["Event","?"],["Site","?"],["Date","????.??.??"],["Round","?"],["White","?"],["Black","?"],["Result","*"]]),Tt="\uFEFF",ht=n=>/^\s*$/.test(n),at=n=>n.startsWith("%");class Ne extends Error{}class xe{constructor(t,e=yt,i=1e6){this.emitGame=t,this.initHeaders=e,this.maxBudget=i,this.lineBuf=[],this.resetGame(),this.state=0}resetGame(){this.budget=this.maxBudget,this.found=!1,this.state=1,this.game=_e(this.initHeaders),this.stack=[{parent:this.game.moves,root:!0}],this.commentBuf=[]}consumeBudget(t){if(this.budget-=t,this.budget<0)throw new Ne("ERR_PGN_BUDGET")}parse(t,e){if(!(this.budget<0))try{let i=0;for(;;){const s=t.indexOf(`
`,i);if(s===-1)break;const r=s>i&&t[s-1]==="\r"?s-1:s;this.consumeBudget(s-i),this.lineBuf.push(t.slice(i,r)),i=s+1,this.handleLine()}this.consumeBudget(t.length-i),this.lineBuf.push(t.slice(i)),e!=null&&e.stream||(this.handleLine(),this.emit(void 0))}catch(i){this.emit(i)}}handleLine(){let t=!0,e=this.lineBuf.join("");this.lineBuf=[];t:for(;;)switch(this.state){case 0:e.startsWith(Tt)&&(e=e.slice(Tt.length)),this.state=1;case 1:if(ht(e)||at(e))return;this.found=!0,this.state=2;case 2:{if(at(e))return;let i=!0;for(;i;)i=!1,e=e.replace(/^\s*\[([A-Za-z0-9][A-Za-z0-9_+#=:-]*)\s+"((?:[^"\\]|\\"|\\\\)*)"\]/,(s,r,h)=>(this.consumeBudget(200),this.game.headers.set(r,h.replace(/\\"/g,'"').replace(/\\\\/g,"\\")),i=!0,t=!1,""));if(ht(e))return;this.state=3}case 3:{if(t){if(at(e))return;if(ht(e))return this.emit(void 0)}const i=/(?:[NBKRQ]?[a-h]?[1-8]?[-x]?[a-h][1-8](?:=?[nbrqkNBRQK])?|[pnbrqkPNBRQK]?@[a-h][1-8]|O-O-O|0-0-0|O-O|0-0)[+#]?|--|Z0|0000|@@@@|{|;|\$\d{1,4}|[?!]{1,2}|\(|\)|\*|1-0|0-1|1\/2-1\/2/g;let s;for(;s=i.exec(e);){const r=this.stack[this.stack.length-1];let h=s[0];if(h===";")return;if(h.startsWith("$"))this.handleNag(parseInt(h.slice(1),10));else if(h==="!")this.handleNag(1);else if(h==="?")this.handleNag(2);else if(h==="!!")this.handleNag(3);else if(h==="??")this.handleNag(4);else if(h==="!?")this.handleNag(5);else if(h==="?!")this.handleNag(6);else if(h==="1-0"||h==="0-1"||h==="1/2-1/2"||h==="*")this.stack.length===1&&h!=="*"&&this.game.headers.set("Result",h);else if(h==="(")this.consumeBudget(100),this.stack.push({parent:r.parent,root:!1});else if(h===")")this.stack.length>1&&this.stack.pop();else if(h==="{"){const a=i.lastIndex,l=e[a]===" "?a+1:a;e=e.slice(l),this.state=4;continue t}else this.consumeBudget(100),h==="Z0"||h==="0000"||h==="@@@@"?h="--":h.startsWith("0")&&(h=h.replace(/0/g,"O")),r.node&&(r.parent=r.node),r.node=new Pe({san:h,startingComments:r.startingComments}),r.startingComments=void 0,r.root=!1,r.parent.children.push(r.node)}return}case 4:{const i=e.indexOf("}");if(i===-1){this.commentBuf.push(e);return}else{const s=i>0&&e[i-1]===" "?i-1:i;this.commentBuf.push(e.slice(0,s)),this.handleComment(),e=e.slice(i),this.state=3,t=!1}}}}handleNag(t){var e;this.consumeBudget(50);const i=this.stack[this.stack.length-1];i.node&&((e=i.node.data).nags||(e.nags=[]),i.node.data.nags.push(t))}handleComment(){var t,e;this.consumeBudget(100);const i=this.stack[this.stack.length-1],s=this.commentBuf.join(`
`);this.commentBuf=[],i.node?((t=i.node.data).comments||(t.comments=[]),i.node.data.comments.push(s)):i.root?((e=this.game).comments||(e.comments=[]),this.game.comments.push(s)):(i.startingComments||(i.startingComments=[]),i.startingComments.push(s))}emit(t){if(this.state===4&&this.handleComment(),t)return this.emitGame(this.game,t);this.found&&this.emitGame(this.game,void 0),this.resetGame()}}const Be=(n,t=yt)=>{const e=[];return new xe(i=>e.push(i),t,NaN).parse(n),e},Me=(n,t)=>n==="white"?t:-t,$t=n=>2/(1+Math.exp(-.00368208*n))-1,Ie=n=>$t(Math.min(Math.max(-1e3,n),1e3)),ve=n=>{const e=(21-Math.min(10,Math.abs(n)))*100*(n>0?1:-1);return $t(e)},Te=n=>typeof n.mate<"u"?ve(n.mate):Ie(n.cp),zt=(n,t)=>Me(n,Te(t)),ze=(n,t,e)=>103.1668*Math.exp(-.04354*(zt(n,t)*100-zt(n,e)*100))-3.1669;class Ke{async request_move_data(t,e){console.log(t,e);let i={cp:Math.random()*1e3},s={cp:i.cp-Math.random()*200},r=ze("white",i,s);return console.log(i,s,r),{before_cp:i,after_cp:s,accuracy:r,multi_pvs4:[]}}}const Le=new Ke,et=class et{constructor(t,e){this.headers=t,this.tree=e}get event(){return this.headers.event}get site(){return this.headers.site}get white(){return this.headers.white}get black(){return this.headers.black}get puzzle(){return this.headers.puzzle}};T(et,"make_many",t=>Be(t).map(e=>{let i=e.headers.get("Event"),s=e.headers.get("Site"),r=e.headers.get("White"),h=e.headers.get("Black"),a=e.headers.get("Puzzle"),l=e.headers.get("FEN"),f=e.moves.children[0],k=l??ke,E=f.data.san,w=Ut.fromSetup(Et(k).unwrap()).unwrap(),g=vt(w,E),I=_t(g),O=mt.make(k,[I]);_(O,f,w,[]);function _(v,Y,J,X){let Rt=vt(J,Y.data.san),Ct=J.clone();Ct.play(Rt);let At=_t(Rt);v.append_uci(At,X),Y.children.forEach(Ht=>{_(v,Ht,Ct,[...X,At])})}return new et({event:i,site:s,white:r,black:h,puzzle:a},O)}));let Kt=et;const $=class ${constructor(t){T(this,"_children");this.data=t,this._children=Zt([])}static color_of(t){return Et(t.data.before_fen).unwrap().turn}get clone(){let t=new $({...this.data});return t.children=this.children.map(e=>e.clone),t}get length(){if(this.children.length>1)return 1;if(this.children.length===0)return 0;let t=1,e=this.children[0];for(;(e==null?void 0:e.children.length)===1;)t++,e=e.children[0];return t}get nb_first_variations(){var t;return((t=this.children_first_variations)==null?void 0:t.length)??0}get children_first_variations(){let t=this.children;for(;(t==null?void 0:t.length)===1;)t=t[0].children;if(t.length>1)return t}get children(){return this._children[0]()}set children(t){this._children[1](t)}};T($,"make",t=>new $(t));let Q=$;const nt=class nt{constructor(t){this.root=t}_traverse_path(t){let e,i=[this.root];for(let s of t)e=i.find(r=>r.data.uci===s),i=(e==null?void 0:e.children)||this.root;return e}get_children(t){let e=this._traverse_path(t);return e==null?void 0:e.children.map(i=>i.data)}get_at(t){let e=this._traverse_path(t);return e==null?void 0:e.data}};T(nt,"make",t=>{function e(a,l){let f=a.length,k=a.nb_first_variations,E=l*(f/2)*(k+1),w=Q.make({path:a.data.path,uci:a.data.uci,score:E}),g=a.children.length,I=g*(g+1)/2;return w.children=a.children.map((O,_)=>e(O,(g-_)/I)),w}function i(a){return a.data.score+a.children.map(f=>i(f)).reduce((f,k)=>f+k,0)}function s(a,l){a.data.score/=l,a.children.forEach(f=>s(f,l))}let r=e(t.root,1),h=i(r);return s(r,h),new nt(r)});let Lt=nt;const P=class P{constructor(t){this.root=t}get initial_color(){return Q.color_of(this.root)}get clone(){return new P(this.root.clone)}static make_data(t,e,i,s){let r=Et(t).unwrap(),h=Ut.fromSetup(r).unwrap(),a=Jt(e),l=Oe(h,a);return h.play(a),{path:[...s,e],ply:i,before_fen:t,san:l,after_fen:Re(h.toSetup()),uci:e}}_traverse_path(t){let e,i=[this.root];for(let s of t)e=i.find(r=>r.data.uci===s),i=(e==null?void 0:e.children)||this.root;return e}_find_path(t){let e=[],i=[],s=this.root,r=[s],h=!1;for(let a of t)if(h)i.push(a);else{let l=r.find(f=>f.data.uci===a);l?(e.push(a),s=l,r=Ot(()=>s.children)):(h=!0,i.push(a))}return[e,s,i]}get_children(t){let e=this._traverse_path(t);return e==null?void 0:e.children.map(i=>i.data)}async request_ceval_and_get_at(t){let e=this.get_at(t);if(e)return e.eval_accuracy=await Le.request_move_data(e.before_fen,e.after_fen),e}get_at(t){let e=this._traverse_path(t);return e==null?void 0:e.data}append_uci(t,e=[]){this.append_ucis([...e,t])}append_ucis(t){let[e,i,s]=this._find_path(t);for(let r of s){let h=Q.make(P.make_data(i.data.after_fen,r,i.data.ply+1,e)),a=Ot(()=>i.children);i.children=[...a,h],i=h,e=[...e,r]}}};T(P,"make",(t,e)=>{let i=e[0],s=e.slice(1),r=new P(Q.make(P.make_data(t,i,1,[])));return r.append_ucis(s),r});let mt=P;export{Ut as C,ke as I,Lt as M,Kt as P,mt as a,Re as b,G as c,Jt as d,D as m,Et as p,b as s};