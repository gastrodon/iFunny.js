'use strict';

const axios = require("axios")

async function token(username, password) {

const prom = new Promise(async (resolve, reject) => {

    try {

        const data = await axios({

            url: "https://ifunny.co/oauth/login",
            method: "post",
            data: {
                "username": username,
                "password": password
            }

        })
    
        resolve(resolve(data.headers["set-cookie"][1].split(";")[0].split("=")[1]))

    } catch (err) {

        reject(err)

    }

})

return prom

}












module.exports = {
    token: token
}