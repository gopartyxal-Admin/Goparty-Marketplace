const menuToggle = document.getElementById('menuToggle');
        const mobileLinks = document.getElementById('mobileLinks');
        menuToggle.addEventListener('click', () => {
            const isOpen = mobileLinks.classList.toggle('open');
            menuToggle.setAttribute('aria-expanded', String(isOpen));
        });
