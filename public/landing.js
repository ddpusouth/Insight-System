document.addEventListener('DOMContentLoaded', function () {
    // --- SPA Navigation Logic ---
    window.showPage = function (pageId) {
        // Hide all pages
        const pages = document.querySelectorAll('.page-section');
        pages.forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        const selectedPage = document.getElementById(pageId);
        if (selectedPage) {
            selectedPage.classList.add('active');
        }

        // Update Nav Links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            // Check if this link corresponds to the current page
            // We use a custom attribute data-page or just check the onclick
            if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(pageId)) {
                link.classList.add('active');
            }
        });

        // Scroll to top
        window.scrollTo(0, 0);

        // Close mobile menu if open
        const nav = document.querySelector('.navbar-nav');
        if (nav.classList.contains('active')) {
            nav.classList.remove('active');
        }
    };

    // Mobile Menu Toggle
    window.toggleMenu = function () {
        const nav = document.querySelector('.navbar-nav');
        nav.classList.toggle('active');
    };

    // Handle initial load (check hash or default to home)
    // For now, default to home
    // showPage('home'); // This is handled by default class in HTML

    // --- Header Scroll Effect ---
    window.addEventListener('scroll', function () {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Committee Filter Logic ---
    // Only run if we are on the committee page or if the elements exist
    // Since it's SPA, elements exist.

    window.filterSelection = function (c) {
        var x, i;
        x = document.getElementsByClassName("committee-member");
        if (c == "all") c = "";
        for (i = 0; i < x.length; i++) {
            removeShowClass(x[i], "show");
            if (x[i].className.indexOf(c) > -1) addShowClass(x[i], "show");
        }
    }

    function addShowClass(element, name) {
        var i, arr1, arr2;
        arr1 = element.className.split(" ");
        arr2 = name.split(" ");
        for (i = 0; i < arr2.length; i++) {
            if (arr1.indexOf(arr2[i]) == -1) {
                element.className += " " + arr2[i];
            }
        }
    }

    function removeShowClass(element, name) {
        var i, arr1, arr2;
        arr1 = element.className.split(" ");
        arr2 = name.split(" ");
        for (i = 0; i < arr2.length; i++) {
            while (arr1.indexOf(arr2[i]) > -1) {
                arr1.splice(arr1.indexOf(arr2[i]), 1);
            }
        }
        element.className = arr1.join(" ");
    }

    // Add active class to the current button (highlight it)
    var btnContainer = document.getElementById("myBtnContainer");
    if (btnContainer) {
        var btns = btnContainer.getElementsByClassName("filter-btn");
        for (var i = 0; i < btns.length; i++) {
            btns[i].addEventListener("click", function () {
                var current = document.getElementsByClassName("active filter-btn"); // Modified selector to be specific
                if (current.length > 0) {
                    current[0].className = current[0].className.replace(" active", "");
                }
                this.className += " active";
            });
        }
    }

    // Initialize filter
    filterSelection("all");
});
