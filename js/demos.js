document.addEventListener('DOMContentLoaded', () => {
    // IMPORTANTE: Reemplaza con la IP pública de tu instancia EC2
    const EC2_PUBLIC_IP = '44.219.48.92';
    const API_BASE_URL = `http://${EC2_PUBLIC_IP}:8000`;
    const DEVICE_ID = 1; // Asumimos que la app de control maneja el Dispositivo #1

    // --- Elementos del DOM ---
    const demoSelectList = document.getElementById('demo-select-list');
    const executeBtn = document.getElementById('execute-demo-btn');
    const executeStatus = document.getElementById('execute-status');
    const createForm = document.getElementById('create-demo-form');
    const createStatus = document.getElementById('create-status');
    const historyTableBody = document.getElementById('demo-history-table');

    /**
     * Carga la lista de demos disponibles desde la API y las pone en el selector.
     * Endpoint: GET /demos
     */
    async function loadAvailableDemos() {
        try {
            const response = await fetch(`${API_BASE_URL}/demos/`);
            if (!response.ok) throw new Error('No se pudieron cargar las demos.');
            
            const demos = await response.json();
            
            if (demos.length > 0) {
                demoSelectList.innerHTML = demos.map(demo => 
                    `<option value="${demo.id}">${demo.nombre_demo}</option>`
                ).join('');
            } else {
                demoSelectList.innerHTML = '<option disabled>No hay demos creadas</option>';
            }
        } catch (error) {
            console.error('Error cargando demos:', error);
            demoSelectList.innerHTML = `<option disabled>Error al cargar</option>`;
        }
    }

    /**
     * Carga el historial de las últimas demos ejecutadas.
     * Endpoint: GET /demos/executions
     */
    async function loadDemoHistory() {
        try {
            const response = await fetch(`${API_BASE_URL}/demos/executions?limit=20`);
            if (!response.ok) throw new Error('No se pudo cargar el historial.');

            const history = await response.json();

            if (history.length > 0) {
                historyTableBody.innerHTML = history.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.nombre_demo}</td>
                        <td>${item.nombre_dispositivo}</td>
                        <td>${new Date(item.fecha_ejecucion).toLocaleString('es-MX')}</td>
                    </tr>
                `).join('');
            } else {
                historyTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No se ha ejecutado ninguna demo.</td></tr>';
            }
        } catch (error) {
            console.error('Error cargando historial de demos:', error);
            historyTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error al cargar historial.</td></tr>`;
        }
    }

    /**
     * Listener para el botón de ejecutar una demo.
     * Endpoint: POST /demos/execute
     */
    executeBtn.addEventListener('click', async () => {
        const selectedDemoId = demoSelectList.value;
        if (!selectedDemoId) {
            executeStatus.textContent = 'Por favor, selecciona una demo.';
            executeStatus.className = 'mt-3 text-center text-warning';
            return;
        }

        executeStatus.textContent = 'Enviando comando de ejecución...';
        executeStatus.className = 'mt-3 text-center';

        try {
            const response = await fetch(`${API_BASE_URL}/demos/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dispositivo_id: DEVICE_ID,
                    secuencia_id: parseInt(selectedDemoId)
                })
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.detail);

            executeStatus.textContent = `¡Demo '${demoSelectList.options[demoSelectList.selectedIndex].text}' iniciada correctamente!`;
            executeStatus.classList.add('text-success');
            
            // Actualizamos el historial para que se refleje la nueva ejecución
            setTimeout(loadDemoHistory, 1000); 

        } catch (error) {
            executeStatus.textContent = `Error: ${error.message}`;
            executeStatus.classList.add('text-danger');
        }
    });

    /**
     * Listener para el formulario de crear una nueva demo.
     * Endpoint: POST /demos
     */
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        createStatus.textContent = 'Guardando nueva demo...';
        createStatus.className = 'mt-3 text-center';

        const demoData = {
            nombre_demo: document.getElementById('demo-name').value,
            descripcion: document.getElementById('demo-description').value,
            movimientos_csv: document.getElementById('demo-csv').value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/demos/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(demoData)
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.detail);

            createStatus.textContent = '¡Demo guardada exitosamente!';
            createStatus.classList.add('text-success');
            createForm.reset();
            
            // Recargamos la lista de demos para que la nueva aparezca en el selector
            loadAvailableDemos();

        } catch (error) {
            createStatus.textContent = `Error: ${error.message}`;
            createStatus.classList.add('text-danger');
        }
    });

    // --- Carga inicial de datos al abrir la página ---
    function initializePage() {
        loadAvailableDemos();
        loadDemoHistory();
    }

    initializePage();
});