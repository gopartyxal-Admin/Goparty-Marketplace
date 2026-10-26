import { addDoc, collection, db, doc, getDoc, getDocs, query, where } from "../firebase-config.js";

// ==========================================
// DATOS POR DEFECTO (fallback si Firebase está vacío)
// ==========================================
const categoriasDefault = [
    { nombre: 'Salones', icono: '🏰', descripcion: 'Espacios únicos', orden: 1 },
    { nombre: 'Alimentos', icono: '🍽️', descripcion: 'Sabores increíbles', orden: 2 },
    { nombre: 'Fotografía', icono: '📸', descripcion: 'Momentos eternos', orden: 3 },
    { nombre: 'Música/DJ', icono: '🎵', descripcion: 'El ritmo perfecto', orden: 4 },
    { nombre: 'Decoración', icono: '🎈', descripcion: 'Ambientes mágicos', orden: 5 },
    { nombre: 'Animación', icono: '🎪', descripcion: 'Diversión garantizada', orden: 6 }
];

const ciudadesDefault = [
    { nombre: 'Xalapa', estado: 'Veracruz', descripcion: 'Capital de Veracruz', orden: 1 },
    { nombre: 'Veracruz', estado: 'Veracruz', descripcion: 'Puerto y playa', orden: 2 },
    { nombre: 'Puebla', estado: 'Puebla', descripcion: 'Tradición y sabor', orden: 3 },
    { nombre: 'CDMX', estado: 'Ciudad de México', descripcion: 'La gran ciudad', orden: 4 },
    { nombre: 'Córdoba', estado: 'Veracruz', descripcion: 'Café y cultura', orden: 5 },
    { nombre: 'Orizaba', estado: 'Veracruz', descripcion: 'Ciudad de las aguas', orden: 6 }
];

const faqDefault = [
    { pregunta: '¿Cómo sé que un proveedor es confiable?', respuesta: 'Todos los proveedores en GoParty pasan por un proceso de verificación. Los que tienen insignia Gold o Pro han sido validados por nuestro equipo y cuentan con reseñas de clientes reales.', orden: 1 },
    { pregunta: '¿GoParty cobra comisión por las reservas?', respuesta: 'No. GoParty no cobra comisiones a los clientes. Los proveedores pagan una membresía mensual por estar en la plataforma, pero tú contactas directamente con ellos sin costos adicionales.', orden: 2 },
    { pregunta: '¿Qué diferencia hay entre los planes Gold, Pro y Basic?', respuesta: 'Basic: aparece en el directorio general. Pro: tiene sello verificado y mayor visibilidad. Gold: posición destacada en búsquedas, borde dorado y soporte prioritario.', orden: 3 },
    { pregunta: '¿Cómo solicito una cotización personalizada?', respuesta: 'Haz clic en "Solicitar Cotización" en el menú, llena el formulario con los detalles de tu evento (tipo, fecha, presupuesto, servicios) y nuestro equipo te conectará con los proveedores ideales.', orden: 4 },
    { pregunta: '¿En qué ciudades opera GoParty?', respuesta: 'Actualmente operamos en Xalapa, Veracruz, Córdoba, Orizaba, Coatepec, Puebla y CDMX. Estamos expandiéndonos constantemente a más ciudades de México.', orden: 5 },
    { pregunta: '¿Soy proveedor, cómo me registro?', respuesta: 'Haz clic en "Únete a GoParty" o "Soy Proveedor" en el menú. Completa el formulario de 4 pasos con tu información, servicios y elige tu plan. Tu perfil será revisado en 24-48 horas.', orden: 6 }
];

