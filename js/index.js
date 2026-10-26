import { addDoc, auth, collection, db, doc, getDoc, getDocs, provider, query, signInWithPopup, where } from "../firebase-config.js";

let demoData = null;
let tipoRegistroSeleccionado = 'cliente';

async function cargarDataDemo() {
    if (demoData) return demoData;
    try { const res = await fetch('data.json'); if (!res.ok) throw new Error('no'); demoData = await res.json(); }
    catch { demoData = { usuarios: [], proveedores: [], cotizaciones: [] }; }
    return demoData;
}

function proveedoresDemoFiltrados(filtros = {}) {
    return (demoData?.proveedores || []).filter(p =>
        (!filtros.categoria || p.categoria === filtros.categoria) &&
        (!filtros.estado || p.estado === filtros.estado) &&
        (!filtros.ciudad || p.ciudad === filtros.ciudad)
    );
}

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
            const demoProv = proveedoresDemoFiltrados(filtros);
            if (demoProv.length === 0) {
                contenedor.innerHTML = `<div class="loading-msg"><h3>🎉 ¡Pronto tendremos proveedores!</h3><p>Aún no hay proveedores verificados con estos filtros.</p></div>`;
                countElement.textContent = '0 proveedores'; return;
            }
            explorarProveedores = [...new Map([...explorarProveedores, ...demoProv].map(p => [p.id, p])).values()];
            contenedor.innerHTML = demoProv.map(renderTarjetaAirbnb).join('');
            countElement.textContent = `${demoProv.length} proveedores de prueba`;
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

        // Asegurar que los proveedores del panel también estén en explorarProveedores
        explorarProveedores = proveedoresArray.map(p => {
            if (!explorarProveedores.find(ep => ep.id === p.id)) return p;
            return explorarProveedores.find(ep => ep.id === p.id);
        }).concat(explorarProveedores.filter(ep => !proveedoresArray.find(p => p.id === ep.id)));
        // Deduplicar
        explorarProveedores = [...new Map(explorarProveedores.map(p => [p.id, p])).values()];

        proveedoresArray.forEach((data) => {
            if (!data.fotos) data.fotos = [];
            if (!data.resenas) data.resenas = [];
            if (!data.calificacion) data.calificacion = 5;
            if (!data.total_resenas) data.total_resenas = 0;
            const card = renderTarjetaAirbnb(data);
            contenedor.innerHTML += card;
        });
    } catch (error) {
        const demoProv = proveedoresDemoFiltrados(filtros);
        explorarProveedores = [...new Map([...explorarProveedores, ...demoProv].map(p => [p.id, p])).values()];
        contenedor.innerHTML = demoProv.length ? demoProv.map(renderTarjetaAirbnb).join('') : '<p class="loading-msg">Error al cargar proveedores.</p>';
        countElement.textContent = demoProv.length ? `${demoProv.length} proveedores de prueba` : '0 proveedores';
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

// ==========================================
// FAVORITOS (localStorage)
// ==========================================
function getFavoritos() {
    try { return JSON.parse(localStorage.getItem('goparty_favoritos') || '[]'); } catch { return []; }
}
function saveFavoritos(favs) {
    localStorage.setItem('goparty_favoritos', JSON.stringify(favs));
    actualizarContadorFav();
}
function actualizarContadorFav() {
    const count = getFavoritos().length;
    const el = document.getElementById('favCount');
    if (el) el.textContent = count;
}
window.toggleFavorito = function(id, nombre, btnEl) {
    let favs = getFavoritos();
    const idx = favs.indexOf(id);
    if (idx >= 0) {
        favs.splice(idx, 1);
        mostrarToast('♡ Quitado de favoritos');
    } else {
        favs.push(id);
        mostrarToast(usuarioLogueado ? '♡ Agregado a tus favoritos.' : '♡ Guardado en este navegador. Inicia sesión para sincronizar tus favoritos.');
    }
    saveFavoritos(favs);
    if (btnEl) btnEl.classList.toggle('active', favs.includes(id));
    document.querySelectorAll('.exp-card-fav[data-id="' + id + '"]').forEach(b => b.classList.toggle('active', favs.includes(id)));
};

window.abrirFavoritos = function() { abrirPanel('panelFavoritos'); renderFavoritos(); };

function renderFavoritos() {
    const body = document.getElementById('favoritosBody');
    const favs = getFavoritos();
    if (favs.length === 0) {
        body.innerHTML = '<p class="loading-msg">No tienes favoritos guardados aún.</p>';
        return;
    }
    const items = favs.map(id => {
        const p = buscarProveedorPorId(id);
        if (!p) return '';
        return `<div class="fav-item" onclick="abrirPerfil('${id}')">
            <div class="fav-item-cover">📷</div>
            <div class="fav-item-info"><h4>${p.nombreNegocio || 'Proveedor'}</h4><p>${p.categoria || ''} · ${p.ciudad || ''}</p></div>
            <button class="fav-item-remove" onclick="event.stopPropagation(); toggleFavorito('${id}', '', this.closest('.fav-item')); this.closest('.fav-item').remove();">×</button>
        </div>`;
    }).join('');
    body.innerHTML = items || '<p class="loading-msg">No tienes favoritos guardados aún.</p>';
}

// ==========================================
// TOAST
// ==========================================
function mostrarToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('active');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('active'), 3000);
}

