(function () {
  "use strict";

  var nav = document.getElementById("site-nav");
  var menuToggle = document.querySelector(".menu-toggle");
  var scrollTopButton = document.querySelector(".scroll-top");
  var desktopQuery = window.matchMedia("(min-width: 768px)");

  function setMenuState(isOpen) {
    if (!nav || !menuToggle) {
      return;
    }

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    nav.hidden = !isOpen && !desktopQuery.matches;
  }

  function syncMenuForViewport() {
    if (!nav) {
      return;
    }

    if (desktopQuery.matches) {
      nav.hidden = false;
      if (menuToggle) {
        menuToggle.setAttribute("aria-expanded", "false");
      }
      return;
    }

    setMenuState(menuToggle && menuToggle.getAttribute("aria-expanded") === "true");
  }

  function updateScrollTopButton() {
    if (!scrollTopButton) {
      return;
    }

    scrollTopButton.hidden = window.scrollY <= 300;
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      var isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      setMenuState(!isOpen);
    });
  }

  if (nav) {
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a") && !desktopQuery.matches) {
        setMenuState(false);
      }
    });
  }

  if (scrollTopButton) {
    scrollTopButton.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if ("IntersectionObserver" in window) {
    var navLinks = Array.prototype.slice.call(document.querySelectorAll(".site-nav a[href^='#']"));
    var sections = navLinks
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          navLinks.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  window.addEventListener("scroll", updateScrollTopButton, { passive: true });
  window.addEventListener("resize", syncMenuForViewport);
  syncMenuForViewport();
  updateScrollTopButton();
})();