const testimoniosDefault = [
    { nombreCliente: 'María González', inicial: 'M', tipoEvento: 'Cumpleaños Infantil', ciudad: 'Xalapa', calificacion: 5, comentario: 'Encontré al decorador perfecto para la fiesta de mi hija. Todo salió increíble y el proceso fue súper fácil.' },
    { nombreCliente: 'Juan Pérez', inicial: 'J', tipoEvento: 'Boda', ciudad: 'Veracruz', calificacion: 5, comentario: 'La mejor plataforma para encontrar proveedores. Los Gold realmente valen la pena, calidad garantizada.' },
    { nombreCliente: 'Ana Ramírez', inicial: 'A', tipoEvento: 'Evento Corporativo', ciudad: 'Puebla', calificacion: 5, comentario: 'Me encantó poder comparar varios proveedores y ver sus reseñas. Mi evento corporativo fue un éxito total.' }
];

// ==========================================
// RENDER CATEGORÍAS (solo llena los selects)
// ==========================================
function renderCategorias(categorias) {
    const select = document.getElementById('filterCategoria');
    while (select.options.length > 1) select.remove(1);
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.nombre;
        option.textContent = `${cat.icono || ''} ${cat.nombre}`;
        select.appendChild(option);
    });
}

// ==========================================
// RENDER CIUDADES
// ==========================================
function renderCiudades(ciudades) {
    const grid = document.getElementById('ciudadesGrid');
    const selectCiudad = document.getElementById('filterCiudad');
    const selectEstado = document.getElementById('filterEstado');
    while (selectCiudad.options.length > 1) selectCiudad.remove(1);
    while (selectEstado.options.length > 1) selectEstado.remove(1);
    const estadosUnicos = [...new Set(ciudades.map(c => c.estado))];
    const gradientes = ['#FFD93D,#FF6B9D', '#FF6B9D,#4A90E2', '#6BCB77,#4A90E2', '#4A90E2,#FFD93D', '#FF6B9D,#FFD93D', '#4A90E2,#6BCB77'];
    grid.innerHTML = ciudades.map((ciu, idx) => {
        const g = gradientes[idx % gradientes.length].split(',');
        return `<div class="ciudad-card" onclick="filtrarPorCiudad('${ciu.nombre}')" style="background: linear-gradient(135deg, ${g[0]} 0%, ${g[1]} 100%);"><div class="ciudad-info"><h3>${ciu.nombre}</h3><p>${ciu.descripcion || ciu.estado}</p></div></div>`;
    }).join('');
    ciudades.forEach(ciu => {
        const option = document.createElement('option');
        option.value = ciu.nombre;
        option.textContent = ciu.nombre;
        selectCiudad.appendChild(option);
    });
    estadosUnicos.forEach(est => {
        const option = document.createElement('option');
        option.value = est;
        option.textContent = est;
        selectEstado.appendChild(option);
    });
}

// ==========================================
// RENDER FAQ
// ==========================================
function renderFaqs(faqs) {
    const container = document.getElementById('faqContainer');
    container.innerHTML = faqs.map(faq => `
        <div class="faq-item">
            <div class="faq-pregunta"><span>${faq.pregunta}</span><span class="faq-icono">+</span></div>
            <div class="faq-respuesta">${faq.respuesta}</div>
        </div>
    `).join('');
}

