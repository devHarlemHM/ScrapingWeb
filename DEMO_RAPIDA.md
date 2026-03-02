# 🎯 GUÍA RÁPIDA PARA DEMOSTRACIÓN

## ✅ VERIFICACIÓN PREVIA (1 minuto)

### 1. Verificar que Docker está corriendo
```powershell
docker-compose ps
```
Debes ver 7 servicios en estado "Up":
- ✅ scrapingweb_backend
- ✅ scrapingweb_frontend
- ✅ scrapingweb_db
- ✅ scrapingweb_redis
- ✅ scrapingweb_celery_worker
- ✅ scrapingweb_celery_beat
- ✅ scrapingweb_pgadmin

### 2. Abrir la aplicación
URL: **http://localhost:3000**

## 🎬 SCRIPT DE DEMOSTRACIÓN (5 minutos)

### PASO 1: Mostrar Estado Inicial (30 segundos)

**Acción**: 
- Abrir http://localhost:3000
- Ir a pestaña **"Visualización Comparativa"**

**Qué mostrar**:
- "Aquí tenemos datos de ~170,000 reseñas de 3 plataformas"
- "Vean los gráficos con toda la información cargada"
- Señalar el gráfico "Distribución por Plataforma" (muestra 3 barras)

---

### PASO 2: Filtrar por Plataforma (1 minuto)

**Acción**:
1. Ir a pestaña **"Panel de Control"**
2. En "Extracción de Datos", desmarcar:
   - ☐ Airbnb
   - ☐ Google Reviews
   - ☑ Booking.com (dejar solo este)
3. Click en **"Iniciar Extracción"**

**Qué decir**:
- "Ahora vamos a analizar solo las reseñas de Booking.com"
- "Observen cómo el sistema carga solo esa plataforma"

**Resultado**:
- El sistema cambia automáticamente a la pestaña "Análisis Cuantitativo"
- La tabla muestra solo hoteles de Booking

**Mostrar**:
- Ir a **"Visualización Comparativa"**
- "Vean que el gráfico 'Distribución por Plataforma' ahora solo muestra Booking"

---

### PASO 3: Filtrar por Fecha (1.5 minutos)

**Acción**:
1. Ir a **"Panel de Control"**
2. En "Filtros de Análisis":
   - Fecha Desde: **01/09/2025**
   - Fecha Hasta: **31/12/2025**
3. Click en **"Aplicar Filtros"**

**Qué decir**:
- "Ahora vamos a ver solo las reseñas del último trimestre del 2025"
- "El sistema filtra automáticamente por el rango de fechas"

**Resultado**:
- Cambia a "Análisis Cuantitativo" automáticamente
- Menos hoteles en la tabla (solo los que tienen reseñas en ese período)

**Mostrar**:
1. Ir a **"Visualización Comparativa"**
   - "Los gráficos se actualizaron con datos del período filtrado"
   
2. Ir a **"Análisis Cualitativo"**
   - Scroll en las reseñas
   - "Todas estas reseñas son de septiembre a diciembre 2025"

---

### PASO 4: Filtrar por Calidad (1 minuto)

**Acción**:
1. Ir a **"Panel de Control"**
2. En "Filtros de Análisis":
   - Sostenibilidad Mín: **⭐⭐⭐⭐ 4 estrellas**
   - Calidad Mín: **⭐⭐⭐⭐ 4 estrellas**
3. Click en **"Aplicar Filtros"**

**Qué decir**:
- "Ahora veamos solo los hoteles de alta calidad"
- "Filtraremos hoteles con calificación >= 4 estrellas"

**Resultado**:
- La tabla muestra menos hoteles (solo los de alta calidad)

**Mostrar**:
- Ir a **"Visualización Comparativa"**
- "Vean que ahora todos los hoteles en los gráficos están en el rango alto"

---

### PASO 5: Demostrar Actualización Automática (1 minuto)

**Acción**:
1. Ir a **"Panel de Control"**
2. En "Extracción de Datos", marcar:
   - ☑ Airbnb
   - ☑ Booking.com
   - ☑ Google Reviews (todas)
3. Click en **"Iniciar Extracción"**
4. **RÁPIDAMENTE** ir a **"Visualización Comparativa"**

**Qué decir**:
- "Vean cómo al cambiar las plataformas..."
- "Los gráficos se actualizan automáticamente"
- "Sin necesidad de recargar la página"

**Mostrar**:
- El gráfico "Distribución por Plataforma" ahora muestra 3 barras
- Todos los demás gráficos tienen más datos

---

## 🎯 PUNTOS CLAVE A DESTACAR

Durante toda la demo, enfatizar:

