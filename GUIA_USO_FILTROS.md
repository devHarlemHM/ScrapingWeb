# Sistema de Visualización y Filtrado de Reseñas Hoteleras

## 📊 Descripción

Este sistema permite analizar y visualizar reseñas de hoteles de tres plataformas principales:
- **Airbnb**
- **Booking.com**
- **Google Reviews**

Los datos de muestra ya están cargados desde los archivos JSON de scraping ubicados en `frontend/src/data-scraping/`.

## 🎯 Características Principales

### 1. Panel de Control
El panel de control permite:
- ✅ Seleccionar las plataformas a analizar (Airbnb, Booking, Google)
- 📅 Filtrar reseñas por rango de fechas
- ⭐ Filtrar hoteles por calificación mínima de sostenibilidad
- ⭐ Filtrar hoteles por calificación mínima de calidad

### 2. Análisis Cuantitativo
Muestra tablas con:
- Hoteles y sus calificaciones
- Distribución por plataforma
- Métricas de sostenibilidad y calidad

### 3. Visualización Comparativa
Gráficos interactivos que incluyen:
- 📊 Sostenibilidad y Calidad por Hotel
- 📊 Distribución por Plataforma
- 📊 Distribución de Sentimientos
- 📊 Comparación de Calificaciones

**Los gráficos se actualizan automáticamente** al aplicar cualquier filtro.

### 4. Análisis Cualitativo
- Reseñas positivas destacadas
- Reseñas negativas a considerar
- Reseñas recientes relevantes

## 🚀 Cómo Usar el Sistema

### Paso 1: Acceder a la Aplicación
Abre tu navegador en: http://localhost:3000

### Paso 2: Panel de Control

#### A. Extracción de Datos (Simulación)
1. Selecciona las plataformas que deseas analizar:
   - ☑️ Airbnb
   - ☑️ Booking.com
   - ☑️ Google Reviews

2. Haz clic en **"Iniciar Extracción"**
   - Esto cargará las reseñas de las plataformas seleccionadas
   - Es una simulación que usa datos reales de los archivos JSON

#### B. Filtros de Análisis
1. **Fecha Desde / Fecha Hasta**: 
   - Selecciona el rango de fechas de las reseñas que quieres analizar
   - Por defecto: últimos 6 meses
   - Ejemplo: De 01/09/2024 a 01/03/2026

2. **Sostenibilidad Mín.**:
   - Filtra hoteles con calificación mínima de sostenibilidad
   - Rango: 1 a 5 estrellas

3. **Calidad Mín.**:
   - Filtra hoteles con calificación mínima de calidad
   - Rango: 1 a 5 estrellas

4. Haz clic en **"Aplicar Filtros"**

### Paso 3: Ver Resultados

#### Análisis Cuantitativo
- Se actualiza automáticamente con los filtros aplicados
- Muestra tabla con hoteles filtrados
- Incluye botón de exportación a Excel

#### Visualización Comparativa
- **Los gráficos se actualizan en tiempo real** según los filtros
- Puedes ver:
  - Comparación entre plataformas
  - Tendencias de calidad y sostenibilidad
  - Distribución de sentimientos

#### Análisis Cualitativo
- Reseñas filtradas por fecha y plataforma
- Clasificadas por sentimiento (positivo/negativo)
- Muestra las más recientes dentro del rango seleccionado

## 📋 Ejemplos de Uso

### Caso 1: Análisis de Booking en el Último Mes
```
1. Panel de Control > Extracción de Datos
   - ☑️ Booking.com
   - ☐ Airbnb
   - ☐ Google Reviews
   
2. Panel de Control > Filtros
   - Fecha Desde: 01/02/2026
   - Fecha Hasta: 01/03/2026
   - Sostenibilidad Mín: Todas
   - Calidad Mín: Todas
   
3. Aplicar Filtros
4. Ver pestaña "Visualización Comparativa"
```

### Caso 2: Hoteles de Alta Calidad en Todas las Plataformas
```
1. Panel de Control > Extracción de Datos
   - ☑️ Airbnb
   - ☑️ Booking.com
   - ☑️ Google Reviews
   
2. Panel de Control > Filtros
   - Fecha Desde: 01/09/2024
   - Fecha Hasta: 01/03/2026
   - Sostenibilidad Mín: ⭐⭐⭐⭐ 4 estrellas
   - Calidad Mín: ⭐⭐⭐⭐ 4 estrellas
   
3. Aplicar Filtros
4. Ver tablas y gráficos actualizados
```

