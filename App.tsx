import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Animated,
  Vibration,
  Dimensions,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Fases extendidas de la broma (~32 segundos en total)
type PrankStage =
  | 'CAMOUFLAGE'
  | 'HACKER_INTRUSION'
  | 'RANSOMWARE_LOCK'
  | 'ANDROID_RECOVERY'
  | 'REVEAL';

interface ExfilFile {
  name: string;
  size: string;
  progress: number;
  status: 'UPLOADING' | 'SENT' | 'ENCRYPTED';
}

const SHELL_COMMANDS_SEQUENCE = [
  'root@android:/ # uname -a',
  'Linux localhost 5.15.137-android14-11-g9b2f8c #1 SMP PREEMPT',
  'root@android:/ # ./dirtypipe_exploit /system/bin/run-as',
  '[+] Escalando privilegios UID=0 (root) GID=0 (root)... OK!',
  '[+] SELinux cambiado de ENFORCING -> PERMISSIVE (0x0)',
  'root@android:/ # service call package 131 s16 com.google.android.gms i32 0',
  '[!] Google Play Protect & VerifyApps DESACTIVADOS',
  'root@android:/ # dumpsysiphonesubinfo | grep IMEI',
  '[+] IMEI/MEID capturado: 358921104829104 / SIM: ACTIVA',
  'root@android:/ # cat /data/misc/wifi/WifiConfigStore.xml',
  '[+] 7 redes WiFi guardadas y claves WPA2-PSK extraídas',
  'root@android:/ # sqlite3 /data/data/com.whatsapp/databases/msgstore.db',
  '[+] Volcando 24,819 mensajes y 1,402 notas de voz de WhatsApp...',
  'root@android:/ #sqlite3 /data/data/com.android.chrome/app_chrome/Default/Login\\ Data',
  '[+] Descifrando 64 contraseñas guardadas con Android Keystore...',
  'root@android:/ # ./cam_mic_stream --silent --dest rtp://185.220.101.47:4444',
  '[!] CÁMARA FRONTAL + MICRÓFONO transmitiendo en segundo plano (1080p)',
  'root@android:/ # iptables -A OUTPUT -d 185.220.101.47 -j ACCEPT',
  '[!] Túnel inverso SSH establecido con nodo C2 [TOR_EXIT_89]',
  'root@android:/ # ./shadow_crypt --alg AES-256-GCM /sdcard/ /data/user/0/',
  '[CRIT] Cifrado masivo de almacenamiento interno en progreso...',
];

const EXFIL_TARGET_FILES = [
  { name: '/sdcard/DCIM/Camera/IMG_20261109_221405.jpg', size: '4.8 MB' },
  { name: '/sdcard/DCIM/Camera/VID_20261108_193012.mp4', size: '68.4 MB' },
  { name: '/data/data/com.whatsapp/databases/msgstore.db', size: '142.1 MB' },
  { name: '/data/system/users/0/settings_secure.xml', size: '1.2 MB' },
  { name: '/data/misc/keystore/user_0/auth_tokens.bin', size: '3.7 MB' },
  { name: '/sdcard/WhatsApp/Media/Voice Notes/opus_pack.tar', size: '89.5 MB' },
  { name: '/data/data/com.android.chrome/Default/Cookies', size: '18.9 MB' },
  { name: '/sdcard/Download/estados_bancarios_2026.pdf', size: '6.3 MB' },
  { name: '/data/system/locksettings.db (PIN/Patrón Hash)', size: '0.8 MB' },
  { name: '/efs/nv_data.bin (Certificado Baseband/IMEI)', size: '12.0 MB' },
];

const SYSTEM_NOTIFICATIONS = [
  {
    app: 'Seguridad de Android • ahora',
    title: '⚠️ Google Play Protect desactivado',
    body: 'Un proceso con acceso root (PID 4091) detuvo la protección en tiempo real.',
  },
  {
    app: 'Sistema Android • ahora',
    title: '🔓 Depuración ADB inalámbrica activa',
    body: 'Conectado a cliente remoto 185.220.101.47:5555 con permisos de superusuario.',
  },
  {
    app: 'WhatsApp • ahora',
    title: '📤 Exportando base de datos de chats...',
    body: 'Transfiriendo copia sin cifrar (142 MB) a servidor externo.',
  },
  {
    app: 'Gestor de Batería • ahora',
    title: '🔥 Peligro de sobrecalentamiento (89.4°C)',
    body: 'La CPU está trabajando al 100% por proceso desconocido "kworker/u16:0-exploit".',
  },
];

