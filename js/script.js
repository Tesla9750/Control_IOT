document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración del WebSocket ---
    const EC2_PUBLIC_IP = '44.219.48.92';
    const wsEndpoint = `ws://${EC2_PUBLIC_IP}:8000/ws`; // Apunta a tu endpoint WS
    const DEVICE_ID = 1;

    // --- Referencias de la Interfaz ---
    const statusIndicator = document.getElementById('status-indicator');
    const melodySelect = document.getElementById('melody-select');
    const btnAutoMode = document.getElementById('btn-auto-mode');

    // --- Mapeo de Acciones (sin cambios) ---
    const statusMap = { /* ... (mapa de status completo) ... */ 
        1: 'Avanzando', 2: 'Retrocediendo', 3: 'Detenido', 4: 'Avance Derecha',
        5: 'Avance Izquierda', 6: 'Reversa Derecha', 7: 'Reversa Izquierda', 
        8: 'Girando Derecha', 9: 'Girando Izquierda', 10: 'Giro 360° Derecha',
        11: 'Giro 360° Izquierda', 12: 'Iniciando Secuencia Demo', 
        13: 'Giro 90° Izquierda', 14: 'Giro 90° Derecha', 15: 'Modo Autónomo'
    };
    const pressAndHoldButtons = { /* ... (mapa de botones con '#') ... */ 
        '#btn-forward': 1, '#btn-backward': 2, '#btn-forward-right': 4,
        '#btn-forward-left': 5, '[data-action="6"]': 6, '[data-action="7"]': 7,
        '#btn-turn-right': 8, '#btn-turn-left': 9
    };
    const clickOnceButtons = { /* ... (mapa de botones con '#') ... */ 
        '#btn-stop': 3, '#btn-spin-right': 10, '#btn-spin-left': 11,
        '[data-action="12"]': 12, '[data-action="13"]': 13, 
        '[data-action="14"]': 14, '#btn-auto-mode': 15
    };

    // --- Conexión WebSocket ---
    let ws;

    function connectWebSocket() {
        console.log("Intentando conectar al WebSocket...");
        ws = new WebSocket(wsEndpoint);

        ws.onopen = () => {
            console.log("Conectado al WebSocket.");
            statusIndicator.textContent = 'CONECTADO';
            statusIndicator.style.color = 'var(--success-color)';
        };

        ws.onmessage = (event) => {
            console.log("Mensaje recibido del servidor:", event.data);
        };

        ws.onclose = () => {
            console.log("WebSocket desconectado. Reconectando en 3s...");
            statusIndicator.textContent = 'RECONECTANDO...';
            statusIndicator.style.color = 'var(--stop-color)';
            setTimeout(connectWebSocket, 3000); 
        };

        ws.onerror = (error) => {
            console.error("Error de WebSocket:", error);
            statusIndicator.textContent = 'ERROR DE CONEXIÓN';
            statusIndicator.style.color = 'var(--stop-color)';
        };
    }
    connectWebSocket();

    // --- Función Principal para Enviar Comandos (Sin cambios) ---
    function sendLiveCommand(movementKey) {
        const statusText = statusMap[movementKey] || 'DESCONOCIDO';
        statusIndicator.textContent = statusText.toUpperCase();
        
        if (movementKey === 3) {
            statusIndicator.style.color = 'var(--stop-color)';
        } else {
            statusIndicator.style.color = 'var(--secondary-color)';
        }
        
        const velocidad = (movementKey === 3) ? 0 : 100;

        const commandData = {
            dispositivo_id: DEVICE_ID,
            comando_clave: movementKey,
            velocidad: velocidad
        };

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(commandData));
        } else {
            console.warn("WebSocket no está abierto. Comando no enviado.");
            statusIndicator.textContent = 'NO CONECTADO';
            statusIndicator.style.color = 'var(--stop-color)';
        }
    }

    // --- Asignar Eventos a los Botones ---

    // ¡CAMBIO 1! Creamos un "interruptor"
    let isMoving = false;

    // 1. Lógica para "Mantener Presionado"
    for (const selector in pressAndHoldButtons) {
        const button = document.querySelector(selector);
        if (button) {
            const movementKey = pressAndHoldButtons[selector];
            
            const startHandler = (e) => {
                e.preventDefault();
                isMoving = true; // ¡CAMBIO 2! Encendemos el interruptor
                sendLiveCommand(movementKey);
            };
            button.addEventListener('mousedown', startHandler);
            button.addEventListener('touchstart', startHandler, { passive: false });

            const stopHandler = (e) => {
                e.preventDefault();
                // ¡CAMBIO 3! Solo detenemos si el interruptor está encendido
                if (isMoving) { 
                    isMoving = false; // Apagamos el interruptor
                    sendLiveCommand(3); // Enviar "Detener"
                }
            };
            button.addEventListener('mouseup', stopHandler);
            button.addEventListener('mouseleave', stopHandler); // Ahora solo funciona si 'isMoving' es true
            button.addEventListener('touchend', stopHandler);
        } else {
            console.warn("No se encontró el botón:", selector);
        }
    }

    // 2. Lógica para "Un Solo Clic"
    for (const selector in clickOnceButtons) {
        const button = document.querySelector(selector);
        if (button) {
            const movementKey = clickOnceButtons[selector];
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                if (movementKey === 15) toggleAutoMode();
                sendLiveCommand(movementKey);
            });
        } else {
            console.warn("No se encontró el botón:", selector);
        }
    }
    
// 3. Lógica para el Botón de Bocina (ACTUALIZADO)
    const hornButton = document.querySelector('[data-action="H"]');
    if (hornButton) {
        hornButton.addEventListener('click', () => {
            const melodyId = melodySelect.value;
            const hornCommandString = "H=" + melodyId; // Crea el comando (ej: "H=1")
            
            console.log(`Bocina presionada. Enviando: ${hornCommandString}`);
            statusIndicator.textContent = `TOCANDO MELODÍA ${parseInt(melodyId) + 1}...`;

            // ¡CAMBIO CLAVE!
            // Creamos un JSON especial, diferente al de movimiento.
            const hornData = {
                dispositivo_id: DEVICE_ID,
                comando_bocina: hornCommandString // Usamos una clave única
            };

            // Enviar el JSON de la bocina por el WebSocket
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(hornData));
            } else {
                console.warn("WebSocket no está abierto. Comando de bocina no enviado.");
                statusIndicator.textContent = 'NO CONECTADO';
            }
        });
    }

    // 4. Lógica de UI para Modo Autónomo (Sin cambios)
    let autoModeActive = false;
    function toggleAutoMode() {
        autoModeActive = !autoModeActive;
        if (autoModeActive) {
            btnAutoMode.innerHTML = '<i class="bi bi-stop-circle-fill"></i> Detener Modo Autónomo';
        } else {
            btnAutoMode.innerHTML = '<i class="bi bi-robot"></i> Iniciar Modo Autónomo';
        }
    }
});