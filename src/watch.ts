import GameWatcher from "./GameWatcher";

if (process.argv.length === 2) {
  console.error("Expected at least one argument!");
  process.exit(1);
}

// Parse the second parameter as the id of the game to watch
const gameApiId: number = parseInt(process.argv[2], 10);

const gameWatcher = new GameWatcher();

(async () => {
  await gameWatcher.getGame(gameApiId);
  process.exit();
})();