1. ✅ **Datos Reales**: "Estos son datos reales de scraping, no simulados"
   
2. ✅ **Actualización Automática**: "Cada vez que aplico un filtro, TODAS las visualizaciones se actualizan"

3. ✅ **Filtros Múltiples**: "Puedo combinar filtros de fecha + plataforma + calidad"

4. ✅ **Volumen de Datos**: "El sistema maneja ~170,000 reseñas sin problemas"

5. ✅ **Interfaz Intuitiva**: "Todo es visual y fácil de usar"

---

## 🚨 SI ALGO SALE MAL

### Frontend no responde
```powershell
docker-compose restart frontend
docker-compose logs -f frontend
```
Espera 10 segundos y recarga el navegador

### No aparecen datos después de filtrar
- Amplía el rango de fechas
- Reduce las calificaciones mínimas
- Selecciona más plataformas

### Gráficos no se actualizan
- Asegúrate de hacer click en "Aplicar Filtros"
- Recarga la página (F5)

---

## 📊 ESTADÍSTICAS PARA MENCIONAR

- **170,000+** líneas de datos reales
- **3** plataformas integradas (Airbnb, Booking, Google)
- **Múltiples hoteles** de diferentes ciudades
- **Filtrado en tiempo real** sin latencia
- **Docker** para fácil despliegue
- **React + TypeScript** para robustez
- **Recharts** para visualizaciones profesionales

---

## 💡 PREGUNTAS FRECUENTES EN DEMOS

**P: ¿Los datos son reales?**
R: "Sí, son datos reales extraídos mediante scraping de las 3 plataformas. Están en los archivos JSON en la carpeta data-scraping."

**P: ¿Se puede exportar?**
R: "Sí, hay un botón de exportación a Excel en la tabla de resultados."

**P: ¿Cómo se actualizan los gráficos?**
R: "React maneja el estado de forma reactiva. Cuando cambio los filtros, el estado se actualiza y React re-renderiza automáticamente todos los componentes que dependen de ese estado."

**P: ¿Qué pasa con fechas en español?**
R: "Implementé un parser personalizado que entiende formatos como 'agosto de 2025' y '18 de septiembre de 2025'."

**P: ¿Se puede agregar más plataformas?**
R: "Sí, el sistema es modular. Solo hay que agregar los datos y actualizar la configuración."

---

## ⏱️ TIEMPOS ESTIMADOS

- Verificación previa: **1 min**
- Demo completa: **5 min**
- Preguntas y respuestas: **3-5 min**
- **TOTAL: 10-12 minutos**

---

## 📝 CHECKLIST PRE-DEMO

- [ ] Docker Desktop está corriendo
- [ ] Ejecuté `docker-compose ps` y todos los servicios están "Up"
- [ ] Abrí http://localhost:3000 y carga correctamente
- [ ] Tengo abierto el navegador en pantalla completa
- [ ] Tengo esta guía abierta en otro monitor/ventana
- [ ] He practicado el flujo al menos 1 vez
- [ ] Cerré pestañas/programas innecesarios (para mejor rendimiento)

---

## 🎬 CIERRE DE LA DEMO

**Frase final sugerida**:

> "Como han visto, el sistema permite analizar más de 170,000 reseñas reales de hoteles, aplicar filtros dinámicos por fecha, plataforma y calidad, y visualizar los resultados en tiempo real con gráficos que se actualizan automáticamente. Todo esto dockerizado para fácil despliegue y escalabilidad. ¿Alguna pregunta?"

---

## 📸 CAPTURAS SUGERIDAS PARA EVIDENCIA

Si necesitas capturar pantallas para el informe:

1. **Panel de Control** con filtros aplicados
2. **Tabla de resultados** con datos filtrados
3. **Gráfico "Distribución por Plataforma"** (mostrando el cambio)
4. **Gráfico "Sostenibilidad y Calidad"** con hoteles de alta calificación
5. **Análisis Cualitativo** con reseñas filtradas por fecha
6. **Consola del navegador** (F12) mostrando los logs de debug

---

## ✅ POST-DEMO

Después de la demo, puedes mencionar:

1. **Código disponible**: "Todo el código está en GitHub/repositorio"
2. **Documentación**: "Hay 3 documentos completos: README, GUIA_USO_FILTROS y IMPLEMENTACION_FILTROS"
3. **Arquitectura**: "Uso Docker Compose para orquestar 7 servicios en una red compartida"
4. **Tecnologías**: "React, TypeScript, Next.js, FastAPI, PostgreSQL, Redis, Celery"

---

**¡Éxito en tu demostración! 🚀**