### Caso 3: Comparar Airbnb vs Google en un Período Específico
```
1. Panel de Control > Extracción de Datos
   - ☑️ Airbnb
   - ☐ Booking.com
   - ☑️ Google Reviews
   
2. Panel de Control > Filtros
   - Fecha Desde: 01/05/2025
   - Fecha Hasta: 01/08/2025
   - Sostenibilidad Mín: Todas
   - Calidad Mín: Todas
   
3. Aplicar Filtros
4. Ver gráfico "Distribución por Plataforma"
```

## 🔄 Actualización Automática

### ¿Qué se actualiza automáticamente?
✅ **Tablas**: Se actualizan con los hoteles filtrados
✅ **Gráficos**: Se regeneran con los datos filtrados
✅ **Reseñas**: Se muestran solo las que cumplen los criterios
✅ **Estadísticas**: Contadores y métricas se recalculan

### Flujo de Actualización
1. Usuario selecciona filtros
2. Click en "Aplicar Filtros"
3. Sistema filtra datos en tiempo real
4. Todas las visualizaciones se actualizan instantáneamente
5. Usuario ve resultados filtrados en todas las pestañas

## 📊 Interpretación de Datos

### Calificaciones
- **5 estrellas**: Excelente
- **4 estrellas**: Muy bueno
- **3 estrellas**: Bueno
- **2 estrellas**: Regular
- **1 estrella**: Malo

### Sentimientos
- 🟢 **Positivo**: Rating >= 4.2 estrellas
- 🟡 **Neutral**: Rating entre 3.2 y 4.2
- 🔴 **Negativo**: Rating < 3.2

### Plataformas
- 🔴 **Airbnb**: Color rojo (#FF5A5F)
- 🔵 **Booking**: Color azul oscuro (#003580)
- 🟦 **Google**: Color azul (#4285F4)

## 🗂️ Origen de los Datos

Los datos provienen de archivos JSON reales de scraping:
- `frontend/src/data-scraping/reseñas_airbnb.json` (69,797 líneas)
- `frontend/src/data-scraping/reseñas_booking.json` (43,684 líneas)
- `frontend/src/data-scraping/reseñas_google.json` (57,120 líneas)

**Total**: ~170,000 líneas de datos reales de reseñas hoteleras.

## 🐛 Solución de Problemas

### Los gráficos no se actualizan
- Asegúrate de hacer click en "Aplicar Filtros"
- Verifica que hay datos en el rango de fechas seleccionado
- Revisa la consola del navegador (F12) para mensajes de debug

### No aparecen hoteles
- Amplía el rango de fechas
- Reduce los requisitos de calificación mínima
- Selecciona más plataformas

### Fechas no funcionan correctamente
- Usa el formato de fecha del selector (YYYY-MM-DD)
- Asegúrate que "Fecha Desde" sea anterior a "Fecha Hasta"
- Las fechas de las reseñas están en español y se parsean automáticamente

## 💡 Consejos de Uso

1. **Empieza amplio**: Primero carga todas las plataformas sin filtros
2. **Refina progresivamente**: Aplica filtros uno a uno para ver el impacto
3. **Compara períodos**: Usa diferentes rangos de fechas para ver tendencias
4. **Exporta datos**: Usa el botón de exportación para análisis offline
5. **Revisa todas las pestañas**: Cada una ofrece perspectivas diferentes

## 📝 Notas Técnicas

- El sistema usa **React** con **TypeScript**
- Los gráficos están construidos con **Recharts**
- El parseo de fechas soporta formatos en español
- La simulación es instantánea (sin llamadas reales a APIs)
- Los datos se filtran en el cliente (frontend)
- La arquitectura es reactiva: cambios de estado actualizan todas las vistas

## 🎓 Para la Evidencia

### Demostración Sugerida
1. Mostrar panel de control con todas las opciones de filtros
2. Seleccionar solo Booking y aplicar filtro por fecha (últimos 3 meses)
3. Navegar a "Visualización Comparativa" para mostrar gráficos actualizados
4. Cambiar a Airbnb + Google y mostrar cómo los gráficos se actualizan
5. Aplicar filtro de calidad >= 4 estrellas y mostrar resultados refinados
6. Mostrar "Análisis Cualitativo" con reseñas filtradas

### Puntos Clave a Destacar
✅ Sistema funcional con datos reales
✅ Filtros por fecha y plataforma funcionando
✅ Gráficos que se actualizan automáticamente
✅ Más de 170,000 líneas de datos de scraping reales
✅ Interfaz intuitiva y responsiva
✅ Exportación de datos a Excel
