# iFunny.js

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
