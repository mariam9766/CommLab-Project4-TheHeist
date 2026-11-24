// ============================================================
// THE HEIST: how this file is organised
//   1. settings and the story (scenes, notes)
//   2. getting the elements and loading the sounds
//   3. parts 1 + 2: title and flashlight
//   4. part 3: the movie and the choices
// ============================================================


const FLASHLIGHT_SECONDS = 7; // how long you get to look around the table

// the three characters (the pictures are in the assets folder) which lets us look a person up by their key: PEOPLE["megan"].name
// (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors)
const PEOPLE = {
  megan:  { name: "Megan",     img: "assets/megan.png" },
  hyein:  { name: "Hyein",     img: "assets/hyein.png" },
  mariam: { name: "Mariam B.", img: "assets/mariam.png" }
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
const tapPlay = document.getElementById("tapPlay");

const fader = document.getElementById("fader");


// ---------- sounds ----------
// new Audio("file") makes a sound we can play from javascript without an <audio> tag
// (https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement/Audio)
const jazz = new Audio("assets/OpeningPageAudio.mp3");
jazz.loop = true;   // start again when it ends (https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/loop)
jazz.volume = 0.5;  // 0 is silent, 1 is full (https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volume)
const clickSound = new Audio("assets/ClickSound.mp3");
const timerSound = new Audio("assets/TimerSound.mp3");

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
  playClip(SCENES[n].clip, function () {
    showChoice(n);
  });
}

// the video goes dark and the character pictures show up
function showChoice(n) {
  sceneNumber = n;
  phase = "choice";
  video.onended = null; // so the old clip can't trigger anything anymore
  video.pause();

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
}

function hideChoice() {
  choice.classList.remove("show");
}

// runs when a card is clicked: remember the pick, play the cutscene, then go to the next scene
function choose(n, option) {
  hideChoice();
  picks[n] = option;
  phase = "cutscene";
  playClip(option.clip, function () {
    if (n + 1 < SCENES.length) {
      playScene(n + 1);
    } else {
      playFinal();
    }
  });
}

// scene 6: the laptop closes. the credits and the pin board are not built yet,
// so for now the page just starts over when the clip ends
// (reload: https://developer.mozilla.org/en-US/docs/Web/API/Location/reload)
function playFinal() {
  phase = "final";
  playClip(FINAL_CLIP, function () {
    fadeThrough(function () {
      location.reload();
    });
  });
}
