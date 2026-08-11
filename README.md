# Cierra

Cierra es un MVP de agente de ventas para sitios web. El dueño de un negocio carga la información aprobada de su producto, prueba la conversación y obtiene una línea de instalación para añadir un chat flotante a cualquier página.

## Qué incluye

- Página comercial para explicar y vender el servicio.
- Configurador de negocio, producto, tono y cierre por WhatsApp.
- Chat de prueba que evita inventar datos faltantes.
- Widget instalable mediante `public/widget.js`.
- Ruta segura `/api/chat` para conectar un proveedor de IA sin exponer claves en el navegador.
- Respuestas locales de demostración cuando no existe una clave configurada.

## Conexión opcional de IA

La variable `GROQ_API_KEY` debe configurarse únicamente en el entorno del servidor. También puede definirse `GROQ_MODEL`. Nunca deben incluirse claves privadas dentro del código que recibe el navegador.

## Alcance del MVP

La configuración se guarda en el navegador y viaja dentro del código de instalación. Para convertirlo en una plataforma multiempresa se recomienda añadir cuentas, una base de datos por cliente, métricas de conversaciones y un sistema de planes.