// ==========================================
// RENDER TESTIMONIOS
// ==========================================
function renderTestimonios(testimonios) {
    const grid = document.getElementById('testimoniosGrid');
    if (!grid) return;
    grid.innerHTML = testimonios.map(t => {
        const estrellas = '⭐'.repeat(t.calificacion || 5);
        return `
            <div class="testimonio-card">
                <div class="testimonio-estrellas">${estrellas}</div>
                <p class="testimonio-texto">${t.comentario || ''}</p>
                <div class="testimonio-autor">
                    <div class="testimonio-avatar">${t.inicial || t.nombreCliente?.charAt(0) || '?'}</div>
                    <div class="testimonio-info">
                        <h4>${t.nombreCliente || 'Cliente'}</h4>
                        <p>${t.tipoEvento || ''} - ${t.ciudad || ''}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// CARGAR CONTENIDO DINÁMICO
// ==========================================
async function cargarContenidoDinamico() {
    try {
        const catSnap = await getDocs(collection(db, "categorias"));
        let categorias = [];
        catSnap.forEach(doc => categorias.push({ id: doc.id, ...doc.data() }));
        categorias.sort((a, b) => (a.orden || 99) - (b.orden || 99));
        if (categorias.length === 0) categorias = categoriasDefault;
        renderCategorias(categorias);

        const ciuSnap = await getDocs(collection(db, "ciudades"));
        let ciudades = [];
        ciuSnap.forEach(doc => ciudades.push({ id: doc.id, ...doc.data() }));
        ciudades.sort((a, b) => (a.orden || 99) - (b.orden || 99));
        if (ciudades.length === 0) ciudades = ciudadesDefault;
        renderCiudades(ciudades);

        const faqSnaps = await Promise.all([
            getDocs(collection(db, "faq_general")),
            getDocs(collection(db, "faq_clientes")),
            getDocs(collection(db, "faq_proveedores"))
        ]);
        let faqs = [];
        faqSnaps.forEach(faqSnap => faqSnap.forEach(doc => faqs.push({ id: doc.id, ...doc.data() })));
        faqs.sort((a, b) => (a.orden || 99) - (b.orden || 99));
        if (faqs.length === 0) faqs = faqDefault;
        renderFaqs(faqs);

        const testSnap = await getDocs(collection(db, "testimonios"));
        let testimonios = [];
        testSnap.forEach(doc => testimonios.push({ id: doc.id, ...doc.data() }));
        testimonios = testimonios
            .filter(t => t.estado === 'aprobado')
            .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
        if (testimonios.length === 0) testimonios = testimoniosDefault;
        renderTestimonios(testimonios.slice(0, 6));
    } catch (error) {
        console.error("Error cargando contenido dinámico:", error);
        renderCategorias(categoriasDefault);
        renderCiudades(ciudadesDefault);
        renderFaqs(faqDefault);
        renderTestimonios(testimoniosDefault);
    }
}

// ==========================================
// CONFIGURACIÓN (WhatsApp, Stats)
// ==========================================
async function cargarConfiguracion() {
    try {
        const docRef = doc(db, "configuracion", "general");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.whatsapp) {
                document.getElementById('whatsappFloat').href = `https://wa.me/${data.whatsapp}?text=Hola%20GoParty%2C%20necesito%20información`;
            }
            if (data.modoStats === 'manual') {
                setStat('statEventos', (data.eventosManual || 0) + '+');
                setStat('statSatisfaccion', (data.satisfaccionManual || 0) + '%');
            } else {
                const proveedoresSnap = await getDocs(collection(db, "proveedores"));
                const verificados = proveedoresSnap.docs.filter(d => d.data().estadoVerificacion === 'Verificado').length;
                const ciudadesCount = [...new Set(proveedoresSnap.docs.map(d => d.data().ciudad).filter(c => c))];
                const cotizacionesSnap = await getDocs(collection(db, "solicitudes"));
                setStat('statEventos', cotizacionesSnap.size + '+');
                setStat('statProveedores', verificados + '+');
                setStat('statSatisfaccion', '98%');
                setStat('statCiudades', ciudadesCount.length + '+');
            }
        } else {
            setStat('statProveedores', '0+');
            setStat('statCiudades', '0+');
        }
    } catch (error) { console.error("Error cargando config:", error); }
}

// ==========================================
// NEWSLETTER
// ==========================================
window.suscribirNewsletter = async function(e) {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail').value.trim();
    const msg = document.getElementById('newsletterMsg');
    if (!email) return;
    try {
        const q = query(collection(db, "suscriptores"), where("email", "==", email));
        const existing = await getDocs(q);
        if (!existing.empty) { msg.textContent = 'ℹ️ Este email ya está suscrito.'; msg.style.color = '#FF6B9D'; return; }
        await addDoc(collection(db, "suscriptores"), { email, fecha: new Date().toISOString(), activo: true });
        msg.textContent = '✅ ¡Gracias por suscribirte!';
        msg.style.color = '#6BCB77';
        document.getElementById('newsletterForm').reset();
        setTimeout(() => { msg.textContent = ''; }, 5000);
    } catch (error) { msg.textContent = '❌ Error al suscribir.'; msg.style.color = '#FF6B9D'; }
};

