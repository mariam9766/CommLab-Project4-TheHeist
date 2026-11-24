// ============================================================
// THE HEIST: how this file is organised
//   1. settings and the story (scenes, notes)
//   2. getting the elements and loading the sounds
//   3. parts 1 + 2: title and flashlight
//   4. part 3: the movie, choices, notes, credits, skip buttons
//   5. scene 7: the pin board
// ============================================================


const FLASHLIGHT_SECONDS = 7; // how long you get to look around the table
const NOTE_SECONDS = 6;       // how long an investigator note stays on screen
const ROLL_SECONDS = 9;       // how long the credits take to roll up

// the three characters (the pictures are in the assets folder) which lets us look a person up by their key: PEOPLE["megan"].name
// (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors)
const PEOPLE = {
  megan:  { name: "Megan",     img: "assets/megan.png",  mission: "MISSION: Choose a study away location" },
  hyein:  { name: "Hyein",     img: "assets/hyein.png",  mission: "MISSION: Graduate this semester" },
  mariam: { name: "Mariam B.", img: "assets/mariam.png", mission: "MISSION: Submit this Comms Lab assignment" }
};

// scenes 1 and 2 let you choose whose interview cutscene to watch.
// this function builds those 3 options so we don't write the same thing twice.
// .map() makes a new list by running a function on every item
// (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
function interviews(n, notes) {
  return ["megan", "hyein", "mariam"].map(function (who) {
    return {
      who: who,
      label: PEOPLE[who].name,
      clip: "clips/scene" + n + "_" + who + ".mp4",
      note: notes[who]
    };
  });
}

// every scene = a clip, then a choice screen, then the cutscene you picked.
// the clips in the clips folder are placeholders currently.
// "note" is the investigator note that gets written while that cutscene plays.
const SCENES = [
  {
    clip: "clips/scene1.mp4",
    prompt: "Choose a character",
    options: interviews(1, {
      megan:  "Investigator note placeholder (scene 1, Megan)",
      hyein:  "Investigator note placeholder (scene 1, Hyein)",
      mariam: "Investigator note placeholder (scene 1, Mariam)"
    })
  },
  {
    clip: "clips/scene2.mp4",
    prompt: "Choose a character",
    options: interviews(2, {
      megan:  "Investigator note placeholder (scene 2, Megan)",
      hyein:  "Investigator note placeholder (scene 2, Hyein)",
      mariam: "Investigator note placeholder (scene 2, Mariam)"
    })
  },
  {
    clip: "clips/scene3.mp4",
    prompt: "What does Mariam do?",
    options: [
      { who: "mariam", label: "Break it into steps", clip: "clips/scene3_steps.mp4",
        note: "Investigator note placeholder (scene 3, Mariam breaks it into steps)" },
      { who: "mariam", label: "Start smoking", clip: "clips/scene3_smoking.mp4",
        note: "Investigator note placeholder (scene 3, Mariam starts smoking)" }
    ]
  },
  {
    clip: "clips/scene4.mp4",
    prompt: "What does Hyein do?",
    options: [
      { who: "hyein", label: "Email the advisor", clip: "clips/scene4_email.mp4",
        note: "Investigator note placeholder (scene 4, Hyein emails the advisor)" },
      { who: "hyein", label: "Doomscroll", clip: "clips/scene4_doomscroll.mp4",
        note: "Investigator note placeholder (scene 4, Hyein doomscrolls)" }
    ]
  },
  {
    clip: "clips/scene5.mp4",
    prompt: "What does Megan do?",
    options: [
      { who: "megan", label: "Draw from a bowl", clip: "clips/scene5_bowl.mp4",
        note: "Investigator note placeholder (scene 5, Megan draws from a bowl)" },
      { who: "megan", label: "Get a piercing", clip: "clips/scene5_piercing.mp4",
        note: "Investigator note placeholder (scene 5, Megan gets a piercing)" }
    ]
  }
];

