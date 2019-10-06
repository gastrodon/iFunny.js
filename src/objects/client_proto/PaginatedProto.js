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

/**
 * Get a chunk of this logged in users chats
 * @param  {Object}  opts={}       optional parameters
 * @param  {Number}  opts.limit=25 Number of items to fetch
 * @return {Promise<Object>}         chunk of chats with paging info
 */
Client.prototype.chats_paginated = async function(opts = {}) {
    let Chat = require('../Chat')
    let instance = opts.instance || this
    params = {
        limit: opts.limit || instance.paginated_size,
        token: opts.next || null,
        show_empty: true,
        show_read_recipt: true,
        show_member: true,
        public_mode: 'all',
        super_mode: 'all',
        distinct_mode: 'all',
        member_state_filter: 'all',
        order: 'latest_last_message'
    }

    let response = await axios({
        method: 'get',
        url: `${instance.sendbird_api}/users/${instance.id_sync}/my_group_channels`,
        params: params,
        headers: await instance.sendbird_headers
    })

    let chats = response.data.channels.map(
        it => new Chat(it.channel_url, { client: instance, data: it })
    )
    return { items: chats, paging: { next: response.data.next } }
};

/**
 * Get a chunk of the messages in a chat
 * @param  {Object}  opts={}       optional parameters
 * @param  {Number}  opts.limit=25 Number of items to fetch
 * @param  {Number}  opts.chat    Chat to fetch messages from
 * @return {Promise<Object>}       Chunk of messages with paging info
 */
Client.prototype.chat_messages_paginated = async function(opts = {}) {
    let Message = require('../Message')
    let instance = opts.instance || this

    if (!opts.chat) {
        throw `a chat is required`
    }

    let params = {
        prev_limit: opts.limit || instance.paginated_size,
        next_limit: 0,
        include: true,
        is_sdk: true,
        reverse: true
    }

    if (opts.next) {
        params.message_id = opts.next
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
    let next_id = index >= 0 ? response.data.messages[index].message_id : null
    let messages = response.data.messages.map(
        it => new Message(it.message_id, it.channel_url, { client: instance, data: it })
    )

    return { items: messages, paging: { prev: null, next: next_id } }
}

/**
 * Get a chunk of the members of a chat
 * @param  {Object}  opts={}       optional parameters
 * @param  {Number}  opts.limit=25 Number of items to fetch
 * @param  {Number}  opts.chat     Chat to fetch members from
 * @return {Promise<Object>}       Chunk of chat memebrs with paging info
 */
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
        it => new ChatUser(it.user_id, opts.chat, { client: instance, chat_data: it, data: it })
    )

    return { items: members, paging: { prev: null, next: response.data.next } }

}

/**
 * Get a chunk of posts from the feed of a channel
 * @param  {Object}  opts={}            optional parameters
 * @param  {Number}  opts.limit=25      Number of items to fetch
 * @param  {Number}  opts.channel       Channel to fetch posts from
 * @return {Promise<Object>}            Chunk of chat memebrs with paging info
 */
Client.prototype.channel_feed_paginated = async function(opts = {}) {
    let Post = require('../Post')
    let instance = opts.instance || this

    let params = {
        limit: opts.limit || instance.paginated_size
    }

    if (opts.next) {
        params.next = opts.next
    }

    let data = await methods.paginated_data(`${instance.api}/channels/${opts.channel.id || opts.channel}/items`)
    data.items = data.items.map((item) => new Post(item.id, { client: instance, data: item }))
    return data
};

module.exports = Client
