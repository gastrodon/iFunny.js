const Client = require('../Client')
const axios = require('axios')
const qs = require('qs')

async function get_slice(source, query) {
    let index = source.indexOf(query)
    return index > -1 ? `${index}:${index + query.length - 1}` : null
}

/**
 * Add a comment to a post
 * @param  {Post|String} post                           Post to add a comment to
 * @param  {String} text=null                           Text of this post
 * @param  {Post|String} attachment=null                Post to attach to the comment
 * @param  {Array<User>|Array<String>} mentions=null    Users to mention in this post
 * @return {Object}                                     API response
 */
Client.prototype.add_comment_to_post = async function(post, text, attachment, mentions) {
    let data = {}

    if (text) {
        data.text = text
    }

    if (attachment) {
        data.content = attachment.id || attachment
    }

    if (mentions) {
        let formatted = []
        for (let user of mentions) {
            if (typeOf(user) === 'string') {
                let User = require('../User')
                user = new User(user, { client: this })
            }
            formatted.push([user, await get_slice(text, await user.nick)])
        }
    }

    let response = await axios({
        method: 'post',
        url: `${this.api}/content/${post.id || post}/comments`,
        data: qs.stringify(data),
        headers: await this.headers
    })

    return response.data.data.id
}

/**
 * Modify the smile status of this client on a post
 * @param  {Post|String}    post   Post to modify the smile on
 * @param  {String}         method To `put` or `delete` a smile on this post
 * @return {Object}                API response
 */
Client.prototype.modify_post_smile = async function(post, method) {
    let response = await axios({
        method: method,
        url: `${this.api}/content/${post.id || post}/smiles`,
        headers: await this.headers
    })

    return response
}

/**
 * Modify the unsmile status of this client on a post
 * @param  {Post|String}    post   Post to modify the unsmile on
 * @param  {String}         method To `put` or `delete` a unsmile on this post
 * @return {Object}                API response
 */
Client.prototype.modify_post_unsmile = async function(post, method) {
    let response = await axios({
        method: method,
        url: `${this.api}/content/${post.id || post}/unsmiles`,
        headers: await this.headers
    })

    return response
}

/**
 * Modify the republish status of this client on a post
 * @param  {Post|String}    post   Post to modify the republish status on
 * @param  {String}         method To `put` or `delete` a republish on this post
 * @return {Object}                API response
 */
Client.prototype.modify_post_republish = async function(post, method) {
    let response = await axios({
        method: method,
        url: `${this.api}/content/${post.id || post}/republished`,
        headers: await this.headers
    })
}

/**
 * Report a post
 * @param  {Post|String}    user Post to report
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
 * @return {Object}              API response
 */
Client.prototype.report_post = async function(post, type) {
    let params = {
        type: type
    }

    let response = await axios({
        method: 'put',
        url: `${this.api}/content/${post.id || post}/abuses`,
        params: params,
        headers: await this.headers
    })

    return response
}

/**
 * Modify the tags on a post
 * @param  {Post|String}    post Post to modify the tags of
 * @param  {Array<String>}  tags Tags to use on this post
 * @return {Object}              API response
 */
Client.prototype.modify_post_tags = async function(post, tags) {
    let data = {
        tags: tags.map((tag) => {
            return `"${tag.replace(' ', '')}"`
        })
    }

    let response = await axios({
        method: 'put',
        url: `${this.api}/content/${post.id || post}/tags`,
        data: qs.stringify(data),
        headers: await this.headers
    })

    return response
}

/**
 * Delete a post
 * @param  {Post|String} post Post to delete
 * @return {Object}           API response
 */
Client.prototype.delete_post = async function(post) {
    let response = axios({
        method: 'delete',
        url: `${this.api}/content${post.id || post}`,
        headers: await this.headers
    })

    return response
}

/**
 * Modify the pinned status of a post
 * @param  {Post|String}    post   Post to pin or unpin
 * @param  {String}         method To `put` or `delete` a pin on a post
 * @return {Object}                API response
 */
Client.prototype.modify_post_pinned_status = async function(post, method) {
    let response = await axios({
        method: method,
        url: `${this.api}/content/${post.id || post}/pinned`,
        headers: await this.headers
    })

    return response
}

/**
 * Modify the scheduled post time of a pending delayed post
 * @param  {Post|String}    post Post to modify the schedule of
 * @param  {Number}         time Timestamp in seconds to publish this post at
 * @return {Object}              API response
 */
Client.prototype.modify_delayed_post_schedule = async function(post, time) {
    let data = {
        publish_at: parseInt(time)
    }

    let response = await axios({
        method: 'patch',
        url: `${this.api}/content/${post.id || post}`,
        data: qs.stringify(data),
        headers: await this.headers
    })

    return response
}

/**
 * Modify the visibility of a pending delated post
 * @param  {Post|String}    post       Post to modify the visibility of
 * @param  {String}         visibility Visibility to set for this post
 *
 * `public`      -> appear in collective and potentially featured feed
 *
 * `subscribers` -> appear only in subscriber and timeline feeds
 *
 * @return {Object}                    API response
 */
Client.prototype.modify_delayed_post_visibility = async function(post, visibility) {
    let data = {
        visibility: visibility
    }

    let response = await axios({
        method: 'patch',
        url: `${this.api}/content/${post.id || post}`,
        data: qs.stringify(data),
        headers: await this.headers
    })

    return response
}

/**
 * Mark a post as read by this client
 * @param  {Post|String} post Post to mark as read
 * @return {Object}           API response
 */
Client.prototype.read_post = async function(post) {
    let response = await axios({
        method: 'put',
        url: `${this.api}/reads/${post.id || post}`,
        headers: await this.headers
    })
};

module.exports = Client
