import { addDoc, collection, db, storage, storageRef, uploadBytes, getDownloadURL, getDocs, query, where } from "../firebase-config.js";

        let currentStep = 1;
        let formData = { estado: '', ciudad: '', categoria: '', plan: 'basic', otrosConcepto: '' };
        let uploadedFiles = { ine: [], fotos: [], csf: [] };

        // Navigation
        window.nextStep = function(step) {
            if (!validateStep(step)) return;
            document.querySelector(`.form-step[data-step="${step}"]`).classList.remove('active');
            document.querySelector(`.form-step[data-step="${step + 1}"]`).classList.add('active');
            document.querySelectorAll('.step')[step-1].classList.remove('active');
            document.querySelectorAll('.step')[step-1].classList.add('completed');
            document.querySelectorAll('.step')[step].classList.add('active');
            currentStep = step + 1;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        window.prevStep = function(step) {
            document.querySelector(`.form-step[data-step="${step}"]`).classList.remove('active');
            document.querySelector(`.form-step[data-step="${step - 1}"]`).classList.add('active');
            document.querySelectorAll('.step')[step].classList.remove('active');
            document.querySelectorAll('.step')[step-1].classList.remove('completed');
            document.querySelectorAll('.step')[step-1].classList.add('active');
            currentStep = step - 1;
        };

        function validateStep(step) {
            const currentForm = document.querySelector(`.form-step[data-step="${step}"]`);
            const requiredFields = currentForm.querySelectorAll('[required]');
            for (let field of requiredFields) {
                if (!field.value || !field.value.trim()) {
                    alert('Por favor completa todos los campos obligatorios');
                    field.style.borderColor = 'red';
                    setTimeout(() => field.style.borderColor = '', 2000);
                    return false;
                }
            }
            if (step === 2 && formData.categoria === 'Otros' && !document.getElementById('otrosConceptoTexto').value.trim()) {
                alert('Por favor describe el concepto de tu servicio');
                return false;
            }
            return true;
        }

        // Category selection
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', function() {
                document.querySelectorAll('.category-item').forEach(i => i.classList.remove('selected'));
                this.classList.add('selected');
                formData.categoria = this.getAttribute('data-categoria');
                document.getElementById('selectCategoria').value = formData.categoria;

                const otrosConceptoDiv = document.getElementById('otrosConcepto');
                if (formData.categoria === 'Otros') {
                    otrosConceptoDiv.style.display = 'block';
                } else {
                    otrosConceptoDiv.style.display = 'none';
                    document.getElementById('otrosConceptoTexto').value = '';
                    formData.otrosConcepto = '';
                }
            });
        });

        // Track otros concepto
        document.getElementById('otrosConceptoTexto').addEventListener('input', (e) => {
            formData.otrosConcepto = e.target.value;
        });

        // Plan selection with requirements
        const planRequirements = {
            basic: {
                title: 'Plan Básico - Documentación Requerida',
                items: ['Identificación Oficial (INE/IFE)', 'Fotos de evidencia de tu servicio']
            },
            pro: {
                title: 'Plan Pro - Documentación Requerida',
                items: ['Identificación Oficial (INE/IFE)', 'Fotos de evidencia de tu servicio', 'Constancia de Situación Fiscal']
            },
            gold: {
                title: 'Plan Gold - Documentación y Verificación Requerida',
                items: ['Identificación Oficial (INE/IFE)', 'Fotos de evidencia de tu servicio', 'Constancia de Situación Fiscal', 'Reunión presencial para verificación de datos y validación de eventos']
            }
        };

        window.selectPlan = function(plan) {
            formData.plan = plan;
            document.getElementById('selectPlan').value = plan;
            ['basic', 'pro', 'gold'].forEach(p => document.getElementById(`plan-${p}`).classList.remove('selected'));
            document.getElementById(`plan-${plan}`).classList.add('selected');

            const reqDiv = document.getElementById('planRequirements');
            const reqList = document.getElementById('planReqList');
            const reqTitle = document.getElementById('planReqTitle');

            reqTitle.textContent = planRequirements[plan].title;
            reqList.innerHTML = planRequirements[plan].items.map(item => `<li>${item}</li>`).join('');
            reqDiv.classList.add('visible');

            updateUploadRequirements(plan);
        };

        function updateUploadRequirements(plan) {
            const grpCSF = document.getElementById('grpCSF');
            const grpCalendar = document.getElementById('grpCalendar');

            if (plan === 'pro' || plan === 'gold') {
                grpCSF.style.display = 'block';
                grpCSF.querySelector('input').required = true;
            } else {
                grpCSF.style.display = 'none';
                grpCSF.querySelector('input').required = false;
            }

            if (plan === 'gold') {
                grpCalendar.classList.add('visible');
                document.getElementById('fechaReunion').required = true;
            } else {
                grpCalendar.classList.remove('visible');
                document.getElementById('fechaReunion').required = false;
            }
        }

        // File upload handling
        function setupFileInput(inputId, listId, category) {
            const input = document.getElementById(inputId);
            const list = document.getElementById(listId);

            input.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files);
                for (let file of files) {
                    file._category = category;
                    uploadedFiles[category].push(file);
                    renderThumbnail(file, list, category);
                }
                const uploadArea = input.closest('.upload-area');
                if (uploadedFiles[category].length > 0) uploadArea.classList.add('uploaded');
            });
        }

        function renderThumbnail(file, list, category) {
            const thumb = document.createElement('div');
            thumb.className = file.type.startsWith('image/') ? 'upload-thumb' : 'upload-thumb-pdf';
            thumb.dataset.fileName = file.name;

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                thumb.appendChild(img);
            } else {
                thumb.textContent = '📄';
            }

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.textContent = '×';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                uploadedFiles[category] = uploadedFiles[category].filter(f => f.name !== file.name);
                thumb.remove();
                if (uploadedFiles[category].length === 0) {
                    document.querySelector(`#list-${category}`).closest('.form-group').querySelector('.upload-area').classList.remove('uploaded');
                }
            };
            thumb.appendChild(removeBtn);
            list.appendChild(thumb);
        }

        setupFileInput('file-ine', 'list-ine', 'ine');
        setupFileInput('file-fotos', 'list-fotos', 'fotos');
        setupFileInput('file-csf', 'list-csf', 'csf');

        // Upload a single file to Firebase Storage
        async function uploadFile(file, proveedorId, docType) {
            const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const path = `proveedores/${proveedorId}/${docType}/${Date.now()}_${safeName}`;
            const ref = storageRef(storage, path);
            await uploadBytes(ref, file);
            return await getDownloadURL(ref);
        }

        // Form submit
        document.getElementById('registroProveedor').addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('btnEnviarRegistro');
            btn.disabled = true;
            btn.textContent = 'Subiendo documentos...';

            try {
                const tempId = 'tmp_' + Date.now();
                let documentos = {};

                // Upload INE
                if (uploadedFiles.ine.length > 0) {
                    btn.textContent = 'Subiendo identificación...';
                    const urls = [];
                    for (let file of uploadedFiles.ine) {
                        const url = await uploadFile(file, tempId, 'ine');
                        urls.push(url);
                    }
                    documentos.ine = urls;
                }

                // Upload Fotos
                if (uploadedFiles.fotos.length > 0) {
                    btn.textContent = 'Subiendo fotos de evidencia...';
                    const urls = [];
                    for (let file of uploadedFiles.fotos) {
                        const url = await uploadFile(file, tempId, 'fotos');
                        urls.push(url);
                    }
                    documentos.fotosEvidencia = urls;
                }

                // Upload CSF (Pro/Gold)
                if ((formData.plan === 'pro' || formData.plan === 'gold') && uploadedFiles.csf.length > 0) {
                    btn.textContent = 'Subiendo constancia fiscal...';
                    const urls = [];
                    for (let file of uploadedFiles.csf) {
                        const url = await uploadFile(file, tempId, 'csf');
                        urls.push(url);
                    }
                    documentos.constanciaFiscal = urls;
                }

                btn.textContent = 'Guardando registro...';

                const proveedorData = {
                    nombreNegocio: document.getElementById('nombreNegocio').value,
                    nombreContacto: document.getElementById('nombreContacto').value,
                    whatsapp: document.getElementById('whatsapp').value.replace(/\D/g, ''),
                    email: document.getElementById('email').value,
                    estado: document.getElementById('selectEstado').value,
                    ciudad: document.getElementById('selectCiudad').value,
                    categoria: formData.categoria || 'General',
                    otrosConcepto: formData.otrosConcepto || '',
                    plan: formData.plan || 'basic',
                    descripcion: document.getElementById('descripcion').value || '',
                    documentos: documentos,
                    fechaRegistro: new Date().toISOString(),
                    estadoVerificacion: 'Pendiente',
                    fechaSolicitud: new Date().toISOString(),
                    vistas: 0,
                    calificacion: 0,
                    reseñas: []
                };

                if (formData.plan === 'gold') {
                    proveedorData.fechaReunionPresencial = document.getElementById('fechaReunion').value;
                }

                const docRef = await addDoc(collection(db, "proveedores"), proveedorData);

                // Show success modal
                const summary = document.getElementById('successSummary');
                summary.innerHTML = `
                    <p><strong>Negocio:</strong> ${proveedorData.nombreNegocio}</p>
                    <p><strong>Contacto:</strong> ${proveedorData.nombreContacto}</p>
                    <p><strong>Plan:</strong> ${proveedorData.plan.toUpperCase()}</p>
                    <p><strong>Estado:</strong> ${proveedorData.estado}</p>
                    <p><strong>Servicio:</strong> ${proveedorData.categoria}${proveedorData.otrosConcepto ? ' - ' + proveedorData.otrosConcepto : ''}</p>
                    ${proveedorData.fechaReunionPresencial ? `<p><strong>Reunión:</strong> ${new Date(proveedorData.fechaReunionPresencial).toLocaleString('es-MX')}</p>` : ''}
                    <p><strong>Documentos:</strong> ${Object.keys(documentos).length} categoría(s) subida(s)</p>
                `;
                document.getElementById('successModal').classList.add('open');

            } catch (error) {
                console.error("Error al registrar: ", error);
                alert('❌ Error al guardar. Intenta de nuevo.');
                btn.disabled = false;
                btn.textContent = '✅ Enviar Registro';
            }
        });

        // Load states from Firestore (fallback to hardcoded if collection is empty)
        async function cargarEstados() {
            const select = document.getElementById('selectEstado');
            try {
                const snap = await getDocs(collection(db, "estados"));
                if (!snap.empty) {
                    const estados = [];
                    snap.forEach(d => estados.push(d.data().nombre));
                    estados.sort();
                    select.innerHTML = '<option value="">Selecciona tu estado</option>' +
                        estados.map(e => `<option value="${e}">${e}</option>`).join('');
                } else {
                    select.innerHTML = '<option value="">Selecciona tu estado</option>' +
                        ['Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas','Chihuahua','Ciudad de México','Coahuila','Colima','Durango','Estado de México','Guanajuato','Guerrero','Hidalgo','Jalisco','Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas']
                        .map(e => `<option value="${e}">${e}</option>`).join('');
                }
            } catch (e) {
                select.innerHTML = '<option value="">Selecciona tu estado</option>' +
                    ['Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas','Chihuahua','Ciudad de México','Coahuila','Colima','Durango','Estado de México','Guanajuato','Guerrero','Hidalgo','Jalisco','Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas']
                        .map(e => `<option value="${e}">${e}</option>`).join('');
            }
        }

        // Load cities from Firestore filtered by selected state
        async function cargarCiudades(estado) {
            const select = document.getElementById('selectCiudad');
            select.innerHTML = '<option value="">Selecciona tu ciudad</option>';
            if (!estado) return;
            try {
                const q = query(collection(db, "ciudades"), where("estado", "==", estado));
                const snap = await getDocs(q);
                const ciudades = [];
                snap.forEach(d => ciudades.push(d.data().nombre));
                ciudades.sort();
                select.innerHTML = '<option value="">Selecciona tu ciudad</option>' +
                    ciudades.map(c => `<option value="${c}">${c}</option>`).join('') +
                    '<option value="Otro">Otro</option>';
            } catch (e) {
                select.innerHTML = '<option value="">Selecciona tu ciudad</option><option value="Otro">Otro</option>';
            }
        }

        document.getElementById('selectEstado').addEventListener('change', (e) => {
            formData.estado = e.target.value;
            cargarCiudades(e.target.value);
        });

        cargarEstados();
        selectPlan('basic');
