(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile navigation ---------- */
  var header = document.getElementById("siteHeader");
  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");

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

  /* ---------- Header border on scroll ---------- */
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav link ---------- */
  var navLinks = siteNav.querySelectorAll('ul a[href^="#"]');
  var sections = document.querySelectorAll("main section[id]");

  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      var isMatch = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", isMatch);
      if (isMatch) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  if ("IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveLink(entry.target.id === "top" ? "" : entry.target.id);
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealItems = document.querySelectorAll(".reveal");

  function finishReveal(el) {
    // Hand the element back to its normal styles once the entrance is done.
    window.setTimeout(function () {
      el.classList.remove("reveal", "is-visible");
      el.style.removeProperty("--d");
    }, 1100);
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (el) { el.classList.remove("reveal"); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            finishReveal(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Case study dialogs ---------- */
  var openDialog = null;
  var lastTrigger = null;

  function pauseVideos(dialog) {
    dialog.querySelectorAll("video").forEach(function (video) { video.pause(); });
  }

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
      pauseVideos(dialog);
      openDialog = null;
      if (location.hash.indexOf("#case-") === 0) {
        try { history.replaceState(null, "", location.pathname + location.search + "#projects"); } catch (e) { /* ignore */ }
      }
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
    });

    // Click on the backdrop (outside the dialog box) closes it.
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

  /* ---------- Copy email ---------- */
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
})();
