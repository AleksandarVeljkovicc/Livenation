async function loadInclude(element) {
    const path = element.dataset.include;
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
    }

    const template = document.createElement("template");
    template.innerHTML = await response.text();

    if (!template.content.firstElementChild) {
        throw new Error(`The include at ${path} is empty.`);
    }

    element.replaceWith(template.content);
}

function initializeMobileNavigation() {
    const menuToggle = document.querySelector(".mobile_menu_toggle");
    const navigation = document.querySelector(".mobile_navigation");
    const sidebarToggle = document.querySelector(".sidebar_toggle");
    const sidebar = document.querySelector("aside");
    const sidebarClose = document.querySelector(".aside_close_button");

    if (!menuToggle || !navigation || !sidebarToggle || !sidebar || !sidebarClose) {
        throw new Error("Mobile navigation or sidebar controls are missing.");
    }

    const mobileLayout = window.matchMedia("(max-width: 700px)");
    const backdrop = document.createElement("div");
    backdrop.id = "aside_backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    document.body.append(backdrop);

    function setMenuOpen(isOpen) {
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        navigation.classList.toggle("is-open", isOpen);
        menuToggle.querySelector("i").className = isOpen
            ? "fa-solid fa-xmark"
            : "fa-solid fa-bars";
        menuToggle.querySelector(".visually-hidden").textContent = isOpen
            ? "Close navigation menu"
            : "Open navigation menu";
    }

    function setSidebarOpen(isOpen) {
        document.body.classList.toggle("aside-open", isOpen);
        sidebar.setAttribute("aria-hidden", String(mobileLayout.matches && !isOpen));
        sidebar.inert = mobileLayout.matches && !isOpen;

        if (isOpen) {
            sidebarClose.focus();
        } else {
            menuToggle.focus();
        }
    }

    menuToggle.addEventListener("click", () => {
        setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    navigation.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setMenuOpen(false));
    });

    sidebarToggle.addEventListener("click", () => {
        setMenuOpen(false);
        setSidebarOpen(true);
    });

    sidebarClose.addEventListener("click", () => setSidebarOpen(false));
    backdrop.addEventListener("click", () => setSidebarOpen(false));

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setMenuOpen(false);

            if (document.body.classList.contains("aside-open")) {
                setSidebarOpen(false);
            }

            return;
        }

        if (event.key === "Tab" && document.body.classList.contains("aside-open")) {
            const focusableElements = [...sidebar.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )].filter((element) => element.getClientRects().length > 0);
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    });

    mobileLayout.addEventListener("change", ({ matches }) => {
        setMenuOpen(false);
        document.body.classList.remove("aside-open");
        sidebar.setAttribute("aria-hidden", String(matches));
        sidebar.inert = matches;
    });

    sidebar.setAttribute("aria-hidden", String(mobileLayout.matches));
    sidebar.inert = mobileLayout.matches;
}

async function initializeIncludes() {
    const elements = [...document.querySelectorAll("[data-include]")];
    const results = await Promise.allSettled(elements.map(loadInclude));

    results.forEach((result, index) => {
        if (result.status === "rejected") {
            console.error(result.reason);
            elements[index].innerHTML = "<p>Shared content could not be loaded.</p>";
        }
    });

    if (results.every((result) => result.status === "fulfilled")) {
        initializeMobileNavigation();
    }
}

initializeIncludes().catch((error) => {
    console.error("Failed to initialize shared page components.", error);
});
