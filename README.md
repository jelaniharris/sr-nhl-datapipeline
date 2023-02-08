# sr-nhl-datapipeline

## Requirements

This project assumes that you have docker running on your machine. If you do not have docker installed (and I can understand why ...) please go to [this guide](https://docs.docker.com/engine/install/) to get up and running.

## Dev Setup

You will need to copy the `.env-example` into the `.env` file. There isn't any sensitive keys you'll need to setup.

Once you have the env setup, then there are two simple steps to get the application up and running:

```
$ docker-compose build
$ docker-compose up
```

To shut down the application you could just `CTRL-C' or `CMD-C` to exit out of the app, and then do:

```
$ docker-compose down
```

## Test Suite

I use Jest. You can run the tests with

```
$ npm run test
```

## Invidual Past Games

Because the process that waits for the live games to start, and the process that injests the game data are two separate scripts. You have the ability to run a past game through the
To run an invidual game that has already happened you can use

```
$ docker-compose run nhl-datapipeline-service npx ts-node ./src/live.ts [GAMEID]
```

Replace [GAMEID] with the id of the game e.g. 2022020804

## Tech Stack

- Node - Runtime Environment
- Typescript - Language
- Docker - VM
- Prisma - Database ORM
- Postgres - Database