const FINAL_CLIP = "clips/scene6.mp4"; // laptop closes, then the credits roll


// ---------- elements ----------
// grabbing everything once at the top so we can use the names below
const intro = document.getElementById("intro");
const titleBox = document.getElementById("titleBox");
const startBtn = document.getElementById("startBtn");
const timerBox = document.getElementById("timerBox");
const timerNum = document.getElementById("timerNum");

const movie = document.getElementById("movie");
const video = document.getElementById("film");
const choice = document.getElementById("choice");
const choicePrompt = document.getElementById("choicePrompt");
const choiceCards = document.getElementById("choiceCards");
const credits = document.getElementById("credits");
const creditsRoll = document.getElementById("creditsRoll");
const noteBox = document.getElementById("note");
const noteText = document.getElementById("noteText");
const tapPlay = document.getElementById("tapPlay");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const board = document.getElementById("board");
const cols = document.getElementById("cols");
const strings = document.getElementById("strings");
const restartBtn = document.getElementById("restartBtn");
const fader = document.getElementById("fader");


// ---------- sounds ----------
// new Audio("file") makes a sound we can play from javascript without an <audio> tag
// (https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement/Audio)
const jazz = new Audio("assets/OpeningPageAudio.mp3");
jazz.loop = true;   // start again when it ends (https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/loop)
jazz.volume = 0.5;  // 0 is silent, 1 is full (https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volume)
const clickSound = new Audio("assets/ClickSound.mp3");
const timerSound = new Audio("assets/TimerSound.mp3");
const creditsSound = new Audio("assets/CreditsPageAudio.mp3");

// plays a sound from the start.
// browsers block sound until the visitor clicks something, so play() can fail at first.
// play() gives back a promise and .catch() runs if it was blocked
// (https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
// (https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime)
function playSound(sound) {
  sound.currentTime = 0;
  sound.play().catch(function () {});
}

// try the jazz right away, if the browser says no we start it on the first click
// (pointerdown: https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerdown_event)
jazz.play().catch(function () {
  document.addEventListener("pointerdown", function startJazz() {
    jazz.play().catch(function () {});
    document.removeEventListener("pointerdown", startJazz); // only needed once
  });
});

// lowers the volume a little at a time, then stops the sound.
// setInterval runs the function again and again, clearInterval stops it
// (https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval)
function fadeOut(sound, ms) {
  const steps = 20;
  const startVolume = sound.volume;
  let i = 0;
  const timer = setInterval(function () {
    i++;
    // Math.max keeps the volume from going below 0
    // (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/max)
    sound.volume = Math.max(0, startVolume * (1 - i / steps));
    if (i >= steps) {
      clearInterval(timer);
      sound.pause();
      sound.volume = startVolume; // put the volume back for next time
    }
  }, ms / steps);
}

// fade to black, change what is on screen, fade back in
function fadeThrough(change) {
  fader.classList.add("on");
  setTimeout(function () {
    change();
    fader.classList.remove("on");
  }, 800); // 800 = the length of the css transition on #fader
}


// ---------- PART 1 + 2: title, then the flashlight ----------

// the flashlight follows the mouse by changing the --x and --y variables in the css.
// e.clientX / e.clientY are the mouse position in pixels
// (pointermove: https://developer.mozilla.org/en-US/docs/Web/API/Element/pointermove_event)
// (setProperty: https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/setProperty)
// (css variables: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
intro.addEventListener("pointermove", function (e) {
  intro.style.setProperty("--x", e.clientX + "px");
  intro.style.setProperty("--y", e.clientY + "px");
});

startBtn.addEventListener("click", function () {
  playSound(clickSound);
  jazz.play().catch(function () {});
  titleBox.classList.add("gone"); // the css fades the writing away
  setTimeout(startFlashlight, 1100);
});

