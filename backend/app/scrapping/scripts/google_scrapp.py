from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime, timedelta
import hashlib
import os
import re
import json
import time

def estimar_fecha(fecha_relativa):
    hoy = datetime.today()
    fecha_relativa = fecha_relativa.lower()
    try:
        cantidad = int(re.search(r"\d+", fecha_relativa).group())
        if "semana" in fecha_relativa:
            return (hoy - timedelta(weeks=cantidad)).strftime("%Y-%m-%d")
        elif "mes" in fecha_relativa:
            return (hoy - timedelta(days=30 * cantidad)).strftime("%Y-%m-%d")
        elif "día" in fecha_relativa:
            return (hoy - timedelta(days=cantidad)).strftime("%Y-%m-%d")
        elif "hora" in fecha_relativa or "minuto" in fecha_relativa:
            return hoy.strftime("%Y-%m-%d")
        elif "año" in fecha_relativa:
            return (hoy.replace(year=hoy.year - cantidad)).strftime("%Y-%m-%d")
    except:
        pass
    return "Fecha estimada no disponible"

opts = Options()
opts.add_argument("--start-maximized")
opts.add_argument("--disable-infobars")
opts.add_argument("--disable-notifications")
opts.add_argument("--disable-extensions")
opts.add_argument("--disable-gpu")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-dev-shm-usage")
opts.add_argument("--headless=new")
opts.add_argument("--window-size=1920,1080")
if os.path.exists("/usr/bin/chromium"):
    opts.binary_location = "/usr/bin/chromium"

driver = webdriver.Chrome(options=opts)
wait = WebDriverWait(driver, 30)

datos = {"Barranquilla": []}

try:
    print("🏨 Abriendo Google Maps...")
    driver.get("https://www.google.com/maps/search/Barranquilla,+hoteles")
    time.sleep(6)

    panel_resultados = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'div[role="feed"]')))
    scroll_intentos = 0
    max_intentos = 50
    hoteles_previos = 0

    while scroll_intentos < max_intentos:
        hoteles = driver.find_elements(By.CSS_SELECTOR, 'div.Nv2PK')
        if len(hoteles) == hoteles_previos:
            scroll_intentos += 1
        else:
            scroll_intentos = 0
            hoteles_previos = len(hoteles)
        driver.execute_script("arguments[0].scrollBy(0, 1000);", panel_resultados)
        time.sleep(1.5)

    enlaces_hoteles = []
    hoteles = driver.find_elements(By.CSS_SELECTOR, 'div.Nv2PK')
    print(f"\n🏨 Total de hoteles encontrados: {len(hoteles)}")
    for idx, hotel in enumerate(hoteles, 1):
        try:
            nombre = hotel.find_element(By.CSS_SELECTOR, 'a.hfpxzc').get_attribute('aria-label')
            enlace = hotel.find_element(By.CSS_SELECTOR, 'a.hfpxzc').get_attribute('href')
            enlaces_hoteles.append({
                "id": idx,
                "nombre": nombre,
                "url": enlace
            })
        except:
            continue

    total_comentarios = 0

    for hotel in enlaces_hoteles:
        i = hotel["id"]
        nombre = hotel["nombre"]
        enlace = hotel["url"]

        try:
            try:
                driver.title
            except:
                print("🔄 Reiniciando navegador por sesión inválida...")
                try:
                    driver.quit()
                except:
                    pass
                time.sleep(5)
                driver = webdriver.Chrome(options=opts)
                wait = WebDriverWait(driver, 30)

            print(f"\n🏨 [{i}] {nombre}")
            print(f"🔗 {enlace}")
            driver.get(enlace)
            time.sleep(6)

            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'div.m6QErb')))
            time.sleep(2)

            comentarios = []

            try:
                opiniones_tab = wait.until(EC.element_to_be_clickable((
                    By.XPATH, '//button[@role="tab"][.//div[contains(text(), "Opiniones") or contains(text(), "Revisiones")]]'
                )))
                opiniones_tab.click()
                print("✅ Se abrió la pestaña de opiniones")
                time.sleep(4)

                panel = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'div.m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde')))
                for _ in range(40):
                    driver.execute_script("arguments[0].scrollBy(0, 1000);", panel)
                    time.sleep(2.5)
            except:
                print("⚠️ No se encontró la pestaña 'Opiniones'. Intentando extraer reseñas directamente...")

            bloques = driver.find_elements(By.CSS_SELECTOR, 'div.jftiEf.fontBodyMedium')
            hashes = set()
            for b in bloques:
                try:
                    usuario = b.find_element(By.CSS_SELECTOR, 'div.d4r55').text
                    puntuacion = b.find_element(By.CSS_SELECTOR, 'span.fontBodyLarge.fzvQIb').text
                    fecha_raw = b.find_element(By.CSS_SELECTOR, 'span.xRkPPb').text.replace("\n", " ").strip()
                    fecha_estimada = estimar_fecha(fecha_raw)
                    texto = b.find_element(By.CSS_SELECTOR, 'span.wiI7pd').text.strip()
                    if not texto:
                        continue

                    clave = hashlib.md5(f"{usuario}-{texto}".encode()).hexdigest()
                    if clave in hashes:
                        continue
                    hashes.add(clave)

                    comentario = {
                        "usuario": usuario,
                        "puntuacion": puntuacion,
                        "fecha": fecha_estimada,
                        "texto": texto,
                        "fuente": "Google"
                    }
                    comentarios.append(comentario)
                except:
                    continue

            print(f"💬 {len(comentarios)} comentarios extraídos")
            total_comentarios += len(comentarios)
            datos["Barranquilla"].append({
                "id": i,
                "nombre": nombre,
                "url": enlace,
                "comentarios": comentarios
            })

        except Exception as e:
            print(f"❌ Error con hotel {i}: {str(e)[:60]}")
            continue

    with open("comentarios_hoteles.json", "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)

    with open("hoteles_enumerados.json", "w", encoding="utf-8") as f:
        json.dump(enlaces_hoteles, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 Scraping completado: {len(enlaces_hoteles)} hoteles procesados, {total_comentarios} comentarios extraídos.")
    print("📦 Lista enumerada guardada en hoteles_enumerados.json")

except Exception as e:
    print(f"❌ Error general: {str(e)[:60]}")

finally:
    try:
        input("\nPresiona Enter para cerrar el navegador...")
    except EOFError:
        pass
    driver.quit()