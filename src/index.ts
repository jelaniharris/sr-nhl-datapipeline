import GameMonitor from "./GameMonitor";

const gameMonitor = new GameMonitor();

setInterval(() => {
  gameMonitor.checkForLiveGames();
}, 60000);
