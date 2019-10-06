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

    // methods for any post

    /**
     * Add a comment to this post
     * @param  {String} text=null                           Text of this comment
     * @param  {Post|String} attachment=null                Post to attach to the comment
     * @param  {Array<User>|Array<String>} mentions=null    Users to mention in this comment
     * @return {Promise<Comment>}                                    Posted comment
     * @throws                                              Throws error if bad api response, or if the comment is not posted
     */
    async add_comment(text, attachment, mentions) {
        let data = await this.client.add_comment_to_post(this, text, attachment, mentions)
            .data

        if (data.id === '000000000000000000000000') {
            throw data.toString()
        }

        let comment = require('./Comment')
        return new Comment(data.id, { client: this.client, data: data.comment })
    }

    /**
     * Add a smile to this post
     * @return {Promise<Post>}   This post
     * @throws          Throws an error if bad api response
     */
    async smile() {
        try {
            await this.client.modify_post_smile(this, 'put')
            return this.fresh
        } catch (error) {
            if (error.response && error.response.data.error === 'already_smiled') {
                return this.fresh
            }
            throw error
        }
    }

    /**
     * Remove a smile from this post
     * @return {Promise<Post>}   This post
     * @throws          Throws an error if bad api response
     */
    async remove_smile() {
        try {
            await this.client.modify_post_smile(this, 'delete')
            return this.fresh
        } catch (error) {
            if (error.response && error.response.data.error === 'not_smiled') {
                return this.fresh
            }
            throw error
        }
    }

    /**
     * Add an unsmile to this post
     * @return {Promise<Post>}   This post
     * @throws          Throws an error if bad api response
     */
    async unsmile() {
        try {
            await this.client.modify_post_unsmile(this, 'put')
            return this.fresh
        } catch (error) {
            if (error.response && error.response.data.error === 'already_unsmiled') {
                return this.fresh
            }
            throw error
        }
    }

    /**
     * Remove an unsmile from this post
     * @return {Promise<Post>}   This post
     * @throws          Throws an error if bad api response
     */
    async remove_unsmile() {
        try {
            await this.client.modify_post_unsmile(this, 'delete')
            return this.fresh
        } catch (error) {
            if (error.response && error.response.data.error === 'not_unsmiled') {
                return this.fresh
            }
            throw error
        }
    }

    /**
     * Republish this post
     * @param  {Boolean}  force Remove republish and republish if already republished?
     * @return {Promise<Post>}           Instance of this republished post in the timeline of the client, if successful
     * @throws                  Throws an error if bad api response
     */
    async republish(force) {
        try {
            let data = await this.client.modify_post_republish(this, 'post')
                .data
            return new Post(data.id, { client: this.client })
        } catch (error) {
            if (error.response && error.response.data.error === 'already_republished') {
                if (force) {
                    return this.remove_republish()
                        .republish()
                } else {
                    return null
                }
            }
            throw error
        }
    }

    /**
     * Republish this post
     * @return {Promise<Post>}           Instance of this republished post in the timeline of the client, if successful
     * @throws                  Throws an error if bad api response
     */
    async remove_republish() {
        try {
            let data = await this.client.modify_post_republish(this, 'delete')
                .data
            return this.fresh
        } catch (error) {
            if (error.response && error.response.data.error === 'not_republished') {
                return this.fresh
            }
            throw error
        }
    }

    /**
     * Report this post
     * @param  {String}         type Type of report to send
     *
     * `hate`   -> hate speech
     *
     * `nude`   -> nudity
     *
     * `spam`   -> spam posting
     *
     * `harm`   -> encouragement of harm or violence
     *
     * `target` -> targeted harrassment
     *
     * @return {Promise<Post>}                Post that was reported
     * @throws                       Throws an error if bad api response, or if the report type is invalid
     */
    async report(type) {
        await this.client.report_post(this, type)
        return this
    }

    /**
     * Mark this post as read
     * @return {Promise<Post>} This post
     */
    async read() {
        await this.client.read_post(this)
        return this
    }

    // methods for your own posts

    /**
     * Update the tags on this post
     * @param  {Array<String>}  tags Tags to tag this post with
     * @return {Promise<Post>}                This post
     * @throws                       Throws an error if bad api response, or not own content
     */
    async set_tags(tags) {
        await this.client.modify_post_tags(this, tags)
        return this.fresh
    }

    /**
     * Delete this post
     * @return {Promise<Post>} This post (but it has been deleted!)
     * @throws                       Throws an error if bad api response, or not own content
     */
    async delete() {
        await this.client.delete_post(this)
        return this
    }

    /**
     * Pin this post to the timeline of the client
     * @return {Promise<Post>} This post
     * @throws                       Throws an error if bad api response, or not own content
     */
    async pin() {
        await this.client.modify_post_pinned_status(this, 'put')
        return this.fresh
    }

    /**
     * Unpin this post from the timeline of the client
     * @return {Promise<Post>} This post
     * @throws                       Throws an error if bad api response, or not own content
     */
    async unpin() {
        await this.client.modify_post_pinned_status(this, 'put')
        return this.fresh
    }

    // methods for your own pending posts

    /**
     * Update the scheduled post time of a pending post
     * @param  {Number}  time Timestamp in seconds to publish this post
     * @return {Promise<Post>}         This post
     * @throws                       Throws an error if bad api response, not pending post, or not own content
     */
    async set_schedule(time) {
        await this.client.modify_delayed_post_schedule(this, time)
        return this.fresh
    }

    /**
     * Update the scheduled post time of a pending post
     * @param  {String} visibility Visibility to set for this post
     *
     * `public`      -> appear in collective and potentially featured feed
     *
     * `subscribers` -> appear only in subscriber and timeline feeds
     *
     * @return {Promise<Post>}              This post
     * @throws                       Throws an error if bad api response, not pending post, or not own content
     */
    async set_visibility(visibility) {
        await this.client.modify_delayed_post_visibility(this, visibility)
        return this.fresh
    }

    // getters

    /**
     * The author of this Post
     * @type {Promise<User>}
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
     * @type {Promise<Number>}
     */
    get smile_count() {
        return (async () => {
            return await this.get('num')
                .smiles
        })()
    }

    /**
     * Number of unsmiles on this Post
     * @type {Promise<Number>}
     */
    get unsmile_count() {
        return (async () => {
            return await this.get('num')
                .unsmiles
        })()
    }

    /**
     * Number of guest smiles on this Post
     * @type {Promise<Number>}
     */
    get guest_smile_count() {
        return (async () => {
            return await this.get('num')
                .guest_smiles
        })()
    }

    /**
     * Number of comments on this Post
     * @type {Promise<Number>}
     */
    get comment_count() {
        return (async () => {
            return await this.get('num')
                .comments
        })()
    }

    /**
     * Number of views on this Post
     * @type {Promise<Number>}
     */
    get view_count() {
        return (async () => {
            return await this.get('num')
                .views
        })()
    }

    /**
     * Number of republications of this post
     * @type {Promise<Number>}
     */
    get republish_count() {
        return (async () => {
            return await this.get('num')
                .republished
        })()
    }

    /**
     * Number of shares of this Post
     * @type {Promise<Number>}
     */
    get share_count() {
        return (async () => {
            return await this.get('num')
                .shares
        })()
    }

    /**
     * Type of post
     * @type {Promise<String>}
     */
    get type() {
        return this.get('type')
    }

    /**
     * Background color of this image
     * @type {Promise<String>}
     */
    get bg_color() {
        return this.get('bg_color')
    }

    /**
     * Title of this Post
     * Published posts are published
     * @type {Promise<String>}
     */
    get title() {
        return this.get('title')
    }

    /**
     * Dynamic title of this Post
     * @type {Promise<String>}
     */
    get dynamic_title() {
        return this.get('fixed_title')
    }

    /**
     * State of this Post
     * Regular posts appear as published
     * Posts scheduled to be posted appear as delayed
     * @type {Promise<String>}
     */
    get state() {
        return this.get('state')
    }

    /**
     * Timestamp of post creation
     * @type {Promise<Number>}
     */
    get created_at() {
        return this.get('date_create')
    }

    /**
     * Timestamp of post publication
     * @type {Promise<Number>}
     */
    get publish_at() {
        return this.get('publish_at')
    }

    /**
     * Was this Post smiled by the bound Client?
     * @type {Promise<Boolean>}
     */
    get is_smiled() {
        return this.get('is_smiled')
    }

    /**
     * Was this Post unsmiled by the bound Client?
     * @type {Promise<Boolean>}
     */
    get is_unsmiled() {
        return this.get('is_unsmiled')
    }

    /**
     * Was this Post removed by moderators?
     * @type {Promise<Boolean>}
     */
    get is_abused() {
        return this.get('is_abused')
    }

    /**
     * Was this Post featured?
     * @type {Promise<Boolean>}
     */
    get is_featured() {
        return this.get('is_featured')
    }

    /**
     * Was this Post republished by the bound Client?
     * @type {Promise<Boolean>}
     */
    get is_republished() {
        return this.get('is_republished')
    }

    /**
     * Was this Post pinned by it's author?
     * @type {Promise<Boolean>}
     */
    get is_pinned() {
        return this.get('is_pinned')
    }

    /**
     * Is this Post using the old iFunny watermark?
     * @type {Promise<Boolean>}
     */
    get is_old_watermark() {
        return this.get('old_watermark')
    }

    /**
     * Is this Post able to be boosted?
     * @type {Promise<Boolean>}
     */
    get is_boostable() {
        return this.get('can_be_boosted')
    }

    /**
     * Tags attached to this Post
     * @type {Promise<Array<String>>}
     */
    get tags() {
        return this.get('tags')
    }

    /**
     * Original source of this content, if from another site
     * @type {Promise<string>}
     */
    get copyright_source() {
        return (async () => {
            return (await this.get('copyright'))
                .url || await (this.fresh.get('copyright'))
                .url
        })()
    }

    /**
     * Timestamp of when this post was featured, if featured
     * @type {Promise<Number|null>}
     */
    get issue_at() {
        return this.get('issue_at')
    }

    /**
     * Visibility of this post
     * Posts with public visibility will appear in collective and can be featured
     * Posts with subscribers visibility will only appear in home feeds,
     * linking to the post directly, or by viewing the authors timeline
     * @type {Promise<String>}
     */
    get visibility() {
        return this.get('visibility')
    }

    /**
     * Text detected in this post by iFunny ocr, if any
     * @type {Promise<String|null>}
     */
    get detected_text() {
        return this.get('ocr_text')
    }

    /**
     * Sharable link to this post
     * @type {Promise<String>}
     */
    get link() {
        return this.get('link')
    }

    /**
     * Same as `this.link`, but with a url
     * that indicates the type of content
     * @type {Promise<String>}
     */
    get canonical_link() {
        return this.get('canonical_url')
    }

    /**
     * Link to the content of this post,
     * with the old style ifunny.co banner watermark
     * @type {Promise<String>}
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

    // method alias'

    get remove_pin() {
        return this.unpin
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
