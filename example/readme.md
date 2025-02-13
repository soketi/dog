# Example: DOG Chat Room

> **Note:** WIP - needs live deployment

## Setup

### Using the Published Library

Modify the `package.json` file so that its `"@soketi/dog"` dependency is non-local:

```diff
{
  "dependencies": {
--  "@soketi/dog": "workspace:*"
++  "@soketi/dog": "next"
  }
}
```

Then, from this `/example` directory, run the following commands:

```sh
$ npm install
$ npm run dev
```

### Using a local Build

From the project root (not this directory), using [pnpm](https://pnpm.io/) to install and link packages:

```sh
# setup/link pkgs && compile `@soketi/dog` lib
$ pnpm install && pnpm run build
# change directory & run miniflare
$ cd example && pnpm run dev
```

## Overview

Currently, when a user visits `localhost:8787`, they enter an arbitrary username, which sends a `/ws?u=<username>` request to the Worker, who then forwards the request to the `Lobby` class. As of now, a hardcoded `"lobby-id"` is used to identify the chatroom, but in a real-world setting, this would generally be tied to some URL/model identifier.

The `Lobby` identifies each request by its `?u` query parameter. Of course, in a real application this would be an entity identifier, accessed by an `Authorization` header or a parsed cookie.

The underlying `Replica` allows and accepts multiple connections sharing the same username. For a chatroom, this can surface as `lukeed` connecting through a desktop _and_ a mobile client. The `lukeed` user will/should expect to see any messages meant for them on all connected devices, including replica-only (`/group`) and whispered (`/w`) messages. However, this behavior might not be welcome in other applications – this is why `Gateway.identify` is user-specified, deferring full uniqueness control (and full responsibility) to the developer.

In this example, when a connection is established, the client sends a `"req:user:list"` query. The `Room` server owning the connection sees this query and then _gossips_ with the other `Room` instances to compile a list of connected users. The `Room` then sends this list _only_ to the new connection (via `socket.send`).

Without gossiping, the `Room` would have only been able to send down a list of the users that **it** was currently hosting. Given that each `Room` is configured with a limit of `2` active connections, this would have meant that new users would only see themselves and one other user online, _despite the fact_ that the new user would be able to send and receive messages from everyone in the chatroom.


## Slash Commands

When connected to the chatroom, you may invoke the following slash commands which illustrate the varying `Socket` interface methods:

* `/w <userid> <message>` <br> `/msg <userid> <message>` <br>Sends a message to a specific user – and **only** that user. Utilitizes the `socket.whisper` method.

* `/g <message>` <br> `/group <userid> <message>` <br>Sends a message to the _group_ which, in this case, refers to the users that are hosted on the same `Room / Replica` as the sender. Interally, this utilizes the `socket.emit` method.

* `/a <message>` <br> `/all <userid> <message>` <br>This is the default; AKA, it's the same as not including a slash command at all. Delivers a message to **everyone** in the chatroom, because the chatroom is structured as a single cluster. Internally, this utilizes the `socket.broadcast` method.
