# sr-nhl-datapipeline

This monitors the NHL Live Data feed and when a game starts it will spawn a subprocess to watch that game and injest the data into the database.

## Requirements

This project assumes that you have docker running on your machine. If you do not have docker installed (and I can understand why ...) please go to [this guide](https://docs.docker.com/engine/install/) to get up and running.

## Dev Setup

You will need to copy the `.env-example` into the `.env` file. There aren't any sensitive keys you'll need to setup and you can use the database values as they are.

Once you have the env setup, then there are two simple steps to get the application up and running:

```
$ docker-compose build
$ docker-compose up
```

To shut down the application you could just `CTRL-C' or `CMD-.` on a mac to exit out of the app, and then do to bring down the docker containers:

```
$ docker-compose down
```

## Test Suite

I use Jest to do unit testing. You can run the tests with

```
$ npm run test
```

## Prisma Studio

Once the app is running, you can go to `http://localhost:5555` to look at the data and layout using Prisma Studio.

## Invidual Past Games

Because the process that waits for the live games to start, and the process that injests the game data are two separate scripts. You have the ability to run a past game through the
To run an invidual game that has already happened you can use

```
$ docker-compose run nhl-datapipeline-service npx ts-node ./src/watch.ts [GAMEID]
```

Replace [GAMEID] with the id of the game e.g. 2022020804

## Tech Stack

- [Node](https://nodejs.org/en/) - Runtime Environment
- [Typescript](https://www.typescriptlang.org/) - Language
- [Docker](https://www.docker.com/) - VM
- [Prisma](https://www.prisma.io/) - Database ORM
- [Postgres](https://www.postgresql.org/) - Database

## Schema

![Database Schema](/images/db-schema.png?raw=true "DB Schema")
