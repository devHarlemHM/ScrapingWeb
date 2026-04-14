from time import sleep, perf_counter
from datetime import datetime
import json
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
#Script realizado por Freddy Rangel


def log(message):
    print(f"[BOOKING][{datetime.now().strftime('%H:%M:%S')}] {message}", flush=True)


opts = Options()
opts.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-dev-shm-usage")
opts.add_argument("--disable-gpu")
opts.add_argument("--headless=new")
opts.add_argument("--window-size=1920,1080")
if os.path.exists("/usr/bin/chromium"):
    opts.binary_location = "/usr/bin/chromium"
opts.add_experimental_option('excludeSwitches', ['enable-logging'])

driver = webdriver.Chrome(options=opts)
driver.implicitly_wait(5)
wait = WebDriverWait(driver, 12)

comentarios = []

try:
    script_started = perf_counter()
    log("EXTRACTOR BOOKING - BARRANQUILLA")

    # Abrir Booking
    driver.get("https://www.booking.com")
    sleep(3)

    # Cerrar popups si existen
    try:
        driver.find_element(By.CSS_SELECTOR, "button[aria-label*='Dismiss'], button[aria-label*='Cerrar']").click()
        sleep(1)
    except:
        pass

    log("Buscando Barranquilla...")
    search = wait.until(EC.presence_of_element_located((By.NAME, "ss")))
    search.clear()
    search.send_keys("Barranquilla, Atlántico, Colombia")
    sleep(1)
    search.send_keys(Keys.ENTER)
    sleep(5)

    log(f"Ubicacion actual: {driver.title}")

    # Scroll infinito hasta que no carguen más hoteles
    last_height = driver.execute_script("return document.body.scrollHeight")
    while True:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        sleep(3)
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:  # No cargaron más hoteles
            break
        last_height = new_height


    # Capturar lista de hoteles
    hoteles_info = []
    hoteles_elementos = driver.find_elements(By.CSS_SELECTOR, "[data-testid='title']")
    total_hoteles = len(hoteles_elementos)
    log(f"Hoteles encontrados: {total_hoteles}")

    for hotel in hoteles_elementos:  
        try:
            nombre = hotel.text.strip()
            link = hotel.find_element(By.XPATH, "./ancestor::a").get_attribute("href")
            hoteles_info.append({"nombre": nombre, "url": link})
            print(f"✅ {nombre}")
        except:
            continue

    log(f"Hoteles agregados para procesar: {len(hoteles_info)}")

    # Procesar hoteles
    for i, hotel_data in enumerate(hoteles_info, 1):
        hotel_started = perf_counter()
        nombre = hotel_data["nombre"]
        url = hotel_data["url"]

        log(f"Procesando hotel {i}/{len(hoteles_info)}: {nombre}")

        try:
            driver.get(url)
            sleep(3)

            # Intentar abrir sección de comentarios
            try:
                comentarios_btn = driver.find_element(By.CSS_SELECTOR,
                    'button[data-testid="fr-read-all-reviews"], a[data-testid="reviews-tab"], a[href*="reviews"]')
                driver.execute_script("arguments[0].click();", comentarios_btn)
                sleep(3)
                log(f"Comentarios abiertos para hotel: {nombre}")
            except:
                log(f"No se encontro boton de comentarios para {nombre}, se extrae desde pagina actual")

            # Extraer comentarios con navegación por páginas
            count = 0
            pagina_actual = 1
            max_paginas = 10  # Límite de páginas para evitar bucles infinitos
            #Este bucle "while" puede ser quitado  solo lo utilicé para ver la funcionalidad del programa
            while pagina_actual <= max_paginas:
                log(f"Hotel {nombre}: procesando pagina {pagina_actual}")
                
                # Extraer comentarios de la página actual
                elementos = driver.find_elements(By.CSS_SELECTOR, 'div[data-testid="review-card"]')
                comentarios_pagina = 0

                for elem in elementos:  # Recorrer la seccion de comentarios
                    try:
                        try:
                            positivo = elem.find_element(By.CSS_SELECTOR, 'div[data-testid="review-positive-text"]').text.strip()
                        except:
                            positivo = ""
                        try:
                            negativo = elem.find_element(By.CSS_SELECTOR, 'div[data-testid="review-negative-text"]').text.strip()
                        except:
                            negativo = ""

                        if not positivo and not negativo:
                            continue

                        try:
                            puntuacion = elem.find_element(By.CSS_SELECTOR, '[data-testid="review-score"] div[aria-hidden="true"]').text.strip()
                        except:
                            puntuacion = "N/A"

                        try:
                            usuario = elem.find_element(By.CSS_SELECTOR, '[data-testid="review-avatar"] div[class*="b08850ce41 f546354b44"]').text.strip()
                        except:
                            usuario = "N/A"

                        try:
                            fecha = elem.find_element(By.CSS_SELECTOR, 'span[data-testid="review-date"]').text.strip()
                        except:
                            fecha = "N/A"

                        comentarios.append({
                            "id": len(comentarios) + 1,
                            "hotel": nombre,
                            "usuario": usuario,
                            "puntuacion": puntuacion,
                            "Registro":fecha,
                            "positivo": positivo,
                            "negativo": negativo,
                            "url": url
                        })

                        comentarios_pagina += 1

                    except:
                        continue

                count += comentarios_pagina
                log(f"Hotel {nombre}: {comentarios_pagina} comentarios en pagina {pagina_actual}")
                
                # Buscar y hacer clic en el botón de siguiente página
                try:
                    # Buscar la barra de navegación de páginas usando la estructura exacta del DOM
                    nav_buttons = driver.find_elements(By.CSS_SELECTOR, 'ol.a81722b979 li.d8842cf9f4 button')
                    
                    if not nav_buttons:
                        # Intentar con selectores alternativos para la navegación
                        nav_buttons = driver.find_elements(By.CSS_SELECTOR, 
                            'button[aria-label*="Siguiente"], button[aria-label*="Next"], '
                            'a[aria-label*="Siguiente"], a[aria-label*="Next"], '
                            'button[data-testid*="pagination"], a[data-testid*="pagination"]')
                    
                    # Buscar el botón de siguiente página
                    siguiente_btn = None
                    siguiente_numero = pagina_actual + 1
                    
                    for btn in nav_buttons:
                        try:
                            # Obtener el aria-label del boton
                            aria_label = btn.get_attribute('aria-label') or ""
                            texto = btn.text.strip()
                            
                            # Buscar el boton que corresponde a la siguiente página
                            if aria_label.strip() == str(siguiente_numero) or texto == str(siguiente_numero):
                                siguiente_btn = btn
                                break
                                
                            # Tambien buscar botones de navegacion con flechas
                            if any(keyword in texto or keyword in aria_label.lower() for keyword in 
                                   ['siguiente', 'next', '>', '»', 'página siguiente']):
                                siguiente_btn = btn
                                break
                        except:
                            continue
                    
                    if siguiente_btn and siguiente_btn.is_enabled():
                        print(f"    🔍 Encontrado botón para página {siguiente_numero}")
                        
                        # Hacer scroll hasta el botón para asegurar que esté visible
                        driver.execute_script("arguments[0].scrollIntoView(true);", siguiente_btn)
                        sleep(1)
                        
                        # Intentar hacer clic en el botón
                        try:
                            siguiente_btn.click()
                        except:
                            # Si el clic normal falla ejecuta un script de Javascript
                            driver.execute_script("arguments[0].click();", siguiente_btn)
                        
                        sleep(3)  # Esperar a que cargue la nueva página
                        pagina_actual += 1
                        
                        # Verificar si realmente cambió la página
                        try:
                            # Buscar indicadores de que estamos en una nueva página
                            elementos_nuevos = driver.find_elements(By.CSS_SELECTOR, 'div[data-testid="review-card"]')
                            if len(elementos_nuevos) == 0:
                                print(f"    ⚠️ No hay más comentarios en página {pagina_actual}")
                                break
                        except:
                            pass
                            
                    else:
                        # Verificar si estamos en la última página disponible
                        try:
                            # Buscar todos los números de página disponibles
                            paginas_disponibles = []
                            for btn in nav_buttons:
                                try:
                                    aria_label = btn.get_attribute('aria-label') or ""
                                    texto = btn.text.strip()
                                    if aria_label.strip().isdigit():
                                        paginas_disponibles.append(int(aria_label.strip()))
                                    elif texto.isdigit():
                                        paginas_disponibles.append(int(texto))
                                except:
                                    continue

                            if paginas_disponibles and max(paginas_disponibles) <= pagina_actual:
                                print(f"    ℹ️ Llegamos a la última página disponible ({max(paginas_disponibles)})")
                                break
                            else:
                                print(f"    ℹ️ No se encontró botón de siguiente página (página {siguiente_numero})")
                                break
                        except:
                            print(f"    ℹ️ No se encontró botón de siguiente página")
                            break
                        
                except Exception as e:
                    print(f"    ⚠️ Error navegando a página {pagina_actual + 1}: {str(e)[:50]}...")
                    break

            hotel_elapsed = round(perf_counter() - hotel_started, 2)
            log(f"Hotel {nombre}: total extraidos={count}, paginas={pagina_actual}, duracion={hotel_elapsed}s")

        except Exception as e:
            log(f"Error procesando hotel {nombre}: {str(e)[:60]}...")
            continue

        # Preguntar si quiere continuar con el siguiente hotel
        print(f"\n📊 RESUMEN DEL HOTEL:")
        print(f"  🏨 Hotel: {nombre}")
        print(f"  💬 Comentarios extraídos: {count}")
        print(f"  📄 Páginas procesadas: {pagina_actual}")
        print(f"  📈 Total comentarios acumulados: {len(comentarios)}")
        

    # Guardar resultados
    datos = {
        "resumen": {
            "total_comentarios": len(comentarios),
            "total_hoteles": len(hoteles_info),
            "ciudad": "Barranquilla, Colombia"
        },
        "comentarios": comentarios
    }

    with open('datos_completos.json', 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)
    log(f"Archivo generado: datos_completos.json | comentarios={len(comentarios)}")

    total_elapsed = round(perf_counter() - script_started, 2)
    log("Scraping booking completado")
    log(f"Hoteles procesados: {len(hoteles_info)}")
    log(f"Comentarios extraidos: {len(comentarios)}")
    log(f"Duracion total: {total_elapsed}s")

    if comentarios:
        print("\n📋 EJEMPLO DE COMENTARIOS:")
        for c in comentarios[:3]:
            print(f"• {c['hotel']} - {c['usuario']} - ({c['puntuacion']}) - {c['fecha']}")
            if c['positivo']: print(f"  + {c['positivo'][:70]}...")
            if c['negativo']: print(f"  - {c['negativo'][:70]}...")


    if comentarios:
        with open('datos.json', 'w', encoding='utf-8') as f:
            json.dump({"comentarios_parciales": comentarios}, f, ensure_ascii=False, indent=2)
        log(f"Archivo generado: datos.json | comentarios_parciales={len(comentarios)}")

finally:
    try:
        input("Presiona Enter para cerrar...")
    except EOFError:
        pass
    driver.quit()