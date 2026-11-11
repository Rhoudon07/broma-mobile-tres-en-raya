# Simulador de Hackeo Inofensivo para Celulares Android (BromaPhone) 🎭📱

Una adaptación completa para **dispositivos móviles Android** del programa de broma de hackeo ubicado en `Broma`. Diseñado de forma 100% inofensiva y segura para gastarle una broma a amigos, compañeros de trabajo o familiares en sus teléfonos móviles.

---

## ⚡ ¿Cómo funciona la broma en el celular?

1. **Camuflaje Inicial (Juego Tres en Raya)**:
   - Al abrir la aplicación en el celular, se presenta como un juego legítimo y moderno de **Tres en Raya (Tic Tac Toe)** para Android.
   - La víctima puede tocar las casillas para jugar su turno ("Tú juegas con X").
   - Tras realizar la jugada, la CPU responde e inmediatamente **se desata la simulación de ataque**.

2. **Invasión de Terminales Móviles y Alertas Hacker**:
   - **Vibración háptica real**: El teléfono empieza a vibrar con pulsos de alarma realistas.
   - **Efectos sonoros de alarma**: Beeps y sirenas generadas nativamente por el hardware de audio del teléfono.
   - **Falsa barra de estado Android**: Muestra alertas críticas, `ROOT COMPROMISED`, CPU al 99% y sobrecalentamiento de batería al 1%.
   - **Múltiples ventanas de terminal flotantes**: Simulación estilo Termux / Kali Linux superponiéndose en la pantalla del celular:
     - Volcados hexadecimales de memoria en tiempo real (`0x7FFE...`, `0xDEADBEEF`).
     - Lluvia de código Matrix verde fosforescente.
     - Mensajes alarmantes adaptados específicamente al sistema operativo **Android**:
       - `[KERNEL] Explotando CVE-2026-Stagefright en libstagefright.so...`
       - `[ROOT] Obteniendo privilegios root mediante Dirty Pipe exploit...`
       - `[WHATSAPP] Extrayendo base de datos msgstore.db.crypt14 (18,421 mensajes)...`
       - `[DCIM] Volcado de /sdcard/DCIM/Camera: 843 fotos transmitidas a servidor C2...`
       - `[MIC/CAM] Grabación silenciosa en curso -> rtp://194.26.29.13:4444...`
       - `[BATERIA] Advertencia: Temperatura de CPU a 89°C (Límite crítico)...`
       - `[PLAY PROTECT] Servicio Google Play Protect detenido remotamente...`

3. **Popups y Diálogos Falsos del Sistema Android**:
   - Diálogo nativo idéntico a Android: *"Alerta de Seguridad Android: Trojan.AndroidOS.ShadowStrike detectado"*.
   - Diálogo de bloqueo: *"La interfaz del sistema com.android.systemui no responde"*.

4. **El "Crash" Crítico: Pantallazo de Android Recovery (El equivalente BSOD de Windows)**:
   - Toda la pantalla se oscurece y pasa al temido modo de recuperación **Android Recovery**:
   - Gráfico del robot de Android caído con el triángulo de peligro ⚠️.
   - Mensaje de corrupción crítica: `Can't load Android system. Your data may be corrupt.`
   - Barra de progreso en tiempo real: `Borrando almacenamiento interno: [████████░░] 68%... 98%...` con vibración continua.

5. **La Gran Revelación (¡¡¡ ES UNA BROMA !!!)**:
   - De golpe, la pantalla se transforma en un entorno verde esmeralda festivo con lluvia de confeti animado y una melodía alegre:
   - Cartel gigante: `¡¡¡ ES UNA BROMA !!! 🎭😂`
   - Aclaración tranquilizadora:
     - *"Tranquilo(a), tu celular está 100% seguro."*
     - *"No se ha tocado, leído ni borrado ninguna foto, mensaje ni archivo."*
     - *"Todo fue una simulación visual, háptica y sonora inofensiva. :)"*
   - Botón interactivo para reiniciar la broma o volver al Tres en Raya.

---

## 🔒 Seguridad Garantizada

- **No modifica ni borra ningún archivo ni directorio del teléfono.**
- **No accede a tu cámara, micrófono, fotos ni mensajes reales.**
- **No instala malware ni altera la configuración del sistema operativo.**
- **Es únicamente un efecto cosmético, auditivo y háptico inofensivo.**

---

## 🚀 ¿Cómo usarlo en cualquier celular Android?

Tienes dos formas sumamente sencillas de usarlo:

### Opción 1: Lanzador Rápido por WiFi / QR (Recomendado - Sin instalar nada)

Esta es la forma más rápida y divertida para gastar la broma de inmediato:

1. Asegúrate de que tu computadora y el celular de tu amigo estén conectados a la misma red WiFi.
2. En esta carpeta, haz doble clic en **`iniciar_servidor_movil.bat`**.
3. En la ventana negra verás:
   - El enlace local (por ejemplo `http://192.168.1.50:8080`).
   - El código QR para escanear con la cámara del celular.
4. Abre la cámara del celular o el navegador Google Chrome y accede al enlace.
5. Pásale el celular a tu amigo con el juego abierto y dile: *"Mira este juego de Tres en Raya que hice, ¿jugamos una partida?"*.
6. ¡En cuanto haga su primer movimiento, la broma se activará automáticamente!

> [!TIP]
> **Instalar como App en el teléfono (PWA):**
> Al abrir el enlace en Chrome para Android, pulsa en los 3 puntos superiores (menú) y selecciona **"Añadir a la pantalla de inicio"** o **"Instalar aplicación"**. Se creará un acceso directo en la pantalla del celular con el icono y nombre de "Tres en Raya Móvil" que se abre a pantalla completa como una app nativa.

---

### Opción 2: Proyecto React Native / Expo (Para compilar APK o usar Expo Go)

Las dependencias ya están instaladas. Puedes iniciar el servidor Expo de dos formas:

1. **Haciendo doble clic en `iniciar_expo.bat`** (Recomendado en Windows).
2. O ejecutando desde la terminal dentro de `BromaPhone`:
   ```bash
   npx expo start
   ```
3. Escanea el código QR desde la aplicación **Expo Go** en Android.
4. Para compilar un archivo APK independiente con EAS:
   ```bash
   eas build -p android --profile preview
   ```

---

## 📁 Estructura del Proyecto `BromaPhone`

```text
BromaPhone/
├── public/
│   ├── index.html               # Simulador móvil interactivo completo (PWA)
│   ├── manifest.json            # Manifiesto para instalación como app nativa en Android
│   ├── icon-192.png             # Icono de la app (192x192)
│   └── icon-512.png             # Icono de la app (512x512)
├── servidor_local.js            # Servidor HTTP con detección de IP y generación de enlace/QR
├── iniciar_servidor_movil.bat   # Script de 1 clic para Windows para iniciar el servidor
├── App.tsx                      # Componente React Native con lógica completa de la broma
├── app.json                     # Configuración de Expo / Android
├── package.json                 # Dependencias y scripts de ejecución
└── README.md                    # Documentación detallada
```

