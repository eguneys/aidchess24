function s(e){let t=0;return l=>{t+=l.deltaY*(l.deltaMode?40:1),Math.abs(t)>=4?(e(l,!0),t=0):e(l,!1)}}export{s};
