# iFunny.js

[![Discord](https://img.shields.io/discord/646164479863947266?label=Discord&style=flat-square&logo=discord)](https://discord.gg/MRdxWZW)

A simple wrapper for the iFunny API

```js
const ifunny = require('iFunny')
const robot = new ifunny.Client({ prefix: '-' })

robot.on('login', async (fresh) => {
    await robot.socket.start()
})

robot.handler.on('message' async () => {
    message.reply('Hello, world!')
})

robot.command.on('ping', async (message, args) => {
    message.reply('Pong!')
})

robot.login('username', 'password')
```

Fun fact, there's not a single file in this project called `ifunny.js`