function startFlashlight() {
  intro.classList.add("dark"); // turns the flashlight, hint and timer on in the css
  timerBox.style.setProperty("--secs", FLASHLIGHT_SECONDS + "s");
  playSound(timerSound);

  // we wait two frames before adding "running" so the css transition (white to red) really runs
  // (https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      timerBox.classList.add("running");
    });
  });

  let left = FLASHLIGHT_SECONDS;
  timerNum.textContent = "0:0" + left;
  const countdown = setInterval(function () {
    left--;
    timerNum.textContent = "0:0" + left;
    if (left <= 0) {
      clearInterval(countdown);
      fadeOut(timerSound, 600);
      fadeThrough(startMovie);
    }
  }, 1000);
}


// ---------- PART 3: the movie ----------
let sceneNumber = 0;   // which scene we are in (0 is scene 1)
let phase = "clip";    // "clip", "choice", "cutscene", "final" or "credits"
const picks = {};      // scene number -> the option that was picked
const notes = {};      // scene number -> the investigator note for that pick
let noteTimer = null;  // timers for the note, kept so we can stop them
let typeTimer = null;

function startMovie() {
  intro.hidden = true; // the hidden property hides an element (https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden)
  movie.hidden = false;
  fadeOut(jazz, 1500);
  playScene(0);
}

// plays a clip, then calls whenDone.
// video.onended runs when the clip finishes (https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/ended_event)
// video.onerror runs if the file can't load: we just move on after a second so the page never freezes
function playClip(src, whenDone) {
  video.onended = whenDone;
  video.onerror = function () {
    setTimeout(whenDone, 1000);
  };
  video.src = src; // changing src loads the new clip
  tapPlay.hidden = true;
  // play() gives back a promise that fails if the browser blocks playing,
  // then we show a "Tap to continue" button
  // (https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play)
  video.play().catch(function () {
    tapPlay.hidden = false;
  });
}

tapPlay.addEventListener("click", function () {
  tapPlay.hidden = true;
  video.play();
});

function playScene(n) {
  sceneNumber = n;
  phase = "clip";
  hideChoice();
  hideNote();
  playClip(SCENES[n].clip, function () {
    showChoice(n);
  });
  updateSkip();
}

// the video goes dark and the character pictures show up
function showChoice(n) {
  sceneNumber = n;
  phase = "choice";
  video.onended = null; // so the old clip can't trigger anything anymore
  video.pause();
  hideNote();

  const scene = SCENES[n];
  choicePrompt.textContent = scene.prompt;
  choiceCards.innerHTML = ""; // empty out the cards from the last scene
  // classList.toggle(name, true/false) adds or removes a class depending on the second value
  // two-option scenes show the option text all the time, the three character scenes only show names on hover
  // (https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList/toggle)
  choiceCards.classList.toggle("options", scene.options.length === 2);

  // forEach runs the function once for every option in the list
  // (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
  scene.options.forEach(function (option) {
    // build the card with javascript because the pictures and names change every scene
    // (https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement)
    const card = document.createElement("button");
    card.className = "card";

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = option.label;

    // the three-character scenes get a picture, the two-option scenes are just text
    if (scene.options.length !== 2) {
      const photo = document.createElement("img");
      photo.className = "photo";
      photo.src = PEOPLE[option.who].img;
      photo.alt = option.label;
      card.appendChild(photo); // appendChild puts one element inside another
    }
    card.appendChild(name);
    card.addEventListener("click", function () {
      playSound(clickSound);
      choose(n, option);
    });
    choiceCards.appendChild(card);
  });

  choice.classList.add("show");
  updateSkip();
}

function hideChoice() {
  choice.classList.remove("show");
}

// runs when a card is clicked: remember the pick, write the note, play the cutscene, then go to the next scene
function choose(n, option) {
  hideChoice();
  picks[n] = option;
  notes[n] = { who: option.who, text: option.note }; // picking again in the same scene replaces the old note
  phase = "cutscene";
  showNote(option.note);
  playClip(option.clip, function () {
    hideNote();
    if (n + 1 < SCENES.length) {
      playScene(n + 1);
    } else {
      playFinal();
    }
  });
  updateSkip();
}