// ==========================================
// PROVEEDORES (carga en panel lateral)
// ==========================================
async function cargarProveedores(filtros = {}) {
    const contenedor = document.getElementById('contenedorProveedores');
    const countElement = document.getElementById('proveedoresCount');
    contenedor.innerHTML = '<p class="loading-msg">Cargando proveedores...</p>';
    try {
        let q = collection(db, "proveedores");
        const constraints = [];
        constraints.push(where("estadoVerificacion", "==", "Verificado"));
        if (filtros.categoria) constraints.push(where("categoria", "==", filtros.categoria));
        if (filtros.estado) constraints.push(where("estado", "==", filtros.estado));
        if (filtros.ciudad) constraints.push(where("ciudad", "==", filtros.ciudad));
        if (constraints.length > 0) q = query(q, ...constraints);
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            contenedor.innerHTML = `<div class="loading-msg"><h3>🎉 ¡Pronto tendremos proveedores!</h3><p>Aún no hay proveedores verificados con estos filtros.</p></div>`;
            countElement.textContent = '0 proveedores';
            return;
        }

        const proveedoresArray = [];
        querySnapshot.forEach((doc) => proveedoresArray.push({ id: doc.id, ...doc.data() }));
        proveedoresArray.sort((a, b) => {
            const rankA = a.planRank || (a.plan === 'gold' ? 3 : a.plan === 'pro' ? 2 : 1);
            const rankB = b.planRank || (b.plan === 'gold' ? 3 : b.plan === 'pro' ? 2 : 1);
            return rankB - rankA;
        });

        contenedor.innerHTML = '';
        countElement.textContent = `${proveedoresArray.length} proveedor${proveedoresArray.length !== 1 ? 'es' : ''}`;

        proveedoresArray.forEach((data) => {
            let badge = '', cardClass = '';
            if (data.plan === 'gold') { badge = '<span class="badge badge-gold">👑 Gold</span>'; cardClass = 'gold'; }
            else if (data.plan === 'pro') { badge = '<span class="badge badge-pro">⭐ Pro</span>'; }
            else { badge = '<span class="badge badge-basic">✓ Verificado</span>'; }
            const tarjeta = `<div class="proveedor-card ${cardClass}">${badge}<div class="camera-icon">📷</div><h3 style="margin:0;font-size:1.1rem;text-align:center;">${data.nombreNegocio}</h3><p style="margin:0.3rem 0;opacity:0.95;text-align:center;font-size:0.85rem;">📍 ${data.ciudad || 'Xalapa'}, ${data.estado || 'Veracruz'}</p><p style="margin:0.3rem 0;opacity:0.95;text-align:center;font-size:0.85rem;">🏷️ ${data.categoria || 'General'}</p></div>`;
            contenedor.innerHTML += tarjeta;
        });
    } catch (error) {
        contenedor.innerHTML = '<p class="loading-msg">Error al cargar proveedores.</p>';
    }
}

