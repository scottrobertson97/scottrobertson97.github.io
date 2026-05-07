(function () {
  "use strict";

  var nav = document.getElementById("site-nav");
  var menuToggle = document.querySelector(".menu-toggle");
  var scrollTopButton = document.querySelector(".scroll-top");
  var lastFocusedElement = null;
  var activeModal = null;
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

  function focusableElements(container) {
    return Array.prototype.slice.call(
      container.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")
    );
  }

  function closeModal() {
    if (!activeModal) {
      return;
    }

    activeModal.hidden = true;
    document.body.classList.remove("modal-open");
    activeModal = null;

    if (lastFocusedElement) {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  }

  function openModal(modalId, opener) {
    var modal = document.getElementById(modalId);
    if (!modal) {
      return;
    }

    lastFocusedElement = opener;
    activeModal = modal;
    modal.hidden = false;
    document.body.classList.add("modal-open");

    var focusTargets = focusableElements(modal);
    if (focusTargets.length) {
      focusTargets[0].focus();
    }
  }

  function handleModalKeydown(event) {
    if (!activeModal) {
      return;
    }

    if (event.key === "Escape") {
      closeModal();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    var focusTargets = focusableElements(activeModal);
    if (!focusTargets.length) {
      event.preventDefault();
      return;
    }

    var firstTarget = focusTargets[0];
    var lastTarget = focusTargets[focusTargets.length - 1];

    if (event.shiftKey && document.activeElement === firstTarget) {
      event.preventDefault();
      lastTarget.focus();
    } else if (!event.shiftKey && document.activeElement === lastTarget) {
      event.preventDefault();
      firstTarget.focus();
    }
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

  document.addEventListener("click", function (event) {
    var opener = event.target.closest("[data-modal-target]");
    if (opener) {
      openModal(opener.getAttribute("data-modal-target"), opener);
      return;
    }

    if (event.target.closest("[data-modal-close]")) {
      closeModal();
      return;
    }

    if (activeModal && event.target === activeModal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", handleModalKeydown);

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