// ==========================================
// AUTH (con datos de prueba de data.json)
// ==========================================
let usuarioLogueado = null;
let tipoRegistroSeleccionado = 'cliente';

function buscarUsuarioDemo(email) {
    const local = JSON.parse(localStorage.getItem('goparty_usuarios') || '[]');
    return [...(demoData?.usuarios || []), ...local].find(u => u.email.toLowerCase() === email.toLowerCase());
}

function cargarSesion() {
    try {
        const saved = JSON.parse(localStorage.getItem('goparty_user') || 'null');
        if (saved) { usuarioLogueado = saved; actualizarUIAuth(); }
    } catch {}
}

window.seleccionarTipo = function(tipo) {
    tipoRegistroSeleccionado = tipo;
    document.getElementById('tipoCliente')?.classList.toggle('active', tipo === 'cliente');
    document.getElementById('tipoProveedor')?.classList.toggle('active', tipo === 'proveedor');
};

window.hacerLogin = function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    const msg = document.getElementById('authMsg');
    const user = buscarUsuarioDemo(email);
    if (!user || user.password !== pass) {
        msg.textContent = '❌ Credenciales incorrectas (usa demo@goparty.com / 123456)'; msg.style.color = '#FF6B9D'; return;
    }
    usuarioLogueado = { id: user.id, nombre: user.nombre, email: user.email, tipo: user.tipo, whatsapp: user.whatsapp, proveedor_id: user.proveedor_id, ha_contratado: (user.eventos_completados || []).length > 0 };
    localStorage.setItem('goparty_user', JSON.stringify(usuarioLogueado));
    actualizarUIAuth();
    msg.textContent = '✅ Sesión iniciada'; msg.style.color = '#6BCB77';
    setTimeout(() => { cerrarTodo(); resetAuthMsg(); }, 1000);
};

window.hacerRegistro = function(e) {
    e.preventDefault();
    const nombre = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const whatsapp = document.getElementById('regWhatsapp').value.trim();
    const pass = document.getElementById('regPass').value;
    const msg = document.getElementById('authMsg');
    if (!email.toLowerCase().includes('@gmail.com')) { msg.textContent = '❌ Usa una dirección Gmail válida (tu@gmail.com)'; msg.style.color = '#FF6B9D'; return; }
    if (!/^\d{10}$/.test(whatsapp)) { msg.textContent = '❌ El WhatsApp debe tener 10 dígitos'; msg.style.color = '#FF6B9D'; return; }
    if (pass.length < 6) { msg.textContent = '❌ La contraseña debe tener al menos 6 caracteres'; msg.style.color = '#FF6B9D'; return; }
    if (buscarUsuarioDemo(email)) { msg.textContent = '❌ Ya existe una cuenta con este correo'; msg.style.color = '#FF6B9D'; return; }
    if (tipoRegistroSeleccionado === 'proveedor') { window.location.href = `unete.html?email=${encodeURIComponent(email)}&nombre=${encodeURIComponent(nombre)}&whatsapp=${encodeURIComponent(whatsapp)}`; return; }
    const newUser = { id: `local-${Date.now()}`, nombre, email, whatsapp, password: pass, tipo: 'cliente', eventos_completados: [], favoritos: [] };
    const users = JSON.parse(localStorage.getItem('goparty_usuarios') || '[]');
    users.push(newUser);
    localStorage.setItem('goparty_usuarios', JSON.stringify(users));
    usuarioLogueado = { id: newUser.id, nombre, email, whatsapp, tipo: 'cliente', ha_contratado: false };
    localStorage.setItem('goparty_user', JSON.stringify(usuarioLogueado));
    actualizarUIAuth();
    msg.textContent = '✅ Cuenta creada'; msg.style.color = '#6BCB77';
    setTimeout(() => { cerrarTodo(); resetAuthMsg(); }, 1000);
};

window.abrirMisCotizaciones = function() { document.getElementById('userDropdown')?.classList.remove('active'); mostrarToast('Tus cotizaciones aparecerán aquí'); };
window.abrirMisResenas = function() { document.getElementById('userDropdown')?.classList.remove('active'); mostrarToast('Tus reseñas aparecerán aquí'); };
window.abrirMiPerfil = function() { document.getElementById('userDropdown')?.classList.remove('active'); abrirModal('modalAuth'); };
window.abrirPanelProveedor = function() { window.location.href = 'dashboard.html'; };

window.cerrarSesion = function() {
    usuarioLogueado = null;
    localStorage.removeItem('goparty_user');
    actualizarUIAuth();
    mostrarToast('Sesión cerrada');
    document.getElementById('userDropdown').classList.remove('active');
};