// ==========================================
// BLOG
// ==========================================
let blogFiltroActual = 'todos';
async function cargarBlog() {
    const blogGrid = document.getElementById('blogGrid');
    try {
        let q = collection(db, "posts");
        const constraints = [];
        if (blogFiltroActual !== 'todos') constraints.push(where("categoria", "==", blogFiltroActual));
        if (constraints.length > 0) q = query(q, ...constraints);
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            blogGrid.innerHTML = `<div class="blog-empty"><div class="blog-empty-icon">📝</div><h3>Próximamente</h3><p>Estamos preparando contenido increíble.</p></div>`;
            return;
        }
        blogGrid.innerHTML = '';
        const posts = [];
        querySnapshot.forEach((doc) => posts.push({ id: doc.id, ...doc.data() }));
        posts.sort((a, b) => new Date(b.fechaPublicacion || 0) - new Date(a.fechaPublicacion || 0));
        posts.slice(0, 6).forEach(post => {
            const iconos = { 'Consejos': '💡', 'Tendencias': '🔥', 'Recursos Descargables': '📥', 'General': '📰' };
            const icono = iconos[post.categoria] || '';
            const fecha = post.fechaPublicacion ? new Date(post.fechaPublicacion).toLocaleDateString('es-MX') : '';
            const tieneRecurso = post.recursoURL && post.recursoURL.trim() !== '';
            const card = `<div class="blog-card"><div class="blog-card-image"><span class="blog-card-category">${post.categoria || 'General'}</span>${icono}</div><div class="blog-card-content"><h3 class="blog-card-title">${post.titulo || 'Sin título'}</h3><p class="blog-card-excerpt">${(post.resumen || post.contenido || '').substring(0, 120)}...</p><div class="blog-card-footer"><span class="blog-card-date">${fecha}</span><a href="${tieneRecurso ? post.recursoURL : '#'}" class="blog-card-action ${tieneRecurso ? 'download' : ''}" ${tieneRecurso ? 'download' : ''} target="_blank">${tieneRecurso ? '📥 Descargar' : '📖 Leer más'}</a></div></div></div>`;
            blogGrid.innerHTML += card;
        });
    } catch (error) { console.error("Error al cargar blog:", error); }
}

document.querySelectorAll('.blog-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.blog-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        blogFiltroActual = tab.getAttribute('data-filter');
        cargarBlog();
    });
});

// ==========================================
// FILTROS
// ==========================================
window.filtrarProveedores = function() {
    const filtros = {
        categoria: document.getElementById('filterCategoria').value,
        estado: document.getElementById('filterEstado').value,
        ciudad: document.getElementById('filterCiudad').value
    };
    cargarProveedores(filtros);
    abrirPanel('panelDestacados');
};

window.filtrarPorCiudad = function(ciudad) {
    document.getElementById('filterCiudad').value = ciudad;
    cargarProveedores({ ciudad });
    abrirPanel('panelDestacados');
};

window.filtrarPorCategoria = function(categoria) {
    document.getElementById('filterCategoria').value = categoria;
    cargarProveedores({ categoria });
    abrirPanel('panelDestacados');
};

// ==========================================
// ENVIAR COTIZACIÓN
// ==========================================
window.enviarCotizacion = async function() {
    const whatsapp = document.getElementById('cotWhatsapp').value.trim();
    const email = document.getElementById('cotEmail').value.trim();
    if (!whatsapp || !email) { alert('Completa tu WhatsApp y email'); return; }

    const tipo = document.querySelector('input[name="tipoEvento"]:checked')?.value || '';
    const servicios = Array.from(document.querySelectorAll('input[name="servicios"]:checked')).map(c => c.value);
    const fecha = document.getElementById('cotFecha').value;
    const presupuesto = document.getElementById('cotPresupuesto').value;

    try {
        await addDoc(collection(db, "solicitudes"), {
            tipoEvento: tipo,
            servicios,
            fecha,
            presupuesto,
            whatsapp,
            email,
            estado: 'Pendiente',
            fechaSolicitud: new Date().toISOString()
        });
        document.querySelectorAll('.cot-step').forEach(s => s.classList.add('hidden'));
        document.getElementById('cotConfirm').classList.remove('hidden');
    } catch (error) {
        alert('❌ Error al enviar: ' + error.message);
    }
};

// ==========================================
// WHATSAPP DESDE FAQ
// ==========================================
window.abrirWhatsApp = function() {
    const wa = document.getElementById('whatsappFloat');
    if (wa && wa.href && wa.href !== '#') {
        window.open(wa.href, '_blank');
    }
};

// ==========================================
// BÚSQUEDA SUPERIOR
// ==========================================
document.getElementById('topbarSearch').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const term = e.target.value.trim();
        if (term) {
            cargarProveedores({});
            abrirPanel('panelDestacados');
        }
    }
});