const RECOVERY_LOG_LINES = [
  'Android Recovery',
  'google/husky/husky:14/UQ1A.240205.004/11269751',
  'user/release-keys',
  'Use volume up/down and power.',
  '--------------------------------------------',
  'E:Failed to verify boot_a VBMeta signature (ERR_MODIFIED)',
  'E:dm-verity corruption detected on /dev/block/dm-0',
  'E:SELinux policy integrity check FAILED!',
  'E:Can\'t load Android system. Your data is corrupt.',
  '--------------------------------------------',
  '[INIT] Emergency Factory Data Reset forced by bootloader...',
  '[MOUNT] Unmounting /data, /metadata, /sdcard...',
  '[WIPE] Formatting /data (f2fs) -> /dev/block/sda34...',
  '[WIPE] Erasing /sdcard/DCIM/Camera (1,284 photos)...',
  '[WIPE] Erasing /sdcard/WhatsApp (24,819 messages)...',
  '[WIPE] Purging /data/misc/keystore & biometric templates...',
  '[WIPE] Destroying EFS / NVRAM cellular calibration...',
  '[FLASH] Writing payload_boot_compromised.img to /boot_a...',
  '[WARN] DO NOT TURN OFF TARGET DURING NAND ERASE!',
];

export default function App() {
  const [stage, setStage] = useState<PrankStage>('CAMOUFLAGE');

  // Estado del juego Camuflaje (Tres en Raya)
  const [board, setBoard] = useState<string[]>(Array(9).fill(''));
  const [playerMoves, setPlayerMoves] = useState(0);

  // Telemetría realista en vivo
  const deviceName = Constants.deviceName || `${Platform.OS === 'android' ? 'Android' : 'Mobile'} Device`;
  const [cpuTemp, setCpuTemp] = useState(43.2);
  const [cpuLoad, setCpuLoad] = useState(64);
  const [batteryPct, setBatteryPct] = useState(78);
  const [uploadedMB, setUploadedMB] = useState(14.2);
  const [packetsCount, setPacketsCount] = useState(1420);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Terminales y archivos en vivo
  const [shellLogs, setShellLogs] = useState<string[]>([]);
  const [hexDumpLines, setHexDumpLines] = useState<string[]>([]);
  const [currentFileIdx, setCurrentFileIdx] = useState(0);
  const [fileProgress, setFileProgress] = useState(15);
  const [notifIndex, setNotifIndex] = useState(0);
  const [dialogStep, setDialogStep] = useState(0);
  const [panicClicks, setPanicClicks] = useState(0);

  // Fase Ransomware
  const [encryptedFilesCount, setEncryptedFilesCount] = useState(124);
  const [ransomProgress, setRansomProgress] = useState(12);

  // Fase Recovery
  const [recoveryPercent, setRecoveryPercent] = useState(0);
  const [recoveryVisibleLines, setRecoveryVisibleLines] = useState<string[]>(
    RECOVERY_LOG_LINES.slice(0, 6)
  );
  const [currentPartition, setCurrentPartition] = useState('/dev/block/by-name/userdata');

  // Animación de parpadeo e indicador de cámara
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.2, duration: 450, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [blinkAnim]);

  const triggerHapticAlarm = () => {
    Vibration.vibrate([120, 70, 120, 70, 280]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  };

  // Manejo de jugadas en Tres en Raya (permite 2 jugadas para mayor realismo antes del ataque)
  const handleCellPress = (index: number) => {
    if (board[index] !== '') return;

    Vibration.vibrate(35);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    const newMoves = playerMoves + 1;
    setPlayerMoves(newMoves);

    setTimeout(() => {
      const empties = newBoard
        .map((val, idx) => (val === '' ? idx : null))
        .filter((v) => v !== null) as number[];
      if (empties.length > 0) {
        const randIndex = empties[Math.floor(Math.random() * empties.length)];
        newBoard[randIndex] = 'O';
        setBoard([...newBoard]);
      }

      // En la segunda jugada (o si quedan pocas casillas), desatar el ataque
      if (newMoves >= 2 || empties.length <= 2) {
        setTimeout(() => {
          triggerPrank();
        }, 650);
      }
    }, 380);
  };

  const triggerPrank = () => {
    triggerHapticAlarm();
    setShellLogs(SHELL_COMMANDS_SEQUENCE.slice(0, 3));
    setHexDumpLines([
      '0x7FF8A010: 45 4C 46 02 01 01 00 00  |ELF.....|',
      '0x7FF8A020: 72 6F 6F 74 5F 73 68 65  |root_she|',
    ]);
    setCpuTemp(48.5);
    setCpuLoad(88);
    setBatteryPct(72);
    setUploadedMB(18.4);
    setPacketsCount(1890);
    setElapsedSec(0);
    setCurrentFileIdx(0);
    setFileProgress(20);
    setNotifIndex(0);
    setDialogStep(0);
    setPanicClicks(0);
    setStage('HACKER_INTRUSION');
  };

  // =========================================================================
  // FASE 1: HACKER_INTRUSION (~14 segundos de extracción y terminales en vivo)
  // =========================================================================
  useEffect(() => {
    if (stage !== 'HACKER_INTRUSION') return;

    let cmdCursor = 3;
    let tick = 0;

    const mainInterval = setInterval(() => {
      tick++;

      // Actualizar comandos de consola root
      if (cmdCursor < SHELL_COMMANDS_SEQUENCE.length) {
        const nextCmd = SHELL_COMMANDS_SEQUENCE[cmdCursor];
        setShellLogs((prev) => [...prev.slice(-11), nextCmd]);
        cmdCursor++;
      } else {
        const randPid = Math.floor(2100 + Math.random() * 6800);
        const dynamicLog = `[EXFIL #${randPid}] Bloque TCP enviado -> 185.220.101.47:4444 (ACK)`;
        setShellLogs((prev) => [...prev.slice(-11), dynamicLog]);
      }

      // Actualizar volcado hexadecimal de memoria y claves
      const addr = (0x7ff8b000 + tick * 0x20).toString(16).toUpperCase();
      const b1 = Math.floor(Math.random() * 255).toString(16).padStart(2, '0').toUpperCase();
      const b2 = Math.floor(Math.random() * 255).toString(16).padStart(2, '0').toUpperCase();
      const b3 = Math.floor(Math.random() * 255).toString(16).padStart(2, '0').toUpperCase();
      const b4 = Math.floor(Math.random() * 255).toString(16).padStart(2, '0').toUpperCase();
      const asciiTag = ['KEY_AUTH', 'PASS_DB ', 'MSG_WA  ', 'DCIM_RAW', 'OAUTH_TK', 'PIN_HASH'][
        tick % 6
      ];
      setHexDumpLines((prev) => [
        ...prev.slice(-5),
        `0x${addr}: ${b1} ${b2} ${b3} ${b4}  |${asciiTag}|`,
      ]);

      // Actualizar telemetría realista
      setCpuTemp((prev) => Math.min(94.8, +(prev + 1.4 + Math.random() * 0.9).toFixed(1)));
      setCpuLoad(Math.min(100, 91 + Math.floor(Math.random() * 9)));
      setBatteryPct((prev) => Math.max(1, prev - (tick % 2 === 0 ? 3 : 2)));
      setUploadedMB((prev) => +(prev + 11.7 + Math.random() * 6.5).toFixed(1));
      setPacketsCount((prev) => prev + Math.floor(240 + Math.random() * 190));
      setElapsedSec((prev) => prev + 1);

      // Avanzar barra de archivo exfiltrado
      setFileProgress((prev) => {
        const next = prev + 38;
        if (next >= 100) {
          setCurrentFileIdx((idx) => (idx + 1) % EXFIL_TARGET_FILES.length);
          return 15;
        }
        return next;
      });

      // Rotar notificaciones falsas de sistema Android
      if (tick % 5 === 0) {
        setNotifIndex((prev) => (prev + 1) % SYSTEM_NOTIFICATIONS.length);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      } else {
        Vibration.vibrate(35);
      }

      // Mostrar diálogo de alerta de seguridad a mitad de la intrusión
      if (tick === 7) {
        setDialogStep(1);
        Vibration.vibrate([150, 80, 150]);
      }
    }, 520);

    // Pasar a la fase de bloqueo Ransomware tras ~14.5 segundos
    const nextPhaseTimer = setTimeout(() => {
      clearInterval(mainInterval);
      triggerHapticAlarm();
      setStage('RANSOMWARE_LOCK');
    }, 14500);

    return () => {
      clearInterval(mainInterval);
      clearTimeout(nextPhaseTimer);
    };
  }, [stage]);

  // =========================================================================
  // FASE 2: RANSOMWARE_LOCK (~9 segundos de cifrado de particiones y bloqueo)
  // =========================================================================
  useEffect(() => {
    if (stage !== 'RANSOMWARE_LOCK') return;

    setRansomProgress(14);
    setEncryptedFilesCount(180);

    const lockInterval = setInterval(() => {
      setRansomProgress((prev) => Math.min(99, prev + Math.floor(Math.random() * 9) + 6));
      setEncryptedFilesCount((prev) => prev + Math.floor(Math.random() * 145) + 65);
      setCpuTemp((prev) => Math.min(97.2, +(prev + 0.4).toFixed(1)));
      setBatteryPct((prev) => Math.max(1, prev - 2));
      Vibration.vibrate(55);
    }, 450);

    const recoveryTimer = setTimeout(() => {
      clearInterval(lockInterval);
      Vibration.vibrate([350, 120, 350, 120, 500]);
      setStage('ANDROID_RECOVERY');
    }, 8500);

    return () => {
      clearInterval(lockInterval);
      clearTimeout(recoveryTimer);
    };
  }, [stage]);

  // =========================================================================
  // FASE 3: ANDROID_RECOVERY (~10 segundos de formateo y volcado de particiones)
  // =========================================================================
  useEffect(() => {
    if (stage !== 'ANDROID_RECOVERY') return;

    let currentPct = 0;
    let lineIdx = 6;
    const partitions = [
      '/dev/block/by-name/userdata (f2fs)',
      '/sdcard/DCIM/Camera (1,284 files)',
      '/data/data/com.whatsapp/databases',
      '/data/misc/keystore (Hardware TEE)',
      '/dev/block/by-name/efs (IMEI/Modem)',
      '/dev/block/by-name/metadata',
    ];

    const progressInterval = setInterval(() => {
      // Pausas dramáticas en 34%, 68% y 94%
      const step =
        currentPct > 30 && currentPct < 38
          ? 2
          : currentPct > 64 && currentPct < 72
          ? 3
          : Math.floor(Math.random() * 7) + 4;

      currentPct = Math.min(99, currentPct + step);
      setRecoveryPercent(currentPct);
      setCurrentPartition(
        partitions[Math.min(partitions.length - 1, Math.floor((currentPct / 100) * partitions.length))]
      );

      if (lineIdx < RECOVERY_LOG_LINES.length) {
        const nextLine = RECOVERY_LOG_LINES[lineIdx];
        setRecoveryVisibleLines((prev) => [...prev.slice(-11), nextLine]);
        lineIdx++;
      }

      Vibration.vibrate(40);

      if (currentPct >= 99) {
        clearInterval(progressInterval);
        setTimeout(() => {
          setStage('REVEAL');
          Vibration.vibrate([100, 60, 100, 60, 400]);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }, 2400);
      }
    }, 450);

    return () => clearInterval(progressInterval);
  }, [stage]);

  const handleFakeDialogButton = () => {
    Vibration.vibrate([80, 40, 160]);
    setPanicClicks((prev) => prev + 1);
    setDialogStep((prev) => prev + 1);
  };

  const resetAll = () => {
    setBoard(Array(9).fill(''));
    setPlayerMoves(0);
    setShellLogs([]);
    setRecoveryPercent(0);
    setStage('CAMOUFLAGE');
  };

  const currentNotif = SYSTEM_NOTIFICATIONS[notifIndex % SYSTEM_NOTIFICATIONS.length];
  const currentTargetFile = EXFIL_TARGET_FILES[currentFileIdx % EXFIL_TARGET_FILES.length];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ========================================================= */}
      {/* 1. CAMUFLAJE: TRES EN RAYA                                */}
      {/* ========================================================= */}
      {stage === 'CAMOUFLAGE' && (
        <View style={styles.camuContainer}>
          <View style={styles.camuHeader}>
            <Text style={styles.camuTitle}>TRES EN RAYA</Text>
            <Text style={styles.camuSubtitle}>Edición Móvil Pro • Modo IA</Text>
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Tú (X)</Text>
              <Text style={styles.scoreValue}>1</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Empates</Text>
              <Text style={styles.scoreValue}>2</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>CPU (O)</Text>
              <Text style={styles.scoreValue}>1</Text>
            </View>
          </View>

          <View style={styles.board}>
            {board.map((cell, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.cell}
                activeOpacity={0.7}
                onPress={() => handleCellPress(idx)}
              >
                <Text style={[styles.cellText, cell === 'X' ? styles.cellX : styles.cellO]}>
                  {cell}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.camuActions}>
            <TouchableOpacity style={styles.btnCamu} onPress={() => handleCellPress(4)}>
              <Text style={styles.btnCamuText}>⚡ Jugar Partida Rápida</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnCamuSec} onPress={triggerPrank}>
              <Text style={styles.btnCamuSecText}>🎭 Iniciar Broma Directa</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ========================================================= */}
      {/* 2. ATAQUE HACKER: INTRUSIÓN, TELEMETRÍA Y EXFILTRACIÓN    */}
      {/* ========================================================= */}
      {stage === 'HACKER_INTRUSION' && (
        <View style={styles.hackerContainer}>
          {/* Barra superior con indicador verde real de Cámara/Micrófono de Android 14 */}
          <View style={styles.fakeStatusBar}>
            <View style={styles.statusRowLeft}>
              <Animated.Text style={[styles.fakeStatusRed, { opacity: blinkAnim }]}>
                ● ROOT_SHELL
              </Animated.Text>
              <Text style={styles.fakeStatusMono}>185.220.101.47:4444</Text>
            </View>
            <View style={styles.privacyDotPill}>
              <Text style={styles.privacyDotText}>🎥 🎙️ REC</Text>
            </View>
          </View>

          {/* Notificación flotante tipo Heads-Up de Android */}
          <View style={styles.headsUpNotif}>
            <View style={styles.notifHeaderRow}>
              <Text style={styles.notifAppText}>{currentNotif.app}</Text>
              <Text style={styles.notifBadge}>CRÍTICO</Text>
            </View>
            <Text style={styles.notifTitle}>{currentNotif.title}</Text>
            <Text style={styles.notifBody}>{currentNotif.body}</Text>
          </View>

          {/* Panel de Telemetría del Dispositivo en Tiempo Real */}
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>DISPOSITIVO / KERNEL</Text>
              <Text style={styles.telemetryValCyan} numberOfLines={1}>
                {deviceName} (UID:0)
              </Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>TEMP CPU / CARGA</Text>
              <Text style={styles.telemetryValCrit}>
                {cpuTemp}°C ({cpuLoad}%) 🔥
              </Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>DATOS EXTRAÍDOS</Text>
              <Text style={styles.telemetryValWarn}>
                {uploadedMB} MB ({packetsCount} pkts)
              </Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>DRENAJE BATERÍA</Text>
              <Text style={styles.telemetryValCrit}>
                {batteryPct}% (Descarga rápida)
              </Text>
            </View>
          </View>

          {/* Monitor de Exfiltración de Archivos */}
          <View style={styles.exfilBox}>
            <View style={styles.exfilHeader}>
              <Text style={styles.exfilTitle}>
                {'📤 EXFILTRANDO ARCHIVOS PRIVADOS (TLS 1.3 -> C2)'}
              </Text>
              <Text style={styles.exfilSpeed}>46.8 MB/s</Text>
            </View>
            <Text style={styles.exfilFileName} numberOfLines={1}>
              {currentTargetFile.name} ({currentTargetFile.size})
            </Text>
            <View style={styles.exfilBarBg}>
              <View style={[styles.exfilBarFill, { width: `${fileProgress}%` }]} />
            </View>
          </View>

          {/* Ventana de Terminal Root ADB */}
          <View style={styles.terminalCard}>
            <View style={styles.termTitlebar}>
              <Text style={styles.termTitle}>
                TERMUX // ADB_ROOT_DAEMON [PID: 4091]
              </Text>
              <View style={styles.dotsRow}>
                <View style={[styles.dot, { backgroundColor: '#ff4444' }]} />
                <View style={[styles.dot, { backgroundColor: '#ffbb00' }]} />
                <View style={[styles.dot, { backgroundColor: '#00e676' }]} />
              </View>
            </View>
            <ScrollView style={styles.termBody}>
              {shellLogs.map((log, i) => (
                <Text
                  key={i}
                  style={[
                    styles.termText,
                    log.includes('[!]') || log.includes('[CRIT]')
                      ? styles.termCrit
                      : log.includes('[+]')
                      ? styles.termWarn
                      : styles.termGreen,
                  ]}
                >
                  {log}
                </Text>
              ))}
            </ScrollView>
          </View>

          {/* Volcado de Memoria Keystore / RAM */}
          <View style={styles.hexCard}>
            <Text style={styles.hexHeader}>
              MEMORY DUMP // ANDROID KEYSTORE & CREDENTIALS:
            </Text>
            {hexDumpLines.map((h, i) => (
              <Text key={i} style={styles.hexLine}>
                {h}
              </Text>
            ))}
          </View>

          {/* Diálogo emergente interactivo (Trampa: al tocar empeora la alerta) */}
          {dialogStep >= 1 && (
            <View style={styles.androidDialogOverlay}>
              <View style={styles.androidDialog}>
                <Text style={styles.dialogIcon}>{dialogStep === 1 ? '⚠️' : '⛔'}</Text>
                <Text style={styles.dialogTitle}>
                  {dialogStep === 1
                    ? 'Alerta Crítica de Seguridad Android'
                    : 'Acceso Denegado por Superusuario (Root)'}
                </Text>
                <Text style={styles.dialogMsg}>
                  {dialogStep === 1 ? (
                    <>
                      Se detectó <Text style={styles.boldRed}>Trojan.AndroidOS.Pegasus.v4</Text>{' '}
                      extrayendo credenciales bancarias, fotos de galería y base de datos de
                      WhatsApp.
                    </>
                  ) : (
                    <>
                      El proceso <Text style={styles.boldRed}>com.android.systemui</Text> está
                      controlado remotamente (Intento #{panicClicks} bloqueado). Iniciando cifrado
                      de partición <Text style={styles.boldRed}>/data/user/0</Text>...
                    </>
                  )}
                </Text>
                <View style={styles.dialogButtons}>
                  <TouchableOpacity style={styles.dialogBtnCancel} onPress={handleFakeDialogButton}>
                    <Text style={styles.dialogBtnCancelText}>Apagar Red</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dialogBtn} onPress={handleFakeDialogButton}>
                    <Text style={styles.dialogBtnText}>
                      {dialogStep === 1 ? 'Abortar Extracción' : 'Forzar Detención'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ========================================================= */}
      {/* 3. FASE RANSOMWARE & BLOQUEO DE PARTICIONES               */}
      {/* ========================================================= */}
      {stage === 'RANSOMWARE_LOCK' && (
        <View style={styles.ransomContainer}>
          <View style={styles.ransomBanner}>
            <Text style={styles.ransomSkull}>🔒⚠️🔓</Text>
            <Text style={styles.ransomTitle}>DISPOSITIVO BLOQUEADO // AES-256-GCM</Text>
            <Text style={styles.ransomSub}>
              Cifrando almacenamiento interno y credenciales del teléfono...
            </Text>
          </View>

          <View style={styles.partitionCard}>
            <Text style={styles.partitionHeader}>ESTADO DE PARTICIONES DEL SISTEMA:</Text>
            <View style={styles.partRow}>
              <Text style={styles.partName}>/sdcard/DCIM/Camera (Fotos/Videos)</Text>
              <Text style={styles.partLocked}>[CIFRADO]</Text>
            </View>
            <View style={styles.partRow}>
              <Text style={styles.partName}>/data/data/com.whatsapp (Chats)</Text>
              <Text style={styles.partLocked}>[EXFILTRADO]</Text>
            </View>
            <View style={styles.partRow}>
              <Text style={styles.partName}>/data/misc/keystore (Claves/Bancos)</Text>
              <Text style={styles.partLocked}>[CLONADO]</Text>
            </View>
            <View style={styles.partRow}>
              <Text style={styles.partName}>/efs/imei_nv_data.bin (SIM/Red)</Text>
              <Text style={styles.partWarn}>[COMPROMETIDO]</Text>
            </View>
            <View style={styles.partRow}>
              <Text style={styles.partName}>/system/priv-app/SystemUI</Text>
              <Text style={styles.partLocked}>[SOBRESCRITO]</Text>
            </View>
          </View>

          <View style={styles.ransomStatsBox}>
            <Text style={styles.ransomStatLine}>
              Archivos personales cifrados: <Text style={styles.boldRed}>{encryptedFilesCount}</Text>
            </Text>
            <Text style={styles.ransomStatLine}>
              Temperatura del procesador: <Text style={styles.boldRed}>{cpuTemp}°C</Text>
            </Text>
            <Text style={styles.ransomStatLine}>
              Clave privada RSA-4096 almacenada en: <Text style={styles.monoCyan}>185.220.101.47</Text>
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Cifrando sectores de usuario (/data):</Text>
              <Text style={styles.progressValue}>{ransomProgress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${ransomProgress}%` }]} />
            </View>
          </View>

          <Text style={styles.ransomFooterWarn}>
            ⚠️ ERROR DE KERNEL DETECTADO: Reiniciando en modo Android Recovery...
          </Text>
        </View>
      )}

      {/* ========================================================= */}
      {/* 4. ANDROID RECOVERY CRASH (FASTBOOT / WIPE DATA)          */}
      {/* ========================================================= */}
      {stage === 'ANDROID_RECOVERY' && (
        <View style={styles.recoveryContainer}>
          <View style={styles.recoveryTopBar}>
            <Text style={styles.fastbootBadge}>BOOTLOADER STATE: UNLOCKED (RED STATE)</Text>
          </View>

          <Text style={styles.deadAndroidIcon}>🤖 ⚠️</Text>
          <Text style={styles.recoveryTitle}>Android Recovery</Text>
          <Text style={styles.recoveryBuild}>
            google/husky/husky:14/UQ1A.240205.004/release-keys
          </Text>

          <View style={styles.recoveryMenuBox}>
            <Text style={styles.recoveryMenuItem}>  Reboot system now</Text>
            <Text style={styles.recoveryMenuItem}>  Apply update from ADB</Text>
            <Text style={styles.recoveryMenuSelected}>▶ Wipe data/factory reset [AUTO-EXEC]</Text>
            <Text style={styles.recoveryMenuItem}>  Format /sdcard & internal storage</Text>
          </View>

          <View style={styles.recoveryConsole}>
            {recoveryVisibleLines.map((line, idx) => (
              <Text
                key={idx}
                style={[
                  styles.recoveryText,
                  line.startsWith('E:') || line.startsWith('[WARN]')
                    ? { color: '#ff5252' }
                    : line.startsWith('[WIPE]')
                    ? { color: '#ffd740' }
                    : null,
                ]}
              >
                {line}
              </Text>
            ))}
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.partitionTargetText}>
              Objetivo actual: {currentPartition}
            </Text>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Borrando particiones y almacenamiento:</Text>
              <Text style={styles.progressValue}>{recoveryPercent}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${recoveryPercent}%` }]} />
            </View>
          </View>
        </View>
      )}

      {/* ========================================================= */}
      {/* 5. LA GRAN REVELACIÓN (¡¡¡ ES UNA BROMA !!!)              */}
      {/* ========================================================= */}
      {stage === 'REVEAL' && (
        <View style={styles.revealContainer}>
          <View style={styles.revealCard}>
            <Text style={styles.revealEmoji}>🎭😂</Text>
            <Text style={styles.revealHeader}>¡¡¡ ES UNA BROMA !!!</Text>
            <Text style={styles.revealSub}>
              ¡Respira tranquilo(a)! Tu teléfono está 100% seguro e intacto.
            </Text>

            <View style={styles.safeBox}>
              <Text style={styles.safeTitle}>🔒 Informe Real de Seguridad:</Text>
              <Text style={styles.safeItem}>
                • Ninguna foto, video ni archivo de tu galería fue leído ni borrado.
              </Text>
              <Text style={styles.safeItem}>
                • Tus chats de WhatsApp, contraseñas y contactos están intactos.
              </Text>
              <Text style={styles.safeItem}>
                • Tu cámara, micrófono y batería no sufrieron ninguna alteración.
              </Text>
              <Text style={styles.safeItem}>
                • Todo fue una simulación visual y háptica totalmente inofensiva. :)
              </Text>
            </View>

            <TouchableOpacity style={styles.btnReset} onPress={triggerPrank}>
              <Text style={styles.btnResetText}>🔄 Repetir Simulación de Broma</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnBack} onPress={resetAll}>
              <Text style={styles.btnBackText}>🎮 Volver al Juego Tres en Raya</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  // Camouflage
  camuContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  camuHeader: {
    alignItems: 'center',
    marginTop: 10,
  },
  camuTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#00f2fe',
    letterSpacing: 1.5,
  },
  camuSubtitle: {
    fontSize: 13,
    color: '#8fa0be',
    marginTop: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scoreBox: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#7b8fa8',
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  board: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 320,
    aspectRatio: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cell: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#151c2e',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 40,
    fontWeight: '900',
  },
  cellX: {
    color: '#00e5ff',
  },
  cellO: {
    color: '#ff3366',
  },
  camuActions: {
    width: '100%',
    maxWidth: 320,
    gap: 10,
    marginBottom: 10,
  },
  btnCamu: {
    backgroundColor: '#0072ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCamuText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnCamuSec: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCamuSecText: {
    color: '#8fa0be',
    fontSize: 13,
  },

  // Hacker Intrusion
  hackerContainer: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  fakeStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: '#ff3b30',
  },
  statusRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fakeStatusRed: {
    color: '#ff3b30',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  fakeStatusMono: {
    color: '#ccc',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  privacyDotPill: {
    backgroundColor: '#2fd159',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  privacyDotText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  headsUpNotif: {
    backgroundColor: '#1e222b',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#ff3b30',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notifAppText: {
    color: '#9aa4b8',
    fontSize: 10,
  },
  notifBadge: {
    color: '#ff5252',
    fontSize: 9,
    fontWeight: 'bold',
  },
  notifTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notifBody: {
    color: '#cbd2e0',
    fontSize: 11,
    marginTop: 1,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 4,
  },
  telemetryItem: {
    width: '49%',
    backgroundColor: '#0c1218',
    borderWidth: 1,
    borderColor: '#1f2d3d',
    borderRadius: 6,
    padding: 6,
  },
  telemetryLabel: {
    color: '#6c7d93',
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  telemetryValCyan: {
    color: '#00e5ff',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginTop: 2,
  },
  telemetryValCrit: {
    color: '#ff4444',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginTop: 2,
  },
  telemetryValWarn: {
    color: '#ffca28',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginTop: 2,
  },
  exfilBox: {
    backgroundColor: '#140808',
    borderWidth: 1,
    borderColor: '#ff3344',
    borderRadius: 6,
    padding: 7,
    marginTop: 6,
  },
  exfilHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  exfilTitle: {
    color: '#ff5252',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  exfilSpeed: {
    color: '#00e676',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  exfilFileName: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  exfilBarBg: {
    height: 6,
    backgroundColor: '#2a0f0f',
    borderRadius: 3,
    overflow: 'hidden',
  },
  exfilBarFill: {
    height: '100%',
    backgroundColor: '#ff3344',
  },
  terminalCard: {
    flex: 1,
    backgroundColor: '#050c08',
    borderWidth: 1,
    borderColor: '#00ff66',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 6,
  },
  termTitlebar: {
    backgroundColor: '#002b11',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: '#00ff66',
  },
  termTitle: {
    color: '#00ff66',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  termBody: {
    flex: 1,
    padding: 6,
  },
  termText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    lineHeight: 13,
    marginBottom: 2,
  },
  termGreen: { color: '#00ff66' },
  termWarn: { color: '#ffcc00' },
  termCrit: { color: '#ff3344', fontWeight: 'bold' },
  hexCard: {
    backgroundColor: '#070a0f',
    borderWidth: 1,
    borderColor: '#1e3a5f',
    borderRadius: 6,
    padding: 6,
    marginTop: 6,
  },
  hexHeader: {
    color: '#4fc3f7',
    fontSize: 8.5,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  hexLine: {
    color: '#80deea',
    fontSize: 8.5,
    fontFamily: 'monospace',
  },
  androidDialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  androidDialog: {
    backgroundColor: '#22252d',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.45)',
    width: '100%',
    maxWidth: 330,
  },
  dialogIcon: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 6,
  },
  dialogTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  dialogMsg: {
    color: '#d0d6e2',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 14,
  },
  boldRed: {
    color: '#ff5252',
    fontWeight: 'bold',
  },
  monoCyan: {
    color: '#00e5ff',
    fontFamily: 'monospace',
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  dialogBtnCancel: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  dialogBtnCancelText: {
    color: '#bbb',
    fontSize: 12,
    fontWeight: '600',
  },
  dialogBtn: {
    backgroundColor: '#d32f2f',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dialogBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Ransomware Phase
  ransomContainer: {
    flex: 1,
    backgroundColor: '#090002',
    padding: 18,
    justifyContent: 'space-between',
  },
  ransomBanner: {
    backgroundColor: '#2b0006',
    borderWidth: 1,
    borderColor: '#ff1744',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  ransomSkull: {
    fontSize: 34,
    marginBottom: 6,
  },
  ransomTitle: {
    color: '#ff1744',
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  ransomSub: {
    color: '#ffcdd2',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  partitionCard: {
    backgroundColor: '#120508',
    borderWidth: 1,
    borderColor: '#4a121b',
    borderRadius: 10,
    padding: 12,
  },
  partitionHeader: {
    color: '#ff8a80',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  partRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  partName: {
    color: '#e0e0e0',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  partLocked: {
    color: '#ff1744',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  partWarn: {
    color: '#ffca28',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  ransomStatsBox: {
    backgroundColor: '#0d0d0d',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#222',
    gap: 5,
  },
  ransomStatLine: {
    color: '#ccc',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  ransomFooterWarn: {
    color: '#ffca28',
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  // Android Recovery
  recoveryContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  recoveryTopBar: {
    width: '100%',
    backgroundColor: '#260000',
    borderWidth: 1,
    borderColor: '#ff3333',
    paddingVertical: 4,
    alignItems: 'center',
    borderRadius: 4,
  },
  fastbootBadge: {
    color: '#ff5252',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  deadAndroidIcon: {
    fontSize: 42,
    marginTop: 6,
    textAlign: 'center',
  },
  recoveryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4444',
    letterSpacing: 1,
  },
  recoveryBuild: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#888',
    marginBottom: 8,
  },
  recoveryMenuBox: {
    width: '100%',
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
    paddingVertical: 6,
    marginBottom: 8,
  },
  recoveryMenuItem: {
    color: '#00e5ff',
    fontFamily: 'monospace',
    fontSize: 10,
    paddingVertical: 2,
  },
  recoveryMenuSelected: {
    backgroundColor: '#ff3333',
    color: '#000',
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
    paddingVertical: 3,
  },
  recoveryConsole: {
    width: '100%',
    flex: 1,
    backgroundColor: '#060606',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  recoveryText: {
    color: '#bbb',
    fontFamily: 'monospace',
    fontSize: 9.5,
    lineHeight: 14,
  },
  partitionTargetText: {
    color: '#ffd740',
    fontFamily: 'monospace',
    fontSize: 10,
    marginBottom: 4,
  },
  progressContainer: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressLabel: {
    color: '#ff5555',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  progressValue: {
    color: '#ff5555',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#222',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#444',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ff3333',
  },

  // Reveal
  revealContainer: {
    flex: 1,
    backgroundColor: '#06190e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  revealCard: {
    alignItems: 'center',
    width: '100%',
  },
  revealEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  revealHeader: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffe600',
    textAlign: 'center',
    marginBottom: 8,
  },
  revealSub: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 18,
  },
  safeBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,128,0.3)',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  safeTitle: {
    color: '#00e676',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 6,
  },
  safeItem: {
    color: '#d7ffe4',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 3,
  },
  btnReset: {
    backgroundColor: '#00e676',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnResetText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
  btnBack: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnBackText: {
    color: '#fff',
    fontSize: 13,
  },
});
