# Cierra

Cierra es un MVP de agente de ventas para sitios web. El dueño de un negocio carga la información aprobada de su producto, prueba la conversación y obtiene una línea de instalación para añadir un chat flotante a cualquier página.

## Qué incluye

- Página comercial para explicar y vender el servicio.
- Configurador de negocio, producto, tono y cierre por WhatsApp.
- Chat de prueba que evita inventar datos faltantes.
- Widget instalable mediante `public/widget.js`.
- Ruta segura `/api/chat` conectada a la Responses API de OpenAI.
- Una sola clave global alimenta todos los vendedores, productos y clientes.
- La clave se guarda como secreto del servidor y no se incluye en el código ni en el widget.
- Respuestas locales de demostración cuando no existe una clave configurada.

## Conexión con OpenAI

La variable secreta `OPENAI_API_KEY` se configura una sola vez en el entorno del servidor. Todos los agentes de la plataforma usan esa misma cuenta de OpenAI; los datos comerciales de cada producto siguen viajando de forma independiente en su widget. `OPENAI_MODEL` permite cambiar el modelo y usa `gpt-5.6-luna` de forma predeterminada.

## Alcance del MVP

La configuración se guarda en el navegador y viaja dentro del código de instalación. Para convertirlo en una plataforma multiempresa se recomienda añadir cuentas, una base de datos por cliente, métricas de conversaciones y un sistema de planes.
