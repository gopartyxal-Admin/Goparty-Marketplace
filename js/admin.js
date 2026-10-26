import { addDoc, collection, db, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc, where, storage, storageRef, uploadBytes, getDownloadURL } from "../firebase-config.js";

let usuarioActual = null;
let filtroTestimoniosActual = 'todas';
let filtroExperienciasActual = 'todas';
let filtroCasosActual = 'todas';
let filtroModeracionesActual = 'todas';
let filtroResenaActual = 'pendiente';
let filtroSolicitudActual = 'Pendiente';
let filtroCotizacionActual = 'todas';
let filtroCambioActual = 'Pendiente';
let filtroFinanzaActual = 'mes';
let filtroTransaccionActual = 'todas';
let filtroProveedorActual = 'todos';
let solicitudIdActual = '';

const ESTADOS_MEXICO = ['Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas','Chihuahua','Ciudad de México','Coahuila','Colima','Durango','Estado de México','Guanajuato','Guerrero','Hidalgo','Jalisco','Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas'];

const MUNICIPIOS_POR_ESTADO = {
    'Veracruz': ['Xalapa','Veracruz','Córdoba','Orizaba','Coatepec','Boca del Río','Poza Rica','Tuxpan','Minatitlán','Cosamaloapan','Martínez de la Torre','San Andrés Tuxtla','Catemaco','Zongolica','Tierra Blanca','Perote','Jalapa',' Emiliano Zapata','Banderilla','Coacoatzintla','Naolinco','Tlacolulan','Jilotepec','Las Vigas','Villa Aldama','Tonaticán','Chiconquiaco','Acajete','Atoyac','Tlaltetela'],
    'Puebla': ['Puebla','Tehuacán','San Martín Texmelucan','Atlixco','Cholula','Huejotzingo','Teziutlán','Zacatlán','Ciudad Serdán','Libres','Acatlán','Huauchinango','Chignahuapan','Zacapoaxtla','Tlatlauquitepec','Metztitlán','Xicotepec','Cuetzalan'],
    'Ciudad de México': ['Álvaro Obregón','Azcapotzalco','Benito Juárez','Coyoacán','Cuajimalpa','Cuauhtémoc','Gustavo A. Madero','Iztacalco','Iztapalapa','La Magdalena Contreras','Miguel Hidalgo','Milpa Alta','Tláhuac','Tlalpan','Venustiano Carranza','Xochimilco'],
    'Oaxaca': ['Oaxaca de Juárez','Salina Cruz','Juchitán','Tuxtepec','Huajuapan de León','Puerto Escondido','Santa María del Tule','El Tule','Miahuatlán','Santiago Pinotepa Nacional'],
    'Estado de México': ['Toluca','Ecatepec','Nezahualcóyotl','Naucalpan','Chimalhuacán','Tultitlán','Ixtapaluca','Cuautitlán','Chalco','Valle de Chalco','Texcoco','Coacalco','Atizapán','Tlalnepantla','Los Reyes La Paz'],
    'Jalisco': ['Guadalajara','Zapopan','Tlaquepaque','Tonalá','Puerto Vallarta','Tlajomulco','El Salto','Chapala','Ocotlán','Lagos de Moreno','San Juan de los Lagos','Tepatitlán'],
    'Nuevo León': ['Monterrey','Guadalupe','San Nicolás','San Pedro','Santa Catarina','Apodaca','Escobedo','Juárez','Cadereyta','Santiago','Ciénega de Flores'],
    'Baja California': ['Tijuana','Mexicali','Ensenada','Rosarito','Tecate','San Quintín','Playas de Rosarito'],
    'Quintana Roo': ['Cancún','Chetumal','Playa del Carmen','Tulum','Cozumel','Isla Mujeres','Puerto Morelos','Bacalar'],
    'Guanajuato': ['León','Guanajuato','Irapuato','Celaya','Salamanca','Dolores Hidalgo','San Miguel de Allende','Silao','Moroleón','Uriangato','Cortazar','Pénjamo'],
    'Yucatán': ['Mérida','Valladolid','Tizimín','Progreso','Kanasín','Umán','Motul','Tekax','Izamal'],
    'Querétaro': ['Querétaro','San Juan del Río','Corregidora','El Marqués','Tequisquiapan','Amealco','Cadereyta','Ezequiel Montes'],
    'Aguascalientes': ['Aguascalientes','Jesús María','San Francisco de los Romo','Rincón de Romos','Cosío','Pabellón de Arteaga'],
    'Chihuahua': ['Chihuahua','Ciudad Juárez','Delicias','Parral','Cuauhtémoc','Nuevo Casas Grandes','Camargo'],
    'Sinaloa': ['Culiacán','Mazatlán','Los Mochis','Guasave','Navolato','El Fuerte','Escuinapa'],
    'Sonora': ['Hermosillo','Ciudad Obregón','Nogales','San Luis Río Colorado','Navojoa','Guaymas','Empalme'],
    'Tamaulipas': ['Tampico','Ciudad Victoria','Reynosa','Matamoros','Nuevo Laredo','Madero','Valle Hermoso'],
    'Michoacán': ['Morelia','Uruapan','Lázaro Cárdenas','Pátzcuaro','Zamora','La Piedad','Apatzingán','Hidalgo del Rincón'],
    'San Luis Potosí': ['San Luis Potosí','Soledad','Ciudad Valles','Matehuala','Rioverde','Tamazunchale','Santa María del Río'],
    'Hidalgo': ['Pachuca','Tulancingo','Tula','Ixmiquilpan','Mineral de la Reforma','Actopan','Huichapan'],
    'Morelos': ['Cuernavaca','Jiutepec','Cuautla','Temixco','Yautepec','Emiliano Zapata','Jojutla'],
    'Tlaxcala': ['Tlaxcala','Apizaco','Chiautempan','Huamantla','Zacatelco','Calpulalpan','Tlaxco'],
    'Nayarit': ['Tepic','Xalisco','Compostela','Bahía de Banderas','San Blas','Acaponeta'],
    'Colima': ['Colima','Manzanillo','Villa de Álvarez','Tecomán','Armería','Coquimatlán'],
    'Campeche': ['Campeche','Ciudad del Carmen','Champotón','Escárcega','Calkiní','Hopelchén'],
    'Tabasco': ['Villahermosa','Cárdenas','Comalcalco','Paraíso','Macuspana','Jalpa de Méndez','Centro'],
    'Chiapas': ['Tuxtla Gutiérrez','San Cristóbal','Tapachula','Chiapa de Corzo','Comitán','Ocosingo','Palenque'],
    'Coahuila': ['Saltillo','Torreón','Monclova','Piedras Negras','Acuña','Sabinas','Matamoros'],
    'Durango': ['Durango','Gómez Palacio','Lerdo','Nombre de Dios','Vicente Guerrero','Santiago Papasquiaro'],
    'Zacatecas': ['Zacatecas','Fresnillo','Jerez','Guadalupe','Río Grande','Sombrerete','Nochistlán'],
    'Baja California Sur': ['La Paz','Los Cabos','Loreto','Comondú','Mulegé','San José del Cabo'],
    'Guerrero': ['Acapulco','Chilpancingo','Zihuatanejo','Iguala','Taxco','Tlapa','Ometepec']
};

// ==========================================
// LOGIN
// ==========================================
window.login = async function() {
    const username = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!username || !password) {
        alert('❌ Completa usuario y contraseña');
        return;
    }

    try {
        const qUsername = query(collection(db, "usuarios"), where("username", "==", username), where("password", "==", password), where("activo", "==", true));
        const qEmail = query(collection(db, "usuarios"), where("email", "==", username), where("password", "==", password), where("activo", "==", true));
        const [snapUsername, snapEmail] = await Promise.all([getDocs(qUsername), getDocs(qEmail)]);

        let userData = null;
        let userId = null;

        if (!snapUsername.empty) {
            userData = snapUsername.docs[0].data();
            userId = snapUsername.docs[0].id;
        } else if (!snapEmail.empty) {
            userData = snapEmail.docs[0].data();
            userId = snapEmail.docs[0].id;
        }

        if (userData) {
            await updateDoc(doc(db, "usuarios", userId), { ultimoLogin: new Date().toISOString() });
            iniciarSesionAdmin(userData);
            return;
        }

        if (username === 'admin@goparty.com' && password === 'goparty2026') {
            iniciarSesionAdmin({
                nombre: 'Administrador Principal',
                username: 'admin',
                email: 'admin@goparty.com',
                rol: 'admin',
                estado: 'Todos',
                municipios: '',
                permisos: { dashboard: true, proveedores: true, clientes: true, testimonios: true, finanzas: true, perfil: true },
                activo: true
            });
            return;
        }

        alert('❌ Credenciales incorrectas o usuario inactivo');
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
};

function iniciarSesionAdmin(userData) {
    usuarioActual = userData;
    localStorage.setItem('adminLogged', 'true');
    localStorage.setItem('adminUser', JSON.stringify(userData));
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('adminPanel').classList.add('active');
    aplicarPermisos(userData);
    cargarDashboard();
}

function aplicarPermisos(userData) {
    const permisos = userData.permisos || {};
    const rol = userData.rol;
    const estado = userData.estado;
    const nombre = userData.nombre || 'Usuario';

    document.getElementById('topbarTitle').textContent = `Panel - ${nombre}`;
    document.getElementById('userBadge').textContent = `${rol.toUpperCase()} ${estado && estado !== 'Todos' ? '• ' + estado : ''}`;

    document.querySelectorAll('.tab').forEach(tab => {
        const tabName = tab.dataset.tab;
        if (permisos[tabName] === false) {
            tab.classList.add('hidden');
        } else {
            tab.classList.remove('hidden');
        }
    });

    if (rol !== 'admin' && estado && estado !== 'Todos') {
        localStorage.setItem('filtroEstado', estado);
    } else {
        localStorage.removeItem('filtroEstado');
    }
}

window.logout = function() {
    localStorage.removeItem('adminLogged');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('filtroEstado');
    usuarioActual = null;
    location.reload();
};

if (localStorage.getItem('adminLogged') === 'true') {
    const savedUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    if (savedUser && savedUser.username) {
        iniciarSesionAdmin(savedUser);
    } else {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('adminPanel').classList.add('active');
        cargarDashboard();
    }
}