window.switchAuthTab = function(tab) {
    document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
    document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
    document.getElementById('authLoginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('authRegisterForm').classList.toggle('hidden', tab !== 'register');
    resetAuthMsg();
};

function resetAuthMsg() { const m = document.getElementById('authMsg'); if (m) { m.textContent = ''; } }

function actualizarUIAuth() {
    const menu = document.getElementById('userMenu');
    const btnProv = document.getElementById('btnProveedorHeader');
    if (usuarioLogueado) {
        menu.classList.remove('hidden');
        if (btnProv) btnProv.classList.add('hidden');
        document.getElementById('userName').textContent = usuarioLogueado.nombre || 'Mi cuenta';
        document.getElementById('userAvatar').textContent = (usuarioLogueado.nombre || '?').charAt(0).toUpperCase();
        document.getElementById('ddPanelProveedor')?.classList.toggle('hidden', usuarioLogueado.tipo !== 'proveedor');
        const c = document.getElementById('ddFavCount'); if (c) c.textContent = `(${getFavoritos().length})`;
    } else {
        menu.classList.add('hidden');
        if (btnProv) btnProv.classList.remove('hidden');
    }
}

window.toggleUserMenu = function(e) {
    e.stopPropagation();
    document.getElementById('userDropdown').classList.toggle('active');
};
document.addEventListener('click', (e) => {
    if (!e.target.closest('#userMenu')) {
        const dd = document.getElementById('userDropdown');
        if (dd) dd.classList.remove('active');
    }
});

// ==========================================
// BUSCAR PROVEEDOR POR ID (busca en caché)
// ==========================================
function buscarProveedorPorId(id) {
    return explorarProveedores.find(p => p.id === id) || null;
}

// ==========================================
// RENDER TARJETA AIRBNB (compartida)
// ==========================================
function renderTarjetaAirbnb(p) {
    let badge = '', coverClass = '';
    if (p.plan === 'gold') { badge = '<span class="exp-card-badge gold">👑 Gold</span>'; coverClass = 'gold'; }
    else if (p.plan === 'pro') { badge = '<span class="exp-card-badge pro">⭐ Pro</span>'; coverClass = 'pro'; }
    else { badge = '<span class="exp-card-badge basic">✓ Verificado</span>'; }
    const favs = getFavoritos();
    const isFav = favs.includes(p.id);
    const fotos = p.fotos || [];
    const coverContent = fotos.length > 0 ? `<img src="${fotos[0]}" alt="${p.nombreNegocio || ''}">` : '📷';
    const cal = p.calificacion || 5;
    const totalRes = p.total_resenas || p.totalResenas || 0;
    const avgPrice = Number(p.precio_promedio || p.precioPromedio || 0);
    const tier = avgPrice <= 6000 ? 'economico' : avgPrice <= 15000 ? 'medio' : 'premium';
    const tierLabel = tier === 'economico' ? 'Económico' : tier === 'medio' ? 'Medio' : 'Premium';
    const priceHtml = avgPrice ? `<span class="exp-price-tier ${tier}">${tierLabel} · ${avgPrice.toLocaleString('es-MX')}</span>` : '';
    return `<div class="exp-card" onclick="abrirPerfil('${p.id}')">
        <div class="exp-card-cover ${coverClass}">${coverContent}${badge}
            <button class="exp-card-fav ${isFav ? 'active' : ''}" data-id="${p.id}" onclick="event.stopPropagation(); toggleFavorito('${p.id}', '${(p.nombreNegocio || '').replace(/'/g, '')}', this)">${isFav ? '❤️' : '♡'}</button>
        </div>
        <div class="exp-card-body">
            <div class="exp-card-top-row">
                <span class="exp-card-name">${p.nombreNegocio || 'Proveedor'}</span>
            </div>
            <div class="exp-card-cat">${p.categoria || 'General'}</div>
            <div class="exp-card-city">📍 ${p.ciudad || ''}, ${p.estado || ''}</div>
            <div class="exp-card-rating"><span class="stars">⭐</span> ${cal.toFixed(1)} (${totalRes} reseñas)</div>
            ${priceHtml}
            <a href="#" class="exp-card-btn" onclick="event.stopPropagation(); abrirPerfil('${p.id}'); return false;">Ver perfil</a>
        </div>
    </div>`;
}

// ==========================================
// PERFIL DE PROVEEDOR (modal estilo Airbnb)
// ==========================================
let perfilActualId = null;
let lightboxFotos = [];
let lightboxIndex = 0;
let resenaPagina = 1;
const resenasPorPagina = 3;

window.abrirPerfil = function(id) {
    const p = buscarProveedorPorId(id);
    if (!p) { mostrarToast('No se pudo cargar el perfil'); return; }
    perfilActualId = id;
    const body = document.getElementById('perfilBody');
    const nombre = document.getElementById('perfilNombre');
    nombre.textContent = p.nombreNegocio || 'Proveedor';

    const fotos = p.fotos || [];
    const favs = getFavoritos();
    const isFav = favs.includes(id);

    let badgeHtml = '';
    if (p.plan === 'gold') badgeHtml = '<span class="perfil-badge gold">👑 Gold</span>';
    else if (p.plan === 'pro') badgeHtml = '<span class="perfil-badge pro">⭐ Pro</span>';
    badgeHtml += '<span class="perfil-badge verif">✅ Verificado</span>';

    // Galería
    let galHtml = '';
    if (fotos.length === 0) {
        galHtml = `<div class="perfil-galeria"><div class="perfil-gal-main">📷<div style="font-size:0.9rem;margin-top:0.5rem;">Sin fotos disponibles</div></div><div class="perfil-gal-side"><div class="perfil-gal-empty"></div><div class="perfil-gal-empty"></div><div class="perfil-gal-empty"></div><div class="perfil-gal-empty"></div></div></div>`;
    } else {
        const main = `<div class="perfil-gal-main" onclick="abrirLightbox(0)">${fotos[0] ? `<img src="${fotos[0]}" alt="Foto 1">` : '📷'}</div>`;
        const thumbs = [];
        for (let i = 1; i <= 4; i++) {
            if (fotos[i]) {
                thumbs.push(`<div class="perfil-gal-thumb" onclick="abrirLightbox(${i})"><img src="${fotos[i]}" alt="Foto ${i+1}"></div>`);
            } else {
                thumbs.push(`<div class="perfil-gal-empty"></div>`);
            }
        }
        galHtml = `<div class="perfil-galeria">${main}<div class="perfil-gal-side">${thumbs.join('')}</div></div>`;
    }

    // Desglose calificación
    const dc = p.desglose_calificacion || p.desgloseCalificacion || { puntualidad: 5, calidad: 5, atencion: 5, precio: 5 };
    const barras = ['puntualidad', 'calidad', 'atencion', 'precio'].map(k => {
        const val = dc[k] || 5;
        const pct = (val / 5) * 100;
        return `<div class="cal-barra-row"><span class="cal-barra-label">${k.charAt(0).toUpperCase() + k.slice(1)}</span><div class="cal-barra-track"><div class="cal-barra-fill" style="width:${pct}%"></div></div><span class="cal-barra-val">${val.toFixed(1)}</span></div>`;
    }).join('');

    // Reseñas
    const resenas = p.resenas || [];
    const totalRes = resenas.length;
    const calProm = p.calificacion || 5;
    resenaPagina = 1;
    const resenasVisibles = resenas.slice(0, resenasPorPagina);
    let resenasHtml = resenasVisibles.map(r => renderResenaItem(r)).join('');
    if (resenasHtml === '') resenasHtml = '<p style="color:#888;font-size:0.9rem;">Aún no hay reseñas. ¡Sé el primero!</p>';
    const verMasBtn = totalRes > resenasPorPagina ? `<div class="resena-ver-mas"><button onclick="verMasResenas()">Ver más reseñas</button></div>` : '';

    // Servicios
    const servicios = p.servicios || [];
    const servHtml = servicios.length > 0 ? `<ul class="perfil-servicios">${servicios.map(s => `<li>${s}</li>`).join('')}</ul>` : '<p style="color:#888;font-size:0.9rem;">Información no disponible.</p>';

    // Zona cobertura
    const zona = p.zona_cobertura || p.zonaCobertura || [];
    const zonaHtml = zona.length > 0 ? `<div class="perfil-zona">${zona.map(z => `<span>${z}</span>`).join('')}</div>` : '<p style="color:#888;font-size:0.9rem;">Información no disponible.</p>';

    // Descripción
    const desc = p.descripcion || '';
    const descCorta = desc.length > 300 ? desc.substring(0, 300) + '...' : desc;
    const descHtml = desc.length > 300 ? `<p id="descCorta">${descCorta} <a href="#" onclick="mostrarDescCompleta(); return false;" style="color:#FF6B9D;font-weight:600;">Leer más</a></p><p id="descCompleta" class="hidden">${desc}</p>` : `<p>${descCorta || 'Sin descripción disponible.'}</p>`;

    // Similares
    const similares = explorarProveedores.filter(x => x.id !== id && x.categoria === p.categoria).slice(0, 4);
    let simHtml = '';
    if (similares.length > 0) {
        simHtml = `<div class="perfil-section"><h3>✨ Otros proveedores que te pueden interesar</h3><div class="similares-grid">${similares.map(s => {
            const sf = s.fotos || [];
            const cover = sf.length > 0 ? `<img src="${sf[0]}" alt="${s.nombreNegocio || ''}">` : '📷';
            return `<div class="similar-card" onclick="abrirPerfil('${s.id}')"><div class="similar-card-cover">${cover}</div><div class="similar-card-body"><h4>${s.nombreNegocio || 'Proveedor'}</h4><p>⭐ ${(s.calificacion || 5).toFixed(1)} · ${s.ciudad || ''}</p></div></div>`;
        }).join('')}</div></div>`;
    }

    // WhatsApp
    const waNum = p.whatsapp || p.telefono || '';
    const waHref = waNum ? `https://wa.me/${waNum}?text=Hola%20${encodeURIComponent(p.nombreNegocio || '')}%2C%20vi%20tu%20perfil%20en%20GoParty%20y%20me%20interesa%20cotizar%20un%20evento.` : '#';

    body.innerHTML = `${galHtml}
    <div class="perfil-info">
        <h2>${p.nombreNegocio || 'Proveedor'}</h2>
        <p class="perfil-subtitle">${p.categoria || 'General'} · ${p.ciudad || ''}, ${p.estado || ''}</p>
        <div class="perfil-badge-row">${badgeHtml}<span class="perfil-rating-summary">⭐ ${calProm.toFixed(1)} · ${totalRes} reseñas</span></div>

        <div class="perfil-section"><h3>Sobre mí</h3>${descHtml}</div>
        <div class="perfil-section"><h3>Servicios que ofrezco</h3>${servHtml}</div>
        <div class="perfil-section"><h3>Zona de cobertura</h3>${zonaHtml}</div>

        <div class="perfil-section">
            <h3>Calificación y Reseñas</h3>
            <div class="cal-desglose">
                <div class="cal-promedio">
                    <div class="cal-promedio-num">${calProm.toFixed(1)}</div>
                    <div class="cal-promedio-stars">${'⭐'.repeat(Math.round(calProm))}</div>
                    <div class="cal-promedio-total">${totalRes} reseñas</div>
                </div>
                <div class="cal-barras">${barras}</div>
            </div>
            <button class="btn-dejar-resena" onclick="iniciarResena('${id}')">✍️ Dejar una reseña</button>
            <h4 style="margin-bottom:0.8rem;color:#333;font-size:1rem;">Reseñas de clientes (${totalRes})</h4>
            <div class="resena-list" id="resenaList">${resenasHtml}</div>
            ${verMasBtn}
        </div>

        ${simHtml}
    </div>
    <div class="perfil-actions">
        <a href="${waHref}" target="_blank" class="btn-wa-perfil">💬 Contactar por WhatsApp</a>
        <a href="#" class="btn-cot-perfil" onclick="cerrarTodo(); abrirModal('modalCotizacion'); return false;">📋 Solicitar Cotización</a>
        <button class="btn-fav-perfil ${isFav ? 'active' : ''}" id="btnFavPerfil" onclick="toggleFavoritoPerfil('${id}')">${isFav ? '❤️' : '♡'}</button>
    </div>`;

    abrirModal('modalPerfil');
};

window.mostrarDescCompleta = function() {
    document.getElementById('descCorta').classList.add('hidden');
    document.getElementById('descCompleta').classList.remove('hidden');
};

function renderResenaItem(r) {
    const inicial = (r.cliente || r.nombreCliente || '?').charAt(0).toUpperCase();
    const estrellas = '⭐'.repeat(r.estrellas || 5);
    return `<div class="resena-item">
        <div class="resena-item-header">
            <div class="resena-avatar">${inicial}</div>
            <div class="resena-autor-info"><h4>${r.cliente || r.nombreCliente || 'Cliente'}</h4><span>${r.fecha || ''}</span></div>
            <span class="resena-stars">${estrellas}</span>
        </div>
        <p class="resena-texto">${r.comentario || ''}</p>
    </div>`;
}

window.verMasResenas = function() {
    resenaPagina++;
    const p = buscarProveedorPorId(perfilActualId);
    if (!p) return;
    const resenas = p.resenas || [];
    const visibles = resenas.slice(0, resenaPagina * resenasPorPagina);
    const list = document.getElementById('resenaList');
    list.innerHTML = visibles.map(r => renderResenaItem(r)).join('');
    if (resenas.length <= visibles.length) {
        const btn = document.querySelector('.resena-ver-mas');
        if (btn) btn.style.display = 'none';
    }
};

window.toggleFavoritoPerfil = function(id) {
    let favs = getFavoritos();
    const idx = favs.indexOf(id);
    if (idx >= 0) favs.splice(idx, 1); else favs.push(id);
    saveFavoritos(favs);
    const btn = document.getElementById('btnFavPerfil');
    if (btn) { btn.classList.toggle('active', favs.includes(id)); btn.textContent = favs.includes(id) ? '❤️' : '♡'; }
    mostrarToast(favs.includes(id) ? '♡ Agregado a favoritos' : '♡ Quitado de favoritos');
};

// ==========================================
// LIGHTBOX
// ==========================================
window.abrirLightbox = function(index) {
    const p = buscarProveedorPorId(perfilActualId);
    if (!p) return;
    lightboxFotos = p.fotos || [];
    if (lightboxFotos.length === 0) return;
    lightboxIndex = index;
    mostrarLightboxImg();
    document.getElementById('lightbox').classList.add('active');
};

window.cerrarLightbox = function() {
    document.getElementById('lightbox').classList.remove('active');
};

window.navegarLightbox = function(dir) {
    lightboxIndex = (lightboxIndex + dir + lightboxFotos.length) % lightboxFotos.length;
    mostrarLightboxImg();
};

function mostrarLightboxImg() {
    document.getElementById('lightboxImg').src = lightboxFotos[lightboxIndex] || '';
    document.getElementById('lightboxCounter').textContent = `${lightboxIndex + 1} de ${lightboxFotos.length}`;
}

document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (lb && lb.classList.contains('active')) {
        if (e.key === 'ArrowLeft') navegarLightbox(-1);
        if (e.key === 'ArrowRight') navegarLightbox(1);
        if (e.key === 'Escape') cerrarLightbox();
    }
});

