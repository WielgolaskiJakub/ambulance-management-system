let audioContext: AudioContext | null = null;
let soundEnabled = false;
let criticalAlarmIntervalId: number | null = null;

type AudioContextConstructor = typeof AudioContext;

function getAudioContext(): AudioContext | null {
  if (audioContext) {
    return audioContext;
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  audioContext = new AudioContextClass();

  return audioContext;
}

function playTone(
  context: AudioContext,
  frequency: number,
  delaySeconds: number,
  durationSeconds: number,
  volume = 0.3,
  oscillatorType: OscillatorType = "sine"
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = oscillatorType;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);

  gain.gain.setValueAtTime(0.0001, context.currentTime + delaySeconds);
  gain.gain.exponentialRampToValueAtTime(
    volume,
    context.currentTime + delaySeconds + 0.01
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    context.currentTime + delaySeconds + durationSeconds
  );

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(context.currentTime + delaySeconds);
  oscillator.stop(context.currentTime + delaySeconds + durationSeconds);
}

export async function enableNewOrderSound(): Promise<void> {
  const context = getAudioContext();

  if (!context) {
    throw new Error("AudioContext is not supported");
  }

  if (context.state === "suspended") {
    await context.resume();
  }

  soundEnabled = true;

  playNewOrderSound();
}

export function disableNewOrderSound() {
  soundEnabled = false;
  stopCriticalOrderAlarm();
}

export function isNewOrderSoundEnabled(): boolean {
  return soundEnabled;
}

export function playNewOrderSound() {
  if (!soundEnabled) {
    return;
  }

  const context = getAudioContext();

  if (!context || context.state === "suspended") {
    return;
  }

  playTone(context, 950, 0, 0.12, 0.35, "square");
  playTone(context, 750, 0.16, 0.14, 0.35, "square");
}

function playCriticalAlarmCycle() {
  if (!soundEnabled) {
    return;
  }

  const context = getAudioContext();

  if (!context || context.state === "suspended") {
    return;
  }

  // BEEP BEEP BEEP BEEP BEEP — ostre, krótkie, wysokie.
  playTone(context, 1600, 0, 0.11, 0.95, "square");
  playTone(context, 1600, 0.16, 0.11, 0.95, "square");
  playTone(context, 1600, 0.32, 0.11, 0.95, "square");
  playTone(context, 1600, 0.48, 0.11, 0.95, "square");
  playTone(context, 1600, 0.64, 0.11, 0.95, "square");

  // Krótkie niskie dobicie, żeby nie było jak budzik z nokii.
  playTone(context, 900, 0.82, 0.14, 0.75, "sawtooth");
}

export function startCriticalOrderAlarm() {
  if (!soundEnabled || criticalAlarmIntervalId !== null) {
    return;
  }

  playCriticalAlarmCycle();

  criticalAlarmIntervalId = window.setInterval(() => {
    playCriticalAlarmCycle();
  }, 1150);
}

export function stopCriticalOrderAlarm() {
  if (criticalAlarmIntervalId === null) {
    return;
  }

  window.clearInterval(criticalAlarmIntervalId);
  criticalAlarmIntervalId = null;
}