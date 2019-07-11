# IFunnyWrapper

A simple API wrapper for IFunny Mobile.

```javascript
const IF = require('IFunnyWrapper')

const bot = new IF.Client()

bot.on('ready', (token) => {
    console.log(token)
})

bot.login('username', 'password', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36')
```