// ==========================================
// RESEÑA FORM
// ==========================================
let resenaCategorias = { puntualidad: 0, calidad: 0, atencion: 0, precio: 0 };

window.iniciarResena = function(provId) {
    if (!usuarioLogueado) {
        mostrarToast('Debes iniciar sesión para dejar una reseña');
        abrirModal('modalAuth');
        return;
    }
    const p = buscarProveedorPorId(provId);
    const contratados = JSON.parse(localStorage.getItem('goparty_contratados') || '{}');
    const haContratado = usuarioLogueado.ha_contratado || contratados[provId];
    if (!haContratado) {
        const msg = document.getElementById('resenaMsg');
        msg.textContent = 'Solo los clientes que han contratado este servicio pueden dejar una reseña.';
        msg.style.color = '#FF6B9D';
        abrirModal('modalResena');
        return;
    }
    resenaCategorias = { puntualidad: 0, calidad: 0, atencion: 0, precio: 0 };
    document.getElementById('resenaTexto').value = '';
    const msg = document.getElementById('resenaMsg');
    msg.textContent = '';
    document.querySelectorAll('.star-input').forEach(si => {
        const cat = si.getAttribute('data-cat');
        si.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.textContent = '☆';
            star.onclick = () => setStarInput(cat, i);
            si.appendChild(star);
        }
    });
    abrirModal('modalResena');
};

