const axios = require('axios')
const FreshObject = require('./FreshObject')
const User = require('./User')

class Post extends FreshObject {
    constructor(id, opts = {}) {
        /*
        Post object, for iFunny images and videos
        */
        super(id, opts)
        this.url = `${this.api}/content/${id}`
    }

    get author() {
        return (async () => {
            let author = await this.get('creator')
            return new User(author.id, { data: author, client: this.client })
        })()
    }

    get video_clip() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('video_clip')
        })()
    }

    get id() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('id')
        })()
    }

    get type() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('type')
        })()
    }

    get url() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('url')
        })()
    }

    get old_watermark() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('old_watermark')
        })()
    }

    get link() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('link')
        })()
    }

    get title() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('title')
        })()
    }

    get fixed_title() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('fixed_title')
        })()
    }

    get tags() {
        /*
        type: list
        */
        return (async () => {
            return await this.get('tags')
        })()
    }

    get state() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('state')
        })()
    }

    get date_create() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('date_create')
        })()
    }

    get publish_at() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('publish_at')
        })()
    }

    get is_smiled() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_smiled')
        })()
    }

    get is_unsmiled() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_unsmiled')
        })()
    }

    get is_abused() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_abused')
        })()
    }

    get is_featured() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_featured')
        })()
    }

    get is_republished() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_republished')
        })()
    }

    get is_pinned() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('is_pinned')
        })()
    }

    get bg_color() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('bg_color')
        })()
    }

    get thumb() {
        /*
        type: dict
        */
        return (async () => {
            return await this.get('thumb')
        })()
    }

    get num() {
        /*
        type: dict
        */
        return (async () => {
            return await this.get('num')
        })()
    }

    get creator() {
        /*
        type: dict
        */
        return (async () => {
            return await this.get('creator')
        })()
    }

    get size() {
        /*
        type: dict
        */
        return (async () => {
            return await this.get('size')
        })()
    }

    get visibility() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('visibility')
        })()
    }

    get shot_status() {
        /*
        type: str
        */
        return (async () => {
            return await this.get('shot_status')
        })()
    }

    get fast_start() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('fast_start')
        })()
    }

    get can_be_boosted() {
        /*
        type: bool
        */
        return (async () => {
            return await this.get('can_be_boosted')
        })()
    }

}

module.exports = Post
