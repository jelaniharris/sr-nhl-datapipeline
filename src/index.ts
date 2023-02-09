import GameMonitor from "./GameMonitor";

const gameMonitor = new GameMonitor();
gameMonitor.checkForLiveGames();
setInterval(() => {
  try {
    gameMonitor.checkForLiveGames();
  } catch (e) {
    console.log(e);
  }
}, 60000);