function setStarInput(cat, val) {
    resenaCategorias[cat] = val;
    const si = document.querySelector('.star-input[data-cat="' + cat + '"]');
    if (!si) return;
    si.querySelectorAll('span').forEach((s, i) => {
        s.textContent = i < val ? '⭐' : '☆';
        s.classList.toggle('filled', i < val);
    });
}

window.enviarResena = function() {
    for (const k of ['puntualidad', 'calidad', 'atencion', 'precio']) {
        if (resenaCategorias[k] === 0) {
            const msg = document.getElementById('resenaMsg');
            msg.textContent = 'Califica las 4 categorías'; msg.style.color = '#FF6B9D';
            return;
        }
    }
    const texto = document.getElementById('resenaTexto').value.trim();
    if (!texto) {
        const msg = document.getElementById('resenaMsg');
        msg.textContent = 'Escribe tu experiencia'; msg.style.color = '#FF6B9D';
        return;
    }
    const p = buscarProveedorPorId(perfilActualId);
    if (!p) return;
    const prom = (resenaCategorias.puntualidad + resenaCategorias.calidad + resenaCategorias.atencion + resenaCategorias.precio) / 4;
    const nuevaResena = {
        cliente: usuarioLogueado.nombre,
        fecha: new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
        estrellas: Math.round(prom),
        comentario: texto
    };
    if (!p.resenas) p.resenas = [];
    p.resenas.unshift(nuevaResena);
    p.total_resenas = (p.total_resenas || 0) + 1;
    p.calificacion = p.resenas.reduce((s, r) => s + (r.estrellas || 5), 0) / p.resenas.length;
    if (p.desglose_calificacion) {
        p.desglose_calificacion.puntualidad = (p.desglose_calificacion.puntualidad * (p.total_resenas - 1) + resenaCategorias.puntualidad) / p.total_resenas;
        p.desglose_calificacion.calidad = (p.desglose_calificacion.calidad * (p.total_resenas - 1) + resenaCategorias.calidad) / p.total_resenas;
        p.desglose_calificacion.atencion = (p.desglose_calificacion.atencion * (p.total_resenas - 1) + resenaCategorias.atencion) / p.total_resenas;
        p.desglose_calificacion.precio = (p.desglose_calificacion.precio * (p.total_resenas - 1) + resenaCategorias.precio) / p.total_resenas;
    }
    const msg = document.getElementById('resenaMsg');
    msg.textContent = '✅ ¡Gracias por tu reseña!'; msg.style.color = '#6BCB77';
    setTimeout(() => { cerrarTodo(); abrirPerfil(perfilActualId); }, 1200);
};

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
            if (d.estadoVerificacion === 'Verificado') explorarProveedores.push({ id: doc.id, ...d });
        });
        if (explorarProveedores.length === 0) explorarProveedores = [...(demoData?.proveedores || [])];
        llenarFiltrosExplorar();
        aplicarFiltrosExplorar();
    } catch (error) {
        explorarProveedores = [...(demoData?.proveedores || [])];
        llenarFiltrosExplorar();
        aplicarFiltrosExplorar();
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
    const precio = document.getElementById('expFilterPrecio')?.value || '';
    const sort = document.getElementById('expSort').value;

    explorarFiltrados = explorarProveedores.filter(p => {
        if (catsSel.length > 0 && !catsSel.includes(p.categoria)) return false;
        if (estado && p.estado !== estado) return false;
        if (ciudad && p.ciudad !== ciudad) return false;
        if (insignias.length > 0 && !insignias.includes(p.plan || 'basic')) return false;
        if (calMin > 0 && (p.calificacion || 0) < calMin) return false;
        const prom = Number(p.precio_promedio || p.precioPromedio || 0);
        if (precio === 'economico' && prom > 6000) return false;
        if (precio === 'medio' && (prom < 6001 || prom > 15000)) return false;
        if (precio === 'premium' && prom <= 15000) return false;
        return true;
    });

    if (sort === 'calificacion') {
        explorarFiltrados.sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0));
    } else if (sort === 'precioAsc' || sort === 'precioDesc') {
        explorarFiltrados.sort((a, b) => {
            const aP = Number(a.precio_promedio || a.precioPromedio || 0);
            const bP = Number(b.precio_promedio || b.precioPromedio || 0);
            return sort === 'precioAsc' ? aP - bP : bP - aP;
        });
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

    grid.innerHTML = paginaItems.map(p => renderTarjetaAirbnb(p)).join('');

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
    await cargarDataDemo();
    await cargarConfiguracion();
    await cargarContenidoDinamico();
    cargarProveedores();
    cargarBlog();
    document.getElementById('btnVistaGrid').classList.add('active');
    actualizarContadorFav();
    cargarSesion();
    inicializarNuevosFlujos();
});

