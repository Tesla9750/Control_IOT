document.addEventListener('DOMContentLoaded', () => {
    // CAMBIO 1: Reemplaza con la IP pública de tu instancia EC2
    const EC2_PUBLIC_IP = '44.219.48.92';

    // CAMBIO 2: La ruta ahora usa el prefijo del router '/movements'
    const apiEndpoint = `http://${EC2_PUBLIC_IP}:8000/movements/`;

    const statusIndicator = document.getElementById('status-indicator');

    // El mapeo de botones sigue siendo correcto
    const movementMap = {
        'btn-forward': { key: 1, text: 'AVANZANDO' },
        'btn-backward': { key: 2, text: 'RETROCEDIENDO' },
        'btn-stop': { key: 3, text: 'DETENIDO' },
        'btn-forward-right': { key: 4, text: 'AVANCE DERECHA' },
        'btn-forward-left': { key: 5, text: 'AVANCE IZQUIERDA' },
        'btn-turn-right': { key: 8, text: 'GIRANDO DERECHA' },
        'btn-turn-left': { key: 9, 'text': 'GIRANDO IZQUIERDA' },
        'btn-spin-right': { key: 10, text: 'GIRO 360 DERECHA' },
        'btn-spin-left': { key: 11, text: 'GIRO 360 IZQUIERDA' }
    };

    // La lógica para agregar listeners no cambia
    for (const buttonId in movementMap) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                const movement = movementMap[buttonId];
                sendMovementCommand(movement.key, movement.text);
            });
        }
    }

    // La función para enviar el comando es la misma, solo que ahora apunta al endpoint correcto
    async function sendMovementCommand(movementKey, statusText) {
        statusIndicator.textContent = `Enviando: ${statusText}...`;
        statusIndicator.style.color = '#5a677a';

        const commandData = {
            dispositivo_id: 1,
            movimiento_clave: movementKey,
            orientacion_grados: 0,
            estado_ejecucion: 'enviado'
        };

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commandData),
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.detail || `Error en la API`);
            }

            await response.json();

            statusIndicator.textContent = statusText;
            statusIndicator.style.color = movementKey === 3 ? '#ff6b6b' : '#2575fc';

        } catch (error) {
            console.error('Error al enviar el comando:', error);
            statusIndicator.textContent = 'ERROR DE CONEXIÓN';
            statusIndicator.style.color = '#ff6b6b';
        }
    }
});