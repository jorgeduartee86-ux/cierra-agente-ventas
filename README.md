# Cierra

Cierra es un MVP de agente de ventas para sitios web. El dueño de un negocio carga la información aprobada de su producto, prueba la conversación y obtiene una línea de instalación para añadir un chat flotante a cualquier página.

## Qué incluye

- Página comercial para explicar y vender el servicio.
- Configurador de negocio, producto, tono y cierre por WhatsApp.
- Chat de prueba que evita inventar datos faltantes.
- Widget instalable mediante `public/widget.js`.
- Ventana para validar y conectar una clave API de OpenAI.
- Ruta segura `/api/chat` conectada a la Responses API de OpenAI.
- Una sola clave global alimenta todos los vendedores, productos y clientes.
- La clave original se guarda cifrada en D1 y no se incluye en el código del widget.
- Respuestas locales de demostración cuando no existe una clave configurada.

## Conexión con OpenAI

En la página, selecciona **Pegar mi API**, pega la clave y espera la confirmación. El servidor la valida, la cifra y la guarda como conexión global. Todos los agentes configurados en la plataforma usan esa misma cuenta de OpenAI; los datos comerciales de cada producto siguen viajando de forma independiente en su widget.

El servidor necesita `CIERRA_CONFIG_SECRET`, con un valor aleatorio de al menos 32 caracteres, para proteger las conexiones. `OPENAI_MODEL` permite cambiar el modelo y usa `gpt-5.6-luna` de forma predeterminada. Como alternativa administrada, se puede configurar `OPENAI_API_KEY` únicamente en el entorno del servidor.

## Alcance del MVP

La configuración se guarda en el navegador y viaja dentro del código de instalación. Para convertirlo en una plataforma multiempresa se recomienda añadir cuentas, una base de datos por cliente, métricas de conversaciones y un sistema de planes.
