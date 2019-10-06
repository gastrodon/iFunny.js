const Client = require('../Client')
const axios = require('axios')
const qs = require('qs')
const { compose_comment } = require('../../utils/methods')

/**
 * Add a comment to a post
 * @param  {Comment|String} post                        Comment to add a reply to
 * @param  {Post|String} post                           Post where the root comment exists
 * @param  {String} text=null                           Text of this reply
 * @param  {Post|String} attachment=null                Post to attach to the reply
 * @param  {Array<User>|Array<String>} mentions=null    Users to mention in this reply
 * @return {Promise<Object>}                                     API response
 */
Client.prototype.add_reply_to_comment = async function(comment, post, text, attachment, mentions) {
    let data = compose_comment(text, attachment, mentions)

    let response = await axios({
        method: 'post',
        url: `${this.api}/content/${post.id || post}/comments/${comment.id || comment}/replies`,
        data: qs.stringify(data),
        headers: await this.headers
    })

    return response
}

/**
 * Delete a comment
 * @param  {Comment|String} comment Comment that should be deleted
 * @param  {Post|String}       post Post where the comment exists
 * @return {Promise<Object>}                 API response
 */
Client.prototype.delete_comment = async function(comment, post) {
    let response = await axios({
        method: 'delete',
        url: `${this.api}/content/${post.id || post}/comments/${comment.id || content}`,
        headers: await this.headers
    })

    return response
}
/**
 * Modify the smile status of this client on a comment
 * @param  {Comment|String}    comment   Post to modify the smile on
 * @param  {Post|String}       post      Post where the comment exists
 * @param  {String}            method    To `put` or `delete` a smile on this post
 * @return {Promise<Object>}                      API response
 */
Client.prototype.modify_comment_smile = async function(comment, post, method) {
    let response = await axios({
        method: method,
        url: `${this.api}/content/${post.id || post}/comments/${comment.id || content}/smiles`,
        headers: await this.headers
    })
}

/**
 * Modify the unsmile status of this client on a comment
 * @param  {Comment|String}    comment   Post to modify the unsmile on
 * @param  {Post|String}       post      Post where the comment exists
 * @param  {String}            method    To `put` or `delete` a unsmile on this post
 * @return {Promise<Object>}                      API response
 */
Client.prototype.modify_comment_unsmile = async function(comment, post, method) {
    let response = await axios({
        method: method,
        url: `${this.api}/content/${post.id || post}/comments/${comment.id || content}/unsmiles`,
        headers: await this.headers
    })
}

/**
 * Report a comment
 * @param  {Comment|String} comment Comment to report
 * @param  {Post|String}    post    Post where the comment exists
 * @param  {String}         type    Type of report to send
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
 * @return {Promise<Object>}              API response
 */
Client.prototype.report_comment = async function(comment, post, type) {
    let params = {
        type: type
    }

    let response = await axios({
        method: 'put',
        url: `${this.api}/content/${post.id || post}/comments/${comment.id || content}/abuses`,
        params: params,
        headers: await this.headers
    })

    return response
}
