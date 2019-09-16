const axios = require('axios')
const EventEmitter = require('events')
const Client = require('./client.js')
const {homedir} = require('os')

class FreshObject extends EventEmitter {
    static api = 'https://api.ifunny.mobi/v4';
    static sendbird_api = 'https://api-us-1.sendbird.com/v3';

    #object_payload = undefined;
    #update = undefined;
    #url = undefined;

    constructor(id, opts = {client: new Client(), data: null}) {
        super()
        if (id === undefined) {
            throw new TypeError('id should be a string or number')
        }

        this.client = opts.client
        this.id = id
        this.paginated_size = this.client.paginated_size

        this.#object_payload = opts.data
        this.#update = false
        this.#url = undefined
    }

    async get(key) {
        return new Promise(async (resolve, reject) => {
            let found = this.#object_payload[key]

            if (found != undefined) {
                resolve(found)
            }

            let response = await axios({
                method: 'get',
                url: this.#url,
                headers: this.headers
            })

            resolve(response.data[key])
        })
    }

    get fresh() {
        this.#update = true
        return this
    }

    get headers() {
        return this.client.headers
    }
}

module.exports = FreshObject
