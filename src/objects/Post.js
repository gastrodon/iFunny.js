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

    /**
     * Represents the author of this Post
     * 
     */
    get author() {
        /*
        The author of this post
        */
        return (async () => {
            let author = await this.get('creator')
            return new User(author.id, { data: author, client: this.client })
        })()
    }

    get smile_count() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('num').smiles
        })()
    }

    get unsmile_count() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('num').unsmiles
        })()
    }

    get guest_smile_count() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('num').guest_smiles
        })()
    }

    get comment_count() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('num').comments
        })()
    }

    get view_count() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('num').views
        })()
    }

    get republish_count() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('num').republished
        })()
    }

    get share_count() {
        /*
        type: int
        */
        return (async () => {
            return await this.get('num').shares
        })()
    }


    get type() {
        /*
        type: str
        */
        return this.get('type')
    }

    get bg_color() {
        /*
        type: str
        */
        return this.get('bg_color')
    }

    get title() {
        /*
        type: str
        */
        return this.get('title')
    }

    get fixed_title() {
        /*
        type: str
        */
        return this.get('fixed_title')
    }

    get state() {
        /*
        type: str
        */
        return this.get('state')
    }

    get date_create() {
        /*
        type: int
        */
        return this.get('date_create')
    }

    get publish_at() {
        /*
        type: int
        */
        return this.get('publish_at')
    }

    get is_smiled() {
        /*
        type: bool
        */
        return this.get('is_smiled')
    }

    get is_unsmiled() {
        /*
        type: bool
        */
        return this.get('is_unsmiled')
    }

    get is_abused() {
        /*
        type: bool
        */
        return this.get('is_abused')
    }

    get is_featured() {
        /*
        type: bool
        */
        return this.get('is_featured')
    }

    get is_republished() {
        /*
        type: bool
        */
        return this.get('is_republished')
    }

    get is_pinned() {
        /*
        type: bool
        */
        return this.get('is_pinned')
    }

    get old_watermark() {
        /*
        type: bool
        */
        return this.get('old_watermark')
    }

    get fast_start() {
        /*
        type: bool
        */
        return this.get('fast_start')
    }

    get can_be_boosted() {
        /*
        type: bool
        */
        return this.get('can_be_boosted')
    }

    get tags() {
        /*
        type: list
        */
        return this.get('tags')
    }

    get thumb() {
        /*
        type: dict
        */
        return this.get('thumb')
    }

    get size() {
        /*
        type: dict
        */
        return this.get('size')
    }

    get copyright() {
        /*
        type: dict
        */
        return this.get('copyright')
    } // check

    get issue_at() {
        /*
        type: int
        */
        return this.get('issue_at')
    }

    get visibility() {
        /*
        type: str
        */
        return this.get('visibility')
    }

    get shot_status() {
        /*
        type: str
        */
        return this.get('shot_status')
    }

    get ocr_text() {
        /*
        type: str
        */
        return this.get('ocr_text')
    }

    get url() {
        /*
        type: str
        */
        return this.get('url')
    }

    get share_url() {
        /*
        type: str
        */
        return this.get('share_url')
    }

    get canonical_url() {
        /*
        type: str
        */
        return this.get('canonical_url')
    }

    get link() {
        /*
        type: str
        */
        return this.get('link')
    }

}

module.exports = Post
