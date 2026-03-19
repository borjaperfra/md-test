# Manfred Daily — Guía de uso

Herramienta interna para publicar el newsletter diario de ofertas tech en @getmanfred.

---

## Acceso

Entra en: **https://md-test-production.up.railway.app**

Haz clic en **Entrar con Google** y usa tu cuenta `@getmanfred.com`. Solo las cuentas de Manfred tienen acceso.

---

## La aplicación tiene 4 secciones

| Sección | Para qué sirve |
|---------|---------------|
| **Pool de Ofertas** | Buscar, añadir y seleccionar las ofertas del día |
| **Generador** | Crear el mensaje de Telegram con IA |
| **Programados** | Ver y gestionar los mensajes enviados o pendientes |
| **Analítica** | Ver clicks y visualizaciones de cada mensaje |

---

## Flujo diario paso a paso

### 1. Buscar ofertas

Ve a **Pool de Ofertas**. Tienes tres formas de añadir ofertas:

**A) Búsqueda automática con IA**
Pulsa el botón **Buscar ofertas**. La IA busca automáticamente en Manfred, portales de empresas y LinkedIn. Tarda ~1-2 minutos.

**B) Añadir desde URL**
Pulsa **Añadir oferta** → pega la URL de la oferta → la IA extrae el título, empresa, salario y modalidad automáticamente.

**C) Añadir manualmente**
Pulsa **Añadir oferta** → rellena los campos a mano.

---

### 2. Seleccionar y ordenar las 5 ofertas

En la tabla puedes:
- Hacer clic en una oferta para **seleccionarla** (máximo 5)
- **Descartar** ofertas que no quieras incluir (quedan ocultas)
- Ver el **salario**, **modalidad** y **empresa** de cada oferta

En el panel inferior aparecen las 5 ofertas seleccionadas. Puedes **arrastrarlas** para cambiar el orden.

Cuando estés lista, pulsa **Guardar selección** → la app te llevará automáticamente al Generador.

---

### 3. Generar el mensaje

En el **Generador** verás:

- **Saludo del día**: generado automáticamente con IA. Puedes editarlo o pulsar **Regenerar** para obtener otro.
- **Ending del día**: dato histórico de la fecha (se carga automáticamente).
- Botón **Generar Mensaje**: crea el mensaje completo formateado para Telegram.

El mensaje generado sigue este formato:

```
[Saludo del día]

Ⓜ️ Título del puesto @ Empresa
Remote — €70-80K
https://mnfrd.co/...

[4 ofertas más...]

[Dato histórico del día]

Ⓜ️ = ofertas gestionadas por Manfred
```

Puedes **editar el mensaje** directamente antes de enviarlo. El borrador se guarda automáticamente mientras escribes, y se restaura si cierras la pestaña por error.

---

### 4. Enviar o programar

Una vez generado el mensaje tienes dos opciones:

- **Enviar ahora**: publica el mensaje inmediatamente en @getmanfred.
- **Programar**: elige la hora (en horario de España) y el mensaje se enviará automáticamente, aunque cierres el navegador.

> El servidor está siempre encendido en Railway, así que los mensajes programados se enviarán aunque nadie esté usando la aplicación.

En ambos casos recibirás una notificación en Slack confirmando el envío o el error. Las ofertas incluidas en el mensaje quedan automáticamente archivadas y dejan de aparecer en el Pool.

---

### 5. Ver analítica

En **Analítica** puedes ver por cada mensaje enviado:
- **Visualizaciones** en Telegram (se capturan automáticamente antes de que el mensaje se elimine a las 23:59)
- **Clicks** por oferta (desde Bit.ly)
- **Media de clicks** por oferta
- **Mejor mensaje**: el día con más clicks en toda la historia

Puedes seleccionar varios mensajes para comparar sus métricas.

El panel **Top ofertas** muestra las 5 ofertas más clickadas. Puedes filtrarlo por **esta semana**, **este mes** o **histórico**.

---

## Preguntas frecuentes

**¿Qué pasa si cierro el navegador con un mensaje programado?**
No pasa nada. El mensaje se enviará igualmente a la hora programada.

**¿Puedo editar un mensaje ya programado?**
Sí. Ve a **Programados**, encuentra el mensaje y pulsa el icono de edición.

**¿Puedo cancelar un mensaje programado?**
Sí. Ve a **Programados** y pulsa el botón **Cancelar envío** antes de que llegue la hora. El mensaje quedará marcado como "Cancelado" en el historial pero no se enviará. También puedes eliminarlo con el icono de papelera si no quieres que quede registro.

**¿Por qué algunas ofertas tienen Ⓜ️, 👀 o 🌶️?**
- `Ⓜ️` = oferta gestionada por Manfred
- `👀` = oferta de cliente (pagada)
- `🌶️` = salario ≥ €80K

**¿Dónde están las visualizaciones de Telegram?**
Se capturan automáticamente cada día a las 23:00, 23:30 y 23:55 antes de que el mensaje se elimine del canal. Aparecen en Analítica al día siguiente.

**¿Qué pasa con las ofertas después de publicar el mensaje?**
Se archivan automáticamente y dejan de aparecer en el Pool. Si quieres recuperar una oferta, ve a **Pool de Ofertas** → **Ver archivo** → pulsa **Restaurar**.

**¿Quién programó este mensaje?**
En la vista **Programados** cada mensaje muestra el nombre de la persona que lo creó.

---

*Cualquier duda, escribe a Borja.*
