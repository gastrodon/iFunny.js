const Client = require('../Client')
const axios = require('axios')

/**
 * Find the user with a given nick
 * @param  {String}    nick Nick of this user
 * @return {Promise<User|Null>}      User that was found, if any
 */
Client.prototype.user_by_nick = async function(nick) {
    try {
        let response = await axios({
            method: 'get',
            url: `${this.api}/users/by_nick/${nick}`,
            headers: await this.headers
        })
        let User = require('../User')

        return new User(response.data.data.id, { client: this, data: response.data.data })
    } catch (exception) {
        if (exception.response && exception.response.status == 404) {
            return null
        } else {
            throw exception
        }
    }
}

/**
 * Modify the client subscription status of a user
 * @param  {String}         method To `put` or `delete` this subscription
 * @param  {User|String}    user   User to modify the subscription of
 * @return {Promise<Object>} API response
 */
Client.prototype.modify_user_subscription_status = async function(method, user) {
    let response = await axios({
        method: method,
        url: `${this.api}/users/${user.id || user}/subscribers`,
        headers: await this.headers
    })

    return response
}

/**
 * Modify the client updates subscription status of a user
 * @param  {String}         method To `put` or `delete` this subscription
 * @param  {User|String}    user   User to modify the subscription of
 * @return {Promise<Object>} API response
 */
Client.prototype.modify_user_updates_subscription_status = async function(method, user) {
    let response = await axios({
        method: method,
        url: `${this.api}/users/${user.id || user}/updates_subscribers`,
        headers: await this.headers
    })

    return response
}

/**
 * Modify the client blocking status of a user
 * @param  {String}         method To `put` or `delete` this block
 * @param  {User|String}    user   User to modify the block of
 * @param  {String}         type   Type of block to use
 *
 *`user`            -> block a single user
 *
 *`installation`    -> block all accounts owned by a user
 *
 * @return {Promise<Object>} API response
 */
Client.prototype.modify_block_of_user = async function(method, user, type) {
    let params = {
        type: type || 'user'
    }

    let response = await axios({
        method: method,
        url: `${this.api}/users/my/blocked/${user.id || user}`,
        params: params,
        headers: await this.headers
    })

    return response
}

/**
 * Report a user
 * @param  {User|String}    user User to report
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
 * @return {Promise<Object>} API response
 */
Client.prototype.report_user = async function(user, type) {
    let params = {
        type: type
    }

    let response = await axios({
        method: 'put',
        url: `${this.api}/users/${user.id || user}/abuses`,
        params: params,
        headers: await this.headers
    })

    return response
}

Client.prototype.get_user_chat_url = async function(user) {
    let data = {
        'chat_type': 'chat',
        'users': user.id || user
    }

    let response = await axios({
        method: 'POST',
        url: `${this.api}/chats`,
        data: data,
        headers: await this.headers
    })

    return response
}


module.exports = Client
