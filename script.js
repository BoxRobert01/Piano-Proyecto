
// PIANO VIRTUAL - JAVASCRIPT COMPLETO

(() => {
  "use strict";

  // 1. TECLAS DEL PIANO

  const KEY_TO_PITCH = {
    KeyA: "C4",
    KeyW: "C#4",
    KeyS: "D4",
    KeyE: "D#4",
    KeyD: "E4",
    KeyF: "F4",
    KeyT: "F#4",
    KeyG: "G4",
    KeyY: "G#4",
    KeyH: "A4",
    KeyU: "A#4",
    KeyJ: "B4",
    KeyK: "C5",
    KeyO: "C#5",
    KeyL: "D5",
    KeyP: "D#5",
    Semicolon: "E5"
  };

  const PITCH_TO_LABEL = Object.fromEntries(
    Object.entries(KEY_TO_PITCH).map(([code, pitch]) => [
      pitch,
      code === "Semicolon" ? ";" : code.slice(-1)
    ])
  );

  const PITCHES = Object.values(KEY_TO_PITCH);

  const NAMES = [
    "C", "C#", "D", "D#", "E", "F",
    "F#", "G", "G#", "A", "A#", "B"
  ];

  // 2. CONFIGURACION DE ANIMACION

  const PX_PER_BEAT = 120;
  const HIT_Y = 310;

  // 3. CANCIONES

  const SONGS = [
    {
      id: "twinkle",
      title: "Twinkle, Twinkle, Little Star",
      composer: "Traditional",
      bpm: 90,
      notes: [
        ["C4",1],["C4",1],["G4",1],["G4",1],
        ["A4",1],["A4",1],["G4",2],
        ["F4",1],["F4",1],["E4",1],["E4",1],
        ["D4",1],["D4",1],["C4",2],
        ["G4",1],["G4",1],["F4",1],["F4",1],
        ["E4",1],["E4",1],["D4",2],
        ["G4",1],["G4",1],["F4",1],["F4",1],
        ["E4",1],["E4",1],["D4",2],
        ["C4",1],["C4",1],["G4",1],["G4",1],
        ["A4",1],["A4",1],["G4",2],
        ["F4",1],["F4",1],["E4",1],["E4",1],
        ["D4",1],["D4",1],["C4",2]
      ]
    },
    {
      id: "ode-to-joy",
      title: "Ode to Joy",
      composer: "Ludwig van Beethoven",
      bpm: 100,
      notes: [
        ["E4",1],["E4",1],["F4",1],["G4",1],
        ["G4",1],["F4",1],["E4",1],["D4",1],
        ["C4",1],["C4",1],["D4",1],["E4",1],
        ["E4",1.5],["D4",0.5],["D4",2],
        ["E4",1],["E4",1],["F4",1],["G4",1],
        ["G4",1],["F4",1],["E4",1],["D4",1],
        ["C4",1],["C4",1],["D4",1],["E4",1],
        ["D4",1.5],["C4",0.5],["C4",2]
      ]
    },
    {
      id: "fur-elise",
      title: "Für Elise (opening theme)",
      composer: "Ludwig van Beethoven",
      bpm: 60,
      notes: [
        ["E5",0.25],["D#5",0.25],
        ["E5",0.25],["D#5",0.25],["E5",0.25],
        ["B4",0.25],["D5",0.25],["C5",0.25],
        ["A4",0.75],["C4",0.25],
        ["E4",0.25],["A4",0.25],
        ["B4",0.75],["E4",0.25],
        ["G#4",0.25],["B4",0.25],
        ["C5",0.75],["E4",0.25],
        ["E5",0.25],["D#5",0.25],
        ["E5",0.25],["D#5",0.25],["E5",0.25],
        ["B4",0.25],["D5",0.25],["C5",0.25],
        ["A4",0.75],["C4",0.25],
        ["E4",0.25],["A4",0.25],
        ["B4",0.75],["E4",0.25],
        ["C5",0.25],["B4",0.25],
        ["A4",1.5]
      ]
    }
  ].map(song => ({
    ...song,
    notes: song.notes.map(([pitch, beats]) => ({
      pitch,
      beats
    }))
  }));

  // 4. CALCULAR INICIO DE CADA NOTA

  function withStartBeats(notes) {
    let beat = 0;

    return notes.map(note => {
      const timed = {
        ...note,
        start: beat
      };

      beat += note.beats;
      return timed;
    });
  }

  // 5. SONIDO DEL PIANO

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  let audio;

  function midiOf(pitch) {
    const octave = Number(pitch.slice(-1));

    return (octave + 1) * 12 +
      NAMES.indexOf(pitch.slice(0, -1));
  }

  function playTone(pitch) {
    if (!AudioContextClass) return;

    if (!audio) {
      audio = new AudioContextClass();
    }

    if (audio.state === "suspended") {
      audio.resume().catch(() => {});
    }

    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = "triangle";

    osc.frequency.value =
      440 * 2 ** ((midiOf(pitch) - 69) / 12);

    gain.gain.setValueAtTime(
      0.3,
      audio.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audio.currentTime + 1
    );

    osc.connect(gain);
    gain.connect(audio.destination);

    osc.start();
    osc.stop(audio.currentTime + 1);
  }

  // 6. VARIABLES DEL JUEGO

  let song = null;
  let songBeat = 0;
  let nextIndex = 0;
  let lastTime = null;
  let playing = false;
  let raf = null;

  let lane = null;
  let status = null;
  let selector = null;
  let blocks = [];

  const pressed = new Set();
  const keyElements = new Map();

  // 7. ESTILOS PARA ANIMACION Y CONTROLES



  // 8. BUSCAR LAS TECLAS EN EL HTML

  function findKeys() {
    const candidates = [
      ...document.querySelectorAll(
        "[data-pitch], .tecla"
      )
    ];

    for (const el of candidates) {
      let pitch = el.dataset.pitch;

      if (!pitch) {
        const label =
          el.textContent.trim().toUpperCase();

        pitch = PITCHES.find(
          p => PITCH_TO_LABEL[p] === label
        );
      }

      if (
        pitch &&
        PITCHES.includes(pitch) &&
        !keyElements.has(pitch)
      ) {
        el.dataset.pitch = pitch;
        keyElements.set(pitch, el);
      }
    }
  }

  // 9. PRESIONAR Y SOLTAR TECLAS

  function pressKey(pitch) {
    if (!PITCHES.includes(pitch)) return;
    if (pressed.has(pitch)) return;

    pressed.add(pitch);

    playTone(pitch);

    const key = keyElements.get(pitch);

    if (key) {
      key.classList.add("piano-note-active");
    }

    if (
      playing &&
      song &&
      song.notes[nextIndex]?.pitch === pitch &&
      songBeat >= song.notes[nextIndex].start - 0.001
    ) {
      if (blocks[nextIndex]) {
        blocks[nextIndex].classList.add("done");
      }

      nextIndex++;

      if (nextIndex >= song.notes.length) {
        stopSong("¡Canción completada!");
      } else {
        status.textContent =
          `Nota ${nextIndex + 1} de ${song.notes.length}: ` +
          song.notes[nextIndex].pitch;
      }
    }
  }

  function releaseKey(pitch) {
    pressed.delete(pitch);

    const key = keyElements.get(pitch);

    if (key) {
      key.classList.remove("piano-note-active");
    }
  }

  // 10. DIBUJAR LOS BLOQUES MUSICALES

 
function draw() {
    if (!song || !lane) return;

    const laneRect = lane.getBoundingClientRect();

    song.notes.forEach((note, i) => {
        const block = blocks[i];

        if (!block || i < nextIndex) return;

        const height = Math.max(
            10,
            note.beats * PX_PER_BEAT
        );

        const bottom =
            HIT_Y -
            (note.start - songBeat) * PX_PER_BEAT;

        block.style.height = `${height}px`;

        // Buscar la tecla correspondiente a la nota
        const tecla = keyElements.get(note.pitch);

        if (tecla) {
            const teclaRect = tecla.getBoundingClientRect();

            // Alinear el bloque con la tecla
            block.style.left =
                `${teclaRect.left - laneRect.left}px`;

            // Utilizar el mismo ancho de la tecla
            block.style.width = `${teclaRect.width}px`;
        }

        block.style.transform =
            `translateY(${bottom - height}px)`;
    });
}


  // 11. ANIMACION CON REQUESTANIMATIONFRAME

  function frame(now) {
    if (!playing || !song) return;

    if (lastTime !== null) {
      const seconds = Math.min(
        (now - lastTime) / 1000,
        0.1
      );

      songBeat += seconds * (song.bpm / 60);

      const next = song.notes[nextIndex];

      if (next && songBeat >= next.start) {
        songBeat = next.start;
      }
    }

    lastTime = now;

    draw();

    if (playing) {
      raf = requestAnimationFrame(frame);
    }
  }

  // 12. DETENER CANCION

  function stopSong(message = "Canción detenida.") {
    playing = false;

    if (raf !== null) {
      cancelAnimationFrame(raf);
    }

    raf = null;
    lastTime = null;

    if (status) {
      status.textContent = message;
    }
  }

  // 13. INICIAR CANCION

  function startSong(id) {
    stopSong();

    const selected =
      SONGS.find(s => s.id === id) || SONGS[0];

    song = {
      ...selected,
      notes: withStartBeats(selected.notes)
    };

    songBeat = -2;
    nextIndex = 0;

    lane.querySelectorAll(".piano-note")
      .forEach(note => note.remove());

    blocks = song.notes.map(note => {
      const el = document.createElement("div");

      el.className = "piano-note";
      el.textContent = PITCH_TO_LABEL[note.pitch];

      lane.appendChild(el);

      return el;
    });

    status.textContent =
      `Toca ${song.notes[0].pitch} ` +
      `(${PITCH_TO_LABEL[song.notes[0].pitch]}) ` +
      "cuando llegue a la línea.";

    playing = true;

    draw();

    raf = requestAnimationFrame(frame);
  }

  // 14. CONECTAR JAVASCRIPT CON HTML

  function setup() {
    findKeys();


    // TECLADO FISICO

    document.addEventListener("keydown", event => {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) return;

      if (
        ["INPUT", "SELECT", "TEXTAREA"].includes(
          document.activeElement?.tagName
        )
      ) return;

      const pitch = KEY_TO_PITCH[event.code];

      if (pitch) {
        event.preventDefault();
        pressKey(pitch);
      }
    });

    document.addEventListener("keyup", event => {
      const pitch = KEY_TO_PITCH[event.code];

      if (pitch) {
        releaseKey(pitch);
      }
    });

    window.addEventListener("blur", () => {
      [...pressed].forEach(releaseKey);
    });

    // MOUSE Y PANTALLA TACTIL

    keyElements.forEach((el, pitch) => {
      el.style.touchAction = "none";

      el.addEventListener("pointerdown", event => {
        event.preventDefault();

        el.setPointerCapture?.(event.pointerId);

        pressKey(pitch);
      });

      el.addEventListener("pointerup", () => {
        releaseKey(pitch);
      });

      el.addEventListener("pointercancel", () => {
        releaseKey(pitch);
      });

      el.addEventListener("lostpointercapture", () => {
        releaseKey(pitch);
      });
    });


// 15. CONECTAR CONTROLES DEL HTML

const lesson = document.querySelector(".piano-lesson");

selector = document.getElementById("songSelect");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

startBtn.addEventListener("click", () => {
    startSong(selector.value);
});

stopBtn.addEventListener("click", () => {
    stopSong();
});
    

    // 16. CREAR ZONA DE ANIMACION
lane = document.createElement("div");
lane.className = "piano-lane";

const hitLine = document.createElement("div");
hitLine.className = "hit-line";

lane.appendChild(hitLine);

status = document.createElement("p");
status.className = "piano-status";

status.textContent =
      "Selecciona una canción y pulsa Iniciar canción. " +
      "También puedes tocar libremente.";

lesson.append(lane, status);


window.addEventListener("resize", draw);

console.info(
      `Piano listo: ${keyElements.size} ` +
      "teclas HTML detectadas de 17."
    );
    
  }

  // 17. INICIAR CUANDO CARGUE EL HTML

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      setup
    );
  } else {
    setup();
  }

})();