// ==========================================
// VISTA EXPLORAR (tipo Booking)
// ==========================================
let explorarProveedores = [];
let explorarFiltrados = [];
let explorarPagina = 1;
const explorarPorPagina = 12;
let explorarVista = 'grid';

function setStat(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
    const el2 = document.getElementById(id + '2');
    if (el2) el2.textContent = val;
}

window.mostrarExplorar = async function() {
    document.getElementById('explorarView').classList.add('active');
    if (explorarProveedores.length === 0) {
        await cargarProveedoresExplorar();
    }
};

window.ocultarExplorar = function() {
    document.getElementById('explorarView').classList.remove('active');
};

async function cargarProveedoresExplorar() {
    const grid = document.getElementById('expGrid');
    grid.innerHTML = '<div class="loading-msg" style="grid-column:1/-1;">Cargando proveedores...</div>';
    try {
        const snap = await getDocs(collection(db, "proveedores"));
        explorarProveedores = [];
        snap.forEach(doc => {
            const d = doc.data();
            if (d.estadoVerificacion === 'Verificado') {
                explorarProveedores.push({ id: doc.id, ...d });
            }
        });
        llenarFiltrosExplorar();
        aplicarFiltrosExplorar();
    } catch (error) {
        grid.innerHTML = '<div class="loading-msg" style="grid-column:1/-1;">Error al cargar.</div>';
    }
}

function llenarFiltrosExplorar() {
    const cats = [...new Set(explorarProveedores.map(p => p.categoria).filter(c => c))];
    const cont = document.getElementById('expFilterCategorias');
    cont.innerHTML = cats.map(c => `<label class="exp-check"><input type="checkbox" class="exp-cat" value="${c}"> ${c}</label>`).join('');

    const estados = [...new Set(explorarProveedores.map(p => p.estado).filter(e => e))];
    const selEstado = document.getElementById('expFilterEstado');
    while (selEstado.options.length > 1) selEstado.remove(1);
    estados.forEach(e => { const o = document.createElement('option'); o.value = e; o.textContent = e; selEstado.appendChild(o); });
}

window.actualizarCiudadesExplorar = function() {
    const estado = document.getElementById('expFilterEstado').value;
    const selCiudad = document.getElementById('expFilterCiudad');
    while (selCiudad.options.length > 1) selCiudad.remove(1);
    const ciudades = [...new Set(explorarProveedores.filter(p => !estado || p.estado === estado).map(p => p.ciudad).filter(c => c))];
    ciudades.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; selCiudad.appendChild(o); });
};

window.aplicarFiltrosExplorar = function() {
    const catsSel = Array.from(document.querySelectorAll('.exp-cat:checked')).map(c => c.value);
    const estado = document.getElementById('expFilterEstado').value;
    const ciudad = document.getElementById('expFilterCiudad').value;
    const insignias = Array.from(document.querySelectorAll('.exp-insignia:checked')).map(c => c.value);
    const calMin = parseInt(document.getElementById('expFilterCalificacion').value) || 0;
    const sort = document.getElementById('expSort').value;

    explorarFiltrados = explorarProveedores.filter(p => {
        if (catsSel.length > 0 && !catsSel.includes(p.categoria)) return false;
        if (estado && p.estado !== estado) return false;
        if (ciudad && p.ciudad !== ciudad) return false;
        if (insignias.length > 0 && !insignias.includes(p.plan || 'basic')) return false;
        if (calMin > 0 && (p.calificacion || 0) < calMin) return false;
        return true;
    });

    if (sort === 'calificacion') {
        explorarFiltrados.sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0));
    } else if (sort === 'recientes') {
        explorarFiltrados.sort((a, b) => new Date(b.fechaRegistro || 0) - new Date(a.fechaRegistro || 0));
    } else {
        explorarFiltrados.sort((a, b) => {
            const rA = a.planRank || (a.plan === 'gold' ? 3 : a.plan === 'pro' ? 2 : 1);
            const rB = b.planRank || (b.plan === 'gold' ? 3 : b.plan === 'pro' ? 2 : 1);
            return rB - rA;
        });
    }

    explorarPagina = 1;
    renderExplorar();
};

