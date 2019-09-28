# iFunny.js

[![Discord](https://img.shields.io/discord/624473515327881216?label=Discord&style=flat-square)](https://discord.gg/7WJZM9q)

A simple wrapper for iFunny's private API

```js
const ifunny = require('iFunny')
const robot = new ifunny.Client()

robot.on('ready', async (fresh) => {
    await (await robot.socket).start()
})

robot.on('message' async () => {
    message.reply('Hello, world!')
})

robot.login('username', 'password')
```