// the investigator writes the note one letter at a time.
// text.slice(0, i) gives the first i letters
// (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice)
function showNote(text) {
  hideNote();
  noteText.textContent = "";
  noteBox.classList.add("show");
  let i = 0;
  typeTimer = setInterval(function () {
    i++;
    noteText.textContent = text.slice(0, i);
    if (i >= text.length) {
      clearInterval(typeTimer);
    }
  }, 30);
  noteTimer = setTimeout(hideNote, NOTE_SECONDS * 1000);
}

function hideNote() {
  clearInterval(typeTimer);
  clearTimeout(noteTimer); // clearTimeout cancels a setTimeout that hasn't run yet
  noteBox.classList.remove("show");
}

// scene 6, then the credits
function playFinal() {
  phase = "final";
  playClip(FINAL_CLIP, rollCredits);
  updateSkip();
}

function rollCredits() {
  phase = "credits";
  video.onended = null;
  video.pause();
  credits.classList.add("show");
  updateSkip();

  // how far the credits have to move: a bit more than the whole list, so the last line ends up on screen.
  // offsetHeight is the height of an element in pixels (https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetHeight)
  const travel = credits.offsetHeight * 0.6 + creditsRoll.offsetHeight;
  creditsRoll.style.setProperty("--rollTime", ROLL_SECONDS + "s");
  creditsRoll.style.setProperty("--travel", travel + "px");
  creditsRoll.classList.add("rolling"); // starts the css animation

  let finished = false;
  function done() {
    if (finished) return; // make sure we only go to the board one time
    finished = true;
    setTimeout(function () {
      fadeThrough(showBoard);
    }, 1200); // a moment to read the last line
  }

  // when the roll ends we go straight to the pin board, the audio of them talking keeps playing over it
  // (animationend: https://developer.mozilla.org/en-US/docs/Web/API/Element/animationend_event)
  // ({ once: true } makes the listener run only one time: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#once)
  creditsRoll.addEventListener("animationend", done, { once: true });
  setTimeout(done, (ROLL_SECONDS + 3) * 1000); // backup in case the animation event never comes
  playSound(creditsSound);
}


// ---------- skip back and forth between choices ----------

// where "next choice" and "previous choice" would take us (null = nowhere to go, so the button is disabled)
function nextTarget() {
  if (phase === "clip") return sceneNumber;                 // skip the rest of the clip
  if (phase === "choice" || phase === "cutscene") {
    return sceneNumber + 1 < SCENES.length ? sceneNumber + 1 : null;
  }
  return null;
}

function prevTarget() {
  if (phase === "clip") return sceneNumber > 0 ? sceneNumber - 1 : null;
  if (phase === "choice") return sceneNumber > 0 ? sceneNumber - 1 : 0; // first choice: watch scene 1 again
  if (phase === "cutscene") return sceneNumber;             // go back and pick again
  return null;
}

function goTo(target) {
  if (target === null) return;
  if (phase === "choice" && sceneNumber === 0 && target === 0) {
    playScene(0);
  } else {
    showChoice(target);
  }
}

// greys out a skip button when it has nowhere to go
function updateSkip() {
  nextBtn.disabled = nextTarget() === null;
  prevBtn.disabled = prevTarget() === null;
}

nextBtn.addEventListener("click", function () {
  playSound(clickSound);
  goTo(nextTarget());
});

prevBtn.addEventListener("click", function () {
  playSound(clickSound);
  goTo(prevTarget());
});


// ---------- SCENE 7: the pin board ----------

