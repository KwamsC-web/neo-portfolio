(function () {
  "use strict";

  var root = document.documentElement;
  window.__motionReady = true;

  try {
    init();
  } catch (err) {
    // If anything in the animation layer fails, drop back to the plain, fully visible page.
    root.classList.remove("js");
    if (window.console) console.error(err);
  }

  function init() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var pinMQ = window.matchMedia("(min-width: 1021px) and (min-height: 640px)");
    var finePointer = window.matchMedia("(pointer: fine)");

    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function ss(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }

    /* ======================================================================
       Navigation
       ====================================================================== */
    var header = document.getElementById("siteHeader");
    var navToggle = document.getElementById("navToggle");
    var siteNav = document.getElementById("siteNav");
    var navInd = document.getElementById("navInd");
    var navLinks = siteNav.querySelectorAll('ul a[href^="#"]');

    function closeMenu(returnFocus) {
      if (!siteNav.classList.contains("is-open")) return;
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      if (returnFocus) navToggle.focus();
    }

    navToggle.addEventListener("click", function () {
      var isOpen = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    siteNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { closeMenu(false); });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu(true);
    });
    document.addEventListener("click", function (event) {
      if (!header.contains(event.target)) closeMenu(false);
    });

    function positionIndicator() {
      var active = siteNav.querySelector("ul a.is-active");
      if (!active || window.getComputedStyle(navToggle).display !== "none") {
        navInd.style.opacity = "0";
        return;
      }
      navInd.style.setProperty("--x", active.offsetLeft + 14 + "px");
      navInd.style.setProperty("--y", active.offsetTop + active.offsetHeight - 7 + "px");
      navInd.style.setProperty("--w", active.offsetWidth - 28 + "px");
      navInd.style.opacity = "1";
    }

    function setActiveLink(id) {
      navLinks.forEach(function (link) {
        var isMatch = link.getAttribute("href") === "#" + id;
        link.classList.toggle("is-active", isMatch);
        if (isMatch) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
      positionIndicator();
    }

    var sections = document.querySelectorAll("main section[id]");
    if ("IntersectionObserver" in window) {
      var sectionObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) setActiveLink(entry.target.id === "top" ? "" : entry.target.id);
          });
        },
        { rootMargin: "-45% 0px -50% 0px" }
      );
      sections.forEach(function (section) { sectionObserver.observe(section); });
    }

    /* ======================================================================
       Split headings into masked words
       ====================================================================== */
    function splitNode(node, state) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var mask = document.createElement("span");
            mask.className = "w";
            var word = document.createElement("span");
            word.className = "wi";
            word.style.setProperty("--i", Math.min(state.i++, 14));
            word.textContent = part;
            mask.appendChild(word);
            frag.appendChild(mask);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          splitNode(child, state);
        }
      });
    }
    document.querySelectorAll(".split").forEach(function (el) { splitNode(el, { i: 0 }); });

    // Stagger indices for skill chips
    document.querySelectorAll(".skill .chips").forEach(function (list) {
      Array.prototype.forEach.call(list.children, function (chip, i) { chip.style.setProperty("--i", i); });
    });
    // Stagger the household dots in the hero illustration
    document.querySelectorAll(".map-dots circle").forEach(function (dot, i) { dot.style.setProperty("--i", i); });

    /* ======================================================================
       Showcase mode (pinned on large screens, plain list elsewhere)
       ====================================================================== */
    var showcase = document.querySelector("[data-showcase]");
    var scTrack, slides = [], dots = [], scCur, scN = 0;
    var pinned = false, scS = 1, scTop = 0, scActive = -1;

    if (showcase) {
      scTrack = showcase.querySelector("[data-sc-track]");
      slides = Array.prototype.slice.call(showcase.querySelectorAll("[data-slide]"));
      dots = Array.prototype.slice.call(showcase.querySelectorAll("[data-sc-go]"));
      scCur = showcase.querySelector("[data-sc-cur]");
      scN = slides.length;
    }

    function clearSlideStyles(slide) {
      var media = slide.querySelector(".feature-media");
      var img = media && media.querySelector("img");
      var body = slide.querySelector(".feature-body");
      slide.style.pointerEvents = "";
      slide.style.zIndex = "";
      if (media) media.style.clipPath = "";
      if (img) img.style.translate = "";
      if (body) { body.style.opacity = ""; body.style.translate = ""; }
    }

    function settleSlide(slide) {
      slide.querySelectorAll("[data-clip], .split").forEach(function (el) { el.classList.add("is-in"); });
    }

    function applyMode() {
      if (!showcase || scN < 2) return;
      var want = pinMQ.matches && !reduce.matches;
      if (want === pinned) return;
      pinned = want;
      showcase.classList.toggle("is-pinned", pinned);
      slides.forEach(function (slide) {
        clearSlideStyles(slide);
        settleSlide(slide);
        if (pinned) slide.classList.remove("reveal", "is-visible");
      });
      scActive = -1;
    }

    function measureShowcase() {
      if (!pinned) return;
      scTop = scTrack.getBoundingClientRect().top + window.pageYOffset;
      scS = Math.max(1, (scTrack.offsetHeight - window.innerHeight) / (scN - 1));
    }

    function goToSlide(i, instant) {
      measureShowcase();
      window.scrollTo({ top: scTop + i * scS, behavior: instant ? "instant" : "smooth" });
    }

    function updateShowcase(y) {
      var raw = clamp((y - scTop) / scS, 0, scN - 1);
      var base = Math.min(Math.floor(raw), scN - 2);
      var p = base + ss((raw - base - 0.25) / 0.5); // hold, transition, hold
      var active = Math.round(p);

      slides.forEach(function (slide, i) {
        var d = p - i, e, b, ty, top = 0, bottom = 0;
        if (d < 0) {
          e = ss((d + 0.6) / 0.3);
          b = ss((d + 0.45) / 0.25);
          top = (1 - e) * 100;
          ty = (1 - b) * 34;
        } else {
          e = 1 - ss((d - 0.15) / 0.3);
          b = 1 - ss((d - 0.05) / 0.25);
          bottom = (1 - e) * 100;
          ty = -(1 - b) * 34;
        }
        var media = slide.querySelector(".feature-media");
        var img = media && media.querySelector("img");
        var body = slide.querySelector(".feature-body");
        if (media) media.style.clipPath = "inset(" + top.toFixed(2) + "% 0 " + bottom.toFixed(2) + "% 0)";
        if (img) img.style.translate = "0 " + (-d * 9).toFixed(2) + "%";
        if (body) {
          body.style.opacity = b.toFixed(3);
          body.style.translate = "0 " + ty.toFixed(1) + "px";
        }
        slide.style.pointerEvents = i === active ? "auto" : "none";
        slide.style.zIndex = i === active ? "2" : "1";
      });

      if (active !== scActive) {
        scActive = active;
        if (scCur) scCur.textContent = "0" + (active + 1);
        dots.forEach(function (dot, i) {
          if (i === active) dot.setAttribute("aria-current", "true");
          else dot.removeAttribute("aria-current");
        });
      }
    }

    if (showcase && scN > 1) {
      dots.forEach(function (dot) {
        dot.addEventListener("click", function () { goToSlide(parseInt(dot.getAttribute("data-sc-go"), 10), false); });
      });
      // Keyboard users can Tab into any slide: bring that slide into view.
      showcase.addEventListener("focusin", function (event) {
        if (!pinned) return;
        var slide = event.target.closest && event.target.closest("[data-slide]");
        if (!slide) return;
        var i = slides.indexOf(slide);
        if (i !== scActive) goToSlide(i, true);
      });
    }

    applyMode();

    /* ======================================================================
       Reveal system
       ====================================================================== */
    function finishReveal(el) {
      // Hand the element back to its normal styles (hover transforms) once the entrance is done.
      window.setTimeout(function () {
        el.classList.remove("reveal", "is-visible");
        el.style.removeProperty("--d");
      }, 1500);
    }

    function settleAll() {
      document.querySelectorAll(".reveal, .split, [data-clip], [data-in], .section").forEach(function (el) {
        el.classList.add("is-in");
        if (el.classList.contains("reveal")) el.classList.add("is-visible");
      });
    }

    if (reduce.matches || !("IntersectionObserver" in window)) {
      settleAll();
    } else {
      var revealObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            el.classList.add("is-in");
            if (el.classList.contains("reveal")) {
              el.classList.add("is-visible");
              finishReveal(el);
            }
            observer.unobserve(el);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      document.querySelectorAll(".reveal, .split, [data-clip], [data-in], .section").forEach(function (el) {
        revealObserver.observe(el);
      });
    }

    /* ======================================================================
       Scroll controller: one passive listener, one rAF loop
       ====================================================================== */
    var progressBar = document.getElementById("progressBar");
    var hero = document.getElementById("top");
    var heroCopy = document.querySelector("[data-hero-copy]");
    var heroVisual = document.querySelector("[data-hero-visual]");
    var heroBg = document.querySelector("[data-hero-bg]");
    var cue = document.querySelector("[data-cue]");
    var timeline = document.querySelector("[data-timeline]");

    var parallax = Array.prototype.map.call(document.querySelectorAll("[data-parallax]"), function (el) {
      return { el: el, speed: parseFloat(el.getAttribute("data-parallax")) || 0, base: 0, inShowcase: !!el.closest("[data-showcase]") };
    });

    var vh = window.innerHeight, docMax = 0, heroH = 1, tlTop = 0, tlH = 1, pxFactor = 1;
    var ticking = false, wasScrolled = false, heroSettled = false;

    function measure() {
      vh = window.innerHeight;
      docMax = Math.max(0, root.scrollHeight - vh);
      pxFactor = window.innerWidth < 760 ? 0 : window.innerWidth < 1021 ? 0.5 : 1;
      parallax.forEach(function (item) {
        item.el.style.translate = "";
        var r = item.el.getBoundingClientRect();
        item.base = r.top + window.pageYOffset + r.height / 2;
      });
      heroH = Math.max(1, hero.offsetHeight);
      if (timeline) {
        var tr = timeline.getBoundingClientRect();
        tlTop = tr.top + window.pageYOffset;
        tlH = Math.max(1, tr.height);
      }
      measureShowcase();
      positionIndicator();
      heroSettled = false;
      requestTick();
    }

    function clearHero() {
      [heroCopy, heroVisual, heroBg].forEach(function (el) {
        if (el) { el.style.translate = ""; el.style.opacity = ""; }
      });
      if (cue) cue.style.opacity = "";
    }

    function update() {
      ticking = false;
      var y = window.pageYOffset;
      var still = reduce.matches;

      progressBar.style.transform = "scaleX(" + (docMax > 0 ? clamp(y / docMax, 0, 1) : 0).toFixed(4) + ")";

      var scrolled = y > 40;
      if (scrolled !== wasScrolled) {
        wasScrolled = scrolled;
        header.classList.toggle("is-scrolled", scrolled);
      }

      // Hero: copy drifts up, visual and grid drift at different speeds.
      if (!still) {
        var hp = clamp(y / heroH, 0, 1);
        if (hp < 1 || !heroSettled) {
          heroSettled = hp >= 1;
          if (heroCopy) {
            heroCopy.style.translate = "0 " + (-hp * 70).toFixed(1) + "px";
            heroCopy.style.opacity = (1 - hp * 0.55).toFixed(3);
          }
          if (heroVisual) heroVisual.style.translate = "0 " + (hp * 50).toFixed(1) + "px";
          if (heroBg) heroBg.style.translate = "0 " + (hp * 90).toFixed(1) + "px";
          if (cue) cue.style.opacity = clamp(1 - hp * 6, 0, 1).toFixed(3);
        }
      }

      // Light parallax on marked elements
      parallax.forEach(function (item) {
        if (still || pxFactor === 0 || (item.inShowcase && pinned)) {
          if (item.el.style.translate) item.el.style.translate = "";
          return;
        }
        var offset = item.base - y - vh / 2;
        if (Math.abs(offset) > vh * 1.4) return;
        item.el.style.translate = "0 " + (-offset * item.speed * pxFactor).toFixed(1) + "px";
      });

      if (pinned) updateShowcase(y);

      if (timeline) {
        var tp = still ? 1 : clamp((y + vh * 0.7 - tlTop) / tlH, 0, 1);
        timeline.style.setProperty("--tl", tp.toFixed(3));
      }
    }

    function requestTick() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }

    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", function () { applyMode(); measure(); }, { passive: true });
    window.addEventListener("load", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    if ("ResizeObserver" in window) {
      var roPending = false;
      new ResizeObserver(function () {
        if (roPending) return;
        roPending = true;
        window.requestAnimationFrame(function () { roPending = false; measure(); });
      }).observe(document.body);
    }

    function onMotionChange() {
      applyMode();
      if (reduce.matches) { settleAll(); clearHero(); }
      measure();
    }
    if (reduce.addEventListener) reduce.addEventListener("change", onMotionChange);
    if (pinMQ.addEventListener) pinMQ.addEventListener("change", function () { applyMode(); measure(); });

    measure();
    update();

    /* ======================================================================
       Contact: accent ring follows the cursor (fine pointers only)
       ====================================================================== */
    var contact = document.querySelector("[data-contact]");
    var orb = document.querySelector("[data-orb]");
    if (contact && orb && finePointer.matches) {
      var tx = 0, ty = 0, cx = 0, cy = 0, seen = false, orbRaf = 0;
      var orbLoop = function () {
        cx += (tx - cx) * 0.12;
        cy += (ty - cy) * 0.12;
        orb.style.translate = (cx - 140).toFixed(1) + "px " + (cy - 140).toFixed(1) + "px";
        if (Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) orbRaf = window.requestAnimationFrame(orbLoop);
        else orbRaf = 0;
      };
      contact.addEventListener("pointermove", function (event) {
        if (reduce.matches) return;
        var r = contact.getBoundingClientRect();
        tx = event.clientX - r.left;
        ty = event.clientY - r.top;
        if (!seen) { seen = true; cx = tx; cy = ty; }
        orb.classList.add("on");
        if (!orbRaf) orbRaf = window.requestAnimationFrame(orbLoop);
      });
      contact.addEventListener("pointerleave", function () { orb.classList.remove("on"); });
    }

    /* ======================================================================
       Case study dialogs
       ====================================================================== */
    var openDialog = null;
    var lastTrigger = null;

    function openCase(name, trigger) {
      var dialog = document.getElementById("case-" + name);
      if (!dialog) return;
      lastTrigger = trigger || document.activeElement;
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      openDialog = dialog;
      dialog.querySelector(".case-body").scrollTop = 0;
      try { history.replaceState(null, "", "#case-" + name); } catch (e) { /* ignore */ }
    }

    function closeCase(dialog) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }

    document.querySelectorAll("dialog.case").forEach(function (dialog) {
      dialog.addEventListener("close", function () {
        openDialog = null;
        if (location.hash.indexOf("#case-") === 0) {
          try { history.replaceState(null, "", location.pathname + location.search + "#projects"); } catch (e) { /* ignore */ }
        }
        if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
      });
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) closeCase(dialog);
      });
      dialog.querySelectorAll("[data-close-case]").forEach(function (btn) {
        btn.addEventListener("click", function () { closeCase(dialog); });
      });
    });

    document.querySelectorAll("[data-open-case]").forEach(function (el) {
      el.addEventListener("click", function () { openCase(el.getAttribute("data-open-case"), el); });
    });

    // Deep link: index.html#case-capstone opens that case study.
    function openFromHash() {
      var match = /^#case-([a-z]+)$/.exec(location.hash);
      if (match && !openDialog) openCase(match[1], null);
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);

    /* ======================================================================
       Copy email
       ====================================================================== */
    var copyBtn = document.getElementById("copyEmail");
    var copyLabel = document.getElementById("copyLabel");
    var copyStatus = document.getElementById("copyStatus");
    var copyTimer;

    function showCopied(ok) {
      copyBtn.classList.toggle("is-copied", ok);
      copyLabel.textContent = ok ? "Copied" : "Copy failed";
      copyStatus.textContent = ok ? "Email address copied to clipboard" : "Could not copy. Please copy the address manually.";
      window.clearTimeout(copyTimer);
      copyTimer = window.setTimeout(function () {
        copyBtn.classList.remove("is-copied");
        copyLabel.textContent = "Copy email";
      }, 2200);
    }

    function legacyCopy(text) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(area);
      return ok;
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var email = copyBtn.getAttribute("data-email");
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(email).then(
            function () { showCopied(true); },
            function () { showCopied(legacyCopy(email)); }
          );
        } else {
          showCopied(legacyCopy(email));
        }
      });
    }

    /* ---------- Footer year ---------- */
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }
})();
