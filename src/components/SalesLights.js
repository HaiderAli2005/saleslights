'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  BRANDS,
  CALENDLY_BOOK,
  EMAIL,
  LINKEDIN,
  PAGES,
  SERVICES,
  TABS,
} from './data';
import SplitHeadline from './SplitHeadline';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

// Ambient motion is meaningless without a hovering pointer, and on touch it is
// pure battery cost.
function hasFinePointer() {
  return !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
}

// Below this the page scrolls rather than filling one fixed screen, so <main>
// is as tall as its content. Parking the headline at the centre of that would
// drop it far below the fold instead of framing it. Matches the CSS breakpoint.
function isNarrow() {
  return !!(window.matchMedia && window.matchMedia('(max-width: 820px)').matches);
}

// Deliberately small — peak displacement is RADIUS * PULL / 4, about 10px.
// The pull should register before it can be named.
const MAGNET_RADIUS = 90;
const MAGNET_PULL = 0.45;

export default function SalesLights() {
  const [page, setPage] = useState('home');
  const [service, setService] = useState(0);
  const [fading, setFading] = useState(false);

  // Intro: the headline is parked dead centre of <main>, holds, then glides
  // back to its column position while the rest of the chrome fades in.
  const [intro, setIntro] = useState(true);
  const [homeT, setHomeT] = useState('none');
  const [homeMoving, setHomeMoving] = useState(false);

  // Starts true so the server-rendered HTML already carries the pre-intro
  // state. Rendering the headline visible and hiding it after hydration means
  // it paints in the left column first and then jumps to centre when the intro
  // takes over. Reduced motion turns this back off. `play` waits until the
  // headline is wherever it is going to rise from.
  const [revealHeadline, setRevealHeadline] = useState(true);
  const [portraitReady, setPortraitReady] = useState(false);
  const [playHeadline, setPlayHeadline] = useState(false);

  const mainRef = useRef(null);
  const homeH1Ref = useRef(null);
  const pageRef = useRef(page);
  const pageTimer = useRef(null);
  const introTimers = useRef([]);
  const introRafs = useRef([]);
  const introPositioned = useRef(false);
  const hoverTimer = useRef(null);

  const glowRef = useRef(null);
  const portraitRef = useRef(null);
  const cursorRef = useRef(null);
  const ringRef = useRef(null);
  const magnetsRef = useRef([]);

  // Selecting on raw mouseenter fires a content change for every row the
  // cursor crosses, so travelling 01 → 05 flickers through three services
  // nobody asked for. The delay lets the row you settle on win.
  const hoverService = useCallback((i) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setService(i), 80);
  }, []);

  const pickService = useCallback((i) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setService(i);
  }, []);

  useEffect(() => { pageRef.current = page; }, [page]);


  // Drops straight to the finished page: chrome visible, headline home and
  // unmasked. Every failure path lands here rather than part-way through.
  const settleHome = useCallback(() => {
    introTimers.current.forEach(clearTimeout);
    introTimers.current = [];
    setIntro(false);
    setHomeT('none');
    setHomeMoving(false);
    setPlayHeadline(true);
  }, []);

  const startIntro = useCallback(() => {
    introTimers.current.forEach(clearTimeout);
    introTimers.current = [];
    introPositioned.current = false;
    setIntro(true);
    setHomeT('none');
    setHomeMoving(false);
    setPlayHeadline(false);

    // A background tab runs no frames, so the rAF chain below may never fire.
    // Timers still run, so this guarantees the page can't sit blank waiting for
    // an intro that will never start. An overture nobody saw is no loss.
    introTimers.current.push(
      setTimeout(() => {
        if (!introPositioned.current) settleHome();
      }, 400)
    );

    // Two frames so the headline has been laid out at its resting position
    // before we measure the offset to the centre.
    introRafs.current.push(
      requestAnimationFrame(() => {
        introRafs.current.push(
          requestAnimationFrame(() => {
            const el = homeH1Ref.current;
            const main = mainRef.current;
            if (!el || !main) {
              settleHome();
              return;
            }
            introPositioned.current = true;
            const a = el.getBoundingClientRect();
            const b = main.getBoundingClientRect();
            const dx = b.left + b.width / 2 - (a.left + a.width / 2);
            const dy = b.top + b.height / 2 - (a.top + a.height / 2);
            setHomeT(`translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)`);
            setPlayHeadline(true);

            introTimers.current.push(
              setTimeout(() => {
                setHomeMoving(true);
                introTimers.current.push(
                  setTimeout(() => {
                    setIntro(false);
                    setHomeT('none');
                  }, 30)
                );
              // The line reveal lands at ~0.99s, so the original 1500 left half a
              // second of nothing happening before the glide. This holds just
              // long enough to read the headline, then moves.
              }, 1150)
            );
          })
        );
      })
    );
  }, []);

  // Every arrival at Home routes through here. The centre-park overture is a
  // page-load event: it runs on load and on every refresh, but clicking Home
  // from another view is navigation, so that just settles.
  //
  // `viaNav` is a parameter rather than a consumed ref on purpose — StrictMode
  // double-invokes mount effects in dev, so a one-shot flag would be spent by
  // the first pass and the second would skip the intro entirely.
  const enterHome = useCallback(
    (viaNav) => {
      const reduced = prefersReducedMotion();
      setRevealHeadline(!reduced);

      if (reduced || viaNav || isNarrow()) {
        settleHome();
        return;
      }
      startIntro();
    },
    [settleHome, startIntro]
  );

  const go = useCallback(
    (target) => (e) => {
      if (e && e.preventDefault) e.preventDefault();
      if (target !== pageRef.current) {
        if (pageTimer.current) clearTimeout(pageTimer.current);
        setFading(true);
        pageTimer.current = setTimeout(() => {
          setPage(target);
          setFading(false);
          if (target === 'home') enterHome(true);
          // Was 560ms of blank screen on every nav click. The outgoing view now
          // leaves upward in 300ms and the incoming one rises to meet it.
        }, 300);
      }
      try {
        window.history.replaceState(null, '', '#' + target);
      } catch (err) {
        /* history is unavailable on file:// — navigation still works */
      }
    },
    [enterHome]
  );

  useIsoLayoutEffect(() => {
    const fromHash = (window.location.hash || '').replace('#', '');
    const initial = PAGES.indexOf(fromHash) > -1 ? fromHash : 'home';
    if (initial === 'home') {
      enterHome();
    } else {
      setPage(initial);
      setIntro(false);
    }

    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const i = PAGES.indexOf(pageRef.current);
        const n = (i + (e.key === 'ArrowRight' ? 1 : PAGES.length - 1)) % PAGES.length;
        go(PAGES[n])();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      // Read through the refs at teardown: startIntro swaps the timer array on
      // every replay, so a value captured here would go stale.
      introTimers.current.forEach(clearTimeout);
      introRafs.current.forEach(cancelAnimationFrame);
      if (pageTimer.current) clearTimeout(pageTimer.current);
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, [go, enterHome]);

  const chromeOp = page === 'home' && intro ? 0 : 1;
  // One loop for the background field, the cursor ring and the magnetism —
  // three effects reading a single pointer position, updated once per frame.
  useEffect(() => {
    if (prefersReducedMotion() || !hasFinePointer()) return undefined;

    const root = document.documentElement;
    root.setAttribute('data-cursor', 'on');

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;
    let rx = tx;
    let ry = ty;
    let armed = false;

    // State lives on <html> so both cursor parts read it from one class write.
    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!armed) {
        // Jump the ring to the first known position instead of flying in
        // from the middle of the screen.
        armed = true;
        rx = tx;
        ry = ty;
        root.classList.add('sl-pointer-on');
      }
    };
    const onOut = () => root.classList.remove('sl-pointer-on');
    const onIn = () => { if (armed) root.classList.add('sl-pointer-on'); };
    const onOver = (e) => {
      if (!e.target.closest) return;
      if (e.target.closest('a,button')) root.classList.add('sl-pointer-link');
      // The cursor is drawn in ink. Over an inked surface it would vanish, so
      // it flips to paper for as long as it is inside one.
      if (e.target.closest('[data-cursor-invert]')) root.classList.add('sl-pointer-invert');
    };
    const onLeaveTarget = (e) => {
      if (!e.target.closest) return;
      if (e.target.closest('a,button')) root.classList.remove('sl-pointer-link');
      if (e.target.closest('[data-cursor-invert]')) root.classList.remove('sl-pointer-invert');
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onOut);
    document.addEventListener('mouseenter', onIn);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onLeaveTarget);

    let raf = 0;
    const loop = () => {
      // Light answers the pointer. The original author's 0.055 trailed so far
      // behind the cursor that the whole page read as sluggish.
      cx += (tx - cx) * 0.11;
      cy += (ty - cy) * 0.11;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
      }


      // The portrait drifts against the pointer inside a fixed frame. Entrance
      // animations play once and the page is inert again; this keeps answering
      // for as long as someone is on it. Null on every view but Studio.
      if (portraitRef.current) {
        const nx = cx / window.innerWidth - 0.5;
        const ny = cy / window.innerHeight - 0.5;
        portraitRef.current.style.transform =
          `translate3d(${(nx * -16).toFixed(1)}px,${(ny * -16).toFixed(1)}px,0)`;
      }

      // The dot is pinned exactly to the pointer — an aim point that lags reads
      // as a broken cursor. Only the ring is allowed to trail.
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${tx}px,${ty}px,0)`;
      }
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;
      }

      for (let i = 0; i < magnetsRef.current.length; i += 1) {
        const m = magnetsRef.current[i];
        // Reads a cached centre. Measuring here would force a synchronous
        // layout for every magnet on every frame — the whole site felt slow
        // because of it.
        const dx = tx - m.cx;
        const dy = ty - m.cy;
        const near = dx * dx + dy * dy < MAGNET_RADIUS * MAGNET_RADIUS;
        if (near) {
          // Falls off to zero at the edge of the radius, otherwise the link
          // would jump ~20px the instant the cursor crossed the boundary.
          const f = (1 - Math.hypot(dx, dy) / MAGNET_RADIUS) * MAGNET_PULL;
          const nx = +(dx * f).toFixed(1);
          const ny = +(dy * f).toFixed(1);
          if (nx !== m.x || ny !== m.y) {
            m.x = nx;
            m.y = ny;
            if (!m.held) {
              m.held = true;
              m.el.style.transition = 'color .22s ease';
            }
            m.el.style.transform = `translate3d(${nx}px,${ny}px,0)`;
          }
        } else if (m.held) {
          // Eased on release, tracked directly on approach.
          m.held = false;
          m.x = 0;
          m.y = 0;
          m.el.style.transition = 'transform .7s cubic-bezier(.16,1,.3,1), color .22s ease';
          m.el.style.transform = '';
        }
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onOut);
      document.removeEventListener('mouseenter', onIn);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onLeaveTarget);
      cancelAnimationFrame(raf);
      root.removeAttribute('data-cursor');
      root.classList.remove('sl-pointer-on', 'sl-pointer-link', 'sl-pointer-invert');
    };
  }, []);

  // A cached image can finish loading before React attaches onLoad, and then the
  // event never fires and the portrait stays parked out of frame.
  useEffect(() => {
    const el = portraitRef.current;
    if (el && el.complete && el.naturalWidth) setPortraitReady(true);
  }, [page]);

  // Re-collected per view: each page renders its own set of magnetic links.
  // Centres are measured here, not in the frame loop, so the loop never has to
  // touch layout.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-magnetic]'));

    const measure = () => {
      magnetsRef.current = els.map((el) => {
        // Any pull already applied would otherwise be baked into the centre.
        el.style.transform = '';
        const r = el.getBoundingClientRect();
        return { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2, x: 0, y: 0, held: false };
      });
    };

    measure();
    // The entrance animations are still moving these on the first pass, so take
    // the reading that matters once everything has landed.
    const settle = setTimeout(measure, 1200);
    window.addEventListener('resize', measure);

    return () => {
      clearTimeout(settle);
      window.removeEventListener('resize', measure);
      els.forEach((el) => { el.style.transform = ''; });
      magnetsRef.current = [];
    };
  }, [page]);

  const chromeTrans = intro ? 'none' : 'opacity .8s ease .5s';
  const chromeTransLate = intro ? 'none' : 'opacity .8s ease .62s';
  const homeTrans = homeMoving ? 'transform 1.05s cubic-bezier(.16,1,.3,1)' : 'none';
  const active = SERVICES[service] || SERVICES[0];

  return (
    <div className="sl-root">
      <div className="sl-bg" aria-hidden="true">
        <div className="sl-bg-glow" ref={glowRef} />
        <div className="sl-bg-grain" />
      </div>
      <div className="sl-cursor-dot" ref={cursorRef} aria-hidden="true">
        <i />
      </div>
      <div className="sl-cursor-ring" ref={ringRef} aria-hidden="true">
        <i />
      </div>

      <header className="sl-header" style={{ opacity: chromeOp, transition: chromeTrans }}>
        <a href="#home" onClick={go('home')} className="sl-brand">
          <img src="/logo.avif" alt="Saleslights" />
        </a>
        <nav className="sl-nav">
          {TABS.map((t) => (
            <a
              key={t.key}
              href={'#' + t.key}
              onClick={go(t.key)}
              className={page === t.key ? 'is-active' : undefined}
            >
              {t.label}
            </a>
          ))}
        </nav>
      </header>

      <main ref={mainRef} className={'sl-main' + (fading ? ' is-leaving' : '')}>
        {page === 'home' && (
          <div className="sl-grid">
            <SplitHeadline
              innerRef={homeH1Ref}
              className="sl-h1"
              style={{ transform: homeT, transition: homeTrans, opacity: 1 }}
              reveal={revealHeadline}
              play={playHeadline}
              text="We turn a good product into revenue."
            />
            <div className="sl-home-copy" style={{ opacity: chromeOp, transition: chromeTransLate }}>
              <p className="sl-lede">
                Saleslights is a New York based growth consultancy for teams that need pipeline, not
                advice. We build the go to market machine, run it, and report on it every week.
              </p>
              <div className="sl-cta-row">
                <a
                  href={CALENDLY_BOOK}
                  target="_blank"
                  rel="noopener"
                  className="sl-cta"
                  data-magnetic=""
                >
                  Book a call
                </a>
                <a href="#services" onClick={go('services')} className="sl-cta-sub" data-magnetic="">
                  See the services
                </a>
              </div>
            </div>
          </div>
        )}

        {page === 'services' && (
          <div className="sl-grid">
            <div>
              <div className="sl-services-list">
                {SERVICES.map((s, i) => (
                  <button
                    type="button"
                    key={s.num}
                    onClick={() => pickService(i)}
                    onMouseEnter={() => hoverService(i)}
                    onFocus={() => pickService(i)}
                    aria-pressed={service === i}
                    className={'sl-service' + (service === i ? ' is-active' : '')}
                    style={{
                      animation: `slin .8s ${(i * 0.08).toFixed(2)}s cubic-bezier(.16,1,.3,1) both`,
                    }}
                  >
                    <span className="sl-service-num">{s.num}</span>
                    <span className="sl-service-title">{s.title}</span>
                  </button>
                ))}
              </div>
            </div>
            <div key={'svc-' + service} className="sl-service-panel">
              <p className="sl-service-body">{active.body}</p>
              <div className="sl-points">
                {active.points.map((pt) => (
                  <div key={pt} className="sl-point">
                    {pt}
                  </div>
                ))}
              </div>
              <a href="#contact" onClick={go('contact')} className="sl-service-cta" data-magnetic="">
                Talk to us about this
              </a>
            </div>
          </div>
        )}

        {page === 'studio' && (
          <div className="sl-grid">
            <div className="sl-studio-copy">
              <SplitHeadline
                as="h2"
                className="sl-h2"
                reveal={revealHeadline}
                play
                text="Hands-on consultants"
              />
              <div className="sl-h2-rule" aria-hidden="true" />
              <p className="sl-studio-p sl-studio-p-1">
                Saleslights team has former Sales leads, growth engineers and marketers who got tired
                of watching good products lose on distribution.
              </p>
              <p className="sl-studio-p sl-studio-p-2">
                We take a few clients at a time. Founders without a sales team, growth leads short on
                capacity, businesses whose pipeline has gone quiet. In the ever changing world of AI,
                we use a not-one-size-fits-all approach and get you the results.
              </p>
            </div>
            <div className="sl-portrait-row">
              <div className="sl-portrait-frame">
                <div className={`sl-portrait-mask${portraitReady ? ' is-in' : ''}`}>
                  <img
                    src="/nick-krause.png"
                    alt="Nick Krause"
                    className="sl-portrait"
                    ref={portraitRef}
                    onLoad={() => setPortraitReady(true)}
                  />
                </div>
              </div>
              <div className="sl-person">
                <div className="sl-person-rule" aria-hidden="true" />
                <SplitHeadline
                  as="div"
                  className="sl-person-name"
                  reveal={revealHeadline}
                  play
                  delay={0.76}
                  text="Nick Krause"
                />
                <div className="sl-person-role">Founder</div>
                <a href={LINKEDIN} target="_blank" rel="noopener" className="sl-person-link">
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        )}

        {page === 'contact' && (
          <div className="sl-grid">
            <div>
              <SplitHeadline
                as="h2"
                className="sl-contact-h2"
                reveal={revealHeadline}
                play
                text="Tell us what you sell and who buys it."
              />
              <div className="sl-h2-rule" aria-hidden="true" />
              <p className="sl-contact-p">
                Twenty minutes, no deck. You will leave knowing whether we can move your pipeline and
                what it would take.
              </p>
            </div>
            <div className="sl-book-frame">
              <span className="sl-book-beam" aria-hidden="true" />
              <div className="sl-book">
              <p className="sl-book-brand">Saleslights</p>
              <p className="sl-book-title">30 minutes with Nick Krause</p>
              <p className="sl-book-role">Founder</p>
              <div className="sl-book-rows">
                <div className="sl-book-row">
                  <span>Duration</span>
                  <b>30 min</b>
                </div>
                <div className="sl-book-row">
                  <span>Format</span>
                  <b>Web conferencing</b>
                </div>
              </div>
              <p className="sl-book-meta">
                Web conferencing details provided upon confirmation.
              </p>
              <a
                href={CALENDLY_BOOK}
                target="_blank"
                rel="noopener"
                className="sl-book-cta"
                data-magnetic=""
              >
                Choose a time
              </a>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="sl-logos">
        <div className="sl-marquee">
          <div className="sl-track">
            {[0, 1].map((copy) =>
              BRANDS.map((b) => (
                <div key={`${copy}-${b.id}`} className="sl-logo-slot">
                  <div
                    role={copy === 0 ? 'img' : undefined}
                    aria-label={copy === 0 ? b.alt : undefined}
                    aria-hidden={copy === 1 ? 'true' : undefined}
                    title={b.alt}
                    className="sl-logo"
                    style={{
                      width: b.w,
                      height: b.h,
                      backgroundImage: `url("/brand/${b.id}.png")`,
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <footer className="sl-footer" style={{ opacity: chromeOp, transition: chromeTrans }}>
        <span />
        <div className="sl-footer-links">
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <span>2026</span>
        </div>
      </footer>
    </div>
  );
}