// ==========================================
// MATCHING (Recomiéndame un plan)
// ==========================================
function precioCercano(prov, presupuesto) {
    const prom = Number(prov.precio_promedio || 0);
    return prom <= presupuesto ? 2 : Math.max(0, 2 - (prom - presupuesto) / Math.max(presupuesto, 1));
}

function mostrarPasoMatching(step) {
    document.querySelectorAll('.matching-step').forEach(el => el.classList.add('hidden'));
    document.getElementById(`matchStep${step}`)?.classList.remove('hidden');
    document.querySelectorAll('.matching-dot').forEach((d, i) => d.classList.toggle('active', i < step));
}

function renderMatchingResults(service, budget) {
    const pool = [...(demoData?.proveedores || []), ...explorarProveedores];
    const unique = [...new Map(pool.map(p => [p.id, p])).values()];
    const scored = unique.map(p => ({ p, score: (p.categoria === service ? 6 : 0) + precioCercano(p, budget) + (p.plan === 'gold' ? 2 : p.plan === 'pro' ? 1 : 0) })).sort((a, b) => b.score - a.score).slice(0, 3);
    const el = document.getElementById('matchingResults');
    el.innerHTML = `<h3>Recomendaciones para ti</h3>${scored.map(({ p }) => `<button class="matching-result" onclick="cerrarTodo(); abrirPerfil('${p.id}')"><span class="matching-result-img">${p.fotos?.[0] ? `<img src="${p.fotos[0]}" alt="">` : '📷'}</span><span><strong>${p.nombreNegocio}</strong><small>${p.categoria} · ${p.ciudad}</small><small>Desde ${Number(p.precio_min || 0).toLocaleString('es-MX')} · ⭐ ${Number(p.calificacion || 0).toFixed(1)}</small></span></button>`).join('')}`;
    document.querySelectorAll('.matching-step').forEach(s => s.classList.add('hidden'));
    el.classList.remove('hidden');
}

