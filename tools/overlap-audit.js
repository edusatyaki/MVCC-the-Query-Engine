/* Overlap audit for the deck.
   Open the deck in a browser, paste this whole file into the DevTools console,
   and it walks every page and step, listing anything that overlaps.

   Checks, on every step:
   - SVG text touching other SVG text
   - SVG text sitting half across a box border
   - SVG lines and arrows running through a label
   - page text (sidebar, titles, cards, terminals) touching other page text
   - page text drawn over a picture
   - a block pushed off the slide, or text cut off inside its box

   Returns an array of strings; an empty array means nothing overlaps.
   The one expected hit, the deliberate strike-through on 50000 in the
   "Where does the old value live?" case, is filtered out. */
(() => {
  const st = document.createElement('style');
  st.textContent = '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}';
  document.head.appendChild(st);
  const inter = (a, b, t = 1.5) => { const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return (w > t && h > t) ? { w, h, area: w * h } : null; };
  const visible = (el, r) => { let p = el.parentElement; while (p && p !== document.body) { const cs = getComputedStyle(p); if (cs.overflowY !== 'visible' || cs.overflowX !== 'visible') { const pr = p.getBoundingClientRect(); if (r.bottom <= pr.top + 1 || r.top >= pr.bottom - 1 || r.right <= pr.left + 1 || r.left >= pr.right - 1) return false; } p = p.parentElement; } return true; };
  const out = [];
  for (let i = 0; i < DECK.length; i++) for (let j = 0; j < DECK[i].steps.length; j++) {
    si = i; pi = j; render(); fitSlide(); const tag = `page ${DECK.slice(0, i).reduce((n, d) => n + d.steps.length, 0) + j + 1} (${DECK[i].id}:${j})`;
    document.querySelectorAll('svg.scene').forEach(svg => {
      const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim()).map(t => ({ t, r: t.getBoundingClientRect() })).filter(o => o.r.width > 0);
      for (let a = 0; a < texts.length; a++) for (let b = a + 1; b < texts.length; b++) if (inter(texts[a].r, texts[b].r)) out.push(`${tag} picture text "${texts[a].t.textContent.slice(0, 28)}" x "${texts[b].t.textContent.slice(0, 28)}"`);
      const rects = [...svg.querySelectorAll('rect')].map(r => r.getBoundingClientRect()).filter(r => r.width > 4 && r.height > 4);
      texts.forEach(o => { const ta = o.r.width * o.r.height; rects.forEach(q => { const x = inter(o.r, q, 0); if (!x) return; const f = x.area / ta; if (f > 0.12 && f < 0.9) out.push(`${tag} picture text half across a box "${o.t.textContent.slice(0, 34)}"`); }); });
      const tr = texts.map(o => ({ t: o.t, r: { left: o.r.left + 1, right: o.r.right - 1, top: o.r.top + 2, bottom: o.r.bottom - 2 } }));
      [...svg.querySelectorAll('path,line')].filter(p => { const cs = getComputedStyle(p); return cs.stroke !== 'none' && (p.tagName === 'line' || cs.fill === 'none' || p.getAttribute('fill') === 'none'); }).forEach(p => {
        let pts = []; try { const L = p.getTotalLength(); const m = p.getScreenCTM(); for (let d = 0; d <= L; d += 3) { const q = p.getPointAtLength(d); pts.push({ x: q.x * m.a + q.y * m.c + m.e, y: q.x * m.b + q.y * m.d + m.f }); } } catch (e) {}
        tr.forEach(o => { if (pts.filter(q => q.x > o.r.left && q.x < o.r.right && q.y > o.r.top && q.y < o.r.bottom).length >= 2) out.push(`${tag} line crosses "${o.t.textContent.slice(0, 36)}"`); });
      });
    });
    const boxes = []; const w = document.createTreeWalker(document.querySelector('#app'), NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('svg')) continue; const rg = document.createRange(); rg.selectNodeContents(n); [...rg.getClientRects()].forEach(r => { if (r.width > 1 && r.height > 1 && visible(el, r)) boxes.push({ el, r, t: n.textContent.trim().slice(0, 28) }); }); }
    for (let x = 0; x < boxes.length; x++) for (let y = x + 1; y < boxes.length; y++) { if (boxes[x].el === boxes[y].el || boxes[x].el.contains(boxes[y].el) || boxes[y].el.contains(boxes[x].el)) continue; if (inter(boxes[x].r, boxes[y].r, 2)) out.push(`${tag} page text "${boxes[x].t}" x "${boxes[y].t}"`); }
    document.querySelectorAll('svg.scene').forEach(svg => { const sr = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, k = Math.min(sr.width / vb.width, sr.height / vb.height), dw = vb.width * k, dh = vb.height * k;
      const drawn = { left: sr.left + (sr.width - dw) / 2, right: sr.left + (sr.width + dw) / 2, top: sr.top + (sr.height - dh) / 2, bottom: sr.top + (sr.height + dh) / 2 };
      boxes.forEach(b => { if (inter(b.r, drawn, 3)) out.push(`${tag} page text over a picture "${b.t}"`); }); });
    const fit = document.querySelector('.fit'), slide = document.querySelector('.slide').getBoundingClientRect();
    [...fit.children].forEach(k => { const r = k.getBoundingClientRect(); if (r.height && (r.bottom > slide.bottom + 2 || r.top < slide.top - 2)) out.push(`${tag} block off the slide`); });
    fit.querySelectorAll('.sql,.term pre,.tl-c,.card,.probcard,.caseq,.lede,.req,.ph,.tok').forEach(e => { if (e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2) out.push(`${tag} text cut off in ${e.className}`); });
  }
  st.remove(); si = 0; pi = 0; render();
  return [...new Set(out)].filter(s => !s.includes('line crosses "50000"'));
})();
