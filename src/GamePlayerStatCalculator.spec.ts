import { GamePlayerStatCalculator } from "./GamePlayerStatCalculator";

describe("GamePlayerStatCalculator", () => {
  it("should be creatable", async () => {
    const gamePlayerStatCalculator = new GamePlayerStatCalculator();
    expect(gamePlayerStatCalculator).not.toBeNull();
  });
});