// ==========================================
// COTIZACIÓN: presupuesto por servicio
// ==========================================
const cotServiceBudgets = {};
let cotGmailConnected = false;

function renderCotBudgets() {
    const container = document.getElementById('cotBudgetServices');
    if (!container) return;
    const services = Array.from(document.querySelectorAll('input[name="servicios"]:checked')).map(input => input.value);
    services.forEach(service => { if (cotServiceBudgets[service] === undefined) cotServiceBudgets[service] = 0; });
    container.innerHTML = services.map(service => `<div class="cot-budget-row"><span>${service}</span><input type="number" min="0" step="500" data-budget-service="${service}" value="${cotServiceBudgets[service]}" placeholder="$0"><label class="cot-photo-cell"><input type="file" accept="image/*" data-budget-photo="${service}" aria-label="Fotografía de referencia para ${service}"><span>Elegir imagen</span><div class="cot-row-preview" data-budget-preview="${service}"></div></label></div>`).join('');
    container.querySelectorAll('[data-budget-service]').forEach(input => input.addEventListener('input', () => { cotServiceBudgets[input.dataset.budgetService] = Number(input.value) || 0; actualizarTotalCotizacion(); }));
    container.querySelectorAll('[data-budget-photo]').forEach(input => input.addEventListener('change', () => {
        const preview = container.querySelector(`[data-budget-preview="${input.dataset.budgetPhoto}"]`);
        preview.innerHTML = '';
        const file = input.files?.[0];
        if (file) { const image = document.createElement('img'); image.src = URL.createObjectURL(file); image.alt = `Referencia de ${input.dataset.budgetPhoto}`; preview.appendChild(image); }
    }));
    actualizarTotalCotizacion();
}

function actualizarTotalCotizacion() {
    const distribuido = Object.values(cotServiceBudgets).reduce((sum, value) => sum + Number(value || 0), 0);
    const totalInput = document.getElementById('cotTotalInput');
    const total = Number(totalInput?.value || distribuido);
    const hidden = document.getElementById('cotPresupuesto');
    if (hidden) hidden.value = String(total);
}

