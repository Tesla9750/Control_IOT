document.addEventListener('DOMContentLoaded', () => {
    // IMPORTANTE: Reemplaza con la IP pública de tu instancia EC2
    const EC2_PUBLIC_IP = '44.219.48.92';
    const API_BASE_URL = `http://${EC2_PUBLIC_IP}:8000`;
    const WS_URL = `ws://${EC2_PUBLIC_IP}:8000/ws`;
    const DEVICE_ID = 1; // Dispositivo a monitorear

    // --- Elementos del DOM ---
    const lastObstacleCard = document.getElementById('last-obstacle-card');
    const obstacleHistoryTable = document.getElementById('obstacle-history-table');
    const demoSelectList = document.getElementById('demo-select-list');
    const executeDemoBtn = document.getElementById('execute-demo-btn');

    /**
     * Actualiza la tarjeta principal con el último obstáculo detectado.
     * Endpoint: GET /obstacles/{device_id}/last
     */
    async function updateLastObstacleCard() {
        try {
            const response = await fetch(`${API_BASE_URL}/obstacles/${DEVICE_ID}/last`);
            const data = await response.json();

            if (data.length > 0) {
                const lastEvent = data[0];
                lastObstacleCard.innerHTML = `
                    <p class="fs-1 fw-bold text-danger">${lastEvent.obstaculo}</p>
                    <p class="fs-4">Reacción: ${lastEvent.reaccion}</p>
                    <p class="text-muted">Distancia: ${lastEvent.valor_sensor} cm</p>
                    <p class="text-muted">${new Date(lastEvent.fecha_hora_evento).toLocaleString('es-MX')}</p>
                `;
            } else {
                lastObstacleCard.innerHTML = '<p class="fs-2 text-secondary">Sin eventos recientes</p>';
            }
        } catch (error) {
            console.error("Error al cargar el último obstáculo:", error);
            lastObstacleCard.innerHTML = '<p class="fs-4 text-danger">Error de conexión</p>';
        }
    }

    /**
     * Carga el historial de obstáculos en la tabla.
     * Endpoint: GET /obstacles/{device_id}/history
     */
    async function loadObstacleHistory() {
        try {
            const response = await fetch(`${API_BASE_URL}/obstacles/${DEVICE_ID}/history`);
            if (!response.ok) throw new Error('No se pudo cargar el historial.');
            const history = await response.json();
            
            if (history.length > 0) {
                obstacleHistoryTable.innerHTML = history.map(item => `
                    <tr>
                        <td>${item.obstaculo}</td>
                        <td>${item.reaccion}</td>
                        <td>${new Date(item.fecha_hora_evento).toLocaleTimeString('es-MX')}</td>
                    </tr>
                `).join('');
            } else {
                obstacleHistoryTable.innerHTML = '<tr><td colspan="3" class="text-center">No hay historial de obstáculos.</td></tr>';
            }
        } catch (error) {
            console.error("Error cargando el historial de obstáculos:", error);
            obstacleHistoryTable.innerHTML = `<tr><td colspan="3" class="text-danger text-center">${error.message}</td></tr>`;
        }
    }

    /**
     * Carga las demos disponibles en el selector.
     * Endpoint: GET /demos
     */
    async function loadAvailableDemos() {
        try {
            const response = await fetch(`${API_BASE_URL}/demos/`);
            const demos = await response.json();
            demoSelectList.innerHTML = demos.map(demo => `<option value="${demo.id}">${demo.nombre_demo}</option>`).join('');
        } catch (error) {
            console.error("Error cargando demos:", error);
        }
    }

    /**
     * Conecta al WebSocket para actualizaciones en tiempo real.
     */
    function connectWebSocket() {
        const socket = new WebSocket(WS_URL);
        socket.onopen = () => console.log("Dashboard de obstáculos conectado a WebSocket.");
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("Push recibido en dashboard de obstáculos:", message);

            // Si se detecta un obstáculo para nuestro dispositivo, actualizamos todo
            if (message.event === 'obstacle_detected' && message.deviceId === DEVICE_ID) {
                console.log("¡Obstáculo detectado! Actualizando dashboard...");
                updateLastObstacleCard();
                loadObstacleHistory();
            }
        };
        socket.onclose = () => {
            console.log("WS de obstáculos desconectado. Reconectando...");
            setTimeout(connectWebSocket, 5000);
        };
    }

    /**
     * Listener para ejecutar una demo.
     * Endpoint: POST /demos/execute
     */
    executeDemoBtn.addEventListener('click', async () => {
        const demoId = demoSelectList.value;
        if (!demoId) return;
        
        try {
            await fetch(`${API_BASE_URL}/demos/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dispositivo_id: DEVICE_ID, secuencia_id: parseInt(demoId) })
            });
            alert(`Demo #${demoId} iniciada.`);
        } catch(error) {
            console.error("Error al ejecutar demo:", error);
            alert("No se pudo iniciar la demo.");
        }
    });

    // --- Carga inicial de toda la página ---
    function initializeDashboard() {
        updateLastObstacleCard();
        loadObstacleHistory();
        loadAvailableDemos();
        connectWebSocket();
    }

    initializeDashboard();
});