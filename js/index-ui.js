const hamburgerBtn = document.getElementById('hamburgerBtn');
        const sidebar = document.getElementById('sidebar');
        const closeBtn = document.getElementById('closeBtn');
        const overlay = document.getElementById('overlay');

        hamburgerBtn.addEventListener('click', () => { sidebar.classList.add('active'); overlay.classList.add('active'); document.body.style.overflow = 'hidden'; });
        closeBtn.addEventListener('click', () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); document.body.style.overflow = 'auto'; });
        overlay.addEventListener('click', () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); document.body.style.overflow = 'auto'; });
        document.querySelectorAll('.sidebar-links a').forEach(link => { link.addEventListener('click', () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); document.body.style.overflow = 'auto'; }); });

        // FAQ Acordeón (delegado, ya que los items se cargan dinámicamente)
        document.addEventListener('click', (e) => {
            const pregunta = e.target.closest('.faq-pregunta');
            if (pregunta) {
                const item = pregunta.parentElement;
                const isActive = item.classList.contains('active');
                document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
                if (!isActive) item.classList.add('active');
            }
        });
