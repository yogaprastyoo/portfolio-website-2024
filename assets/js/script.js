// ** DOM Elements Cache **
const elements = {
    cursorRing: document.getElementById("cursor-ring"),
    scrollTopButton: document.querySelector(".scroll-to-top"),
    dateElement: document.getElementById("date"),
    yearElements: document.querySelectorAll(".year"),
    ageBadge: document.getElementById("age-badge"),
    navigationLinks: document.querySelectorAll(".navigation__link"),
    sections: document.querySelectorAll("article[id]"),
};

// ** Navigation Button **
let isNavigating = false;
let navigationTarget = null;

const navigateToSection = (id) => {
    const target = document.getElementById(id);
    if (target) {
        // Set navigation state
        isNavigating = true;
        navigationTarget = id;

        // Immediately set active link for the target
        if (window.initializeActiveNavigation) {
            window.initializeActiveNavigation.setActiveLink(id);
        }

        target.scrollIntoView({ behavior: "smooth" });

        // Reset navigation state after scroll completes - shorter timeout for mobile
        setTimeout(() => {
            isNavigating = false;
            navigationTarget = null;

            // Force a navigation update to ensure correct state
            if (window.initializeActiveNavigation) {
                window.initializeActiveNavigation.updateNavigation();
            }
        }, 600); // Reduced from 1000ms to 600ms for better responsiveness
    }
};

document.addEventListener("click", (e) => {
    const target = e.target.closest(".link-to");
    if (target?.dataset.targetId) {
        navigateToSection(target.dataset.targetId);
    }
});

// ** Cursor Ring **
const cursorRing = (() => {
    const ring = elements.cursorRing;
    if (!ring) return null;

    // Don't initialize cursor ring on touch devices
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
        return null;
    }

    const config = {
        easingFactor: 0.2,
        threshold: 0.1,
    };

    let targetX = 0,
        targetY = 0;
    let currentX = 0,
        currentY = 0;
    let isMouseMoving = false;
    let animationId = null;

    const updatePosition = () => {
        if (isMouseMoving) {
            const deltaX = (targetX - currentX) * config.easingFactor;
            const deltaY = (targetY - currentY) * config.easingFactor;

            currentX += deltaX;
            currentY += deltaY;

            ring.style.left = `${currentX}px`;
            ring.style.top = `${currentY}px`;

            isMouseMoving = Math.abs(deltaX) > config.threshold || Math.abs(deltaY) > config.threshold;
        }
        animationId = requestAnimationFrame(updatePosition);
    };

    const handleMouseMove = (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        isMouseMoving = true;
    };

    const showCursor = () => {
        ring.style.display = "block";
        document.addEventListener("mousemove", handleMouseMove, { passive: true });
    };

    const toggleActive = () => ring.classList.toggle("cursor-ring--active");

    // Event listeners
    document.addEventListener("mouseenter", showCursor);
    document.addEventListener("mousedown", toggleActive);
    document.addEventListener("mouseup", toggleActive);

    // Start animation loop
    updatePosition();

    return { ring };
})();

// ** Scroll to Top Button **
const scrollToTop = (() => {
    const container = elements.scrollTopButton;
    const button = container?.querySelector("button");
    if (!container || !button) return null;

    let isVisible = false;
    let ticking = false;

    const toggleVisibility = () => {
        const shouldShow = window.scrollY > window.innerHeight * 0.9;

        if (shouldShow !== isVisible) {
            isVisible = shouldShow;
            container.style.visibility = isVisible ? "visible" : "hidden";
        }
        ticking = false;
    };

    const handleScroll = () => {
        if (!ticking) {
            requestAnimationFrame(toggleVisibility);
            ticking = true;
        }
    };

    const handleClick = () => {
        button.classList.add("active");

        // Immediately remove all navigation underlines
        if (window.initializeActiveNavigation) {
            window.initializeActiveNavigation.removeAllActiveClasses();
        }

        // Set navigation state to prevent glitch during scroll
        isNavigating = true;
        navigationTarget = "top";

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });

        // Remove hash from URL
        if (window.location.hash) {
            history.replaceState(null, null, window.location.pathname + window.location.search);
        }

        // Reset navigation state after scroll completes
        setTimeout(() => {
            isNavigating = false;
            navigationTarget = null;
        }, 1000);
    };

    // Event listeners
    document.addEventListener("scroll", handleScroll, { passive: true });
    button.addEventListener("click", handleClick);

    return { handleClick };
})();

// ** Date Display **
const initializeDates = (() => {
    const currentDate = new Date();
    const formattedDate = new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
        .format(currentDate)
        .replace(/\//g, ". ");

    const year = currentDate.getFullYear();

    // Set date element
    if (elements.dateElement) {
        elements.dateElement.textContent = formattedDate;
    }

    // Set year elements - optimized with forEach
    if (elements.yearElements.length) {
        elements.yearElements.forEach((element) => {
            element.textContent = year;
        });
    }

    return { year, formattedDate };
})();

// ** Age Calculator **
const initializeAge = (() => {
    const birthYear = 2005;
    const birthMonth = 9; // October in 0-based index (October = 9)
    const birthDay = 12;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();

    // Calculate age more efficiently
    let age = currentYear - birthYear;

    // If birthday hasn't occurred this year yet, subtract 1 from age
    if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
        age--;
    }

    // Set age badge
    if (elements.ageBadge) {
        elements.ageBadge.textContent = `${age}y`;
    }

    return { age };
})();

