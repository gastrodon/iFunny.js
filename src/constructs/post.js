const axios = require('axios')

class Post {
    constructor(data = {}) {
        this.setup(data)
    }

    async setup(data) {

        /**
         * The type of post
         * * `caption` -- image
         * * `video` -- video
         * * `gif` -- gif
         *
         * @type {String}
         */
        this.type = data.type || "caption"

        /**
         * Array Of Tags
         *
         * @type {Array}
         */
        this.tags = data.tags || []

        /**
         * String used for auto-tagging based on text.
         *
         * @type {String}
         */
        this.text = data.text || ""

        /**
         * Binary Buffer for the image/video
         *
         * @type {ImageURL}
         */
        this.image = await async function () {
            const res = await axios({method: 'post', url: data.image, responseType: 'stream'})
            return res
        }

        this.image = data.imageurl
            ? null
            : console.log("err")

    }

}

module.exports = Post