// ==========================================
// TABS & SUB-TABS
// ==========================================
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        if (tab.dataset.tab === 'dashboard') cargarDashboard();
        if (tab.dataset.tab === 'perfil') {
            cargarConfiguracion(); cargarCategorias(); cargarEstados(); cargarCiudades();
            cargarFaqGeneral(); cargarFaqProveedores(); cargarFaqClientes();
            cargarUsuarios(); cargarBlog(); cargarEstadosUsuario();
        }
        if (tab.dataset.tab === 'proveedores') {
            cargarProveedores(); cargarSolicitudes(); cargarCambios(); cargarResenas();
        }
        if (tab.dataset.tab === 'clientes') cargarCotizaciones();
        if (tab.dataset.tab === 'testimonios') cargarTestimonios();
        if (tab.dataset.tab === 'finanzas') cargarFinanzas();
    });
});

document.querySelectorAll('.sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const scope = tab.closest('.sub-content') || tab.closest('.tab-content');
        if (scope) {
            scope.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
            scope.querySelectorAll('.sub-content').forEach(c => c.classList.remove('active'));
        }
        tab.classList.add('active');
        const target = document.getElementById('sub-' + tab.dataset.sub);
        if (target) target.classList.add('active');
    });
});

// ==========================================
// DASHBOARD
// ==========================================
async function cargarDashboard() {
    try {
        const proveedoresSnap = await getDocs(collection(db, "proveedores"));
        const proveedores = [];
        proveedoresSnap.forEach(doc => proveedores.push(doc.data()));

        const total = proveedores.length;
        const pendientes = proveedores.filter(p => p.estadoVerificacion === 'Pendiente').length;
        const gold = proveedores.filter(p => p.plan === 'gold').length;
        const pro = proveedores.filter(p => p.plan === 'pro').length;
        const basic = proveedores.filter(p => p.plan === 'basic' || !p.plan).length;

        document.getElementById('statTotalProveedores').textContent = total;
        document.getElementById('statPendientes').textContent = pendientes;
        document.getElementById('statGold').textContent = gold;
        document.getElementById('statPro').textContent = pro;
        document.getElementById('statBasic').textContent = basic;
        document.getElementById('distBasic').textContent = basic;
        document.getElementById('distPro').textContent = pro;
        document.getElementById('distGold').textContent = gold;
        document.getElementById('tabSolicitudesCount').textContent = pendientes;

        const estados = {};
        proveedores.forEach(p => { if (p.estado) estados[p.estado] = (estados[p.estado] || 0) + 1; });
        const topEstados = Object.entries(estados).sort((a, b) => b[1] - a[1]).slice(0, 5);
        document.getElementById('topEstados').textContent = topEstados.length ? topEstados.map(e => `${e[0]}: ${e[1]}`).join(' | ') : 'Sin datos';

        let cotPend = 0;
        try {
            const cotSnap = await getDocs(collection(db, "solicitudes"));
            cotSnap.forEach(d => { if ((d.data().estado || 'Pendiente') === 'Pendiente') cotPend++; });
        } catch(e) {}
        document.getElementById('dashCotizacionesPend').textContent = cotPend;
        document.getElementById('tabCotizacionesCount').textContent = cotPend;

        let comPend = 0;
        try {
            const resSnap = await getDocs(collection(db, "testimonios"));
            resSnap.forEach(d => { if ((d.data().estado || 'pendiente') === 'pendiente') comPend++; });
        } catch(e) {}
        document.getElementById('dashComentariosPend').textContent = comPend;

        let camPend = 0;
        try {
            const camSnap = await getDocs(collection(db, "moderaciones_pendientes"));
            camSnap.forEach(d => { if ((d.data().estado || 'pendiente') === 'pendiente') camPend++; });
        } catch(e) {}
        document.getElementById('dashCambiosPend').textContent = camPend;
        document.getElementById('tabCambiosCount').textContent = camPend;
        document.getElementById('tabTestimoniosCount').textContent = comPend;

        let ingresosMes = 0;
        try {
            const finSnap = await getDocs(collection(db, "transacciones"));
            const now = new Date();
            finSnap.forEach(d => {
                const t = d.data();
                if (t.tipo === 'ingreso') {
                    const f = t.fecha ? new Date(t.fecha) : null;
                    if (f && f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear()) ingresosMes += t.monto || 0;
                }
            });
        } catch(e) {}
        document.getElementById('dashIngresos').textContent = '$' + ingresosMes.toLocaleString('es-MX');
        document.getElementById('dashResumenFinanzas').textContent = `Ingresos del mes: $${ingresosMes.toLocaleString('es-MX')} MXN`;
    } catch (error) { console.error("Error cargando dashboard:", error); }
}

// ==========================================
// CONFIGURACIÓN
// ==========================================
async function cargarConfiguracion() {
    try {
        const docRef = doc(db, "configuracion", "general");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('cfgWhatsapp').value = data.whatsapp || '';
            document.getElementById('cfgEmail').value = data.email || '';
            document.getElementById('cfgFooter').value = data.footer || '';
            document.getElementById('cfgModoStats').value = data.modoStats || 'auto';
            document.getElementById('cfgEventos').value = data.eventosManual || '';
            document.getElementById('cfgSatisfaccion').value = data.satisfaccionManual || '';
            toggleStatsManual();
        }
    } catch (error) { console.error("Error cargando config:", error); }
}

window.guardarConfiguracion = async function() {
    const alertEl = document.getElementById('configAlert');
    try {
        const data = {
            whatsapp: document.getElementById('cfgWhatsapp').value.trim(),
            email: document.getElementById('cfgEmail').value.trim(),
            footer: document.getElementById('cfgFooter').value.trim(),
            modoStats: document.getElementById('cfgModoStats').value,
            eventosManual: parseInt(document.getElementById('cfgEventos').value) || 0,
            satisfaccionManual: parseInt(document.getElementById('cfgSatisfaccion').value) || 0,
            actualizado: new Date().toISOString()
        };
        if (!data.whatsapp || !data.email) { alertEl.className = 'alert error'; alertEl.textContent = 'WhatsApp y Email son obligatorios'; return; }
        await setDoc(doc(db, "configuracion", "general"), data);
        alertEl.className = 'alert success'; alertEl.textContent = '✅ Configuración guardada.';
        setTimeout(() => { alertEl.style.display = 'none'; }, 4000);
    } catch (error) { alertEl.className = 'alert error'; alertEl.textContent = '❌ Error: ' + error.message; }
};

window.toggleStatsManual = function() {
    document.getElementById('statsManual').style.display = document.getElementById('cfgModoStats').value === 'manual' ? 'block' : 'none';
};

// ==========================================
// PERFIL ADMIN
// ==========================================
window.previewPerfilFoto = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => { document.getElementById('perfilFotoPreview').src = e.target.result; };
        reader.readAsDataURL(input.files[0]);
    }
};

