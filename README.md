# iFunny.js

A simple wrapper for iFunny's private API

```js
const ifunny = require('iFunny')
const robot = new ifunny.Client()

robot.on('ready', async (fresh) => {
    console.log(`${robot.nick} was logged on with a ${fresh? 'new': 'cached'} bearer`)
})

robot.login('username', 'password')
```
