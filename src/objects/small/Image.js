const axios = require('axios')

/**
 * Image object
 * @param {String} url                      url to this image source
 * @param {Object} opts                     optional parameters
 * @param {String} opts.background="000000" background color of this image
 * @param {Client} opts.client              client who's headers should be used to fetch this images data
 */
class Image {
    constructor(url, opts = {}) {
        let Client = require('../Client')
        this.url = url
        this.client = opts.client || new Client()
        this.background = opts.background || "000000"
        this.thumbs = opts.thumbs || {}
    }

    /**
     * Raw content of this image
     * @type {Promise<String>}
     */
    get content() {
        return (async () => {
            let response = await axios({
                method: 'get',
                url: this.url,
                headers: this.client.headers
            })

            return response.data
        })()
    }
}

module.exports = Image