window.guardarPerfilAdmin = async function() {
    try {
        const perfilId = usuarioActual ? (usuarioActual.id || usuarioActual.email) : 'principal';
        const fotoInput = document.getElementById('perfilFoto');
        let fotoURL = document.getElementById('perfilFotoPreview').src || '';

        if (fotoInput.files && fotoInput.files[0]) {
            const file = fotoInput.files[0];
            if (file.size > 2 * 1024 * 1024) { alert('La foto es muy grande (máx 2MB)'); return; }
            const path = `admin/perfil/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
            const ref = storageRef(storage, path);
            await uploadBytes(ref, file);
            fotoURL = await getDownloadURL(ref);
        }

        const perfilData = {
            nombre: document.getElementById('perfilNombre').value.trim(),
            rol: document.getElementById('perfilRol').value,
            email: document.getElementById('perfilEmail').value.trim(),
            telefono: document.getElementById('perfilTelefono').value.trim(),
            fotoURL: fotoURL,
            actualizado: new Date().toISOString()
        };

        if (!perfilData.nombre || !perfilData.email) { alert('Nombre y email son obligatorios'); return; }
        await setDoc(doc(db, "admin_perfil", perfilId), perfilData);
        alert('✅ Perfil guardado correctamente');
    } catch (error) { alert('❌ Error: ' + error.message); }
};

async function cargarPerfilAdmin() {
    try {
        const perfilId = usuarioActual ? (usuarioActual.id || usuarioActual.email) : 'principal';
        const docSnap = await getDoc(doc(db, "admin_perfil", perfilId));
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('perfilNombre').value = data.nombre || '';
            document.getElementById('perfilRol').value = data.rol || 'Administrador Principal';
            document.getElementById('perfilEmail').value = data.email || '';
            document.getElementById('perfilTelefono').value = data.telefono || '';
            if (data.fotoURL) document.getElementById('perfilFotoPreview').src = data.fotoURL;
        }
    } catch (error) { console.error("Error cargando perfil:", error); }
}

// ==========================================
// CRUD CATEGORÍAS
// ==========================================
async function cargarCategorias() {
    const contenedor = document.getElementById('listaCategorias');
    try {
        const snap = await getDocs(collection(db, "categorias"));
        const items = [];
        snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        items.sort((a, b) => (a.orden || 99) - (b.orden || 99));
        if (items.length === 0) { contenedor.innerHTML = '<div class="empty-state">📭 No hay categorías.</div>'; return; }
        contenedor.innerHTML = items.map(item => `<div class="item-row"><div class="item-icon">${item.icono || ''}</div><div class="item-info"><div class="item-title">${item.nombre}</div><div class="item-subtitle">${item.descripcion || 'Sin descripción'} • Orden: ${item.orden || 1}</div></div><div class="item-actions"><button class="btn btn-small btn-secondary" onclick="editarCategoria('${item.id}')">✏️ Editar</button><button class="btn btn-danger btn-small" onclick="eliminarCategoria('${item.id}')">🗑️ Eliminar</button></div></div>`).join('');
    } catch (error) { contenedor.innerHTML = '<div class="empty-state">❌ Error al cargar</div>'; }
}

window.guardarCategoria = async function() {
    const alertEl = document.getElementById('alertCategoria');
    const nombre = document.getElementById('catNombre').value.trim();
    const icono = document.getElementById('catIcono').value.trim();
    const descripcion = document.getElementById('catDescripcion').value.trim();
    const orden = parseInt(document.getElementById('catOrden').value) || 1;
    if (!nombre || !icono) { alertEl.className = 'alert error'; alertEl.textContent = '❌ Nombre e ícono son obligatorios'; return; }
    try {
        await addDoc(collection(db, "categorias"), { nombre, icono, descripcion, orden, activa: true, creado: new Date().toISOString() });
        alertEl.className = 'alert success'; alertEl.textContent = '✅ Categoría guardada';
        document.getElementById('catNombre').value = ''; document.getElementById('catIcono').value = ''; document.getElementById('catDescripcion').value = ''; document.getElementById('catOrden').value = '1';
        setTimeout(() => { alertEl.style.display = 'none'; }, 3000);
        cargarCategorias();
    } catch (error) { alertEl.className = 'alert error'; alertEl.textContent = '❌ Error: ' + error.message; }
};

window.editarCategoria = async function(id) {
    try {
        const docSnap = await getDoc(doc(db, "categorias", id));
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        document.getElementById('catNombre').value = data.nombre || '';
        document.getElementById('catIcono').value = data.icono || '';
        document.getElementById('catDescripcion').value = data.descripcion || '';
        document.getElementById('catOrden').value = data.orden || 1;
    } catch (error) { alert('❌ Error: ' + error.message); }
};

window.eliminarCategoria = async function(id) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try { await deleteDoc(doc(db, "categorias", id)); cargarCategorias(); } catch (error) { alert('❌ Error: ' + error.message); }
};

// ==========================================
// CRUD ESTADOS
// ==========================================
async function cargarEstados() {
    const contenedor = document.getElementById('listaEstados');
    const selectEstado = document.getElementById('ciuEstado');
    try {
        const snap = await getDocs(collection(db, "estados"));
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        items.sort((a, b) => (a.orden || 99) - (b.orden || 99));
        if (selectEstado) {
            selectEstado.innerHTML = '<option value="">Selecciona un estado...</option>' + items.map(i => `<option value="${i.nombre}">${i.nombre}</option>`).join('');
        }
        if (items.length === 0) { contenedor.innerHTML = '<div class="empty-state">📭 No hay estados. Agrega estados para que aparezcan en el registro de proveedores.</div>'; return; }
        contenedor.innerHTML = items.map(item => `<div class="item-row"><div class="item-icon">📍</div><div class="item-info"><div class="item-title">${item.nombre}</div><div class="item-subtitle">${item.descripcion || 'Sin descripción'} • Orden: ${item.orden || 1}</div></div><div class="item-actions"><button class="btn btn-small btn-secondary" onclick="editarEstado('${item.id}')">✏️ Editar</button><button class="btn btn-danger btn-small" onclick="eliminarEstado('${item.id}')">🗑️ Eliminar</button></div></div>`).join('');
    } catch (error) { contenedor.innerHTML = '<div class="empty-state">❌ Error al cargar estados</div>'; }
}

window.guardarEstado = async function() {
    const alertEl = document.getElementById('alertEstado');
    const nombre = document.getElementById('estNombre').value.trim();
    const descripcion = document.getElementById('estDescripcion').value.trim();
    const orden = parseInt(document.getElementById('estOrden').value) || 1;
    if (!nombre) { alertEl.className = 'alert error'; alertEl.textContent = '❌ El nombre del estado es obligatorio'; alertEl.style.display = 'block'; return; }
    try {
        await addDoc(collection(db, "estados"), { nombre, descripcion, orden, activo: true, creado: new Date().toISOString() });
        alertEl.className = 'alert success'; alertEl.textContent = '✅ Estado guardado'; alertEl.style.display = 'block';
        document.getElementById('estNombre').value = ''; document.getElementById('estDescripcion').value = ''; document.getElementById('estOrden').value = '1';
        setTimeout(() => { alertEl.style.display = 'none'; }, 3000);
        cargarEstados();
    } catch (error) { alertEl.className = 'alert error'; alertEl.textContent = '❌ Error: ' + error.message; alertEl.style.display = 'block'; }
};

window.editarEstado = async function(id) {
    try {
        const docSnap = await getDoc(doc(db, "estados", id));
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        document.getElementById('estNombre').value = data.nombre || '';
        document.getElementById('estDescripcion').value = data.descripcion || '';
        document.getElementById('estOrden').value = data.orden || 1;
    } catch (error) { alert('❌ Error: ' + error.message); }
};

window.eliminarEstado = async function(id) {
    if (!confirm('¿Eliminar este estado? Las ciudades asociadas no se eliminarán automáticamente.')) return;
    try { await deleteDoc(doc(db, "estados", id)); cargarEstados(); } catch (error) { alert('❌ Error: ' + error.message); }
};

// ==========================================
// CRUD CIUDADES
// ==========================================
async function cargarCiudades() {
    const contenedor = document.getElementById('listaCiudades');
    try {
        const snap = await getDocs(collection(db, "ciudades"));
        const items = [];
        snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        items.sort((a, b) => (a.orden || 99) - (b.orden || 99));
        if (items.length === 0) { contenedor.innerHTML = '<div class="empty-state">📭 No hay ciudades.</div>'; return; }
        contenedor.innerHTML = items.map(item => `<div class="item-row"><div class="item-icon">🏙️</div><div class="item-info"><div class="item-title">${item.nombre}, ${item.estado}</div><div class="item-subtitle">${item.descripcion || 'Sin descripción'} • Orden: ${item.orden || 1}</div></div><div class="item-actions"><button class="btn btn-small btn-secondary" onclick="editarCiudad('${item.id}')">✏️ Editar</button><button class="btn btn-danger btn-small" onclick="eliminarCiudad('${item.id}')">🗑️ Eliminar</button></div></div>`).join('');
    } catch (error) { contenedor.innerHTML = '<div class="empty-state">❌ Error al cargar</div>'; }
}

window.guardarCiudad = async function() {
    const alertEl = document.getElementById('alertCiudad');
    const nombre = document.getElementById('ciuNombre').value.trim();
    const estado = document.getElementById('ciuEstado').value.trim();
    const descripcion = document.getElementById('ciuDescripcion').value.trim();
    const orden = parseInt(document.getElementById('ciuOrden').value) || 1;
    if (!nombre || !estado) { alertEl.className = 'alert error'; alertEl.textContent = '❌ Nombre y estado son obligatorios'; return; }
    try {
        await addDoc(collection(db, "ciudades"), { nombre, estado, descripcion, orden, activa: true, creado: new Date().toISOString() });
        alertEl.className = 'alert success'; alertEl.textContent = '✅ Ciudad guardada';
        document.getElementById('ciuNombre').value = ''; document.getElementById('ciuEstado').value = ''; document.getElementById('ciuDescripcion').value = ''; document.getElementById('ciuOrden').value = '1';
        setTimeout(() => { alertEl.style.display = 'none'; }, 3000);
        cargarCiudades();
    } catch (error) { alertEl.className = 'alert error'; alertEl.textContent = '❌ Error: ' + error.message; }
};

window.editarCiudad = async function(id) {
    try {
        const docSnap = await getDoc(doc(db, "ciudades", id));
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        document.getElementById('ciuNombre').value = data.nombre || '';
        document.getElementById('ciuEstado').value = data.estado || '';
        document.getElementById('ciuDescripcion').value = data.descripcion || '';
        document.getElementById('ciuOrden').value = data.orden || 1;
    } catch (error) { alert('❌ Error: ' + error.message); }
};

window.eliminarCiudad = async function(id) {
    if (!confirm('¿Eliminar esta ciudad?')) return;
    try { await deleteDoc(doc(db, "ciudades", id)); cargarCiudades(); } catch (error) { alert('❌ Error: ' + error.message); }
};

// ==========================================
// FAQ GENERAL / PROVEEDORES / CLIENTES
// ==========================================
async function cargarFaq(coleccion, contenedorId, alertId, icono) {
    const contenedor = document.getElementById(contenedorId);
    try {
        const snap = await getDocs(collection(db, coleccion));
        const items = [];
        snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        items.sort((a, b) => (a.orden || 99) - (b.orden || 99));
        if (items.length === 0) { contenedor.innerHTML = '<div class="empty-state">📭 No hay preguntas.</div>'; return; }
        contenedor.innerHTML = items.map(item => `<div class="item-row"><div class="item-icon">${icono}</div><div class="item-info"><div class="item-title">${item.pregunta}</div><div class="item-subtitle">${(item.respuesta || '').substring(0, 80)}... • Orden: ${item.orden || 1}</div></div><div class="item-actions"><button class="btn btn-small btn-secondary" onclick="editarFaq('${item.id}', '${coleccion}', '${contenedorId}', '${alertId}')">✏️ Editar</button><button class="btn btn-danger btn-small" onclick="eliminarFaq('${item.id}', '${coleccion}', '${contenedorId}')">🗑️ Eliminar</button></div></div>`).join('');
    } catch (error) { contenedor.innerHTML = '<div class="empty-state">❌ Error al cargar</div>'; }
}

function cargarFaqGeneral() { return cargarFaq("faq_general", "listaFaqGeneral", "alertFaqGeneral", "❓"); }
function cargarFaqProveedores() { return cargarFaq("faq_proveedores", "listaFaqProveedores", "alertFaqProveedores", "👨‍💼"); }
function cargarFaqClientes() { return cargarFaq("faq_clientes", "listaFaqClientes", "alertFaqClientes", "👥"); }

function crearGuardarFaq(coleccion, formPrefix, alertId, reloadFn) {
    return async function() {
        const alertEl = document.getElementById(alertId);
        const pregunta = document.getElementById(formPrefix + 'Pregunta').value.trim();
        const respuesta = document.getElementById(formPrefix + 'Respuesta').value.trim();
        const orden = parseInt(document.getElementById(formPrefix + 'Orden').value) || 1;
        if (!pregunta || !respuesta) { alertEl.className = 'alert error'; alertEl.textContent = '❌ Pregunta y respuesta son obligatorias'; return; }
        try {
            await addDoc(collection(db, coleccion), { pregunta, respuesta, orden, activa: true, creado: new Date().toISOString() });
            alertEl.className = 'alert success'; alertEl.textContent = '✅ Pregunta guardada';
            document.getElementById(formPrefix + 'Pregunta').value = '';
            document.getElementById(formPrefix + 'Respuesta').value = '';
            document.getElementById(formPrefix + 'Orden').value = '1';
            setTimeout(() => { alertEl.style.display = 'none'; }, 3000);
            reloadFn();
        } catch (error) { alertEl.className = 'alert error'; alertEl.textContent = '❌ Error: ' + error.message; }
    };
}

window.guardarFaqGeneral = crearGuardarFaq("faq_general", "faqGeneral", "alertFaqGeneral", cargarFaqGeneral);
window.guardarFaqProveedores = crearGuardarFaq("faq_proveedores", "faqProv", "alertFaqProveedores", cargarFaqProveedores);
window.guardarFaqClientes = crearGuardarFaq("faq_clientes", "faqCli", "alertFaqClientes", cargarFaqClientes);

window.editarFaq = async function(id, coleccion, contenedorId, alertId) {
    try {
        const docSnap = await getDoc(doc(db, coleccion, id));
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        const prefix = coleccion === 'faq_general' ? 'faqGeneral' : coleccion === 'faq_proveedores' ? 'faqProv' : 'faqCli';
        document.getElementById(prefix + 'Pregunta').value = data.pregunta || '';
        document.getElementById(prefix + 'Respuesta').value = data.respuesta || '';
        document.getElementById(prefix + 'Orden').value = data.orden || 1;
    } catch (error) { alert('❌ Error: ' + error.message); }
};

window.eliminarFaq = async function(id, coleccion, contenedorId) {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    try { await deleteDoc(doc(db, coleccion, id)); 
        if (coleccion === 'faq_general') cargarFaqGeneral();
        else if (coleccion === 'faq_proveedores') cargarFaqProveedores();
        else cargarFaqClientes();
    } catch (error) { alert('❌ Error: ' + error.message); }
};

// ==========================================
// GESTIÓN DE USUARIOS
// ==========================================
window.actualizarPermisosPorRol = function() {
    const rol = document.getElementById('usuarioRol').value;
    const checkboxes = document.querySelectorAll('.permiso-item input[type="checkbox"]');
    if (rol === 'admin') {
        checkboxes.forEach(cb => cb.checked = true);
    } else if (rol === 'verificador') {
        checkboxes.forEach(cb => cb.checked = false);
        document.getElementById('perm_dashboard').checked = true;
        document.getElementById('perm_proveedores').checked = true;
    } else if (rol === 'supervisor') {
        checkboxes.forEach(cb => cb.checked = false);
        document.getElementById('perm_dashboard').checked = true;
        document.getElementById('perm_proveedores').checked = true;
        document.getElementById('perm_clientes').checked = true;
    }
};

window.cargarEstadosUsuario = async function() {
    const select = document.getElementById('usuarioEstado');
    if (!select) return;
    try {
        const snap = await getDocs(collection(db, "estados"));
        if (!snap.empty) {
            const estados = [];
            snap.forEach(d => estados.push(d.data().nombre));
            estados.sort();
            select.innerHTML = '<option value="">Selecciona un estado...</option>' + estados.map(e => `<option value="${e}">${e}</option>`).join('');
        } else {
            select.innerHTML = '<option value="">Selecciona un estado...</option>' + ESTADOS_MEXICO.map(e => `<option value="${e}">${e}</option>`).join('');
        }
    } catch (e) {
        select.innerHTML = '<option value="">Selecciona un estado...</option>' + ESTADOS_MEXICO.map(e => `<option value="${e}">${e}</option>`).join('');
    }
};

window.cargarMunicipiosUsuario = function() {
    const estado = document.getElementById('usuarioEstado').value;
    const selectMunicipios = document.getElementById('usuarioMunicipios');
    if (!estado) {
        selectMunicipios.innerHTML = '<option value="" disabled>Selecciona un estado primero</option>';
        return;
    }
    const municipios = MUNICIPIOS_POR_ESTADO[estado] || [];
    selectMunicipios.innerHTML = municipios.map(m => `<option value="${m}">${m}</option>`).join('') + '<option value="Otro">Otro</option>';
};

async function cargarUsuarios() {
    const contenedor = document.getElementById('listaUsuarios');
    const previewSelect = document.getElementById('previewUsuarioSelect');
    try {
        const snap = await getDocs(collection(db, "usuarios"));
        const usuarios = [];
        snap.forEach(doc => usuarios.push({ id: doc.id, ...doc.data() }));

        document.getElementById('totalUsuarios').textContent = usuarios.length;
        document.getElementById('totalAdmins').textContent = usuarios.filter(u => u.rol === 'admin').length;
        document.getElementById('totalVerificadores').textContent = usuarios.filter(u => u.rol === 'verificador').length;
        document.getElementById('totalSupervisores').textContent = usuarios.filter(u => u.rol === 'supervisor').length;

        if (previewSelect) {
            previewSelect.innerHTML = '<option value="">Selecciona un usuario...</option>' +
                usuarios.map(u => `<option value="${u.id}">${u.nombre || u.username}</option>`).join('');
        }

        if (usuarios.length === 0) {
            contenedor.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999; padding: 1rem;">No hay usuarios registrados</td></tr>';
            return;
        }

        contenedor.innerHTML = usuarios.map(u => {
            const rolClass = u.rol === 'admin' ? 'rol-admin' : u.rol === 'verificador' ? 'rol-verificador' : 'rol-supervisor';
            const rolTexto = u.rol === 'admin' ? 'Administrador' : u.rol === 'verificador' ? 'Verificador' : 'Supervisor';
            const region = u.municipios ? `${u.estado} (${u.municipios})` : u.estado || 'Todos los estados';
            const permisosCount = u.permisos ? Object.values(u.permisos).filter(p => p).length : 0;
            const ultLogin = u.ultimoLogin ? new Date(u.ultimoLogin).toLocaleDateString('es-MX') : 'Nunca';
            const totalAcciones = u.totalAcciones || 0;
            const aprobaciones = u.aprobaciones || 0;
            return `<tr>
                <td>${u.nombre || 'Sin nombre'}</td>
                <td><strong>${u.username || 'N/A'}</strong></td>
                <td>${u.email || 'Sin email'}</td>
                <td><span class="rol-badge ${rolClass}">${rolTexto}</span></td>
                <td>${region}</td>
                <td>${permisosCount} secciones</td>
                <td><div class="usuario-dashboard">
                    <div class="metrica-usuario"><span class="metrica-label">Último acceso:</span><span class="metrica-valor">${ultLogin}</span></div>
                    <div class="metrica-usuario"><span class="metrica-label">Acciones:</span><span class="metrica-valor">${totalAcciones}</span></div>
                    <div class="metrica-usuario"><span class="metrica-label">Aprobaciones:</span><span class="metrica-valor">${aprobaciones}</span></div>
                </div></td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="editarUsuario('${u.id}')" style="margin-right: 0.3rem;">✏️ Editar</button>
                    <button class="btn btn-small ${u.activo ? 'btn-secondary' : 'btn'}" onclick="cambiarEstadoUsuario('${u.id}', ${!u.activo})" style="margin-right: 0.3rem;">${u.activo ? 'Desactivar' : 'Activar'}</button>
                    <button class="btn btn-danger btn-small" onclick="eliminarUsuario('${u.id}')">🗑️</button>
                </td>
            </tr>`;
        }).join('');
    } catch (error) {
        contenedor.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red; padding: 1rem;">Error al cargar usuarios</td></tr>';
    }
}

window.guardarUsuario = async function() {
    const alertEl = document.getElementById('alertUsuario');
    const nombre = document.getElementById('usuarioNombre').value.trim();
    const email = document.getElementById('usuarioEmail').value.trim();
    const username = document.getElementById('usuarioLogin').value.trim();
    const password = document.getElementById('usuarioPassword').value.trim();
    const rol = document.getElementById('usuarioRol').value;
    const estado = document.getElementById('usuarioEstado').value;
    const municipiosSelect = document.getElementById('usuarioMunicipios');
    const municipios = Array.from(municipiosSelect.selectedOptions).map(o => o.value).join(', ');

    const permisos = {};
    document.querySelectorAll('.permiso-item input[type="checkbox"]').forEach(cb => {
        permisos[cb.value] = cb.checked;
    });

    if (!nombre || !email || !username || !password || !rol) {
        alertEl.className = 'alert error'; alertEl.textContent = '❌ Por favor completa los campos obligatorios'; alertEl.style.display = 'block'; return;
    }
    if (password.length < 6) {
        alertEl.className = 'alert error'; alertEl.textContent = '❌ La contraseña debe tener al menos 6 caracteres'; alertEl.style.display = 'block'; return;
    }

    try {
        await addDoc(collection(db, "usuarios"), {
            nombre, email, username, password, rol,
            estado: estado || 'Todos',
            municipios: municipios || '',
            permisos, activo: true,
            fechaCreacion: new Date().toISOString(),
            creadoPor: usuarioActual ? usuarioActual.email : 'admin@goparty.com',
            ultimoLogin: null, totalAcciones: 0, aprobaciones: 0
        });
        alertEl.className = 'alert success'; alertEl.textContent = '✅ Usuario creado exitosamente'; alertEl.style.display = 'block';
        document.getElementById('usuarioNombre').value = '';
        document.getElementById('usuarioEmail').value = '';
        document.getElementById('usuarioLogin').value = '';
        document.getElementById('usuarioPassword').value = '';
        document.getElementById('usuarioEstado').value = '';
        municipiosSelect.innerHTML = '<option value="" disabled>Selecciona un estado primero</option>';
        setTimeout(() => { alertEl.style.display = 'none'; }, 3000);
        cargarUsuarios();
    } catch (error) {
        alertEl.className = 'alert error'; alertEl.textContent = '❌ Error: ' + error.message; alertEl.style.display = 'block';
    }
};

window.editarUsuario = async function(id) {
    try {
        const docSnap = await getDoc(doc(db, "usuarios", id));
        if (!docSnap.exists()) return;
        const u = docSnap.data();
        document.getElementById('usuarioNombre').value = u.nombre || '';
        document.getElementById('usuarioEmail').value = u.email || '';
        document.getElementById('usuarioLogin').value = u.username || '';
        document.getElementById('usuarioRol').value = u.rol || 'admin';
        if (u.estado && u.estado !== 'Todos') {
            document.getElementById('usuarioEstado').value = u.estado;
            window.cargarMunicipiosUsuario();
            if (u.municipios) {
                const municipios = u.municipios.split(',').map(m => m.trim());
                Array.from(document.getElementById('usuarioMunicipios').options).forEach(opt => {
                    opt.selected = municipios.includes(opt.value);
                });
            }
        }
        if (u.permisos) {
            Object.keys(u.permisos).forEach(key => {
                const cb = document.getElementById('perm_' + key);
                if (cb) cb.checked = u.permisos[key];
            });
        }
        // Cambiar el botón de guardar a modo edición
        alert('Datos cargados en el formulario. La contraseña no se modifica al editar (déjala en blanco o escribe una nueva).');
        document.getElementById('usuarioPassword').value = '';
    } catch (error) { alert('❌ Error: ' + error.message); }
};

window.cambiarEstadoUsuario = async function(id, nuevoEstado) {
    try { await updateDoc(doc(db, "usuarios", id), { activo: nuevoEstado }); cargarUsuarios(); }
    catch (error) { alert('❌ Error: ' + error.message); }
};

window.eliminarUsuario = async function(id) {
    if (!confirm('¿Eliminar permanentemente este usuario?')) return;
    try { await deleteDoc(doc(db, "usuarios", id)); cargarUsuarios(); }
    catch (error) { alert('❌ Error: ' + error.message); }
};

window.mostrarPreviewUsuario = function() {
    const userId = document.getElementById('previewUsuarioSelect').value;
    const contenido = document.getElementById('previewUsuarioContenido');
    const tabsDiv = document.getElementById('previewUsuarioTabs');
    const regionP = document.getElementById('previewUsuarioRegion');
    if (!userId) { contenido.style.display = 'none'; return; }
    getDoc(doc(db, "usuarios", userId)).then(docSnap => {
        if (!docSnap.exists()) { contenido.style.display = 'none'; return; }
        const u = docSnap.data();
        const permisos = u.permisos || {};
        const allTabs = [
            { key: 'dashboard', label: '📊 Dashboard' },
            { key: 'proveedores', label: '👥 Proveedores' },
            { key: 'clientes', label: '👤 Clientes' },
            { key: 'testimonios', label: '⭐ Testimonios' },
            { key: 'finanzas', label: '💰 Finanzas' },
            { key: 'perfil', label: '👨‍💼 Perfil Admin' }
        ];
        const visibleTabs = allTabs.filter(t => permisos[t.key] !== false);
        tabsDiv.innerHTML = visibleTabs.map(t => `<span style="background:#f0f0f0;padding:0.4rem 0.8rem;border-radius:8px;font-size:0.9rem;">${t.label}</span>`).join('');
        regionP.textContent = u.municipios ? `${u.estado} (${u.municipios})` : u.estado || 'Todos los estados';
        contenido.style.display = 'block';
    });
};

// ==========================================
// PROVEEDORES - DIRECTORIO
// ==========================================
async function cargarProveedores() {
    const contenedor = document.getElementById('listaProveedores');
    if (!contenedor) return;
    try {
        const snap = await getDocs(collection(db, "proveedores"));
        let proveedores = [];
        snap.forEach(doc => proveedores.push({ id: doc.id, ...doc.data() }));
        if (filtroProveedorActual !== 'todos') {
            proveedores = proveedores.filter(p => (p.estadoVerificacion || 'Pendiente') === filtroProveedorActual);
        }
        proveedores.sort((a, b) => (a.nombreNegocio || '').localeCompare(b.nombreNegocio || ''));
        if (proveedores.length === 0) { contenedor.innerHTML = '<div class="empty-state">📭 No hay proveedores.</div>'; return; }
        contenedor.innerHTML = proveedores.map(p => {
            const estado = p.estadoVerificacion || 'Pendiente';
            const estadoColor = estado === 'Aprobado' || estado === 'Verificado' ? '#4CAF50' : estado === 'Rechazado' ? '#FF4444' : '#FFD93D';
            const planBadge = p.plan === 'gold' ? '👑 Gold' : p.plan === 'pro' ? '⭐ Pro' : '✓ Basic';
            return `<div class="item-row"><div class="item-icon">🏪</div><div class="item-info"><div class="item-title">${p.nombreNegocio || 'Sin nombre'}</div><div class="item-subtitle">${p.categoria || 'General'} • ${p.ciudad || ''}, ${p.estado || ''} • Plan: ${planBadge}</div></div><div class="item-actions"><span class="estado-badge" style="background:${estadoColor};color:white;">${estado}</span></div></div>`;
        }).join('');
    } catch (error) { contenedor.innerHTML = '<div class="empty-state">❌ Error al cargar</div>'; }
}

window.filtrarProveedores = function(filtro) { filtroProveedorActual = filtro; cargarProveedores(); };

// ==========================================
// PROVEEDORES - SOLICITUDES DE INCORPORACIÓN
// ==========================================
async function cargarSolicitudes() {
    const contenedor = document.getElementById('listaSolicitudes');
    if (!contenedor) return;
    try {
        const snap = await getDocs(collection(db, "proveedores"));
        let solicitudes = [];
        snap.forEach(doc => solicitudes.push({ id: doc.id, ...doc.data() }));
        if (filtroSolicitudActual !== 'todas') {
            solicitudes = solicitudes.filter(s => (s.estadoVerificacion || 'Pendiente') === filtroSolicitudActual);
        }
        solicitudes.sort((a, b) => new Date(b.fechaSolicitud || b.fechaRegistro || 0) - new Date(a.fechaSolicitud || a.fechaRegistro || 0));

        const todas = await getDocs(collection(db, "proveedores"));
        const pendientes = todas.docs.filter(d => (d.data().estadoVerificacion || 'Pendiente') === 'Pendiente').length;
        const aprobadas = todas.docs.filter(d => d.data().estadoVerificacion === 'Aprobado' || d.data().estadoVerificacion === 'Verificado').length;
        const rechazadas = todas.docs.filter(d => d.data().estadoVerificacion === 'Rechazado').length;

        document.getElementById('solPendientes').textContent = pendientes;
        document.getElementById('solAprobadas').textContent = aprobadas;
        document.getElementById('solRechazadas').textContent = rechazadas;
        document.getElementById('solTotal').textContent = todas.size;

        if (solicitudes.length === 0) { contenedor.innerHTML = `<div class="empty-state">📭 No hay solicitudes.</div>`; return; }

        contenedor.innerHTML = solicitudes.map(s => {
            const estado = s.estadoVerificacion || 'Pendiente';
            const estadoColor = estado === 'Aprobado' || estado === 'Verificado' ? '#4CAF50' : estado === 'Rechazado' ? '#FF4444' : '#FFD93D';
            const fecha = s.fechaSolicitud ? new Date(s.fechaSolicitud).toLocaleDateString('es-MX') : new Date(s.fechaRegistro || 0).toLocaleDateString('es-MX');
            const servicios = s.servicios && s.servicios.length > 0 ? s.servicios.join(', ') : (s.categoria || 'No especificado');
            const docs = s.documentos || {};
            let docsHtml = '';
            const docLabels = { ine: 'INE/IFE', fotosEvidencia: 'Fotos de Evidencia', constanciaFiscal: 'Constancia Fiscal' };
            Object.keys(docLabels).forEach(key => {
                if (docs[key] && docs[key].length > 0) {
                    const links = docs[key].map((url, i) => {
                        const isImg = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                        return `<a href="${url}" target="_blank" style="display:inline-flex;align-items:center;gap:0.3rem;margin:0.2rem;padding:0.3rem 0.6rem;background:#e8f4fd;border-radius:6px;text-decoration:none;font-size:0.8rem;color:#1976d2;">${isImg ? '🖼️' : '📄'} Ver ${i+1}</a>`;
                    }).join('');
                    docsHtml += `<div style="margin-top:0.5rem;"><strong style="font-size:0.85rem;color:#555;">${docLabels[key]}:</strong> ${links}</div>`;
                }
            });
            if (s.fechaReunionPresencial) {
                docsHtml += `<div style="margin-top:0.5rem;font-size:0.85rem;"><strong style="color:#b8860b;">📅 Reunión presencial:</strong> ${new Date(s.fechaReunionPresencial).toLocaleString('es-MX')}</div>`;
            }
            return `<div class="solicitud-card" style="border-left-color: ${estadoColor};">
                <div class="solicitud-header">
                    <div>
                        <div class="solicitud-cliente">🏪 ${s.nombreNegocio || 'Sin nombre'}</div>
                        <div class="solicitud-evento">👤 ${s.nombreContacto || 'Sin contacto'} • 📧 ${s.email || 'Sin email'}</div>
                        <div class="solicitud-evento">📱 ${s.whatsapp || 'Sin teléfono'} • 📍 ${s.ciudad || ''}, ${s.estado || ''}</div>
                        <div class="solicitud-evento">🎯 Servicios: ${servicios} • 💎 Plan: ${(s.plan || 'basic').toUpperCase()}</div>
                        <div style="font-size: 0.8rem; color: #999; margin-top: 0.3rem;">📅 Solicitud: ${fecha}</div>
                    </div>
                    <span style="background: ${estadoColor}; color: white; padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem; font-weight: 600;">${estado}</span>
                </div>
                ${s.descripcion ? `<div class="solicitud-descripcion">"${s.descripcion}"</div>` : ''}
                <div style="padding: 0.75rem; background: #f8f9fa; border-radius: 8px; margin-top: 0.5rem;">
                    <strong style="font-size: 0.85rem; color: #333;">📎 Documentos de Verificación:</strong>
                    ${docsHtml || '<div style="margin-top:0.5rem;font-size:0.85rem;color:#999;">Sin documentos subidos</div>'}
                </div>
                <div class="solicitud-acciones">
                    ${estado === 'Pendiente' ? `
                        <button class="btn-aprobar" onclick="aprobarSolicitud('${s.id}', '${s.email}')">✅ Aprobar y Activar Cuenta</button>
                        <button class="btn-rechazar" onclick="rechazarSolicitud('${s.id}')">❌ Rechazar</button>
                    ` : `
                        ${(estado === 'Aprobado' || estado === 'Verificado') ? `<button class="btn-rechazar" onclick="cambiarEstadoSolicitud('${s.id}', 'Pendiente')">↩️ Volver a Pendiente</button>` : ''}
                        ${estado === 'Rechazado' ? `<button class="btn-aprobar" onclick="cambiarEstadoSolicitud('${s.id}', 'Pendiente')">↩️ Revisar de Nuevo</button>` : ''}
                        <button class="btn btn-danger btn-small" onclick="eliminarSolicitud('${s.id}')">🗑️ Eliminar</button>
                    `}
                </div>
            </div>`;
        }).join('');
    } catch (error) { contenedor.innerHTML = '<div class="empty-state">❌ Error al cargar: ' + error.message + '</div>'; }
}

window.filtrarSolicitudes = function(filtro) { filtroSolicitudActual = filtro; cargarSolicitudes(); };
window.aprobarSolicitud = async function(id, email) {
    if (!confirm('¿Aprobar esta solicitud?\n\nEl proveedor podrá iniciar sesión en el dashboard con este email:\n' + email)) return;
    try { await updateDoc(doc(db, "proveedores", id), { estadoVerificacion: 'Aprobado', fechaAprobacion: new Date().toISOString() }); alert('✅ Solicitud aprobada.'); cargarSolicitudes(); }
    catch (error) { alert('❌ Error: ' + error.message); }
};
window.rechazarSolicitud = async function(id) {
    const motivo = prompt('Motivo del rechazo (opcional):');
    try { await updateDoc(doc(db, "proveedores", id), { estadoVerificacion: 'Rechazado', motivoRechazo: motivo || 'No especificado', fechaRechazo: new Date().toISOString() }); alert('❌ Solicitud rechazada.'); cargarSolicitudes(); }
    catch (error) { alert('❌ Error: ' + error.message); }
};
window.cambiarEstadoSolicitud = async function(id, nuevoEstado) {
    try { await updateDoc(doc(db, "proveedores", id), { estadoVerificacion: nuevoEstado }); cargarSolicitudes(); }
    catch (error) { alert('❌ Error: ' + error.message); }
};
window.eliminarSolicitud = async function(id) {
    if (!confirm('¿Eliminar permanentemente esta solicitud?')) return;
    try { await deleteDoc(doc(db, "proveedores", id)); cargarSolicitudes(); }
    catch (error) { alert('❌ Error: ' + error.message); }
};

// ==========================================
// PROVEEDORES - SOLICITUDES DE CAMBIO
// ==========================================
async function cargarCambios() {
    const contenedor = document.getElementById('listaCambios');
    if (!contenedor) return;
    try {
        const snap = await getDocs(collection(db, "moderaciones_pendientes"));
        let cambios = [];
        snap.forEach(doc => cambios.push({ id: doc.id, ...doc.data() }));
        if (filtroCambioActual !== 'todas') {
            cambios = cambios.filter(c => (c.estado || 'pendiente') === filtroCambioActual);
        }
        const todos = await getDocs(collection(db, "moderaciones_pendientes"));
        document.getElementById('cambiosPendientes').textContent = todos.docs.filter(d => (d.data().estado || 'pendiente') === 'pendiente').length;
        document.getElementById('cambiosAprobados').textContent = todos.docs.filter(d => d.data().estado === 'aprobada').length;
        document.getElementById('cambiosRechazados').textContent = todos.docs.filter(d => d.data().estado === 'rechazada').length;
        if (cambios.length === 0) { contenedor.innerHTML = '<div class="empty-state">📭 No hay solicitudes de cambio.</div>'; return; }
        contenedor.innerHTML = cambios.map(m => {
            const estadoBadge = m.estado === 'aprobada' ? 'estado-aprobado' : m.estado === 'rechazada' ? 'estado-rechazado' : 'estado-pendiente';
            return `<div class="solicitud-card">
                <div class="solicitud-header">
                    <div class="solicitud-info-principal">
                        <div class="solicitud-cliente">Solicitud de ${m.tipo === 'cambio' ? 'Cambio' : 'Eliminación'}</div>
                        <div class="solicitud-evento">Colección: ${m.coleccion || 'Sin especificar'} - Documento: ${m.documentoId || 'Sin ID'}</div>
                        <div style="font-size: 0.8rem; color: #999; margin-top: 0.3rem;">📅 ${m.fecha ? new Date(m.fecha).toLocaleDateString('es-MX') : ''}</div>
                    </div>
                    <span class="estado-badge ${estadoBadge}">${m.estado || 'pendiente'}</span>
                </div>
                ${m.solicitud ? `<div class="solicitud-descripcion">${m.solicitud}</div>` : ''}
                <div class="solicitud-acciones">
                    ${m.estado === 'pendiente' ? `<button class="btn-aprobar" onclick="aprobarModeracion('${m.id}')">✅ Aprobar</button><button class="btn-rechazar" onclick="rechazarModeracion('${m.id}')">❌ Rechazar</button>` : ''}
                </div>
            </div>`;
        }).join('');
    } catch (error) { contenedor.innerHTML = '<div class="empty-state">❌ Error al cargar: ' + error.message + '</div>'; }
}

window.filtrarCambios = function(filtro) { filtroCambioActual = filtro; cargarCambios(); };

// ==========================================
// PROVEEDORES - TESTIMONIOS DE CLIENTES
// ==========================================
async function cargarResenas() {
    const contenedor = document.getElementById('listaResenas');
    if (!contenedor) return;
    try {
        const snap = await getDocs(collection(db, "testimonios"));
        let resenas = [];
        snap.forEach(doc => resenas.push({ id: doc.id, ...doc.data() }));
        if (filtroResenaActual !== 'todas') resenas = resenas.filter(r => r.estado === filtroResenaActual);
        resenas.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

        const todas = await getDocs(collection(db, "testimonios"));
        document.getElementById('resenasPendientes').textContent = todas.docs.filter(d => d.data().estado === 'pendiente').length;
        document.getElementById('resenasAprobadas').textContent = todas.docs.filter(d => d.data().estado === 'aprobado').length;
        document.getElementById('totalClientes').textContent = todas.size;

        if (resenas.length === 0) { contenedor.innerHTML = `<div class="empty-state">📭 No hay reseñas.</div>`; return; }
        contenedor.innerHTML = resenas.map(r => {
            const estadoClase = r.estado === 'aprobado' ? 'aprobada' : r.estado === 'rechazado' ? 'rechazada' : '';
            const estrellas = '⭐'.repeat(r.calificacion || 0);
            const fecha = r.fecha ? new Date(r.fecha).toLocaleDateString('es-MX') : '';
            return `<div class="solicitud-card ${estadoClase}"><div class="solicitud-header"><div><div class="solicitud-cliente">${r.nombreCliente || 'Anónimo'}</div><div class="solicitud-evento">${r.tipoEvento || ''} - ${r.ciudad || ''} • Proveedor: <strong>${r.nombreProveedor || 'N/A'}</strong></div><div style="font-size: 0.8rem; color: #999; margin-top: 0.3rem;">📅 ${fecha}</div></div><span style="background: ${r.estado === 'aprobado' ? '#4CAF50' : r.estado === 'rechazado' ? '#FF4444' : '#FFD93D'}; color: white; padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem; font-weight: 600;">${r.estado || 'pendiente'}</span></div><div style="margin:0.5rem 0;">${estrellas}</div><div class="solicitud-descripcion">"${r.comentario || ''}"</div><div class="solicitud-acciones">${r.estado === 'pendiente' ? `<button class="btn-aprobar" onclick="aprobarResena('${r.id}')">✅ Aprobar</button><button class="btn-rechazar" onclick="rechazarResena('${r.id}')">❌ Rechazar</button>` : `<button class="btn btn-danger btn-small" onclick="eliminarResena('${r.id}')">🗑️ Eliminar</button>`}</div></div>`;
        }).join('');
    } catch (error) { contenedor.innerHTML = '<div class="empty-state">❌ Error al cargar: ' + error.message + '</div>'; }
}

window.filtrarResenas = function(filtro) { filtroResenaActual = filtro; cargarResenas(); };
window.aprobarResena = async function(id) { if (!confirm('¿Aprobar?')) return; try { await updateDoc(doc(db, "testimonios", id), { estado: 'aprobado', fechaModeracion: new Date().toISOString() }); cargarResenas(); } catch (e) { alert('❌ Error: ' + e.message); } };
window.rechazarResena = async function(id) { if (!confirm('¿Rechazar?')) return; try { await updateDoc(doc(db, "testimonios", id), { estado: 'rechazado', fechaModeracion: new Date().toISOString() }); cargarResenas(); } catch (e) { alert('❌ Error: ' + e.message); } };
window.eliminarResena = async function(id) { if (!confirm('¿Eliminar permanentemente?')) return; try { await deleteDoc(doc(db, "testimonios", id)); cargarResenas(); } catch (e) { alert('❌ Error: ' + e.message); } };

// ==========================================
// CLIENTES - COTIZACIONES
// ==========================================
async function cargarCotizaciones() {
    const contenedor = document.getElementById('listaCotizaciones');
    if (!contenedor) return;
    try {
        const snap = await getDocs(collection(db, "solicitudes"));
        let cotizaciones = [];
        snap.forEach(doc => cotizaciones.push({ id: doc.id, ...doc.data() }));
        if (filtroCotizacionActual !== 'todas') {
            cotizaciones = cotizaciones.filter(c => (c.estado || 'Pendiente') === filtroCotizacionActual);
        }
        cotizaciones.sort((a, b) => new Date(b.fechaSolicitud || 0) - new Date(a.fechaSolicitud || 0));
        if (cotizaciones.length === 0) { contenedor.innerHTML = '<div class="empty-state">📭 No hay cotizaciones.</div>'; return; }
        contenedor.innerHTML = cotizaciones.map(c => {
            const estado = c.estado || 'Pendiente';
            const estadoColor = estado === 'Completada' ? '#4CAF50' : estado === 'Asignada' ? '#4A90E2' : '#FFD93D';
            const fecha = c.fechaSolicitud ? new Date(c.fechaSolicitud).toLocaleDateString('es-MX') : '';
            return `<div class="solicitud-card" style="border-left-color: ${estadoColor};">
                <div class="solicitud-header">
                    <div>
                        <div class="solicitud-cliente">📝 ${c.tipoEvento || 'Evento'}</div>
                        <div class="solicitud-evento">👤 ${c.nombreCliente || 'Cliente'} • 📧 ${c.emailCliente || ''}</div>
                        <div class="solicitud-evento">📱 ${c.telefonoCliente || ''} • 📍 ${c.ciudadEvento || ''}</div>
                        <div class="solicitud-evento">🎉 ${c.numInvitados || 0} invitados • 💰 $${c.presupuesto || 0} • 📅 ${c.fechaEvento || ''}</div>
                        <div class="solicitud-evento">🛠️ Servicios: ${(c.serviciosRequeridos || []).join(', ')}</div>
                        <div style="font-size: 0.8rem; color: #999; margin-top: 0.3rem;">📅 Solicitud: ${fecha}</div>
                    </div>
                    <span style="background: ${estadoColor}; color: white; padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem; font-weight: 600;">${estado}</span>
                </div>
                ${c.descripcion ? `<div class="solicitud-descripcion">"${c.descripcion}"</div>` : ''}
                <div class="solicitud-acciones">
                    <a href="https://wa.me/${(c.telefonoCliente || '').replace(/\D/g, '')}" target="_blank" class="btn btn-small btn-secondary" style="text-decoration:none;display:inline-block;">📱 WhatsApp</a>
                    ${estado === 'Pendiente' ? `<button class="btn-aprobar" onclick="asignarCotizacion('${c.id}')">✅ Asignar a Proveedor</button>` : ''}
                </div>
            </div>`;
        }).join('');
    } catch (error) { contenedor.innerHTML = '<div class="empty-state">❌ Error al cargar: ' + error.message + '</div>'; }
}

window.filtrarCotizaciones = function(filtro) { filtroCotizacionActual = filtro; cargarCotizaciones(); };
window.asignarCotizacion = async function(id) {
    const proveedorId = prompt('Ingresa el ID del proveedor al que deseas asignar esta cotización:');
    if (!proveedorId) return;
    try { await updateDoc(doc(db, "solicitudes", id), { estado: 'Asignada', proveedorAsignado: proveedorId }); alert('✅ Cotización asignada.'); cargarCotizaciones(); }
    catch (error) { alert('❌ Error: ' + error.message); }
};

// ==========================================
// TESTIMONIOS Y CASOS DE ÉXITO
// ==========================================
async function cargarTestimonios() {
    try {
        const [snapTestimonios, snapExperiencias, snapCasos, snapModeraciones] = await Promise.all([
            getDocs(collection(db, "testimonios")),
            getDocs(collection(db, "testimonios_proveedores")),
            getDocs(collection(db, "casos_exito")),
            getDocs(collection(db, "moderaciones_pendientes"))
        ]);
        const testimonios = snapTestimonios.docs.map(d => ({ id: d.id, ...d.data() }));
        const experiencias = snapExperiencias.docs.map(d => ({ id: d.id, ...d.data() }));
        const casos = snapCasos.docs.map(d => ({ id: d.id, ...d.data() }));
        const moderaciones = snapModeraciones.docs.map(d => ({ id: d.id, ...d.data() }));

        const total = testimonios.length + experiencias.length + casos.length;
        const pendientes = [...testimonios, ...experiencias, ...casos].filter(t => t.estado === 'pendiente').length;
        const aprobados = [...testimonios, ...experiencias, ...casos].filter(t => t.estado === 'aprobado').length;

        document.getElementById('statTotalTestimonios').textContent = total;
        document.getElementById('statTestimoniosPendientes').textContent = pendientes;
        document.getElementById('statTestimoniosAprobados').textContent = aprobados;
        document.getElementById('tabTestimoniosCount').textContent = pendientes;

        renderizarLista(testimonios, 'listaTestimoniosClientes', filtroTestimoniosActual, 'testimonio');
        renderizarLista(experiencias, 'listaExperienciasGoParty', filtroExperienciasActual, 'experiencia');
        renderizarLista(casos, 'listaCasosExito', filtroCasosActual, 'caso');
        renderizarLista(moderaciones, 'listaModeraciones', filtroModeracionesActual, 'moderacion');
    } catch (error) { console.error("Error cargando testimonios:", error); }
}

function renderizarLista(items, contenedorId, filtro, tipo) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;
    const filtrados = filtro === 'todas' ? items : items.filter(i => i.estado === filtro);
    if (filtrados.length === 0) { contenedor.innerHTML = '<div class="empty-state">📭 No hay elementos</div>'; return; }
    contenedor.innerHTML = filtrados.map(item => {
        const estadoClass = item.estado === 'aprobado' || item.estado === 'aprobada' ? 'aprobada' : item.estado === 'rechazado' || item.estado === 'rechazada' ? 'rechazada' : 'pendiente';
        const estadoBadge = item.estado === 'aprobado' || item.estado === 'aprobada' ? 'estado-aprobado' : item.estado === 'rechazado' || item.estado === 'rechazada' ? 'estado-rechazado' : 'estado-pendiente';
        const estrellas = '⭐'.repeat(item.calificacion || 0);
        let titulo = '', subtitulo = '', descripcion = '';
        if (tipo === 'testimonio') {
            titulo = `${item.nombreCliente || 'Anónimo'} sobre ${item.nombreProveedor || 'Proveedor'}`;
            subtitulo = `${item.tipoEvento || ''} - ${item.ciudad || ''} ${estrellas}`;
            descripcion = `"${item.comentario || ''}"`;
        } else if (tipo === 'experiencia') {
            titulo = `${item.nombreNegocio || 'Proveedor'} - Experiencia con GoParty`;
            subtitulo = `Tiempo usando: ${item.tiempo || 'No especificado'} ${estrellas}`;
            descripcion = `<strong>Me gusta:</strong> ${item.gusta || item.meGusta || ''}<br><strong>Mejoraría:</strong> ${item.mejoraria || ''}<br><strong>Recomendaría:</strong> ${item.recomendar === true || item.recomendaria === 'si' ? '✅ Sí' : '❌ No'}`;
        } else if (tipo === 'caso') {
            titulo = `🏆 ${item.titulo || 'Sin título'}`;
            subtitulo = `${item.nombreNegocio || 'Proveedor'} - ${item.tipoEvento || ''} en ${item.ciudad || ''}`;
            descripcion = `<strong>Historia:</strong> ${item.historia || ''}<br><strong>Resultado:</strong> ${item.resultado || ''}`;
        } else {
            titulo = `Solicitud de ${item.tipo === 'cambio' ? 'Cambio' : 'Eliminación'}`;
            subtitulo = `Colección: ${item.coleccion || 'Sin especificar'} - Documento: ${item.documentoId || 'Sin ID'}`;
            descripcion = item.solicitud || '';
        }
        const fecha = item.fecha ? new Date(item.fecha).toLocaleDateString('es-MX') : '';
        const coleccionMap = { testimonio: 'testimonios', experiencia: 'testimonios_proveedores', caso: 'casos_exito', moderacion: 'moderaciones_pendientes' };
        const coleccion = coleccionMap[tipo];
        return `<div class="solicitud-card ${estadoClass}">
            <div class="solicitud-header">
                <div class="solicitud-info-principal">
                    <div class="solicitud-cliente">${titulo}</div>
                    <div class="solicitud-evento">${subtitulo}</div>
                    <div style="font-size: 0.8rem; color: #999; margin-top: 0.3rem;">📅 ${fecha}</div>
                </div>
                <span class="estado-badge ${estadoBadge}">${item.estado || 'pendiente'}</span>
            </div>
            <div class="solicitud-descripcion">${descripcion}</div>
            ${item.fotos && item.fotos.length > 0 ? `<div style="display: flex; gap: 0.5rem; margin: 1rem 0;">${item.fotos.map(f => `<img src="${f}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;">`).join('')}</div>` : ''}
            <div class="solicitud-acciones">
                ${item.estado !== 'aprobado' && item.estado !== 'aprobada' ? `<button class="btn-aprobar" onclick="aprobarTestimonio('${item.id}', '${coleccion}')">✅ Aprobar</button>` : ''}
                ${item.estado !== 'rechazado' && item.estado !== 'rechazada' ? `<button class="btn-rechazar" onclick="rechazarTestimonio('${item.id}', '${coleccion}')">❌ Rechazar</button>` : ''}
            </div>
        </div>`;
    }).join('');
}

window.filtrarTestimonios = function(filtro, tipo) {
    if (tipo === 'testimonios') filtroTestimoniosActual = filtro;
    else if (tipo === 'experiencias') filtroExperienciasActual = filtro;
    else if (tipo === 'casos') filtroCasosActual = filtro;
    cargarTestimonios();
};
window.filtrarModeraciones = function(filtro) { filtroModeracionesActual = filtro; cargarTestimonios(); };

window.aprobarTestimonio = async function(id, coleccion) {
    try { await updateDoc(doc(db, coleccion, id), { estado: 'aprobado', fechaAprobacion: new Date().toISOString() }); alert('✅ Aprobado y publicado'); cargarTestimonios(); cargarResenas(); }
    catch (error) { alert('❌ Error: ' + error.message); }
};
window.rechazarTestimonio = async function(id, coleccion) {
    const motivo = prompt('Motivo del rechazo (opcional):');
    try { await updateDoc(doc(db, coleccion, id), { estado: 'rechazado', motivoRechazo: motivo || '', fechaRechazo: new Date().toISOString() }); alert('✅ Rechazado'); cargarTestimonios(); cargarResenas(); }
    catch (error) { alert('❌ Error: ' + error.message); }
};
window.aprobarCasoExito = async function(id) {
    try { await updateDoc(doc(db, "casos_exito", id), { estado: 'aprobado', publicado: true, fechaAprobacion: new Date().toISOString() }); alert('✅ Caso de éxito aprobado y publicado'); cargarTestimonios(); }
    catch (error) { alert('❌ Error: ' + error.message); }
};
window.aprobarModeracion = async function(id) {
    try { await updateDoc(doc(db, "moderaciones_pendientes", id), { estado: 'aprobada', fechaRespuesta: new Date().toISOString() }); alert('✅ Solicitud aprobada'); cargarTestimonios(); cargarCambios(); }
    catch (error) { alert('❌ Error: ' + error.message); }
};
window.rechazarModeracion = async function(id) {
    const motivo = prompt('Motivo del rechazo:');
    try { await updateDoc(doc(db, "moderaciones_pendientes", id), { estado: 'rechazada', motivoRechazo: motivo || '', fechaRespuesta: new Date().toISOString() }); alert('✅ Solicitud rechazada'); cargarTestimonios(); cargarCambios(); }
    catch (error) { alert('❌ Error: ' + error.message); }
};

// ==========================================
// FINANZAS
// ==========================================
async function cargarFinanzas() {
    try {
        const snap = await getDocs(collection(db, "transacciones"));
        let transacciones = [];
        snap.forEach(doc => transacciones.push({ id: doc.id, ...doc.data() }));

        const now = new Date();
        let ingresos = 0, gastos = 0, pendientes = 0;
        transacciones.forEach(t => {
            const f = t.fecha ? new Date(t.fecha) : null;
            let inRange = true;
            if (filtroFinanzaActual === 'mes') inRange = f && f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear();
            else if (filtroFinanzaActual === 'semestre') inRange = f && f > new Date(now.getFullYear(), now.getMonth() - 6, 1);
            else if (filtroFinanzaActual === 'ano') inRange = f && f.getFullYear() === now.getFullYear();
            if (inRange) {
                if (t.tipo === 'ingreso') ingresos += t.monto || 0;
                else if (t.tipo === 'gasto') gastos += t.monto || 0;
            }
            if (t.estado === 'pendiente') pendientes++;
        });

        document.getElementById('finIngresos').textContent = '$' + ingresos.toLocaleString('es-MX');
        document.getElementById('finGastos').textContent = '$' + gastos.toLocaleString('es-MX');
        document.getElementById('finBalance').textContent = '$' + (ingresos - gastos).toLocaleString('es-MX');
        document.getElementById('finPendientes').textContent = pendientes;

        renderizarTransacciones(transacciones);
    } catch (error) { console.error("Error cargando finanzas:", error); }
}

function renderizarTransacciones(transacciones) {
    const contenedor = document.getElementById('listaTransacciones');
    if (!contenedor) return;
    let filtradas = transacciones;
    if (filtroTransaccionActual !== 'todas') filtradas = filtradas.filter(t => t.tipo === filtroTransaccionActual);
    filtradas.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
    if (filtradas.length === 0) { contenedor.innerHTML = '<div class="empty-state">📭 No hay transacciones.</div>'; return; }
    contenedor.innerHTML = filtradas.map(t => {
        const tipoColor = t.tipo === 'ingreso' ? '#4CAF50' : '#FF4444';
        const fecha = t.fecha ? new Date(t.fecha).toLocaleDateString('es-MX') : '';
        return `<div class="item-row" style="border-left-color: ${tipoColor};">
            <div class="item-icon">${t.tipo === 'ingreso' ? '💰' : '💸'}</div>
            <div class="item-info">
                <div class="item-title">${t.categoria || 'Sin categoría'} - $${(t.monto || 0).toLocaleString('es-MX')}</div>
                <div class="item-subtitle">${t.descripcion || ''} • ${fecha}</div>
            </div>
        </div>`;
    }).join('');
}

window.filtrarFinanzas = function(filtro) { filtroFinanzaActual = filtro; cargarFinanzas(); };
window.filtrarTransacciones = function(filtro) { filtroTransaccionActual = filtro; cargarFinanzas(); };

window.guardarMetodoPago = async function() {
    try {
        const metodo = document.getElementById('finMetodoPago').value;
        await setDoc(doc(db, "configuracion", "metodo_pago"), { metodo, actualizado: new Date().toISOString() });
        const alertEl = document.getElementById('finanzasAlert');
        alertEl.className = 'alert success'; alertEl.textContent = '✅ Método de pago guardado.';
        setTimeout(() => { alertEl.style.display = 'none'; }, 4000);
    } catch (error) { alert('❌ Error: ' + error.message); }
};

window.registrarTransaccion = async function() {
    try {
        const tipo = document.getElementById('finTipo').value;
        const categoria = document.getElementById('finCategoria').value;
        const monto = parseFloat(document.getElementById('finMonto').value);
        const descripcion = document.getElementById('finDescripcion').value.trim();
        if (!monto || monto <= 0) { alert('El monto debe ser mayor a 0'); return; }
        await addDoc(collection(db, "transacciones"), {
            tipo, categoria, monto, descripcion,
            fecha: new Date().toISOString(),
            estado: 'completada',
            creado: new Date().toISOString()
        });
        alert('✅ Transacción registrada.');
        document.getElementById('finMonto').value = '';
        document.getElementById('finDescripcion').value = '';
        cargarFinanzas();
    } catch (error) { alert('❌ Error: ' + error.message); }
};

// ==========================================
// BLOG
// ==========================================
async function cargarBlog() {
    const contenedor = document.getElementById('listaBlog');
    if (!contenedor) return;
    try {
        const snap = await getDocs(collection(db, "posts"));
        const posts = [];
        snap.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));
        posts.sort((a, b) => new Date(b.fechaPublicacion || 0) - new Date(a.fechaPublicacion || 0));
        if (posts.length === 0) { contenedor.innerHTML = '<div class="empty-state">📭 No hay publicaciones.</div>'; return; }
        contenedor.innerHTML = posts.map(p => {
            const fecha = p.fechaPublicacion ? new Date(p.fechaPublicacion).toLocaleDateString('es-MX') : '';
            return `<div class="item-row"><div class="item-icon">📝</div><div class="item-info"><div class="item-title">${p.titulo || 'Sin título'}</div><div class="item-subtitle">${p.categoria || 'General'} • ${p.autor || ''} • ${fecha}</div></div><div class="item-actions"><button class="btn btn-danger btn-small" onclick="eliminarPost('${p.id}')">🗑️ Eliminar</button></div></div>`;
        }).join('');
    } catch (error) { contenedor.innerHTML = '<div class="empty-state">❌ Error al cargar</div>'; }
}

window.eliminarPost = async function(id) {
    if (!confirm('¿Eliminar este post?')) return;
    try { await deleteDoc(doc(db, "posts", id)); cargarBlog(); }
    catch (error) { alert('❌ Error: ' + error.message); }
};

// ==========================================
// MODALES
// ==========================================
window.abrirModalPost = () => document.getElementById('modalPost').style.display = 'flex';
window.cerrarModalPost = () => document.getElementById('modalPost').style.display = 'none';
window.abrirModalColaborador = () => document.getElementById('modalColaborador').style.display = 'flex';
window.cerrarModalColaborador = () => document.getElementById('modalColaborador').style.display = 'none';

window.guardarPost = async function() {
    const titulo = document.getElementById('postTitulo').value;
    if (!titulo) { alert('El título es obligatorio'); return; }
    try {
        await addDoc(collection(db, "posts"), {
            titulo, autor: document.getElementById('postAutor').value,
            categoria: document.getElementById('postCategoria').value,
            resumen: document.getElementById('postResumen').value,
            contenido: document.getElementById('postContenido').value,
            fechaPublicacion: new Date().toISOString()
        });
        alert('✅ Post guardado'); cerrarModalPost(); cargarBlog();
    } catch (error) { alert('❌ Error: ' + error.message); }
};

window.guardarColaborador = async function() {
    const nombre = document.getElementById('colabNombre').value;
    if (!nombre) { alert('El nombre es obligatorio'); return; }
    try {
        await addDoc(collection(db, "colaboradores"), {
            nombre, puesto: document.getElementById('colabPuesto').value,
            email: document.getElementById('colabEmail').value,
            telefono: document.getElementById('colabTelefono').value,
            estado: document.getElementById('colabEstado').value,
            nivel: document.getElementById('colabNivel').value,
            fechaRegistro: new Date().toISOString()
        });
        alert('✅ Colaborador guardado'); cerrarModalColaborador();
    } catch (error) { alert('❌ Error: ' + error.message); }
};

window.cerrarModalInfo = function() {
    document.getElementById('modalInfoAdicional').classList.remove('active');
    document.getElementById('infoSolicitud').value = '';
    document.getElementById('infoFechaLimite').value = '';
};
window.enviarSolicitudInfo = async function() {
    const info = document.getElementById('infoSolicitud').value.trim();
    if (!info) { alert('Por favor describe la información que necesitas'); return; }
    try {
        await updateDoc(doc(db, "proveedores", solicitudIdActual), {
            solicitudInfoAdicional: info,
            fechaSolicitudInfo: new Date().toISOString(),
            fechaLimiteInfo: document.getElementById('infoFechaLimite').value || null,
            estadoInfoAdicional: 'Pendiente'
        });
        alert('✅ Solicitud enviada.');
        window.cerrarModalInfo();
    } catch (error) { alert('❌ Error: ' + error.message); }
};

window.cerrarModalMensaje = function() {
    document.getElementById('modalMensaje').classList.remove('active');
    document.getElementById('mensajeAsunto').value = '';
    document.getElementById('mensajeContenido').value = '';
    document.getElementById('mensajeCopia').value = '';
};
window.enviarMensaje = async function() {
    const asunto = document.getElementById('mensajeAsunto').value.trim();
    const contenido = document.getElementById('mensajeContenido').value.trim();
    if (!asunto || !contenido) { alert('Completa el asunto y el mensaje'); return; }
    try {
        await addDoc(collection(db, "mensajes"), {
            para: document.getElementById('mensajeProveedorEmail').value,
            asunto, contenido,
            copia: document.getElementById('mensajeCopia').value.trim() || null,
            fechaEnvio: new Date().toISOString(), leido: false, tipo: 'administrativo'
        });
        alert('✅ Mensaje enviado.'); window.cerrarModalMensaje();
    } catch (error) { alert('❌ Error: ' + error.message); }
};

// Cargar perfil admin al entrar a la pestaña de perfil
cargarPerfilAdmin();
