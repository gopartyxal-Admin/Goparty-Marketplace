import { addDoc, auth, collection, db, deleteDoc, doc, getDoc, getDocs, onAuthStateChanged, provider, query, sendPasswordResetEmail, serverTimestamp, setDoc, signInWithEmailAndPassword, signInWithPopup, signOut, updateDoc, where } from "../firebase-config.js";

        let proveedorActual = null;
        let variedadesTemporales = [];

        // --- AUTH ---
        async function loginWithGoogle() {
            try {
                const result = await signInWithPopup(auth, provider);
                await verificarYRedirigir(result.user.email);
            } catch (error) {
                console.error("Error Google:", error);
                alert("Error al iniciar sesión con Google: " + error.message);
            }
        }

        document.getElementById('formLogin').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            try {
                await signInWithEmailAndPassword(auth, email, password);
                await verificarYRedirigir(email);
            } catch (error) {
                alert("Error de acceso: " + error.message);
            }
        });

        // FUNCIÓN MEJORADA CON DEBUGGING
        async function verificarYRedirigir(email) {
            try {
                console.log("=== INICIO VERIFICACIÓN ===");
                console.log("Email a verificar:", email);
                
                const q = query(collection(db, "proveedores"), where("email", "==", email));
                const snapshot = await getDocs(q);
                
                console.log("Documentos encontrados:", snapshot.size);
                
                if (snapshot.empty) {
                    console.error(" No se encontró proveedor con email:", email);
                    console.log("Creando registro pendiente...");
                    const user = auth.currentUser;
                    await setDoc(doc(db, "proveedores", user.uid), {
                        email: user.email,
                        nombreNegocio: "Pendiente",
                        estadoVerificacion: "Pendiente",
                        plan: "basic",
                        fechaRegistro: serverTimestamp()
                    });
                    mostrarVista('restringido');
                    return;
                }
                
                const docData = snapshot.docs[0];
                proveedorActual = { id: docData.id, ...docData.data() };
                window.proveedorActual = proveedorActual;
                
                console.log("✅ Proveedor encontrado:");
                console.log("ID:", proveedorActual.id);
                console.log("Estado de verificación:", proveedorActual.estadoVerificacion || proveedorActual.estado);
                console.log("Nombre:", proveedorActual.nombreNegocio);
                console.log("Todos los datos:", proveedorActual);
                
                // Verificación flexible (acepta variaciones de estado)
                const estadoLower = (proveedorActual.estadoVerificacion || proveedorActual.estado || '').toString().toLowerCase().trim();
                
                console.log("Estado normalizado:", estadoLower);
                
                if (estadoLower === 'pendiente' || estadoLower === 'pending') {
                    console.log("➡️ Estado PENDIENTE - Redirigiendo a vista restringida");
                    mostrarVista('restringido');
                } else if (estadoLower === 'aprobado' || estadoLower === 'activo' || estadoLower === 'active' || estadoLower === 'verificado' || estadoLower === 'verified') {
                    console.log("➡️ Estado APROBADO/ACTIVO - Redirigiendo a dashboard");
                    mostrarVista('dashboard');
                    await iniciarDashboard();
                } else if (estadoLower === 'rechazado' || estadoLower === 'rejected') {
                    console.log("➡️ Estado RECHAZADO - Redirigiendo a vista restringida");
                    alert("Tu solicitud ha sido rechazada. Contacta a soporte para más información.");
                    mostrarVista('restringido');
                } else {
                    console.log("⚠️ Estado DESCONOCIDO:", estadoLower);
                    console.log("Redirigiendo a vista restringida por seguridad");
                    mostrarVista('restringido');
                }
                
                console.log("=== FIN VERIFICACIÓN ===");
            } catch (error) {
                console.error("❌ Error en verificarYRedirigir:", error);
                alert("Error de verificación: " + error.message);
            }
        }

        function cerrarSesion() {
            signOut(auth).then(() => {
                proveedorActual = null;
                window.proveedorActual = null;
                mostrarVista('login');
            });
        }

        async function recuperarContrasena(e) {
            e.preventDefault();
            const email = document.getElementById('recuperarEmail').value;
            try {
                await sendPasswordResetEmail(auth, email);
                alert("Enlace de recuperación enviado a tu correo.");
                mostrarVista('login');
            } catch (error) {
                alert("Error: " + error.message);
            }
        }

        // --- UI NAVIGATION ---
        function mostrarVista(vista) {
            ['vistaLogin', 'vistaRecuperar', 'vistaRestringido', 'vistaDashboard'].forEach(id => {
                document.getElementById(id).classList.add('hidden');
            });
            document.getElementById('vista' + vista.charAt(0).toUpperCase() + vista.slice(1)).classList.remove('hidden');
        }

        function toggleDashboardMenu() {
            const menu = document.getElementById('dashboardNav');
            const button = document.getElementById('dashboardMenuToggle');
            const isOpen = menu.classList.toggle('hidden') === false;
            button.setAttribute('aria-expanded', String(isOpen));
        }

        function mostrarSeccion(seccionId) {
            document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));
            document.getElementById('dashboardNav').classList.add('hidden');
            document.getElementById('dashboardMenuToggle').setAttribute('aria-expanded', 'false');
            document.getElementById(seccionId).classList.remove('hidden');
            
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('border-purple-600', 'text-purple-600', 'bg-purple-50');
                btn.classList.add('border-transparent', 'text-gray-700');
            });
            const activeBtn = document.querySelector(`[data-tab="${seccionId}"]`);
            if (activeBtn) {
                activeBtn.classList.remove('border-transparent', 'text-gray-700');
                activeBtn.classList.add('border-purple-600', 'text-purple-600', 'bg-purple-50');
            }
        }

        function mostrarSubSeccion(subsecId) {
            ['subsec-reseñas', 'subsec-experiencia', 'subsec-casos'].forEach(id => {
                document.getElementById(id).classList.add('hidden');
            });
            document.getElementById(subsecId).classList.remove('hidden');

            document.querySelectorAll('.subtab-btn').forEach(btn => {
                btn.classList.remove('text-purple-600', 'border-b-2', 'border-purple-600');
                btn.classList.add('text-gray-500');
            });
            const activeBtn = document.querySelector(`[data-subtab="${subsecId}"]`);
            if (activeBtn) {
                activeBtn.classList.remove('text-gray-500');
                activeBtn.classList.add('text-purple-600', 'border-b-2', 'border-purple-600');
            }
        }

        // --- DASHBOARD INIT ---
        async function iniciarDashboard() {
            if (!proveedorActual) return;
            
            document.getElementById('headerNombreProveedor').textContent = proveedorActual.nombreNegocio || 'Proveedor';
            document.getElementById('infoNombre').textContent = proveedorActual.nombreNegocio || 'Cargando...';
            document.getElementById('infoPlan').textContent = (proveedorActual.plan || 'basic').toUpperCase();
            document.getElementById('infoEstado').textContent = proveedorActual.estadoVerificacion || proveedorActual.estado || 'Pendiente';
            document.getElementById('statVistas').textContent = proveedorActual.vistas || 0;
            
            // Cargar datos en formularios
            document.getElementById('perfilNombreNegocio').value = proveedorActual.nombreNegocio || '';
            document.getElementById('perfilNombreContacto').value = proveedorActual.nombreContacto || '';
            document.getElementById('perfilEmail').value = proveedorActual.email || '';
            document.getElementById('perfilWhatsApp').value = proveedorActual.whatsapp || '';
            document.getElementById('perfilEstado').value = proveedorActual.estadoVerificacion || proveedorActual.estado || ''; 
            document.getElementById('perfilCiudad').value = proveedorActual.ciudad || '';
            document.getElementById('perfilDescripcion').value = proveedorActual.descripcion || '';

            if (proveedorActual.datosFiscales) {
                const df = proveedorActual.datosFiscales;
                document.getElementById('fiscalRequiereFactura').value = df.requiereFactura || 'no';
                document.getElementById('fiscalRFC').value = df.rfc || '';
                document.getElementById('fiscalRazonSocial').value = df.razonSocial || '';
                document.getElementById('fiscalRegimen').value = df.regimen || '';
                document.getElementById('fiscalUsoCFDI').value = df.usoCFDI || '';
                document.getElementById('fiscalCP').value = df.cp || '';
                document.getElementById('fiscalDireccion').value = df.direccion || '';
            }

            if (proveedorActual.redes) {
                document.getElementById('redInstagram').value = proveedorActual.redes.instagram || '';
                document.getElementById('redFacebook').value = proveedorActual.redes.facebook || '';
                document.getElementById('redTikTok').value = proveedorActual.redes.tiktok || '';
                document.getElementById('redWeb').value = proveedorActual.redes.web || '';
            }

            await Promise.all([
                cargarCotizaciones(),
                cargarServicios(),
                cargarTestimoniosAprobados(),
                cargarMisExperiencias(),
                cargarMisCasosExito()
            ]);
        }

        // --- PERFIL ---
        document.getElementById('formPerfilGeneral').addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateDoc(doc(db, "proveedores", proveedorActual.id), {
                nombreNegocio: document.getElementById('perfilNombreNegocio').value,
                nombreContacto: document.getElementById('perfilNombreContacto').value,
                email: document.getElementById('perfilEmail').value,
                whatsapp: document.getElementById('perfilWhatsApp').value,
                ciudad: document.getElementById('perfilCiudad').value,
                descripcion: document.getElementById('perfilDescripcion').value,
                fechaActualizacion: serverTimestamp()
            });
            alert("Perfil actualizado correctamente.");
            iniciarDashboard();
        });

        document.getElementById('formDatosFiscales').addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateDoc(doc(db, "proveedores", proveedorActual.id), {
                datosFiscales: {
                    requiereFactura: document.getElementById('fiscalRequiereFactura').value,
                    rfc: document.getElementById('fiscalRFC').value.toUpperCase(),
                    razonSocial: document.getElementById('fiscalRazonSocial').value,
                    regimen: document.getElementById('fiscalRegimen').value,
                    usoCFDI: document.getElementById('fiscalUsoCFDI').value,
                    cp: document.getElementById('fiscalCP').value,
                    direccion: document.getElementById('fiscalDireccion').value
                }
            });
            alert("Datos fiscales guardados.");
        });

        document.getElementById('formRedesSociales').addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateDoc(doc(db, "proveedores", proveedorActual.id), {
                redes: {
                    instagram: document.getElementById('redInstagram').value,
                    facebook: document.getElementById('redFacebook').value,
                    tiktok: document.getElementById('redTikTok').value,
                    web: document.getElementById('redWeb').value
                }
            });
            alert("Redes sociales guardadas.");
        });

        // --- SERVICIOS ---
        async function cargarServicios() {
            const q = query(collection(db, "proveedores", proveedorActual.id, "servicios"));
            const snapshot = await getDocs(q);
            const contenedor = document.getElementById('listaServicios');
            document.getElementById('statServicios').textContent = snapshot.size;
            document.getElementById('badgeServicios').textContent = snapshot.size;

            if (snapshot.empty) {
                contenedor.innerHTML = '<p class="text-gray-500 col-span-2 text-center py-8">Aún no tienes servicios registrados. ¡Agrega tu primero!</p>';
                return;
            }

            let html = '';
            snapshot.forEach(docSnap => {
                const s = docSnap.data();
                html += `
                    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-start">
                        <div>
                            <h4 class="font-bold text-gray-800">${s.nombre}</h4>
                            <p class="text-sm text-purple-600 font-medium">${s.categoria}</p>
                            <p class="text-xs text-gray-500 mt-1 line-clamp-2">${s.descripcion}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="window.editarServicio('${docSnap.id}')" class="text-blue-600 hover:text-blue-800 text-sm"><i class="fas fa-edit"></i></button>
                            <button onclick="window.eliminarServicio('${docSnap.id}')" class="text-red-600 hover:text-red-800 text-sm"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
            });
            contenedor.innerHTML = html;
        }

        function abrirModalServicio() {
            document.getElementById('formServicio').reset();
            document.getElementById('servicioId').value = '';
            document.getElementById('tituloModalServicio').textContent = 'Agregar Nuevo Servicio';
            variedadesTemporales = [];
            renderVariedadesTemporales();
            document.getElementById('modalServicio').classList.remove('hidden');
        }

        function cerrarModalServicio() {
            document.getElementById('modalServicio').classList.add('hidden');
        }

        function toggleCategoriaOtro() {
            const cat = document.getElementById('servCategoria').value;
            const container = document.getElementById('categoriaOtroContainer');
            if (cat === 'Otro') {
                container.classList.remove('hidden');
                document.getElementById('servCategoriaOtro').required = true;
            } else {
                container.classList.add('hidden');
                document.getElementById('servCategoriaOtro').required = false;
            }
        }

        function agregarVariedadTemporal() {
            const nombre = document.getElementById('varNombre').value;
            const precio = document.getElementById('varPrecio').value;
            if (!nombre || !precio) return alert("Completa nombre y precio del paquete");
            
            variedadesTemporales.push({ nombre, precio: parseFloat(precio), descripcion: "" });
            document.getElementById('varNombre').value = '';
            document.getElementById('varPrecio').value = '';
            renderVariedadesTemporales();
        }

        function renderVariedadesTemporales() {
            const contenedor = document.getElementById('listaVariedades');
            if (variedadesTemporales.length === 0) {
                contenedor.innerHTML = '<p class="text-xs text-gray-500">Aún no hay paquetes agregados.</p>';
                return;
            }
            contenedor.innerHTML = variedadesTemporales.map((v, i) => `
                <div class="flex justify-between items-center bg-purple-50 p-2 rounded text-sm">
                    <span class="font-medium">${v.nombre} - $${v.precio}</span>
                    <button type="button" onclick="window.eliminarVariedadTemporal(${i})" class="text-red-500 hover:text-red-700">&times;</button>
                </div>
            `).join('');
            document.getElementById('servVariedadesJSON').value = JSON.stringify(variedadesTemporales);
        }

        function eliminarVariedadTemporal(index) {
            variedadesTemporales.splice(index, 1);
            renderVariedadesTemporales();
        }

        document.getElementById('formServicio').addEventListener('submit', async (e) => {
            e.preventDefault();
            const servicioId = document.getElementById('servicioId').value;
            const categoria = document.getElementById('servCategoria').value;
            
            let categoriaFinal = categoria;
            let requiereRevision = false;
            if (categoria === 'Otro') {
                categoriaFinal = document.getElementById('servCategoriaOtro').value.trim();
                requiereRevision = true;
            }

            const datosServicio = {
                nombre: document.getElementById('servNombre').value,
                categoria: categoriaFinal,
                descripcion: document.getElementById('servDescripcion').value,
                variedades: document.getElementById('servVariedadesJSON').value,
                esMovil: document.getElementById('servEsMovil').value,
                ciudad: document.getElementById('servCiudad').value,
                maps: document.getElementById('servMaps').value,
                requiereRevisionCategoria: requiereRevision,
                fechaActualizacion: serverTimestamp()
            };

            try {
                if (servicioId) {
                    await updateDoc(doc(db, "proveedores", proveedorActual.id, "servicios", servicioId), datosServicio);
                } else {
                    datosServicio.fechaCreacion = serverTimestamp();
                    await addDoc(collection(db, "proveedores", proveedorActual.id, "servicios"), datosServicio);
                }
                cerrarModalServicio();
                cargarServicios();
                alert("Servicio guardado correctamente.");
            } catch (error) {
                console.error("Error al guardar servicio:", error);
                alert("Error al guardar: " + error.message);
            }
        });

        async function editarServicio(id) {
            const docSnap = await getDoc(doc(db, "proveedores", proveedorActual.id, "servicios", id));
            if (!docSnap.exists()) return;
            const s = docSnap.data();
            
            document.getElementById('servicioId').value = id;
            document.getElementById('tituloModalServicio').textContent = 'Editar Servicio';
            document.getElementById('servNombre').value = s.nombre;
            
            const categoriasEstandar = ["Salones", "Alimentos", "Fotografía", "Música/DJ", "Decoración", "Animación", "Mobiliario", "Vestuario", "Transporte", "Otro"];
            if (categoriasEstandar.includes(s.categoria)) {
                document.getElementById('servCategoria').value = s.categoria;
                toggleCategoriaOtro();
            } else {
                document.getElementById('servCategoria').value = 'Otro';
                toggleCategoriaOtro();
                document.getElementById('servCategoriaOtro').value = s.categoria;
            }
            
            document.getElementById('servDescripcion').value = s.descripcion;
            document.getElementById('servEsMovil').value = s.esMovil || 'si';
            document.getElementById('servCiudad').value = s.ciudad || '';
            document.getElementById('servMaps').value = s.maps || '';

            variedadesTemporales = [];
            if (s.variedades) {
                try {
                    variedadesTemporales = typeof s.variedades === 'string' ? JSON.parse(s.variedades) : s.variedades;
                } catch (e) {
                    console.error("Error parseando variedades", e);
                }
            }
            renderVariedadesTemporales();
            
            document.getElementById('modalServicio').classList.remove('hidden');
        }

        async function eliminarServicio(id) {
            if (!confirm("¿Estás seguro de eliminar este servicio?")) return;
            await deleteDoc(doc(db, "proveedores", proveedorActual.id, "servicios", id));
            cargarServicios();
        }

        // --- COTIZACIONES ---
        async function cargarCotizaciones() {
            const q = query(collection(db, "solicitudes"), where("proveedorAsignado", "==", proveedorActual.id));
            const snapshot = await getDocs(q);
            document.getElementById('statCotizaciones').textContent = snapshot.size;
            document.getElementById('badgeCotizaciones').textContent = snapshot.size;
            
            const contenedor = document.getElementById('listaCotizaciones');
            if (snapshot.empty) {
                contenedor.innerHTML = '<p class="text-gray-500 text-center py-8">No tienes cotizaciones pendientes.</p>';
                return;
            }
            
            let html = '';
            snapshot.forEach(docSnap => {
                const c = docSnap.data();
                html += `
                    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-bold text-gray-800">${c.tipoEvento || 'Evento'}</h4>
                            <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">${c.estado || 'Pendiente'}</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-2">Ciudad: ${c.ciudadEvento || 'No especificada'} | Fecha: ${c.fechaEvento || 'No especificada'}</p>
                        <p class="text-sm text-gray-700 bg-gray-50 p-2 rounded mb-3">${c.descripcion || 'Sin descripción'}</p>
                        <div class="flex gap-2">
                            <a href="https://wa.me/${c.telefonoCliente || ''}?text=Hola, soy ${proveedorActual.nombreNegocio} de GoParty y recibí tu solicitud de cotización." target="_blank" class="flex-1 bg-green-500 text-white text-center py-2 rounded-lg text-sm hover:bg-green-600 transition">
                                <i class="fab fa-whatsapp mr-1"></i> Contactar por WhatsApp
                            </a>
                            <button class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-300 transition">Marcar como Atendida</button>
                        </div>
                    </div>
                `;
            });
            contenedor.innerHTML = html;
        }

        // --- TESTIMONIOS (CLIENTES) ---
        async function cargarTestimoniosAprobados() {
            const q = query(collection(db, "testimonios"), where("proveedorId", "==", proveedorActual.id), where("estado", "==", "aprobado"));
            const snapshot = await getDocs(q);
            
            let total = 0;
            let sumaCalificaciones = 0;
            let html = '';

            if (snapshot.empty) {
                html = '<p class="text-gray-500 text-sm">Aún no tienes reseñas aprobadas.</p>';
            } else {
                snapshot.forEach(docSnap => {
                    const t = docSnap.data();
                    total++;
                    sumaCalificaciones += (t.calificacion || 0);
                    
                    let botonAclarar = '';
                    if (t.calificacion <= 3) {
                        botonAclarar = `
                            <button onclick="window.abrirModalAclaracion('${docSnap.id}')" class="mt-2 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded hover:bg-blue-100 transition flex items-center gap-1">
                                <i class="fas fa-comment-dots"></i> Solicitar Aclaración
                            </button>
                        `;
                    }

                    html += `
                        <div class="border-l-4 border-yellow-400 pl-4 py-2 bg-gray-50 rounded-r-lg">
                            <div class="flex justify-between items-start">
                                <div>
                                    <p class="text-yellow-500 text-sm mb-1">${'⭐'.repeat(t.calificacion || 0)}</p>
                                    <p class="text-gray-700 text-sm italic">"${t.comentario || 'Sin comentario'}"</p>
                                    <p class="text-xs text-gray-500 mt-2">- ${t.nombreCliente || 'Cliente anónimo'}</p>
                                </div>
                            </div>
                            ${botonAclarar}
                        </div>
                    `;
                });
            }

            document.getElementById('totalResenas').textContent = total;
            document.getElementById('promedioCalificacion').textContent = total > 0 ? (sumaCalificaciones / total).toFixed(1) + ' ⭐' : '0.0 ⭐';
            document.getElementById('listaResenasAprobadas').innerHTML = html;
        }

        // --- EXPERIENCIA GOPARTY (PROVEEDOR) ---
        document.getElementById('formExperienciaGoParty').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await addDoc(collection(db, "testimonios_proveedores"), {
                    proveedorId: proveedorActual.id,
                    nombreNegocio: proveedorActual.nombreNegocio,
                    tiempo: document.getElementById('expTiempo').value,
                    calificacion: parseInt(document.getElementById('expCalificacion').value),
                    gusta: document.getElementById('expGusta').value,
                    mejoraria: document.getElementById('expMejoraria').value,
                    recomendaria: document.getElementById('expRecomendaria').value,
                    estado: 'pendiente',
                    fecha: serverTimestamp()
                });
                alert("¡Gracias! Tu experiencia ha sido enviada para revisión.");
                document.getElementById('formExperienciaGoParty').reset();
                cargarMisExperiencias();
            } catch (error) {
                alert("Error al enviar: " + error.message);
            }
        });

        document.querySelectorAll('#estrellasExperiencia i').forEach(star => {
            star.addEventListener('click', function() {
                const val = this.getAttribute('data-val');
                document.getElementById('expCalificacion').value = val;
                document.querySelectorAll('#estrellasExperiencia i').forEach((s, index) => {
                    if (index < val) s.classList.add('text-yellow-400');
                    else s.classList.remove('text-yellow-400');
                });
            });
        });

        async function cargarMisExperiencias() {
            const q = query(collection(db, "testimonios_proveedores"), where("proveedorId", "==", proveedorActual.id));
            const snapshot = await getDocs(q);
            const contenedor = document.getElementById('lista-mis-experiencias');
            
            if (snapshot.empty) {
                contenedor.innerHTML = '<p class="text-gray-500 text-sm">Aún no has enviado tu experiencia.</p>';
                return;
            }
            
            let html = '<div class="space-y-3">';
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const estadoClass = data.estado === 'aprobado' ? 'bg-green-100 text-green-800' : (data.estado === 'rechazado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800');
                const fecha = data.fecha?.toDate ? data.fecha.toDate().toLocaleDateString() : 'Reciente';
                
                html += `
                    <div class="bg-gray-50 p-3 rounded border border-gray-200 flex justify-between items-center">
                        <div>
                            <p class="font-semibold text-sm text-gray-800">Calificación: ${data.calificacion || 'N/A'} ⭐</p>
                            <p class="text-xs text-gray-500">${fecha}</p>
                        </div>
                        <span class="px-2 py-1 rounded text-xs font-bold ${estadoClass}">${data.estado || 'Pendiente'}</span>
                    </div>
                `;
            });
            html += '</div>';
            contenedor.innerHTML = html;
        }

        // --- CASOS DE ÉXITO ---
        document.getElementById('formCasoExito').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await addDoc(collection(db, "casos_exito"), {
                    proveedorId: proveedorActual.id,
                    nombreNegocio: proveedorActual.nombreNegocio,
                    titulo: document.getElementById('casoTitulo').value,
                    tipoEvento: document.getElementById('casoTipo').value,
                    ciudad: document.getElementById('casoCiudad').value,
                    historia: document.getElementById('casoHistoria').value,
                    resultado: document.getElementById('casoResultado').value,
                    estado: 'pendiente',
                    publicado: false,
                    fecha: serverTimestamp()
                });
                alert("¡Caso de éxito enviado! El equipo de GoParty lo revisará pronto.");
                document.getElementById('formCasoExito').reset();
                cargarMisCasosExito();
            } catch (error) {
                alert("Error al enviar: " + error.message);
            }
        });

        async function cargarMisCasosExito() {
            const q = query(collection(db, "casos_exito"), where("proveedorId", "==", proveedorActual.id));
            const snapshot = await getDocs(q);
            const contenedor = document.getElementById('lista-mis-casos-exito');
            
            if (snapshot.empty) {
                contenedor.innerHTML = '<p class="text-gray-500 text-sm">Aún no has propuesto casos de éxito.</p>';
                return;
            }
            
            let html = '<div class="space-y-3">';
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const estadoClass = data.estado === 'aprobado' ? 'bg-green-100 text-green-800' : (data.estado === 'rechazado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800');
                const publicadoBadge = data.publicado ? '<span class="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">🌐 Publicado en Index</span>' : '';
                
                html += `
                    <div class="bg-gray-50 p-3 rounded border border-gray-200">
                        <div class="flex justify-between items-start mb-1">
                            <h5 class="font-bold text-sm text-gray-800">${data.titulo}</h5>
                            <span class="px-2 py-1 rounded text-xs font-bold ${estadoClass}">${data.estado || 'Pendiente'}</span>
                        </div>
                        <p class="text-xs text-gray-600 mb-1">${data.tipoEvento} | ${data.ciudad}</p>
                        ${publicadoBadge}
                    </div>
                `;
            });
            html += '</div>';
            contenedor.innerHTML = html;
        }

        // --- MODAL DE ACLARACIÓN ---
        function abrirModalAclaracion(testimonioId) {
            document.getElementById('testimonioAclararId').value = testimonioId;
            document.getElementById('textoAclaracion').value = '';
            document.getElementById('modalAclaracion').classList.remove('hidden');
        }

        function cerrarModalAclaracion() {
            document.getElementById('modalAclaracion').classList.add('hidden');
        }

        async function enviarAclaracion() {
            const testimonioId = document.getElementById('testimonioAclararId').value;
            const texto = document.getElementById('textoAclaracion').value;
            
            if (!texto.trim()) return alert("Por favor escribe una aclaración.");
            
            try {
                await addDoc(collection(db, "moderaciones_pendientes"), {
                    tipo: 'aclaracion_testimonio',
                    testimonioId: testimonioId,
                    proveedorId: proveedorActual.id,
                    nombreNegocio: proveedorActual.nombreNegocio,
                    texto: texto,
                    estado: 'pendiente',
                    fecha: serverTimestamp()
                });
                alert("Aclaración enviada correctamente. El equipo de GoParty la revisará y la vinculará al testimonio si es pertinente.");
                cerrarModalAclaracion();
            } catch (error) {
                console.error("Error al enviar aclaración:", error);
                alert("Error al enviar la aclaración: " + error.message);
            }
        }

        // --- EXPOSICIÓN GLOBAL DE FUNCIONES ---
        window.loginWithGoogle = loginWithGoogle;
        window.cerrarSesion = cerrarSesion;
        window.mostrarVista = mostrarVista;
        window.mostrarSeccion = mostrarSeccion;
        window.toggleDashboardMenu = toggleDashboardMenu;
        window.mostrarSubSeccion = mostrarSubSeccion;
        window.abrirModalServicio = abrirModalServicio;
        window.cerrarModalServicio = cerrarModalServicio;
        window.toggleCategoriaOtro = toggleCategoriaOtro;
        window.agregarVariedadTemporal = agregarVariedadTemporal;
        window.eliminarVariedadTemporal = eliminarVariedadTemporal;
        window.editarServicio = editarServicio;
        window.eliminarServicio = eliminarServicio;
        window.abrirModalAclaracion = abrirModalAclaracion;
        window.cerrarModalAclaracion = cerrarModalAclaracion;
        window.enviarAclaracion = enviarAclaracion;

        // --- INIT AUTH STATE ---
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                await verificarYRedirigir(user.email);
            } else {
                mostrarVista('login');
            }
        });

        document.getElementById('formRecuperar').addEventListener('submit', recuperarContrasena);
        document.getElementById('dashboardMenuToggle').addEventListener('click', toggleDashboardMenu);
