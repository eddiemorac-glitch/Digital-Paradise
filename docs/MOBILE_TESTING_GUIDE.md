# 📱 Guía de Pruebas Móviles y Responsivas

Esta guía explica las diferentes maneras de visualizar y probar el frontend de **Caribe Digital CR** en dispositivos móviles (Android/iOS) y diferentes tamaños de pantalla, directamente desde tu PC o en dispositivos físicos.

## 1. Extensiones de VS Code (Simulación dentro del IDE)

Estas extensiones te permiten ver la página web dentro de un marco de teléfono sin salir de Visual Studio Code.

*   **[Mobile View](https://marketplace.visualstudio.com/items?itemName=Lirobi.mobile-view)**: Abre una vista móvil responsiva dentro de VS Code. Soporta marcos de iPhone/Android y recarga automática al guardar.
*   **[Live Preview (Microsoft)](https://marketplace.visualstudio.com/items?itemName=ms-vscode.live-server)**: Un servidor local con un navegador embebido. Aunque es genérico, permite abrir la vista en una pestaña lateral y usar las herramientas de desarrollador para simular móviles.
*   **[Phone View](https://marketplace.visualstudio.com/items?itemName=clover-it.phone-view)**: Proporciona marcos realistas de teléfonos para previsualizar tu sitio.

## 2. Herramientas de Desarrollador del Navegador (Device Mode)

La forma más rápida sin instalar nada nuevo:
1.  Abre tu sitio en Chrome/Edge (`http://localhost:5173`).
2.  Presiona `F12` o `Ctrl + Shift + I`.
3.  Haz clic en el icono de **dispositivos** (un pequeño celular y tablet) en la esquina superior izquierda de la consola.
4.  Selecciona un modelo (ej. iPhone 14 Pro, Samsung Galaxy S8) en el menú desplegable superior.

## 3. Pruebas en Dispositivo Físico (Red Local)

Para ver la app **real** en tu propio teléfono:
1.  Asegúrate de que tu PC y tu teléfono estén en la **misma red Wi-Fi**.
2.  En tu PC, abre una terminal y escribe `ipconfig` (Windows) para buscar tu **IPv4 Address** (ej. `192.168.1.15`).
3.  En el navegador de tu teléfono, ingresa: `http://TU_IP:5173` (ej. `http://192.168.1.15:5173`).

> [!TIP]
> Si usas Vite, asegúrate de que el servidor esté escuchando en todas las interfaces. Puedes ejecutarlo con:
> `npm run dev -- --host`

## 4. Túneles para Pruebas Remotas (ngrok / Localtunnel)

Si quieres que alguien más pruebe la página o probarla fuera de tu Wi-Fi:

*   **Localtunnel (Gratis y rápido)**:
    ```bash
    npx localtunnel --port 5173
    ```
    Esto te dará una URL pública (ej. `https://funny-monkeys-jump.loca.lt`) que puedes abrir en cualquier lugar.

*   **ngrok**: Más estable pero requiere cuenta.
    ```bash
    ngrok http 5173
    ```

---
*Documentación generada para facilitar el desarrollo frontend de Caribe Digital CR.*
