import{o as Ct,a as $t}from"./index-BAagO4GW.js";const tt=["a","b","c","d","e","f","g","h"],It=["1","2","3","4","5","6","7","8"],T=["white","black"],C=["pawn","knight","bishop","rook","queen","king"],jt=["a","h"],V=n=>"role"in n,l=n=>n!==void 0,k=n=>n==="white"?"black":"white",z=n=>n>>3,w=n=>n&7,ht=(n,t)=>0<=n&&n<8&&0<=t&&t<8?n+8*t:void 0,M=n=>{switch(n){case"pawn":return"p";case"knight":return"n";case"bishop":return"b";case"rook":return"r";case"queen":return"q";case"king":return"k"}};function G(n){switch(n.toLowerCase()){case"p":return"pawn";case"n":return"knight";case"b":return"bishop";case"r":return"rook";case"q":return"queen";case"k":return"king";default:return}}function S(n){if(n.length===2)return ht(n.charCodeAt(0)-97,n.charCodeAt(1)-49)}const N=n=>tt[w(n)]+It[z(n)],kt=n=>{if(n[1]==="@"&&n.length===4){const t=G(n[0]),e=S(n.slice(2));if(t&&l(e))return{role:t,to:e}}else if(n.length===4||n.length===5){const t=S(n.slice(0,2)),e=S(n.slice(2,4));let i;if(n.length===5&&(i=G(n[4]),!i))return;if(l(t)&&l(e))return{from:t,to:e,promotion:i}}},Rt=n=>V(n)?`${M(n.role).toUpperCase()}@${N(n.to)}`:N(n.from)+N(n.to)+(n.promotion?M(n.promotion):""),mt=(n,t)=>n==="white"?t==="a"?2:6:t==="a"?58:62,wt=(n,t)=>n==="white"?t==="a"?3:5:t==="a"?59:61,_t=n=>(n=n-(n>>>1&1431655765),n=(n&858993459)+(n>>>2&858993459),Math.imul(n+(n>>>4)&252645135,16843009)>>24),at=n=>(n=n>>>8&16711935|(n&16711935)<<8,n>>>16&65535|(n&65535)<<16),At=n=>(n=n>>>1&1431655765|(n&1431655765)<<1,n=n>>>2&858993459|(n&858993459)<<2,n=n>>>4&252645135|(n&252645135)<<4,at(n));class o{constructor(t,e){this.lo=t|0,this.hi=e|0}static fromSquare(t){return t>=32?new o(0,1<<t-32):new o(1<<t,0)}static fromRank(t){return new o(255,0).shl64(8*t)}static fromFile(t){return new o(16843009<<t,16843009<<t)}static empty(){return new o(0,0)}static full(){return new o(4294967295,4294967295)}static corners(){return new o(129,2164260864)}static center(){return new o(402653184,24)}static backranks(){return new o(255,4278190080)}static backrank(t){return t==="white"?new o(255,0):new o(0,4278190080)}static lightSquares(){return new o(1437226410,1437226410)}static darkSquares(){return new o(2857740885,2857740885)}complement(){return new o(~this.lo,~this.hi)}xor(t){return new o(this.lo^t.lo,this.hi^t.hi)}union(t){return new o(this.lo|t.lo,this.hi|t.hi)}intersect(t){return new o(this.lo&t.lo,this.hi&t.hi)}diff(t){return new o(this.lo&~t.lo,this.hi&~t.hi)}intersects(t){return this.intersect(t).nonEmpty()}isDisjoint(t){return this.intersect(t).isEmpty()}supersetOf(t){return t.diff(this).isEmpty()}subsetOf(t){return this.diff(t).isEmpty()}shr64(t){return t>=64?o.empty():t>=32?new o(this.hi>>>t-32,0):t>0?new o(this.lo>>>t^this.hi<<32-t,this.hi>>>t):this}shl64(t){return t>=64?o.empty():t>=32?new o(0,this.lo<<t-32):t>0?new o(this.lo<<t,this.hi<<t^this.lo>>>32-t):this}bswap64(){return new o(at(this.hi),at(this.lo))}rbit64(){return new o(At(this.hi),At(this.lo))}minus64(t){const e=this.lo-t.lo,i=(e&t.lo&1)+(t.lo>>>1)+(e>>>1)>>>31;return new o(e,this.hi-(t.hi+i))}equals(t){return this.lo===t.lo&&this.hi===t.hi}size(){return _t(this.lo)+_t(this.hi)}isEmpty(){return this.lo===0&&this.hi===0}nonEmpty(){return this.lo!==0||this.hi!==0}has(t){return(t>=32?this.hi&1<<t-32:this.lo&1<<t)!==0}set(t,e){return e?this.with(t):this.without(t)}with(t){return t>=32?new o(this.lo,this.hi|1<<t-32):new o(this.lo|1<<t,this.hi)}without(t){return t>=32?new o(this.lo,this.hi&~(1<<t-32)):new o(this.lo&~(1<<t),this.hi)}toggle(t){return t>=32?new o(this.lo,this.hi^1<<t-32):new o(this.lo^1<<t,this.hi)}last(){if(this.hi!==0)return 63-Math.clz32(this.hi);if(this.lo!==0)return 31-Math.clz32(this.lo)}first(){if(this.lo!==0)return 31-Math.clz32(this.lo&-this.lo);if(this.hi!==0)return 63-Math.clz32(this.hi&-this.hi)}withoutFirst(){return this.lo!==0?new o(this.lo&this.lo-1,this.hi):new o(0,this.hi&this.hi-1)}moreThanOne(){return this.hi!==0&&this.lo!==0||(this.lo&this.lo-1)!==0||(this.hi&this.hi-1)!==0}singleSquare(){return this.moreThanOne()?void 0:this.last()}*[Symbol.iterator](){let t=this.lo,e=this.hi;for(;t!==0;){const i=31-Math.clz32(t&-t);t^=1<<i,yield i}for(;e!==0;){const i=31-Math.clz32(e&-e);e^=1<<i,yield 32+i}}*reversed(){let t=this.lo,e=this.hi;for(;e!==0;){const i=31-Math.clz32(e);e^=1<<i,yield 32+i}for(;t!==0;){const i=31-Math.clz32(t);t^=1<<i,yield i}}}const et=(n,t)=>{let e=o.empty();for(const i of t){const s=n+i;0<=s&&s<64&&Math.abs(w(n)-w(s))<=2&&(e=e.with(s))}return e},P=n=>{const t=[];for(let e=0;e<64;e++)t[e]=n(e);return t},Ht=P(n=>et(n,[-9,-8,-7,-1,1,7,8,9])),Vt=P(n=>et(n,[-17,-15,-10,-6,6,10,15,17])),Zt={white:P(n=>et(n,[7,9])),black:P(n=>et(n,[-7,-9]))},nt=n=>Ht[n],it=n=>Vt[n],J=(n,t)=>Zt[n][t],ct=P(n=>o.fromFile(w(n)).without(n)),lt=P(n=>o.fromRank(z(n)).without(n)),ut=P(n=>{const t=new o(134480385,2151686160),e=8*(z(n)-w(n));return(e>=0?t.shl64(e):t.shr64(-e)).without(n)}),ft=P(n=>{const t=new o(270549120,16909320),e=8*(z(n)+w(n)-7);return(e>=0?t.shl64(e):t.shr64(-e)).without(n)}),dt=(n,t,e)=>{let i=e.intersect(t),s=i.bswap64();return i=i.minus64(n),s=s.minus64(n.bswap64()),i.xor(s.bswap64()).intersect(t)},Yt=(n,t)=>dt(o.fromSquare(n),ct[n],t),Jt=(n,t)=>{const e=lt[n];let i=t.intersect(e),s=i.rbit64();return i=i.minus64(o.fromSquare(n)),s=s.minus64(o.fromSquare(63-n)),i.xor(s.rbit64()).intersect(e)},Q=(n,t)=>{const e=o.fromSquare(n);return dt(e,ut[n],t).xor(dt(e,ft[n],t))},W=(n,t)=>Yt(n,t).xor(Jt(n,t)),gt=(n,t)=>Q(n,t).xor(W(n,t)),Xt=(n,t,e)=>{switch(n.role){case"pawn":return J(n.color,t);case"knight":return it(t);case"bishop":return Q(t,e);case"rook":return W(t,e);case"queen":return gt(t,e);case"king":return nt(t)}},Tt=(n,t)=>{const e=o.fromSquare(t);return lt[n].intersects(e)?lt[n].with(n):ft[n].intersects(e)?ft[n].with(n):ut[n].intersects(e)?ut[n].with(n):ct[n].intersects(e)?ct[n].with(n):o.empty()},Z=(n,t)=>Tt(n,t).intersect(o.full().shl64(n).xor(o.full().shl64(t))).withoutFirst();class U{constructor(){}static default(){const t=new U;return t.reset(),t}reset(){this.occupied=new o(65535,4294901760),this.promoted=o.empty(),this.white=new o(65535,0),this.black=new o(0,4294901760),this.pawn=new o(65280,16711680),this.knight=new o(66,1107296256),this.bishop=new o(36,603979776),this.rook=new o(129,2164260864),this.queen=new o(8,134217728),this.king=new o(16,268435456)}static empty(){const t=new U;return t.clear(),t}clear(){this.occupied=o.empty(),this.promoted=o.empty();for(const t of T)this[t]=o.empty();for(const t of C)this[t]=o.empty()}clone(){const t=new U;t.occupied=this.occupied,t.promoted=this.promoted;for(const e of T)t[e]=this[e];for(const e of C)t[e]=this[e];return t}getColor(t){if(this.white.has(t))return"white";if(this.black.has(t))return"black"}getRole(t){for(const e of C)if(this[e].has(t))return e}get(t){const e=this.getColor(t);if(!e)return;const i=this.getRole(t),s=this.promoted.has(t);return{color:e,role:i,promoted:s}}take(t){const e=this.get(t);return e&&(this.occupied=this.occupied.without(t),this[e.color]=this[e.color].without(t),this[e.role]=this[e.role].without(t),e.promoted&&(this.promoted=this.promoted.without(t))),e}set(t,e){const i=this.take(t);return this.occupied=this.occupied.with(t),this[e.color]=this[e.color].with(t),this[e.role]=this[e.role].with(t),e.promoted&&(this.promoted=this.promoted.with(t)),i}has(t){return this.occupied.has(t)}*[Symbol.iterator](){for(const t of this.occupied)yield[t,this.get(t)]}pieces(t,e){return this[t].intersect(this[e])}rooksAndQueens(){return this.rook.union(this.queen)}bishopsAndQueens(){return this.bishop.union(this.queen)}kingOf(t){return this.pieces(t,"king").singleSquare()}}class R{constructor(){}static empty(){const t=new R;for(const e of C)t[e]=0;return t}static fromBoard(t,e){const i=new R;for(const s of C)i[s]=t.pieces(e,s).size();return i}clone(){const t=new R;for(const e of C)t[e]=this[e];return t}equals(t){return C.every(e=>this[e]===t[e])}add(t){const e=new R;for(const i of C)e[i]=this[i]+t[i];return e}subtract(t){const e=new R;for(const i of C)e[i]=this[i]-t[i];return e}nonEmpty(){return C.some(t=>this[t]>0)}isEmpty(){return!this.nonEmpty()}hasPawns(){return this.pawn>0}hasNonPawns(){return this.knight>0||this.bishop>0||this.rook>0||this.queen>0||this.king>0}size(){return this.pawn+this.knight+this.bishop+this.rook+this.queen+this.king}}class v{constructor(t,e){this.white=t,this.black=e}static empty(){return new v(R.empty(),R.empty())}static fromBoard(t){return new v(R.fromBoard(t,"white"),R.fromBoard(t,"black"))}clone(){return new v(this.white.clone(),this.black.clone())}equals(t){return this.white.equals(t.white)&&this.black.equals(t.black)}add(t){return new v(this.white.add(t.white),this.black.add(t.black))}subtract(t){return new v(this.white.subtract(t.white),this.black.subtract(t.black))}count(t){return this.white[t]+this.black[t]}size(){return this.white.size()+this.black.size()}isEmpty(){return this.white.isEmpty()&&this.black.isEmpty()}nonEmpty(){return!this.isEmpty()}hasPawns(){return this.white.hasPawns()||this.black.hasPawns()}hasNonPawns(){return this.white.hasNonPawns()||this.black.hasNonPawns()}}class Y{constructor(t,e){this.white=t,this.black=e}static default(){return new Y(3,3)}clone(){return new Y(this.white,this.black)}equals(t){return this.white===t.white&&this.black===t.black}}class zt{unwrap(t,e){const i=this._chain(s=>u.ok(t?t(s):s),s=>e?u.ok(e(s)):u.err(s));if(i.isErr)throw i.error;return i.value}map(t,e){return this._chain(i=>u.ok(t(i)),i=>u.err(e?e(i):i))}chain(t,e){return this._chain(t,e||(i=>u.err(i)))}}class qt extends zt{constructor(t){super(),this.value=void 0,this.isOk=!0,this.isErr=!1,this.value=t}_chain(t,e){return t(this.value)}}class te extends zt{constructor(t){super(),this.error=void 0,this.isOk=!1,this.isErr=!0,this.error=t}_chain(t,e){return e(this.error)}}var u;(function(n){n.ok=function(t){return new qt(t)},n.err=function(t){return new te(t||new Error)},n.all=function(t){if(Array.isArray(t)){const s=[];for(let r=0;r<t.length;r++){const h=t[r];if(h.isErr)return h;s.push(h.value)}return n.ok(s)}const e={},i=Object.keys(t);for(let s=0;s<i.length;s++){const r=t[i[s]];if(r.isErr)return r;e[i[s]]=r.value}return n.ok(e)}})(u||(u={}));var O;(function(n){n.Empty="ERR_EMPTY",n.OppositeCheck="ERR_OPPOSITE_CHECK",n.PawnsOnBackrank="ERR_PAWNS_ON_BACKRANK",n.Kings="ERR_KINGS",n.Variant="ERR_VARIANT"})(O||(O={}));class L extends Error{}const ee=(n,t,e,i)=>e[t].intersect(W(n,i).intersect(e.rooksAndQueens()).union(Q(n,i).intersect(e.bishopsAndQueens())).union(it(n).intersect(e.knight)).union(nt(n).intersect(e.king)).union(J(k(t),n).intersect(e.pawn)));class B{constructor(){}static default(){const t=new B;return t.castlingRights=o.corners(),t.rook={white:{a:0,h:7},black:{a:56,h:63}},t.path={white:{a:new o(14,0),h:new o(96,0)},black:{a:new o(0,234881024),h:new o(0,1610612736)}},t}static empty(){const t=new B;return t.castlingRights=o.empty(),t.rook={white:{a:void 0,h:void 0},black:{a:void 0,h:void 0}},t.path={white:{a:o.empty(),h:o.empty()},black:{a:o.empty(),h:o.empty()}},t}clone(){const t=new B;return t.castlingRights=this.castlingRights,t.rook={white:{a:this.rook.white.a,h:this.rook.white.h},black:{a:this.rook.black.a,h:this.rook.black.h}},t.path={white:{a:this.path.white.a,h:this.path.white.h},black:{a:this.path.black.a,h:this.path.black.h}},t}add(t,e,i,s){const r=mt(t,e),h=wt(t,e);this.castlingRights=this.castlingRights.with(s),this.rook[t][e]=s,this.path[t][e]=Z(s,h).with(h).union(Z(i,r).with(r)).without(i).without(s)}static fromSetup(t){const e=B.empty(),i=t.castlingRights.intersect(t.board.rook);for(const s of T){const r=o.backrank(s),h=t.board.kingOf(s);if(!l(h)||!r.has(h))continue;const a=i.intersect(t.board[s]).intersect(r),c=a.first();l(c)&&c<h&&e.add(s,"a",h,c);const f=a.last();l(f)&&h<f&&e.add(s,"h",h,f)}return e}discardRook(t){if(this.castlingRights.has(t)){this.castlingRights=this.castlingRights.without(t);for(const e of T)for(const i of jt)this.rook[e][i]===t&&(this.rook[e][i]=void 0)}}discardColor(t){this.castlingRights=this.castlingRights.diff(o.backrank(t)),this.rook[t].a=void 0,this.rook[t].h=void 0}}class ne{constructor(t){this.rules=t}reset(){this.board=U.default(),this.pockets=void 0,this.turn="white",this.castles=B.default(),this.epSquare=void 0,this.remainingChecks=void 0,this.halfmoves=0,this.fullmoves=1}setupUnchecked(t){this.board=t.board.clone(),this.board.promoted=o.empty(),this.pockets=void 0,this.turn=t.turn,this.castles=B.fromSetup(t),this.epSquare=ie(this,t.epSquare),this.remainingChecks=void 0,this.halfmoves=t.halfmoves,this.fullmoves=t.fullmoves}kingAttackers(t,e,i){return ee(t,e,this.board,i)}playCaptureAt(t,e){this.halfmoves=0,e.role==="rook"&&this.castles.discardRook(t),this.pockets&&this.pockets[k(e.color)][e.promoted?"pawn":e.role]++}ctx(){const t=this.isVariantEnd(),e=this.board.kingOf(this.turn);if(!l(e))return{king:e,blockers:o.empty(),checkers:o.empty(),variantEnd:t,mustCapture:!1};const i=W(e,o.empty()).intersect(this.board.rooksAndQueens()).union(Q(e,o.empty()).intersect(this.board.bishopsAndQueens())).intersect(this.board[k(this.turn)]);let s=o.empty();for(const h of i){const a=Z(e,h).intersect(this.board.occupied);a.moreThanOne()||(s=s.union(a))}const r=this.kingAttackers(e,k(this.turn),this.board.occupied);return{king:e,blockers:s,checkers:r,variantEnd:t,mustCapture:!1}}clone(){var t,e;const i=new this.constructor;return i.board=this.board.clone(),i.pockets=(t=this.pockets)===null||t===void 0?void 0:t.clone(),i.turn=this.turn,i.castles=this.castles.clone(),i.epSquare=this.epSquare,i.remainingChecks=(e=this.remainingChecks)===null||e===void 0?void 0:e.clone(),i.halfmoves=this.halfmoves,i.fullmoves=this.fullmoves,i}validate(){if(this.board.occupied.isEmpty())return u.err(new L(O.Empty));if(this.board.king.size()!==2)return u.err(new L(O.Kings));if(!l(this.board.kingOf(this.turn)))return u.err(new L(O.Kings));const t=this.board.kingOf(k(this.turn));return l(t)?this.kingAttackers(t,this.turn,this.board.occupied).nonEmpty()?u.err(new L(O.OppositeCheck)):o.backranks().intersects(this.board.pawn)?u.err(new L(O.PawnsOnBackrank)):u.ok(void 0):u.err(new L(O.Kings))}dropDests(t){return o.empty()}dests(t,e){if(e=e||this.ctx(),e.variantEnd)return o.empty();const i=this.board.get(t);if(!i||i.color!==this.turn)return o.empty();let s,r;if(i.role==="pawn"){s=J(this.turn,t).intersect(this.board[k(this.turn)]);const h=this.turn==="white"?8:-8,a=t+h;if(0<=a&&a<64&&!this.board.occupied.has(a)){s=s.with(a);const c=this.turn==="white"?t<16:t>=48,f=a+h;c&&!this.board.occupied.has(f)&&(s=s.with(f))}l(this.epSquare)&&re(this,t,e)&&(r=o.fromSquare(this.epSquare))}else i.role==="bishop"?s=Q(t,this.board.occupied):i.role==="knight"?s=it(t):i.role==="rook"?s=W(t,this.board.occupied):i.role==="queen"?s=gt(t,this.board.occupied):s=nt(t);if(s=s.diff(this.board[this.turn]),l(e.king)){if(i.role==="king"){const h=this.board.occupied.without(t);for(const a of s)this.kingAttackers(a,k(this.turn),h).nonEmpty()&&(s=s.without(a));return s.union(Ot(this,"a",e)).union(Ot(this,"h",e))}if(e.checkers.nonEmpty()){const h=e.checkers.singleSquare();if(!l(h))return o.empty();s=s.intersect(Z(h,e.king).with(h))}e.blockers.has(t)&&(s=s.intersect(Tt(t,e.king)))}return r&&(s=s.union(r)),s}isVariantEnd(){return!1}variantOutcome(t){}hasInsufficientMaterial(t){return this.board[t].intersect(this.board.pawn.union(this.board.rooksAndQueens())).nonEmpty()?!1:this.board[t].intersects(this.board.knight)?this.board[t].size()<=2&&this.board[k(t)].diff(this.board.king).diff(this.board.queen).isEmpty():this.board[t].intersects(this.board.bishop)?(!this.board.bishop.intersects(o.darkSquares())||!this.board.bishop.intersects(o.lightSquares()))&&this.board.pawn.isEmpty()&&this.board.knight.isEmpty():!0}toSetup(){var t,e;return{board:this.board.clone(),pockets:(t=this.pockets)===null||t===void 0?void 0:t.clone(),turn:this.turn,castlingRights:this.castles.castlingRights,epSquare:se(this),remainingChecks:(e=this.remainingChecks)===null||e===void 0?void 0:e.clone(),halfmoves:Math.min(this.halfmoves,150),fullmoves:Math.min(Math.max(this.fullmoves,1),9999)}}isInsufficientMaterial(){return T.every(t=>this.hasInsufficientMaterial(t))}hasDests(t){t=t||this.ctx();for(const e of this.board[this.turn])if(this.dests(e,t).nonEmpty())return!0;return this.dropDests(t).nonEmpty()}isLegal(t,e){if(V(t))return!this.pockets||this.pockets[this.turn][t.role]<=0||t.role==="pawn"&&o.backranks().has(t.to)?!1:this.dropDests(e).has(t.to);{if(t.promotion==="pawn"||t.promotion==="king"&&this.rules!=="antichess"||!!t.promotion!==(this.board.pawn.has(t.from)&&o.backranks().has(t.to)))return!1;const i=this.dests(t.from,e);return i.has(t.to)||i.has(oe(this,t).to)}}isCheck(){const t=this.board.kingOf(this.turn);return l(t)&&this.kingAttackers(t,k(this.turn),this.board.occupied).nonEmpty()}isEnd(t){return(t?t.variantEnd:this.isVariantEnd())?!0:this.isInsufficientMaterial()||!this.hasDests(t)}isCheckmate(t){return t=t||this.ctx(),!t.variantEnd&&t.checkers.nonEmpty()&&!this.hasDests(t)}isStalemate(t){return t=t||this.ctx(),!t.variantEnd&&t.checkers.isEmpty()&&!this.hasDests(t)}outcome(t){const e=this.variantOutcome(t);return e||(t=t||this.ctx(),this.isCheckmate(t)?{winner:k(this.turn)}:this.isInsufficientMaterial()||this.isStalemate(t)?{winner:void 0}:void 0)}allDests(t){t=t||this.ctx();const e=new Map;if(t.variantEnd)return e;for(const i of this.board[this.turn])e.set(i,this.dests(i,t));return e}play(t){const e=this.turn,i=this.epSquare,s=Kt(this,t);if(this.epSquare=void 0,this.halfmoves+=1,e==="black"&&(this.fullmoves+=1),this.turn=k(e),V(t))this.board.set(t.to,{role:t.role,color:e}),this.pockets&&this.pockets[e][t.role]--,t.role==="pawn"&&(this.halfmoves=0);else{const r=this.board.take(t.from);if(!r)return;let h;if(r.role==="pawn"){this.halfmoves=0,t.to===i&&(h=this.board.take(t.to+(e==="white"?-8:8)));const a=t.from-t.to;Math.abs(a)===16&&8<=t.from&&t.from<=55&&(this.epSquare=t.from+t.to>>1),t.promotion&&(r.role=t.promotion,r.promoted=!!this.pockets)}else if(r.role==="rook")this.castles.discardRook(t.from);else if(r.role==="king"){if(s){const a=this.castles.rook[e][s];if(l(a)){const c=this.board.take(a);this.board.set(mt(e,s),r),c&&this.board.set(wt(e,s),c)}}this.castles.discardColor(e)}if(!s){const a=this.board.set(t.to,r)||h;a&&this.playCaptureAt(t.to,a)}}this.remainingChecks&&this.isCheck()&&(this.remainingChecks[e]=Math.max(this.remainingChecks[e]-1,0))}}class X extends ne{constructor(){super("chess")}static default(){const t=new this;return t.reset(),t}static fromSetup(t){const e=new this;return e.setupUnchecked(t),e.validate().map(i=>e)}clone(){return super.clone()}}const ie=(n,t)=>{if(!l(t))return;const e=n.turn==="white"?5:2,i=n.turn==="white"?8:-8;if(z(t)!==e||n.board.occupied.has(t+i))return;const s=t-i;if(!(!n.board.pawn.has(s)||!n.board[k(n.turn)].has(s)))return t},se=n=>{if(!l(n.epSquare))return;const t=n.ctx(),i=n.board.pieces(n.turn,"pawn").intersect(J(k(n.turn),n.epSquare));for(const s of i)if(n.dests(s,t).has(n.epSquare))return n.epSquare},re=(n,t,e)=>{if(!l(n.epSquare)||!J(n.turn,t).has(n.epSquare))return!1;if(!l(e.king))return!0;const i=n.turn==="white"?8:-8,s=n.epSquare-i;return n.kingAttackers(e.king,k(n.turn),n.board.occupied.toggle(t).toggle(s).with(n.epSquare)).without(s).isEmpty()},Ot=(n,t,e)=>{if(!l(e.king)||e.checkers.nonEmpty())return o.empty();const i=n.castles.rook[n.turn][t];if(!l(i)||n.castles.path[n.turn][t].intersects(n.board.occupied))return o.empty();const s=mt(n.turn,t),r=Z(e.king,s),h=n.board.occupied.without(e.king);for(const f of r)if(n.kingAttackers(f,k(n.turn),h).nonEmpty())return o.empty();const a=wt(n.turn,t),c=n.board.occupied.toggle(e.king).toggle(i).toggle(a);return n.kingAttackers(s,k(n.turn),c).nonEmpty()?o.empty():o.fromSquare(i)},Kt=(n,t)=>{if(V(t))return;const e=t.to-t.from;if(!(Math.abs(e)!==2&&!n.board[n.turn].has(t.to))&&n.board.king.has(t.from))return e>0?"h":"a"},oe=(n,t)=>{const e=Kt(n,t);if(!e)return t;const i=n.castles.rook[n.turn][e];return{from:t.from,to:l(i)?i:t.to}},he=(n,t)=>{const e=new Map,i=n.ctx();for(const[s,r]of n.allDests(i))if(r.nonEmpty()){const h=Array.from(r,N);s===i.king&&w(s)===4&&(r.has(0)?h.push("c1"):r.has(56)&&h.push("c8"),r.has(7)?h.push("g1"):r.has(63)&&h.push("g8")),e.set(N(s),h)}return e},ae="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",ce=ae+" w KQkq -",Lt=ce+" 0 1";var d;(function(n){n.Fen="ERR_FEN",n.Board="ERR_BOARD",n.Pockets="ERR_POCKETS",n.Turn="ERR_TURN",n.Castling="ERR_CASTLING",n.EpSquare="ERR_EP_SQUARE",n.RemainingChecks="ERR_REMAINING_CHECKS",n.Halfmoves="ERR_HALFMOVES",n.Fullmoves="ERR_FULLMOVES"})(d||(d={}));class m extends Error{}const le=(n,t,e)=>{let i=n.indexOf(t);for(;e-- >0&&i!==-1;)i=n.indexOf(t,i+t.length);return i},F=n=>/^\d{1,4}$/.test(n)?parseInt(n,10):void 0,Ft=n=>{const t=G(n);return t&&{role:t,color:n.toLowerCase()===n?"black":"white"}},st=n=>{const t=U.empty();let e=7,i=0;for(let s=0;s<n.length;s++){const r=n[s];if(r==="/"&&i===8)i=0,e--;else{const h=parseInt(r,10);if(h>0)i+=h;else{if(i>=8||e<0)return u.err(new m(d.Board));const a=i+e*8,c=Ft(r);if(!c)return u.err(new m(d.Board));n[s+1]==="~"&&(c.promoted=!0,s++),t.set(a,c),i++}}}return e!==0||i!==8?u.err(new m(d.Board)):u.ok(t)},Nt=n=>{if(n.length>64)return u.err(new m(d.Pockets));const t=v.empty();for(const e of n){const i=Ft(e);if(!i)return u.err(new m(d.Pockets));t[i.color][i.role]++}return u.ok(t)},ue=(n,t)=>{let e=o.empty();if(t==="-")return u.ok(e);for(const i of t){const s=i.toLowerCase(),r=i===s?"black":"white",h=r==="white"?0:7;if("a"<=s&&s<="h")e=e.with(ht(s.charCodeAt(0)-97,h));else if(s==="k"||s==="q"){const a=n[r].intersect(o.backrank(r)).intersect(n.rook.union(n.king)),c=s==="k"?a.last():a.first();e=e.with(l(c)&&n.rook.has(c)?c:ht(s==="k"?7:0,h))}else return u.err(new m(d.Castling))}return T.some(i=>o.backrank(i).intersect(e).size()>2)?u.err(new m(d.Castling)):u.ok(e)},Pt=n=>{const t=n.split("+");if(t.length===3&&t[0]===""){const e=F(t[1]),i=F(t[2]);return!l(e)||e>3||!l(i)||i>3?u.err(new m(d.RemainingChecks)):u.ok(new Y(3-e,3-i))}else if(t.length===2){const e=F(t[0]),i=F(t[1]);return!l(e)||e>3||!l(i)||i>3?u.err(new m(d.RemainingChecks)):u.ok(new Y(e,i))}else return u.err(new m(d.RemainingChecks))},$=n=>{const t=n.split(/[\s_]+/),e=t.shift();let i,s=u.ok(void 0);if(e.endsWith("]")){const a=e.indexOf("[");if(a===-1)return u.err(new m(d.Fen));i=st(e.slice(0,a)),s=Nt(e.slice(a+1,-1))}else{const a=le(e,"/",7);a===-1?i=st(e):(i=st(e.slice(0,a)),s=Nt(e.slice(a+1)))}let r;const h=t.shift();if(!l(h)||h==="w")r="white";else if(h==="b")r="black";else return u.err(new m(d.Turn));return i.chain(a=>{const c=t.shift(),f=l(c)?ue(a,c):u.ok(o.empty()),p=t.shift();let b;if(l(p)&&p!=="-"&&(b=S(p),!l(b)))return u.err(new m(d.EpSquare));let g=t.shift(),E;l(g)&&g.includes("+")&&(E=Pt(g),g=t.shift());const _=l(g)?F(g):0;if(!l(_))return u.err(new m(d.Halfmoves));const x=t.shift(),j=l(x)?F(x):1;if(!l(j))return u.err(new m(d.Fullmoves));const y=t.shift();let A=u.ok(void 0);if(l(y)){if(l(E))return u.err(new m(d.RemainingChecks));A=Pt(y)}else l(E)&&(A=E);return t.length>0?u.err(new m(d.Fen)):s.chain(K=>f.chain(H=>A.map(q=>({board:a,pockets:K,turn:r,castlingRights:H,remainingChecks:q,epSquare:b,halfmoves:_,fullmoves:Math.max(1,j)}))))})},fe=n=>{let t=M(n.role);return n.color==="white"&&(t=t.toUpperCase()),n.promoted&&(t+="~"),t},de=n=>{let t="",e=0;for(let i=7;i>=0;i--)for(let s=0;s<8;s++){const r=s+i*8,h=n.get(r);h?(e>0&&(t+=e,e=0),t+=fe(h)):e++,s===7&&(e>0&&(t+=e,e=0),i!==0&&(t+="/"))}return t},xt=n=>C.map(t=>M(t).repeat(n[t])).join(""),pe=n=>xt(n.white).toUpperCase()+xt(n.black),ke=(n,t)=>{let e="";for(const i of T){const s=o.backrank(i);let r=n.kingOf(i);l(r)&&!s.has(r)&&(r=void 0);const h=n.pieces(i,"rook").intersect(s);for(const a of t.intersect(s).reversed())if(a===h.first()&&l(r)&&a<r)e+=i==="white"?"Q":"q";else if(a===h.last()&&l(r)&&r<a)e+=i==="white"?"K":"k";else{const c=tt[w(a)];e+=i==="white"?c.toUpperCase():c}}return e||"-"},me=n=>`${n.white}+${n.black}`,Dt=(n,t)=>[de(n.board)+(n.pockets?`[${pe(n.pockets)}]`:""),n.turn[0],ke(n.board,n.castlingRights),l(n.epSquare)?N(n.epSquare):"-",...n.remainingChecks?[me(n.remainingChecks)]:[],Math.max(0,Math.min(n.halfmoves,9999)),Math.max(1,Math.min(n.fullmoves,9999))].join(" "),we=(n,t)=>{let e="";if(V(t))t.role!=="pawn"&&(e=M(t.role).toUpperCase()),e+="@"+N(t.to);else{const i=n.board.getRole(t.from);if(!i)return"--";if(i==="king"&&(n.board[n.turn].has(t.to)||Math.abs(t.to-t.from)===2))e=t.to>t.from?"O-O":"O-O-O";else{const s=n.board.occupied.has(t.to)||i==="pawn"&&w(t.from)!==w(t.to);if(i!=="pawn"){e=M(i).toUpperCase();let r;if(i==="king"?r=nt(t.to).intersect(n.board.king):i==="queen"?r=gt(t.to,n.board.occupied).intersect(n.board.queen):i==="rook"?r=W(t.to,n.board.occupied).intersect(n.board.rook):i==="bishop"?r=Q(t.to,n.board.occupied).intersect(n.board.bishop):r=it(t.to).intersect(n.board.knight),r=r.intersect(n.board[n.turn]).without(t.from),r.nonEmpty()){const h=n.ctx();for(const a of r)n.dests(a,h).has(t.to)||(r=r.without(a));if(r.nonEmpty()){let a=!1,c=r.intersects(o.fromRank(z(t.from)));r.intersects(o.fromFile(w(t.from)))?a=!0:c=!0,c&&(e+=tt[w(t.from)]),a&&(e+=It[z(t.from)])}}}else s&&(e=tt[w(t.from)]);s&&(e+="x"),e+=N(t.to),t.promotion&&(e+="="+M(t.promotion).toUpperCase())}}return e},ge=(n,t)=>{var e;const i=we(n,t);return n.play(t),!((e=n.outcome())===null||e===void 0)&&e.winner?i+"#":n.isCheck()?i+"+":i},Gt=(n,t)=>ge(n.clone(),t),vt=(n,t)=>{const e=n.ctx(),i=t.match(/^([NBRQK])?([a-h])?([1-8])?[-x]?([a-h][1-8])(?:=?([nbrqkNBRQK]))?[+#]?$/);if(!i){let p;if(t==="O-O"||t==="O-O+"||t==="O-O#"?p="h":(t==="O-O-O"||t==="O-O-O+"||t==="O-O-O#")&&(p="a"),p){const E=n.castles.rook[n.turn][p];return!l(e.king)||!l(E)||!n.dests(e.king,e).has(E)?void 0:{from:e.king,to:E}}const b=t.match(/^([pnbrqkPNBRQK])?@([a-h][1-8])[+#]?$/);if(!b)return;const g={role:b[1]?G(b[1]):"pawn",to:S(b[2])};return n.isLegal(g,e)?g:void 0}const s=i[1]?G(i[1]):"pawn",r=S(i[4]),h=i[5]?G(i[5]):void 0;if(!!h!==(s==="pawn"&&o.backranks().has(r))||h==="king"&&n.rules!=="antichess")return;let a=n.board.pieces(n.turn,s);s==="pawn"&&!i[2]?a=a.intersect(o.fromFile(w(r))):i[2]&&(a=a.intersect(o.fromFile(i[2].charCodeAt(0)-97))),i[3]&&(a=a.intersect(o.fromRank(i[3].charCodeAt(0)-49)));const c=s==="pawn"?o.fromFile(w(r)):o.empty();a=a.intersect(c.union(Xt({color:k(n.turn),role:s},r,n.board.occupied)));let f;for(const p of a)if(n.dests(p,e).has(r)){if(l(f))return;f=p}if(l(f))return{from:f,to:r,promotion:h}},be=(n=bt)=>({headers:n(),moves:new St});class St{constructor(){this.children=[]}*mainlineNodes(){let t=this;for(;t.children.length;){const e=t.children[0];yield e,t=e}}*mainline(){for(const t of this.mainlineNodes())yield t.data}end(){let t=this;for(;t.children.length;)t=t.children[0];return t}}class Ee extends St{constructor(t){super(),this.data=t}}const bt=()=>new Map([["Event","?"],["Site","?"],["Date","????.??.??"],["Round","?"],["White","?"],["Black","?"],["Result","*"]]),Bt="\uFEFF",rt=n=>/^\s*$/.test(n),ot=n=>n.startsWith("%");class ye extends Error{}class Ce{constructor(t,e=bt,i=1e6){this.emitGame=t,this.initHeaders=e,this.maxBudget=i,this.lineBuf=[],this.resetGame(),this.state=0}resetGame(){this.budget=this.maxBudget,this.found=!1,this.state=1,this.game=be(this.initHeaders),this.stack=[{parent:this.game.moves,root:!0}],this.commentBuf=[]}consumeBudget(t){if(this.budget-=t,this.budget<0)throw new ye("ERR_PGN_BUDGET")}parse(t,e){if(!(this.budget<0))try{let i=0;for(;;){const s=t.indexOf(`
`,i);if(s===-1)break;const r=s>i&&t[s-1]==="\r"?s-1:s;this.consumeBudget(s-i),this.lineBuf.push(t.slice(i,r)),i=s+1,this.handleLine()}this.consumeBudget(t.length-i),this.lineBuf.push(t.slice(i)),e?.stream||(this.handleLine(),this.emit(void 0))}catch(i){this.emit(i)}}handleLine(){let t=!0,e=this.lineBuf.join("");this.lineBuf=[];t:for(;;)switch(this.state){case 0:e.startsWith(Bt)&&(e=e.slice(Bt.length)),this.state=1;case 1:if(rt(e)||ot(e))return;this.found=!0,this.state=2;case 2:{if(ot(e))return;let i=!0;for(;i;)i=!1,e=e.replace(/^\s*\[([A-Za-z0-9][A-Za-z0-9_+#=:-]*)\s+"((?:[^"\\]|\\"|\\\\)*)"\]/,(s,r,h)=>(this.consumeBudget(200),this.game.headers.set(r,h.replace(/\\"/g,'"').replace(/\\\\/g,"\\")),i=!0,t=!1,""));if(rt(e))return;this.state=3}case 3:{if(t){if(ot(e))return;if(rt(e))return this.emit(void 0)}const i=/(?:[NBKRQ]?[a-h]?[1-8]?[-x]?[a-h][1-8](?:=?[nbrqkNBRQK])?|[pnbrqkPNBRQK]?@[a-h][1-8]|O-O-O|0-0-0|O-O|0-0)[+#]?|--|Z0|0000|@@@@|{|;|\$\d{1,4}|[?!]{1,2}|\(|\)|\*|1-0|0-1|1\/2-1\/2/g;let s;for(;s=i.exec(e);){const r=this.stack[this.stack.length-1];let h=s[0];if(h===";")return;if(h.startsWith("$"))this.handleNag(parseInt(h.slice(1),10));else if(h==="!")this.handleNag(1);else if(h==="?")this.handleNag(2);else if(h==="!!")this.handleNag(3);else if(h==="??")this.handleNag(4);else if(h==="!?")this.handleNag(5);else if(h==="?!")this.handleNag(6);else if(h==="1-0"||h==="0-1"||h==="1/2-1/2"||h==="*")this.stack.length===1&&h!=="*"&&this.game.headers.set("Result",h);else if(h==="(")this.consumeBudget(100),this.stack.push({parent:r.parent,root:!1});else if(h===")")this.stack.length>1&&this.stack.pop();else if(h==="{"){const a=i.lastIndex,c=e[a]===" "?a+1:a;e=e.slice(c),this.state=4;continue t}else this.consumeBudget(100),h==="Z0"||h==="0000"||h==="@@@@"?h="--":h.startsWith("0")&&(h=h.replace(/0/g,"O")),r.node&&(r.parent=r.node),r.node=new Ee({san:h,startingComments:r.startingComments}),r.startingComments=void 0,r.root=!1,r.parent.children.push(r.node)}return}case 4:{const i=e.indexOf("}");if(i===-1){this.commentBuf.push(e);return}else{const s=i>0&&e[i-1]===" "?i-1:i;this.commentBuf.push(e.slice(0,s)),this.handleComment(),e=e.slice(i),this.state=3,t=!1}}}}handleNag(t){var e;this.consumeBudget(50);const i=this.stack[this.stack.length-1];i.node&&((e=i.node.data).nags||(e.nags=[]),i.node.data.nags.push(t))}handleComment(){var t,e;this.consumeBudget(100);const i=this.stack[this.stack.length-1],s=this.commentBuf.join(`
`);this.commentBuf=[],i.node?((t=i.node.data).comments||(t.comments=[]),i.node.data.comments.push(s)):i.root?((e=this.game).comments||(e.comments=[]),this.game.comments.push(s)):(i.startingComments||(i.startingComments=[]),i.startingComments.push(s))}emit(t){if(this.state===4&&this.handleComment(),t)return this.emitGame(this.game,t);this.found&&this.emitGame(this.game,void 0),this.resetGame()}}const Re=(n,t=bt)=>{const e=[];return new Ce(i=>e.push(i),t,NaN).parse(n),e},_e=(n,t)=>n==="white"?t:-t,Ut=n=>2/(1+Math.exp(-.00368208*n))-1,Ae=n=>Ut(Math.min(Math.max(-1e3,n),1e3)),Oe=n=>{const e=(21-Math.min(10,Math.abs(n)))*100*(n>0?1:-1);return Ut(e)},Ne=n=>typeof n.mate<"u"?Oe(n.mate):Ae(n.cp),Mt=(n,t)=>_e(n,Ne(t)),Pe=(n,t,e)=>103.1668*Math.exp(-.04354*(Mt(n,t)*100-Mt(n,e)*100))-3.1669;class xe{async request_move_data(t,e){console.log(t,e);let i={cp:Math.random()*1e3},s={cp:i.cp-Math.random()*200},r=Pe("white",i,s),h=Me(e).slice(0,4);return{before_cp:i,after_cp:s,accuracy:r,multi_pvs4:h}}}const ve=new xe;function Te(n,t){let e=$(n).unwrap(),i=X.fromSetup(e).unwrap(),s=kt(t);return i.play(s),Dt(i.toSetup())}function ze(n,t){let e=$(n).unwrap(),i=X.fromSetup(e).unwrap(),s=kt(t);return Gt(i,s)}const Be=n=>$(n).unwrap().turn;function Me(n){let t=X.fromSetup($(n).unwrap()).unwrap(),e=[];for(let[i,s]of he(t))e.push(...s.map(r=>i+r));return e}class Qt{constructor(t,e){this.headers=t,this.tree=e}static make_many=t=>Re(t).flatMap(e=>{let i=e.headers.get("Event"),s=e.headers.get("Site"),r=e.headers.get("White"),h=e.headers.get("Black"),a=e.headers.get("Puzzle"),c=e.headers.get("Section"),f=e.headers.get("Chapter"),p=e.headers.get("FEN"),b=p??Lt,g=X.fromSetup($(b).unwrap()).unwrap(),E=e.moves.children.map(y=>{let A=y.data.san,K=vt(g,A);return[Rt(K)]}),_=D.make(b,E);e.moves.children.forEach(y=>{x(_,y,g,[])});function x(y,A,K,H){let q=vt(K,A.data.san),Et=K.clone();Et.play(q);let yt=Rt(q);y.append_uci(yt,H),A.children.forEach(Wt=>{x(y,Wt,Et,[...H,yt])})}return new Qt({event:i,site:s,white:r,black:h,puzzle:a,section:c,chapter:f,fen:p},_)});get event(){return this.headers.event}get site(){return this.headers.site}get white(){return this.headers.white}get black(){return this.headers.black}get puzzle(){return this.headers.puzzle}get section(){return this.headers.section}get chapter(){return this.headers.chapter}get fen(){return this.headers.fen}}class I{constructor(t){this.data=t,this._children=$t([])}static color_of(t){return Be(t.data.before_fen)}static make=t=>new I(t);get clone(){let t=new I({...this.data});return t.children=this.children.map(e=>e.clone),t}get all_leaves(){return this.children.length===0?[this]:this.children.flatMap(t=>t.all_leaves)}get length(){if(this.children.length>1)return 1;if(this.children.length===0)return 0;let t=1,e=this.children[0];for(;e?.children.length===1;)t++,e=e.children[0];return t}get nb_first_variations(){return this.children_first_variations?.length??0}get first_node_with_variations(){if(this.children.length!==0)return this.children.length===1?this.children[0].first_node_with_variations:this}get children_first_variations(){return this.first_node_with_variations?.children}get children(){return this._children[0]()}set children(t){this._children[1](t)}_children}class pt{constructor(t){this.root=t}static make=t=>{function e(a,c){let f=a.data.path.length,p=a.length,b=a.nb_first_variations,g=-c*100+1/(f/40)*10+p/20*10+(b+1)*100,E=I.make({path:a.data.path,uci:a.data.uci,score:g}),_=a.children.length+c,x=_*(_+1)/2;return E.children=a.children.map((j,y)=>e(j,(y+c)/x)),E}function i(a){return a.data.score+a.children.map(f=>i(f)).reduce((f,p)=>f+p,0)}function s(a,c){a.data.score/=c,a.children.forEach(f=>s(f,c))}let r=t.root.map(a=>e(a,1)),h=r.map(a=>i(a)).reduce((a,c)=>a+c,0);return r.forEach(a=>s(a,h)),new pt(r)};get clone(){return new pt(this.root.map(t=>t.clone))}get progress_paths(){function t(i,s,r){s.push(i.data.path),i.children.length===0?r.push(s):i.children.length===1?t(i.children[0],s,r):(r.push(s),i.children.forEach(h=>{t(h,[],r)}))}let e=[];return this.root.forEach(i=>t(i,[],e)),e}_traverse_path(t){let e,i=this.root;for(let s of t){if(e=i.find(r=>r.data.uci===s),!e)return;i=e.children}return e}get_children(t){return this._traverse_path(t)?.children.map(i=>i.data)}get_at(t){return this._traverse_path(t)?.data}delete_at(t){const e=this._traverse_path(t.slice(0,-1));e&&(e.children=e.children.filter(i=>i.data.path.join("")!==t.join("")))}}class D{constructor(t){this.root=t}static make=(t,e)=>{let i=e.map(r=>r[0]),s=new D(i.map(r=>I.make(D.make_data(t,r,1,[]))));return e.forEach(r=>s.append_ucis(r)),s};get before_fen(){return this.root[0]?.data.before_fen??Lt}get initial_color(){if(this.root[0])return I.color_of(this.root[0])}get clone(){return new D(this.root.map(t=>t.clone))}static make_data(t,e,i,s){let r=$(t).unwrap(),h=X.fromSetup(r).unwrap(),a=kt(e),c=Gt(h,a);return h.play(a),{path:[...s,e],ply:i,before_fen:t,san:c,after_fen:Dt(h.toSetup()),uci:e}}_traverse_path(t){let e,i=this.root;for(let s of t){if(e=i.find(r=>r.data.uci===s),!e)return;i=e.children}return e}_find_path(t){let e=[],i=[],s,r=this.root,h=!1;for(let a of t)if(h)i.push(a);else{let c=r?.find(f=>f.data.uci===a);c?(e.push(a),s=c,r=Ct(()=>s?.children)):(h=!0,i.push(a))}return[e,s,i]}get all_leaves(){return this.root.flatMap(t=>t.all_leaves.map(e=>e.data))}get_children(t){return this._traverse_path(t)?.children.map(i=>i.data)}async request_ceval_and_get_at(t){let e=this.get_at(t);if(e)return e.eval_accuracy=await ve.request_move_data(e.before_fen,e.after_fen),e}collect_branch_sums(t){let e=[],i=this.root,s=!1;for(let r of t){let h=i.find(a=>a.data.uci===r);if(!h)return;s&&(e.push(h.data),s=!1),h.children.length>1&&(s=!0),i=h.children}return e}get_at(t){return this._traverse_path(t)?.data}delete_at(t){const e=this._traverse_path(t.slice(0,-1));e&&(e.children=e.children.filter(i=>i.data.path.join("")!==t.join("")))}append_uci(t,e=[]){this.append_ucis([...e,t])}append_ucis(t){let[e,i,s]=this._find_path(t);if(i!==void 0)for(let r of s){let h=I.make(D.make_data(i.data.after_fen,r,i.data.ply+1,e)),a=Ct(()=>i.children);i.children=[...a,h],i=h,e=[...e,r]}}}export{X as C,Lt as I,pt as M,Qt as P,Te as a,ze as b,D as c,he as d,S as e,Be as f,kt as g,Dt as m,$ as p};