const axios = require('axios')
const stream = require('stream').Readable

async function post(token, Agent, obj) {
    const Headers = {
        "Authorization": "Bearer " + token,
        "User-Agent": Agent
    }

    const data = await axios({url: "https://api.ifunny.mobi/v4/content", method: "post", headers: Headers, formData: obj})

    return data

}

module.exports = {
    post: post
}
