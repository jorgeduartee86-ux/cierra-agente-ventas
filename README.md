# Cierra

Cierra es un MVP de agente de ventas para sitios web. El dueño de un negocio carga la información aprobada de su producto, prueba la conversación y obtiene una línea de instalación para añadir un chat flotante a cualquier página.

## Qué incluye

- Página comercial para explicar y vender el servicio.
- Configurador de negocio, producto, tono y cierre por WhatsApp.
- Chat de prueba que evita inventar datos faltantes.
- Widget instalable mediante `public/widget.js`.
- Ruta segura `/api/chat` conectada a la Responses API de OpenAI.
- Solicitud de llamada saliente con consentimiento y conexión a Twilio.
- Una sola clave global alimenta todos los vendedores, productos y clientes.
- La clave se guarda como secreto del servidor y no se incluye en el código ni en el widget.
- Respuestas locales de demostración cuando no existe una clave configurada.

## Conexión con OpenAI

La variable secreta `OPENAI_API_KEY` se configura una sola vez en el entorno del servidor. Todos los agentes de la plataforma usan esa misma cuenta de OpenAI; los datos comerciales de cada producto siguen viajando de forma independiente en su widget. `OPENAI_MODEL` permite cambiar el modelo y usa `gpt-5.6-luna` de forma predeterminada.

## Llamadas autónomas

El chat puede solicitar una llamada saliente. Para activarla en un backend público configura `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` y `PUBLIC_APP_URL`. La primera versión usa Twilio Voice y captura respuestas por voz. Para una conversación de voz natural en tiempo real, el siguiente paso es conectar el flujo de Twilio Media Streams con OpenAI Realtime mediante un servidor WebSocket; las claves deben permanecer siempre en el backend.

## Alcance del MVP

La configuración se guarda en el navegador y viaja dentro del código de instalación. Para convertirlo en una plataforma multiempresa se recomienda añadir cuentas, una base de datos por cliente, métricas de conversaciones y un sistema de planes.
