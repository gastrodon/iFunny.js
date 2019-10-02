const Client = require('../Client')
const axios = require('axios')
const methods = require('../../utils/methods')

/**
 * Get a chunk of this logged in users notifications
 * @param  {Object}  opts={}       optional parameters
 * @param  {Number}  opts.limit=25 Number of items to fetch
 * @return {Promise<Object>}         chunk of notifications with paging info
 */
Client.prototype.notifications_paginated = async function(opts = {}) {
    let Notification = require('../Notification')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/news/my`, {
        limit: opts.limit || instance.paginated_size,
        key: 'news',
        prev: opts.prev,
        next: opts.next,
        headers: instance.headers
    })

    data.items = data.items.map((item) => new Notification(item, { client: instance }))
    return data
}

Client.prototype.chat_messages_paginated = async function(opts = {}) {
    let Message = require('../Message')
    let instance = opts.instance || this

    let params = {
        prev_limit: opts.limit || instance.paginated_size,
        next_limit: 0,
        include: true,
        is_sdk: true,
        reverse: true
    }

    if (opts.next) {
        params.message_id = next
    } else {
        params.message_ts = Date.now()
    }

    let response = await axios({
        method: 'get',
        url: `${instance.sendbird_api}/group_channels/${opts.chat.channel_url || opts.chat}/messages`,
        params: params,
        headers: await instance.sendbird_headers
    })

    let index = response.data.messages.length - 1
    let next_id = index >= 0 ? response.data.messages[index] : null
    let messages = response.data.messages.map(
        it => new Message(it.message_id, it.channel_url, { client: instance, data: it })
    )

    return { items: messages, paging: { prev: null, next: next_id } }
}

Client.prototype.chat_members_paginated = async function(opts = {}) {
    let ChatUser = require('../ChatUser')
    let instance = opts.instance || this

    let params = {
        limit: opts.limit || instance.paginated_size
    }

    if (opts.next) {
        params.next = opts.next
    }

    let response = await axios({
        method: 'get',
        url: `${instance.sendbird_api}/group_channels/${opts.chat.channel_url || opts.chat}/members`,
        params: params,
        headers: await instance.sendbird_headers
    })

    let members = response.data.members.map(
        it => new ChatUser(it.user_id, opts.chat, { client: this, chat_data: it })
    )

    return { items: members, paging: { prev: null, next: response.data.next } }

};

module.exports = Client
