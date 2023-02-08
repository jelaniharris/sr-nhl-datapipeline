import GameMonitor from "./GameMonitor";
import { NHLApi } from "./util/nhlApi";

jest.mock("./util/nhlApi");

const mockApiGetCurrentGames = NHLApi.getCurrentGames as jest.MockedFunction<
  typeof NHLApi.getCurrentGames
>;

describe("GameMonitor", () => {
  it("should be creatable", async () => {
    const monitor = new GameMonitor();
    expect(monitor).not.toBeNull();
  });

  describe("when checking for live games", () => {
    const spawnGameWatcherSpy = jest.spyOn(
      GameMonitor.prototype as any,
      "_spawnGameWatcher"
    );
    const scheduleLiveData = {
      dates: [
        {
          games: [
            {
              gamePk: 2022020807,
              link: "/path/1",
              status: {
                statusCode: "4",
                detailedState: "In Progress"
              }
            },
            {
              gamePk: 2022020802,
              link: "/path/2022020802",
              status: {
                statusCode: "7",
                detailedState: "Final"
              }
            }
          ]
        }
      ]
    };

    mockApiGetCurrentGames.mockResolvedValue(scheduleLiveData);
    spawnGameWatcherSpy.mockReturnValue(null);
    const monitor = new GameMonitor();

    it("should call spawnGameWatcher when it finds live games", async () => {
      await monitor.checkForLiveGames();
      expect(spawnGameWatcherSpy).toBeCalledWith(2022020807);
    });
    it("should not call spawnGameWatcher when it does not find live games", async () => {
      await monitor.checkForLiveGames();
      expect(spawnGameWatcherSpy).not.toBeCalledWith(2022020802);
    });
  });
});
