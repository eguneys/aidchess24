const t=(n=1)=>()=>{var r=Math.sin(n++)*1e4;return r-Math.floor(r)},o=t();function a(n,r=o){return Math.floor(r()*n)}function e(n){return n[a(n.length)]}export{e as a};
