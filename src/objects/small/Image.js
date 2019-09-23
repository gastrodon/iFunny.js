const axios = require('axios')
const Client = require('../Client')

class Image {
    constructor(url, opts = {}) {
        /*
        Image Object constructor, for images

        params:
            url: url pointing to the image
            opts:
                background: string html background color of this image
                client: Client that this object should be bound to
        */

        this.url = url
        this.client = otps.client || new Client()
        this.background = opts.background || null
    }
}

module.exports = Image
