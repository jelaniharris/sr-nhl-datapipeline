import GameMonitor from "./GameMonitor";

const gameMonitor = new GameMonitor();
gameMonitor.checkForLiveGames();
setInterval(() => {
  gameMonitor.checkForLiveGames();
}, 60000);