// ** Active Navigation Highlighter **
const initializeActiveNavigation = (() => {
    const navigationLinks = elements.navigationLinks;
    const sections = elements.sections;

    if (!navigationLinks.length || !sections.length) return null;

    // Create a map of section IDs to their corresponding navigation links
    const linkMap = new Map();
    navigationLinks.forEach((link) => {
        const targetId = link.dataset.targetId;
        if (targetId) {
            linkMap.set(targetId, link);
        }
    });

    // Cache viewport height calculation
    let cachedViewportHeight = window.innerHeight;
    let resizeTimeout;

    // Update cached viewport height on resize with debouncing
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            cachedViewportHeight = window.innerHeight;
        }, 150);
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // Simple remove all active classes
    const removeAllActiveClasses = () => {
        navigationLinks.forEach((link) => {
            link.classList.remove("navigation__link--active");
        });
    };

    // Simple set active link
    const setActiveLink = (sectionId) => {
        removeAllActiveClasses();
        const targetLink = linkMap.get(sectionId);
        if (targetLink) {
            targetLink.classList.add("navigation__link--active");
        }
    };

    // Optimized section detection with cached calculations
    const getCurrentSection = () => {
        if (isNavigating) {
            // During navigation, return the target section if available
            return navigationTarget;
        }

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Top area - no active section
        if (scrollTop < 200) {
            return null;
        }

        // Cache offset calculation - smaller offset for better mobile detection
        const offset = cachedViewportHeight * 0.2; // Reduced from 0.3 to 0.2 for better mobile detection
        const scrollPlusOffset = scrollTop + offset;

        // Find which section the user is currently in
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const rect = section.getBoundingClientRect();
            const sectionTop = scrollTop + rect.top;
            const sectionBottom = sectionTop + rect.height;

            if (scrollPlusOffset >= sectionTop && scrollPlusOffset < sectionBottom) {
                return section.id;
            }
        }

        return null;
    };

    // Optimized URL update with current hash cache
    let currentURLHash = window.location.hash;
    const updateURL = (sectionId) => {
        const newHash = sectionId ? `#${sectionId}` : "";

        if (currentURLHash !== newHash) {
            const newURL = window.location.pathname + window.location.search + newHash;
            history.replaceState(null, null, newURL);
            currentURLHash = newHash; // Update cache
        }
    };

    // Update navigation state
    const updateNavigation = () => {
        if (isNavigating) return;

        const currentSection = getCurrentSection();

        if (!currentSection || currentSection === "thank-you-note") {
            removeAllActiveClasses();
            updateURL(""); // Remove hash when no section active
        } else {
            setActiveLink(currentSection);
            updateURL(currentSection); // Update URL with current section
        }
    };

    // Optimized scroll handler
    let ticking = false;
    const handleScroll = () => {
        if (isNavigating || ticking) return;

        ticking = true;
        requestAnimationFrame(() => {
            updateNavigation();
            ticking = false;
        });
    };

    // Listen to scroll events
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Handle direct URL access with hash (e.g., website.com#skills)
    const handleInitialHash = () => {
        const hash = window.location.hash.slice(1); // Remove # from hash
        if (hash && linkMap.has(hash)) {
            // Small delay to ensure page is loaded
            setTimeout(() => {
                navigateToSection(hash);
            }, 100);
        }
    };

    // Handle browser back/forward navigation
    const handleHashChange = () => {
        const hash = window.location.hash.slice(1);
        currentURLHash = window.location.hash; // Update cache

        if (hash && linkMap.has(hash)) {
            navigateToSection(hash);
        } else if (!hash) {
            // User navigated to URL without hash, scroll to top
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Listen to hash changes (browser back/forward)
    window.addEventListener("hashchange", handleHashChange, { passive: true });

    // Handle initial page load with hash
    handleInitialHash();

    // Initial check
    updateNavigation();

    return {
        setActiveLink,
        removeAllActiveClasses,
        updateNavigation,
    };
})();

// ** Touch Device Hover Fix **
const handleTouchDeviceHover = (() => {
    // Detect if device supports touch
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    if (!isTouchDevice) return null;

    // Add class to body to indicate touch device
    document.body.classList.add("touch-device");

    // Handle touch events to prevent stuck hover states
    const handleTouchStart = (e) => {
        // Check if touch is on a navigation link
        const navLink = e.target.closest(".navigation__link");

        if (navLink) {
            // If touching a navigation link, immediately remove all touch-hover classes
            elements.navigationLinks.forEach((link) => {
                link.classList.remove("touch-hover");
            });

            // Add touch-hover to the touched navigation link
            navLink.classList.add("touch-hover");
        } else {
            // If touching elsewhere, just remove all touch-hover classes
            elements.navigationLinks.forEach((link) => {
                if (!link.classList.contains("navigation__link--active")) {
                    link.classList.remove("touch-hover");
                }
            });
        }
    };

    const handleTouchEnd = (e) => {
        // Check if touch ended on a navigation link
        const navLink = e.target.closest(".navigation__link");

        if (navLink) {
            // If this was a navigation click, remove touch-hover quickly
            // and let the navigation system handle the state
            setTimeout(() => {
                navLink.classList.remove("touch-hover");

                // Force update navigation state after touch navigation
                if (window.initializeActiveNavigation && !isNavigating) {
                    window.initializeActiveNavigation.updateNavigation();
                }
            }, 100); // Slightly longer delay to ensure click registers
        } else {
            // For other touches, remove touch-hover with normal delay
            setTimeout(() => {
                elements.navigationLinks.forEach((link) => {
                    if (!link.classList.contains("navigation__link--active")) {
                        link.classList.remove("touch-hover");
                    }
                });
            }, 150);
        }
    };

    // Add event listeners
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return { handleTouchStart, handleTouchEnd };
})();

// Make navigation functions globally accessible
window.initializeActiveNavigation = initializeActiveNavigation;
