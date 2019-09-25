const axios = require('axios')
const FreshObject = require('./FreshObject')

/**
 * iFunny Post object, representing a Post
 * @extends {FreshObject}
 * @param {String|Number} id                id of this object
 * @param {Object} opts                     optional parameters
 * @param {Client} opts.client=Client       Client that this object belongs to
 * @param {Number} opts.paginated_size=25   size of each paginated request
 * @param {Object} opts.data={}             data of this object, that can be used before fetching new info
 */

class Post extends FreshObject {
    constructor(id, opts = {}) {
        /*
        Post object, for iFunny images and videos
        */
        super(id, opts)
        this.url = `${this.api}/content/${id}`
    }

    /**
     * The author of this Post
     * @type {User}
     */
    get author() {
        return (async () => {
            let data = await this.get('creator')
            let User = require('./User')
            return new User(data.id, { data: data, client: this.client })
        })()
    }

    /**
     * Number of smiles on this Post
     * @type {Number}
     */
    get smile_count() {
        return (async () => {
            return await this.get('num').smiles
        })()
    }

    /**
     * Number of unsmiles on this Post
     * @type {Number}
     */
    get unsmile_count() {
        return (async () => {
            return await this.get('num').unsmiles
        })()
    }

    /**
     * Number of guest smiles on this Post
     * @type {Number}
     */
    get guest_smile_count() {
        return (async () => {
            return await this.get('num').guest_smiles
        })()
    }

    /**
     * Number of comments on this Post
     * @type {Number}
     */
    get comment_count() {
        return (async () => {
            return await this.get('num').comments
        })()
    }

    /**
     * Number of views on this Post
     * @type {Number}
     */
    get view_count() {
        return (async () => {
            return await this.get('num').views
        })()
    }

    /**
     * Number of republications of this post
     * @type {Number}
     */
    get republish_count() {
        return (async () => {
            return await this.get('num').republished
        })()
    }

    /**
     * Number of shares of this Post
     * @type {Number}
     */
    get share_count() {
        return (async () => {
            return await this.get('num').shares
        })()
    }

    /**
     * Type of post
     * @type {String}
     */
    get type() {
        return this.get('type')
    }

    /**
     * Background color of this image
     * @type {String}
     */
    get bg_color() {
        return this.get('bg_color')
    }

    /**
     * Title of this Post
     * Published posts are published
     * @type {String}
     */
    get title() {
        return this.get('title')
    }

    /**
     * Dynamic title of this Post
     * @type {String}
     */
    get dynamic_title() {
        return this.get('fixed_title')
    }

    /**
     * State of this Post
     * Regular posts appear as published
     * Posts scheduled to be posted appear as delayed
     * @type {String}
     */
    get state() {
        return this.get('state')
    }

    /**
     * Timestamp of post creation
     * @type {Number}
     */
    get created_at() {
        return this.get('date_create')
    }

    /**
     * Timestamp of post publication
     * @type {Number}
     */
    get publish_at() {
        return this.get('publish_at')
    }

    /**
     * Was this Post smiled by the bound Client?
     * @type {Boolean}
     */
    get is_smiled() {
        return this.get('is_smiled')
    }

    /**
     * Was this Post unsmiled by the bound Client?
     * @type {Boolean}
     */
    get is_unsmiled() {
        return this.get('is_unsmiled')
    }

    /**
     * Was this Post removed by moderators?
     * @type {Boolean}
     */
    get is_abused() {
        return this.get('is_abused')
    }

    /**
     * Was this Post featured?
     * @type {Boolean}
     */
    get is_featured() {
        return this.get('is_featured')
    }

    /**
     * Was this Post republished by the bound Client?
     * @type {Boolean}
     */
    get is_republished() {
        return this.get('is_republished')
    }

    /**
     * Was this Post pinned by it's author?
     * @type {Boolean}
     */
    get is_pinned() {
        return this.get('is_pinned')
    }

    /**
     * Is this Post using the old iFunny watermark?
     * @type {Boolean}
     */
    get is_old_watermark() {
        return this.get('old_watermark')
    }

    /**
     * Is this Post able to be boosted?
     * @type {Boolean}
     */
    get is_boostable() {
        return this.get('can_be_boosted')
    }

    /**
     * Tags attached to this Post
     * @type {Array<String>}
     */
    get tags() {
        return this.get('tags')
    }

    /**
     * Original source of this content, if from another site
     * @type {string}
     */
    get copyright_source() {
        return (async () => {
            return (await this.get('copyright')).url || await (this.fresh.get('copyright')).url
        })()
    }

    /**
     * Timestamp of when this post was featured, if featured
     * @type {Number|null}
     */
    get issue_at() {
        return this.get('issue_at')
    }

    /**
     * Visibility of this post
     * Posts with public visibility will appear in collective and can be featured
     * Posts with subscribers visibility will only appear in home feeds,
     * linking to the post directly, or by viewing the authors timeline
     * @type {String}
     */
    get visibility() {
        return this.get('visibility')
    }

    /**
     * Text detected in this post by iFunny ocr, if any
     * @type {String|null}
     */
    get detected_text() {
        return this.get('ocr_text')
    }

    /**
     * Sharable link to this post
     * @type {String}
     */
    get link() {
        return this.get('link')
    }

    /**
     * Same as `this.link`, but with a url
     * that indicates the type of content
     * @type {String}
     */
    get canonical_link() {
        return this.get('canonical_url')
    }

    /**
     * Link to the content of this post,
     * with the old style ifunny.co banner watermark
     * @type {String}
     */
    get content_link() {
        return this.get('url')
    }

    /**
     * Link to the content of this post,
     * with the new style overlay watermark
     * @return {String}
     */
    get share_url() {
        return this.get('share_url')
    }

    // undocumented because they have not been fully implemented
    // or because their use is unknown

    get thumb() {
        return this.get('thumb')
    }

    get fast_start() {
        return this.get('fast_start')
    }

    get shot_status() {
        return this.get('shot_status')
    }

    get size() {
        return this.get('size')
    }

}

module.exports = Post