// ==========================================
// INICIALIZAR NUEVOS FLUJOS
// ==========================================
function inicializarNuevosFlujos() {
    let matchService = '';
    document.querySelectorAll('[data-match-event]').forEach(btn => btn.addEventListener('click', () => mostrarPasoMatching(2)));
    document.querySelectorAll('[data-match-service]').forEach(btn => btn.addEventListener('click', () => { matchService = btn.dataset.matchService || ''; mostrarPasoMatching(3); }));
    const range = document.getElementById('matchBudget');
    const val = document.getElementById('matchBudgetValue');
    range?.addEventListener('input', () => { val.textContent = `${Number(range.value).toLocaleString('es-MX')} MXN`; });
    document.getElementById('matchSubmit')?.addEventListener('click', () => renderMatchingResults(matchService, Number(range?.value || 15000)));

    document.querySelectorAll('input[name="servicios"]').forEach(input => input.addEventListener('change', () => renderCotBudgets()));
    document.getElementById('cotTotalInput')?.addEventListener('input', actualizarTotalCotizacion);
    document.querySelectorAll('input[name="tipoEvento"]').forEach(input => input.addEventListener('change', () => {
        document.getElementById('otroEventoWrap')?.classList.toggle('hidden', input.value !== 'Otro' || !input.checked);
    }));
    document.querySelectorAll('input[name="cotAuthMethod"]').forEach(input => input.addEventListener('change', () => {
        const password = document.getElementById('cotPassword');
        password.disabled = input.value === 'gmail';
        password.required = input.value === 'password';
    }));
    document.getElementById('cotGmailButton')?.addEventListener('click', async () => {
        const button = document.getElementById('cotGmailButton');
        try {
            button.disabled = true;
            const result = await signInWithPopup(auth, provider);
            document.getElementById('cotEmail').value = result.user.email || '';
            document.querySelector('input[name="cotAuthMethod"][value="gmail"]').checked = true;
            document.getElementById('cotPassword').disabled = true;
            cotGmailConnected = true;
            button.textContent = 'Gmail conectado';
        } catch {
            button.disabled = false;
            cotGmailConnected = false;
            button.textContent = 'No se pudo conectar con Gmail';
        }
    });

    const originalNext = window.cotSiguiente;
    window.cotSiguiente = function(paso) {
        if (paso === 2) renderCotBudgets();
        if (paso === 3 && (Number(document.getElementById('cotTotalInput')?.value || 0) <= 0 || Object.values(cotServiceBudgets).reduce((s, v) => s + Number(v || 0), 0) <= 0)) { alert('Escribe un presupuesto total y distribuye al menos un monto entre tus servicios.'); return; }
        originalNext(paso);
    };

    window.enviarCotizacion = async function() {
        const whatsapp = document.getElementById('cotWhatsapp').value.trim();
        const email = document.getElementById('cotEmail').value.trim();
        const password = document.getElementById('cotPassword').value;
        const authMethod = document.querySelector('input[name="cotAuthMethod"]:checked')?.value || 'password';
        const total = Number(document.getElementById('cotTotalInput')?.value || Object.values(cotServiceBudgets).reduce((s, v) => s + Number(v || 0), 0));
        const evento = document.querySelector('input[name="tipoEvento"]:checked')?.value || '';
        const otroEvento = document.getElementById('otroEventoTexto')?.value.trim() || '';
        if (evento === 'Otro' && !otroEvento) { alert('Describe qué tipo de evento estás organizando.'); return; }
        if (!/^\d{10}$/.test(whatsapp) || !email || total <= 0) { alert('Completa tu correo, WhatsApp y presupuesto.'); return; }
        if (authMethod === 'password' && password.length < 6) { alert('La contraseña debe tener al menos 6 caracteres.'); return; }
        if (authMethod === 'gmail' && !cotGmailConnected) { alert('Pulsa “Continuar con Gmail” para autenticar tu cuenta.'); return; }
        if (authMethod === 'password' && !usuarioLogueado) {
            const users = JSON.parse(localStorage.getItem('goparty_usuarios') || '[]');
            const existing = users.find(user => user.email.toLowerCase() === email.toLowerCase());
            if (existing && existing.password !== password) { alert('El correo ya tiene otra contraseña. Inicia sesión primero.'); return; }
            if (!existing) { users.push({ id: `local-${Date.now()}`, nombre: email.split('@')[0], email, password, whatsapp, tipo: 'cliente', eventos_completados: [], favoritos: [] }); localStorage.setItem('goparty_usuarios', JSON.stringify(users)); }
        }
        const payload = { usuario_id: usuarioLogueado?.id || null, tipoEvento: evento, otroEvento, servicios: Object.entries(cotServiceBudgets).filter(([, value]) => Number(value) > 0).map(([nombre, presupuesto]) => ({ nombre, presupuesto })), fecha: document.getElementById('cotFecha').value, presupuesto_total: total, whatsapp, email, authMethod, estado: 'Pendiente', fechaSolicitud: new Date().toISOString() };
        try { await addDoc(collection(db, 'solicitudes'), payload); }
        catch { const saved = JSON.parse(localStorage.getItem('goparty_cotizaciones') || '[]'); saved.push(payload); localStorage.setItem('goparty_cotizaciones', JSON.stringify(saved)); }
        document.querySelectorAll('.cot-step').forEach(s => s.classList.add('hidden'));
        document.getElementById('cotConfirm').classList.remove('hidden');
    };
}
