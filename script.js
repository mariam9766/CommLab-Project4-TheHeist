const video = document.getElementById("film");
const menu = document.getElementById("menu");

const PAUSE_TIME = 75; // second where the video stops so you can choose
let alreadyChose = false;

// check the time while the video plays
video.addEventListener("timeupdate", function () {
  if (video.currentTime >= PAUSE_TIME && !alreadyChose) {
    video.pause();
    menu.style.display = "show";
  }
});

// any character just hides the menu and the video keeps going
function keepPlaying() {
  menu.style.display = "none";
  video.play();
}
