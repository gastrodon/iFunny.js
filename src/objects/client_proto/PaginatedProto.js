const Client = require('../Client')
const axios = require('axios')
const methods = require('../../utils/methods')

/**
 * Get a Chunk of the notifications for this client
 * @param  {Object}  opts={}        Optional parameters
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}        Chunk of notifications with paging info
 */
Client.prototype.notifications_paginated = async function(opts = {}) {
    let Notification = require('../Notification')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/news/my`, {
        limit: opts.limit || instance.paginated_size,
        key: 'news',
        next: opts.next,
        headers: await instance.headers
    })

    data.items = data.items
        .map(item => new Notification(item, { client: instance }))

    return data
}

/**
 * Get a Chunk of posts from the feed of a channel
 * @param  {Object}  opts={}            Optional parameters
 * @param  {Number}  opts.limit=25      Number of items to fetch
 * @param  {Number}  opts.next=null     Nextpage token
 * @param  {Number}  opts.channel       Channel to fetch posts from
 * @return {Promise<Object>}            Chunk of chat memebrs with paging info
 */
Client.prototype.channel_feed_paginated = async function(opts = {}) {
    let Post = require('../Post')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/channels/${opts.channel.id || opts.channel}/items`, {
        limit: opts.limit || instance.paginated_size,
        key: 'content',
        next: opts.next,
        headers: await instance.headers
    })

    data.items = data.items
        .map((item) => new Post(item.id, { client: instance, data: item }))

    return data
}

/**
 * Get a Chunk of this logged in users chats
 * @param  {Object}  opts={}        Optional parameters
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}        Chunk of chats with paging info
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

    let chats = response.data.channels
        .map(it => new Chat(it.channel_url, { client: instance, data: it }))
    return { items: chats, paging: { next: response.data.next } }
}

/**
 * Get a Chunk of the messages in a chat
 * @param  {Object}  opts={}        Optional parameters
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.chat      Chat to fetch messages from
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}        Chunk of messages with paging info
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
    let messages = response.data.messages
        .map(it => new Message(it.message_id, it.channel_url, { client: instance, data: it }))

    return { items: messages, paging: { prev: null, next: next_id } }
}

/**
 * Get a Chunk of the members of a chat
 * @param  {Object}  opts={}        Optional parameters
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.chat      Chat to fetch members from
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}        Chunk of chat memebrs with paging info
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

    let members = response.data.members
        .map(it => new ChatUser(it.user_id, opts.chat, { client: instance, chat_data: it, data: it }))

    return { items: members, paging: { prev: null, next: response.data.next } }

}

/**
 * Get a Chunk of the posts marked as read by this client
 * @param  {Object}  opts={}        Optional parameters
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Post>}          Chunk of posts with paging info
 */
Client.prototype.reads_paginated = async function(opts = {}) {
    let Post = require('../Post')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/feeds/reads`, {
            limit: opts.limit || instance.paginated_size,
            key: 'content',
            next: opts.next,
            headers: await instance.headers
        })
        .catch(e => console.log(e.response.data))

    data.items = data.items
        .map(item => new Post(item.id, { client: instance, data: item }))

    return data
}

/**
 * Get a Chunk of posts from collective
 * @param  {Object}  opts={}        Optional parameters
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Post>}          Chunk of posts with paging info
 */
Client.prototype.collective_paginated = async function(opts = {}) {
    let Post = require('../Post')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/feeds/collective`, {
        method: 'post',
        limit: opts.limit || instance.paginated_size,
        key: 'content',
        next: opts.next,
        headers: await instance.headers
    })

    data.items = data.items
        .map(item => new Post(item.id, { client: instance, data: item }))

    return data
}

/**
 * Get a Chunk of featured posts
 * @param  {Object}  opts={}        Optional parameters
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Post>}          Chunk of posts with paging info
 */
Client.prototype.features_paginated = async function(opts = {}) {
    let Post = require('../Post')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/feeds/featured`, {
        limit: opts.limit || instance.paginated_size,
        key: 'content',
        next: opts.next,
        headers: await instance.headers
    })

    data.items = data.items
        .map(item => new Post(item.id, { client: instance, data: item }))

    return data
}

/**
 * Get a Chunk of the weekly digests
 * @param  {Object}  opts={}             Optional parameters
 * @param  {Number}  opts.limit=25       Number of items to fetch
 * @param  {Number}  opts.next=null      Nextpage token
 * @param  {Boolean} opts.comments=false Get comment data from each digest?
 * @param  {Boolean} opts.contents=false Get content data from each digest?
 * @return {Promise<Post>}               Chunk of posts with paging info
 */
Client.prototype.digests_paginated = async function(opts = {}) {
    let Digest = require('../Digest')
    let instance = opts.instance || this

    let params = {
        comments: ~~(opts.comments || false),
        contents: ~~(opts.contents || false)
    }

    let data = await methods.paginated_data(`${instance.api}/digest_groups`, {
        limit: opts.limit || instance.paginated_size,
        next: opts.next,
        params: params,
        headers: await instance.headers
    })

    data.items = data.items
        .map(item => new Digest(item.id, { client: this, data: item }))

    return data
}

/**
 * Get a Chunk of search results for a tag
 * @param  {Object}  opts={}        Optional parameters
 * @param  {String}  opts.query     Search query
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Post>}          Chunk of posts with paging info
 */
Client.prototype.search_tags_paginated = async function(opts = {}) {
    let Post = require('../Post')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/search/content`, {
            limit: opts.limit || instance.paginated_size,
            key: 'content',
            next: opts.next,
            params: { q: opts.query },
            headers: await instance.headers
        })
        .catch(error => console.log(error.response))

    data.items = data.items
        .map(item => new Post(item.id, { client: this, data: item }))

    return data
}

/**
 * Get a Chunk of search results for a user query
 * @param  {Object}  opts={}        Optional parameters
 * @param  {String}  opts.query     Search query
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<User>}          Chunk of posts with paging info
 */
Client.prototype.search_users_paginated = async function(opts = {}) {
    let User = require('../User')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/search/users`, {
        limit: opts.limit || instance.paginated_size,
        key: 'users',
        next: opts.next,
        params: { q: opts.query },
        headers: await instance.headers
    })

    data.items = data.items
        .map(item => new User(item.id, { client: this, data: item }))

    return data
}

/**
 * Get a chunk of search results for a chat query
 * @param  {Object}  opts={}        Optional parameters
 * @param  {String}  opts.query     Search query
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Chat>}          chunk of posts with paging info
 */
Client.prototype.search_chats_paginated = async function(opts = {}) {
    let Chat = require('../Chat')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/search/chats/channels`, {
        limit: opts.limit || instance.paginated_size,
        key: 'channels',
        next: opts.next,
        params: { q: opts.query },
        headers: await instance.headers
    })

    data.items = data.items
        .map(item => new Chat(item.channel_url, { client: this, data: item }))

    return data
}

module.exports = Client