function renderExplorar() {
    const grid = document.getElementById('expGrid');
    const counter = document.getElementById('expCounter');
    const total = explorarFiltrados.length;
    const inicio = (explorarPagina - 1) * explorarPorPagina;
    const fin = Math.min(inicio + explorarPorPagina, total);
    const paginaItems = explorarFiltrados.slice(inicio, fin);

    counter.textContent = `Mostrando ${total > 0 ? inicio + 1 : 0}-${fin} de ${total} proveedores`;

    if (paginaItems.length === 0) {
        grid.innerHTML = '<div class="loading-msg" style="grid-column:1/-1;">No se encontraron proveedores con estos filtros.</div>';
        document.getElementById('expPagination').innerHTML = '';
        return;
    }

    grid.innerHTML = paginaItems.map(p => {
        let badge = '', coverClass = '';
        if (p.plan === 'gold') { badge = '<span class="exp-card-badge gold">👑 Gold</span>'; coverClass = 'gold'; }
        else if (p.plan === 'pro') { badge = '<span class="exp-card-badge pro">⭐ Pro</span>'; coverClass = 'pro'; }
        else { badge = '<span class="exp-card-badge basic">✓ Verificado</span>'; }
        const estrellas = '⭐'.repeat(Math.round(p.calificacion || 5));
        return `<div class="exp-card" onclick="abrirModal('modalProveedor')">
            <div class="exp-card-cover ${coverClass}">📷${badge}</div>
            <div class="exp-card-body">
                <div class="exp-card-name">${p.nombreNegocio || 'Proveedor'}</div>
                <div class="exp-card-cat">${p.categoria || 'General'}</div>
                <div class="exp-card-rating">${estrellas} ${p.calificacion || '5.0'}</div>
                <div class="exp-card-city">📍 ${p.ciudad || ''}, ${p.estado || ''}</div>
                <a href="#" class="exp-card-btn" onclick="event.stopPropagation();return false;">Ver perfil</a>
            </div>
        </div>`;
    }).join('');

    renderPaginacion(total);
}

function renderPaginacion(total) {
    const cont = document.getElementById('expPagination');
    const totalPaginas = Math.ceil(total / explorarPorPagina);
    if (totalPaginas <= 1) { cont.innerHTML = ''; return; }

    let html = '';
    if (explorarPagina > 1) html += `<button class="exp-page-btn" onclick="cambiarPagina(${explorarPagina - 1})">←</button>`;
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= explorarPagina - 1 && i <= explorarPagina + 1)) {
            html += `<button class="exp-page-btn ${i === explorarPagina ? 'active' : ''}" onclick="cambiarPagina(${i})">${i}</button>`;
        } else if (i === explorarPagina - 2 || i === explorarPagina + 2) {
            html += `<span class="exp-page-btn" style="border:none;background:none;cursor:default;">...</span>`;
        }
    }
    if (explorarPagina < totalPaginas) html += `<button class="exp-page-btn" onclick="cambiarPagina(${explorarPagina + 1})">→</button>`;
    cont.innerHTML = html;
}

window.cambiarPagina = function(n) {
    explorarPagina = n;
    renderExplorar();
    document.getElementById('expGrid').scrollTop = 0;
};

window.cambiarVistaExplorar = function(vista) {
    explorarVista = vista;
    const grid = document.getElementById('expGrid');
    grid.classList.toggle('list-view', vista === 'list');
    document.getElementById('btnVistaGrid').classList.toggle('active', vista === 'grid');
    document.getElementById('btnVistaList').classList.toggle('active', vista === 'list');
};

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    await cargarConfiguracion();
    await cargarContenidoDinamico();
    cargarProveedores();
    cargarBlog();
    document.getElementById('btnVistaGrid').classList.add('active');
});
