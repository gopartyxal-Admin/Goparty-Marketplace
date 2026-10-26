const overlay = document.getElementById('overlay');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const closeBtn = document.getElementById('closeBtn');

// === ABRIR/CERRAR MODALES Y PANELES ===
window.abrirModal = function(id) {
    cerrarTodo();
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

window.abrirPanel = function(id) {
    cerrarTodo();
    const panel = document.getElementById(id);
    if (panel) {
        panel.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

window.cerrarTodo = function() {
    document.querySelectorAll('.modal.active, .side-panel.active').forEach(el => el.classList.remove('active'));
    overlay.classList.remove('active');
    document.body.style.overflow = '';
};

window.cerrarSidebar = function() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
};

// Cerrar al clic en overlay
overlay.addEventListener('click', () => cerrarTodo());

// Cerrar con tecla Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarTodo();
});

// === SIDEBAR MÓVIL ===
hamburgerBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
});
closeBtn.addEventListener('click', cerrarSidebar);
document.querySelectorAll('.sidebar-links a').forEach(link => {
    link.addEventListener('click', cerrarSidebar);
});

// === FAQ ACORDEÓN (delegado) ===
document.addEventListener('click', (e) => {
    const pregunta = e.target.closest('.faq-pregunta');
    if (pregunta) {
        const item = pregunta.parentElement;
        const isActive = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
        if (!isActive) item.classList.add('active');
    }
});

// === COTIZACIÓN MULTI-STEP ===
window.cotSiguiente = function(pasoActual) {
    if (pasoActual === 1) {
        const tipo = document.querySelector('input[name="tipoEvento"]:checked');
        if (!tipo) { alert('Selecciona un tipo de evento'); return; }
    }
    if (pasoActual === 2) {
        const servicios = document.querySelectorAll('input[name="servicios"]:checked');
        if (servicios.length === 0) { alert('Selecciona al menos un servicio'); return; }
    }
    if (pasoActual < 4) {
        document.getElementById('cotStep' + pasoActual).classList.add('hidden');
        document.getElementById('cotStep' + (pasoActual + 1)).classList.remove('hidden');
        document.querySelectorAll('.step-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i <= pasoActual);
        });
    }
};

window.cotAtras = function(pasoActual) {
    if (pasoActual > 1) {
        document.getElementById('cotStep' + pasoActual).classList.add('hidden');
        document.getElementById('cotStep' + (pasoActual - 1)).classList.remove('hidden');
        document.querySelectorAll('.step-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i < pasoActual - 1);
        });
    }
};

window.resetCotizacion = function() {
    document.querySelectorAll('.cot-step').forEach(s => s.classList.add('hidden'));
    document.getElementById('cotStep1').classList.remove('hidden');
    document.getElementById('cotConfirm').classList.add('hidden');
    document.querySelectorAll('.step-dot').forEach((dot, i) => dot.classList.toggle('active', i === 0));
    document.querySelectorAll('input[name="tipoEvento"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="servicios"]').forEach(c => c.checked = false);
    document.getElementById('cotFecha').value = '';
    document.getElementById('cotPresupuesto').value = '';
    document.getElementById('cotWhatsapp').value = '';
    document.getElementById('cotEmail').value = '';
};
