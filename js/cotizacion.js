import { addDoc, collection, db } from "../firebase-config.js";

        // ==========================================
        // MANEJO DE FOTOS (Preview + Base64)
        // ==========================================
        const MAX_FOTOS = 5;
        let fotosArray = [];

        const fileInput = document.getElementById('fileFotos');
        const previewContainer = document.getElementById('previewContainer');

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            const espaciosDisponibles = MAX_FOTOS - fotosArray.length;

            if (espaciosDisponibles <= 0) {
                alert(`Solo puedes subir máximo ${MAX_FOTOS} fotos`);
                return;
            }

            const archivosProcesar = files.slice(0, espaciosDisponibles);

            archivosProcesar.forEach(file => {
                // Validar tipo
                if (!file.type.startsWith('image/')) return;
                // Validar tamaño (2MB máximo por foto)
                if (file.size > 2 * 1024 * 1024) {
                    alert(`La foto "${file.name}" es muy grande (máx 2MB)`);
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    fotosArray.push(event.target.result);
                    renderPreviews();
                };
                reader.readAsDataURL(file);
            });

            // Reset input para permitir subir la misma foto de nuevo si se borró
            fileInput.value = '';
        });

        function renderPreviews() {
            previewContainer.innerHTML = '';
            fotosArray.forEach((foto, index) => {
                const item = document.createElement('div');
                item.className = 'preview-item';
                item.innerHTML = `
                    <img src="${foto}" alt="Referencia ${index + 1}">
                    <button type="button" class="remove-btn" data-index="${index}">×</button>
                `;
                previewContainer.appendChild(item);
            });

            // Eventos para botones de eliminar
            document.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = parseInt(btn.getAttribute('data-index'));
                    fotosArray.splice(idx, 1);
                    renderPreviews();
                });
            });
        }

        // ==========================================
        // ENVÍO DEL FORMULARIO
        // ==========================================
        document.getElementById('formCotizacion').addEventListener('submit', async (e) => {
            e.preventDefault();

            const btnEnviar = document.getElementById('btnEnviar');
            btnEnviar.disabled = true;
            btnEnviar.textContent = '⏳ Enviando solicitud...';

            // Obtener servicios seleccionados
            const serviciosSeleccionados = [];
            document.querySelectorAll('.checkbox-item input[type="checkbox"]:checked').forEach(cb => {
                serviciosSeleccionados.push(cb.value);
            });

            if (serviciosSeleccionados.length === 0) {
                alert('Por favor selecciona al menos un servicio que necesitas');
                btnEnviar.disabled = false;
                btnEnviar.textContent = '📨 Enviar Solicitud de Cotización';
                return;
            }

            const cotizacionData = {
                tipoEvento: document.getElementById('tipoEvento').value,
                tematica: document.getElementById('tematica').value || 'Sin temática específica',
                fechaEvento: document.getElementById('fechaEvento').value,
                numInvitados: parseInt(document.getElementById('numInvitados').value),
                presupuesto: parseInt(document.getElementById('presupuesto').value),
                ciudadEvento: document.getElementById('ciudadEvento').value,
                serviciosRequeridos: serviciosSeleccionados,
                descripcion: document.getElementById('descripcionEvento').value,
                fotosReferencia: fotosArray, // Array de base64 (máx 5)
                nombreCliente: document.getElementById('nombreCliente').value,
                emailCliente: document.getElementById('emailCliente').value,
                telefonoCliente: document.getElementById('telefonoCliente').value,
                fechaSolicitud: new Date().toISOString(),
                estado: 'Pendiente', // Pendiente, En Proceso, Asignada, Completada, Cancelada
                proveedorAsignado: null,
                respuestasProveedor: []
            };

            try {
                await addDoc(collection(db, "solicitudes"), cotizacionData);

                alert('✅ ¡Solicitud enviada con éxito!\n\nEl equipo de GoParty revisará tu solicitud en las próximas 24-48 horas y te contactará con propuestas de proveedores verificados que se ajusten a tu presupuesto.');

                // Resetear formulario
                document.getElementById('formCotizacion').reset();
                fotosArray = [];
                renderPreviews();

                // Scroll arriba
                window.scrollTo({ top: 0, behavior: 'smooth' });

            } catch (error) {
                console.error("Error al enviar solicitud: ", error);
                alert('❌ Error al enviar la solicitud. Por favor intenta de nuevo.');
            } finally {
                btnEnviar.disabled = false;
                btnEnviar.textContent = '📨 Enviar Solicitud de Cotización';
            }
        });
