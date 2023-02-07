import GameWatcher from "./GameWatcher";

if (process.argv.length === 2) {
  console.error("Expected at least one argument!");
  process.exit(1);
}

const gameApiId: number = parseInt(process.argv[2], 10);

const gameWatcher = new GameWatcher();

(async () => {
  await gameWatcher.getGame(gameApiId);
  console.log("We're done with: #", gameApiId);
  process.exit();
})();