// waits for a number of milliseconds, used with "await" below
// (Promise: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// draws a red string between two things on the board.
// the strings are <line> elements inside an svg. svg elements need createElementNS (not createElement)
// (https://developer.mozilla.org/en-US/docs/Web/API/Document/createElementNS)
// getBoundingClientRect gives the position and size of an element on screen
// (https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)
// the line "draws itself" by moving stroke-dashoffset from the full length to 0
// (https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dashoffset)
function drawString(fromEl, toEl) {
  const boardBox = board.getBoundingClientRect();
  const a = fromEl.getBoundingClientRect();
  const b = toEl.getBoundingClientRect();
  // from the bottom middle of the first card to the top middle of the second one
  const x1 = a.left + a.width / 2 - boardBox.left;
  const y1 = a.bottom - boardBox.top;
  const x2 = b.left + b.width / 2 - boardBox.left;
  const y2 = b.top - boardBox.top;

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  // Math.hypot works out the length of the line (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/hypot)
  const length = Math.hypot(x2 - x1, y2 - y1);
  line.style.strokeDasharray = length;
  line.style.strokeDashoffset = length;
  line.style.transition = "stroke-dashoffset 0.6s ease";
  strings.appendChild(line);
  // two frames later so the transition runs
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      line.style.strokeDashoffset = 0;
    });
  });
}

// "async" lets us use "await" inside to wait between steps without lots of nested setTimeouts
// (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
// (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
async function showBoard() {
  movie.hidden = true;
  board.hidden = false;
  cols.innerHTML = "";
  strings.innerHTML = "";

  // one column per character: picture, their notes, their mission
  const chains = [];
  ["megan", "hyein", "mariam"].forEach(function (who) {
    const col = document.createElement("div");
    col.className = "col";

    const photo = document.createElement("div");
    photo.className = "pinned polaroid";
    // innerHTML lets us write the html for the picture and name in one go
    // (https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML)
    photo.innerHTML = '<img src="' + PEOPLE[who].img + '" alt=""><span>' + PEOPLE[who].name + "</span>";

    const notesBox = document.createElement("div");
    notesBox.className = "notes";
    const noteEls = [];
    // Object.keys gives the scene numbers we have notes for, map(Number) turns them from text into numbers,
    // sort puts them in order so the notes show up in the order of the story
    // (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys)
    // (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
    Object.keys(notes)
      .map(Number)
      .sort(function (x, y) { return x - y; })
      .forEach(function (n) {
        if (notes[n].who !== who) return; // only this character's notes go in this column
        const el = document.createElement("div");
        el.className = "pinned pnote";
        el.textContent = notes[n].text;
        notesBox.appendChild(el);
        noteEls.push(el);
      });

    const mission = document.createElement("div");
    mission.className = "pinned mission";
    mission.textContent = PEOPLE[who].mission;

    col.appendChild(photo);
    col.appendChild(notesBox);
    col.appendChild(mission);
    cols.appendChild(col);
    chains.push({ photo: photo, notes: noteEls, mission: mission });
  });

  // first the pictures, then the notes one by one, then the missions
  await sleep(600);
  chains.forEach(function (c) { c.photo.classList.add("show"); });
  await sleep(900);

  // the most notes any one character has (Math.max with apply takes a list of numbers)
  // (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply)
  const most = Math.max.apply(null, chains.map(function (c) { return c.notes.length; }));
  for (let level = 0; level < most; level++) {
    chains.forEach(function (c) {
      if (level < c.notes.length) {
        // each note is tied by string to the one before it (or to the picture for the first note)
        const before = level === 0 ? c.photo : c.notes[level - 1];
        c.notes[level].classList.add("show");
        drawString(before, c.notes[level]);
      }
    });
    await sleep(1100);
  }

  await sleep(500);
  chains.forEach(function (c) {
    // the last string goes to the mission (from the last note, or from the picture if there are no notes)
    const last = c.notes.length ? c.notes[c.notes.length - 1] : c.photo;
    c.mission.classList.add("show");
    drawString(last, c.mission);
  });

  await sleep(1500);
  restartBtn.hidden = false;
}

restartBtn.addEventListener("click", function () {
  playSound(clickSound);
  setTimeout(function () {
    // reload starts the whole page again from the title (https://developer.mozilla.org/en-US/docs/Web/API/Location/reload)
    location.reload();
  }, 250);
});
