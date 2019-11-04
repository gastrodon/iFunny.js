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
 * Get a chunk of guests for some user. For non-admins, only their own guests are visible.
 * @param  {Object}  opts={}        Optional parameters
 * @param  {User|String}  opts.user User to get the guests of
 * @param  {String}  opts.query     Search query
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}        Chunk of users with paging and info and visit_at timestamps
 */
Client.prototype.user_guests_paginated = async function(opts = {}) {
    let User = require('../User')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/users/${opts.user.id || opts.user}/guests`, {
        limit: opts.limit || instance.paginated_size,
        key: 'guests',
        next: opts.next,
        headers: await instance.headers
    })

    data.items = data.items
        .map(item => ({
            user: new User(item.guest.id, {
                client: instance,
                data: item.guest
            }),

            visit_at: item.visit_timestamp
        }))

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
        params.token = opts.next
    }

    let response = await axios({
        method: 'get',
        url: `${instance.sendbird_api}/group_channels/${opts.chat.channel_url || opts.chat}/members`,
        params: { ...params, ...(opts.params || {}) },
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
 * @return {Promise<Object>}          Chunk of posts with paging info
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

    data.items = data.items
        .map(item => new Post(item.id, { client: instance, data: item }))

    return data
}

/**
 * Get a Chunk of the posts by the subscriptions of this logged in client
 * @param  {Object}  opts={}        Optional parameters
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}          Chunk of posts with paging info
 */
Client.prototype.home_paginated = async function(opts = {}) {
    let Post = require('../Post')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/timelines/home`, {
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
 * Get a Chunk of the posts smiled by this logged in client
 * @param  {Object}  opts={}        Optional parameters
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}          Chunk of posts with paging info
 */
Client.prototype.smiles_paginated = async function(opts = {}) {
    let Post = require('../Post')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/users/my/content_smiles`, {
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
 * Get a Chunk of the comments made by this logged in client
 * @param  {Object}  opts={}        Optional parameters
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}          Chunk of comments with paging info
 */
Client.prototype.comments_paginated = async function(opts = {}) {
    let Comment = require('../Comment')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/users/my/comments`, {
        limit: opts.limit || instance.paginated_size,
        key: 'comments',
        next: opts.next,
        headers: await instance.headers
    })

    data.items = data.items
        .map(item => new Comment(item.id, { client: instance, data: item }))

    return data
}

/**
 * Get a Chunk of posts from collective
 * @param  {Object}  opts={}        Optional parameters
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}          Chunk of posts with paging info
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
 * @return {Promise<Object>}          Chunk of posts with paging info
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
 * @return {Promise<Object>}               Chunk of posts with paging info
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
        .map(item => new Digest(item.id, { client: instance, data: item }))

    return data
}

/**
 * Get a Chunk of search results for a tag
 * @param  {Object}  opts={}        Optional parameters
 * @param  {String}  opts.query     Search query
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}          Chunk of posts with paging info
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
        .map(item => new Post(item.id, { client: instance, data: item }))

    return data
}

/**
 * Get a Chunk of search results for a user query
 * @param  {Object}  opts={}        Optional parameters
 * @param  {String}  opts.query     Search query
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}          Chunk of posts with paging info
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
        .map(item => new User(item.id, { client: instance, data: item }))

    return data
}

/**
 * Get a chunk of search results for a chat query
 * @param  {Object}  opts={}        Optional parameters
 * @param  {String}  opts.query     Search query
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}          Chunk of posts with paging info
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
        .map(item => new Chat(item.channel_url, { client: instance, data: item }))

    return data
}

/**
 * Get a chunk of subscribers of a user
 * @param  {Object}  opts={}        Optional parameters
 * @param  {User|String}  opts.user User to get the subscribers of
 * @param  {String}  opts.query     Search query
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}        Chunk of users with paging info
 */
Client.prototype.user_subscribers_paginated = async function(opts = {}) {
    let User = require('../User')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/users/${opts.user.id || opts.user}/subscribers`, {
        limit: opts.limit || instance.paginated_size,
        key: 'users',
        next: opts.next,
        headers: await instance.headers
    })
    data.items = data.items
        .map(item => new User(item.id, { client: instance, data: item }))

    return data
}

/**
 * Get a chunk of subscriptions of a user
 * @param  {Object}  opts={}        Optional parameters
 * @param  {User|String}  opts.user User to get the subscriptions of
 * @param  {String}  opts.query     Search query
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}          Chunk of users with paging info
 */
Client.prototype.user_subscriptions_paginated = async function(opts = {}) {
    let User = require('../User')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/users/${opts.user.id || opts.user}/subscriptions`, {
        limit: opts.limit || instance.paginated_size,
        key: 'users',
        next: opts.next,
        headers: await instance.headers
    })
    data.items = data.items
        .map(item => new User(item.id, { client: instance, data: item }))

    return data
}

/**
 * Get a chunk of bans of a user
 * @param  {Object}  opts={}        Optional parameters
 * @param  {User|String}  opts.user User to get the bans of
 * @param  {String}  opts.query     Search query
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}          Chunk of users with paging info
 */
Client.prototype.user_bans_paginated = async function(opts = {}) {
    let Bans = require('../small/Bans')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/users/${opts.user.id || opts.user}`, {
        limit: opts.limit || instance.paginated_size,
        key: 'bans',
        next: opts.next,
        headers: await instance.headers
    })
    data.items = data.items
        .map(item => new Ban(item.id, { client: instance, user: opts.user, data: item }))

    return data
}

/**
 * Get a chunk of smiles of a post
 * @param  {Object}  opts={}        Optional parameters
 * @param  {Post|String}  opts.post Post to get the smiles of
 * @param  {String}  opts.query     Search query
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}          Chunk of users with paging info
 */
Client.prototype.post_smiles_paginated = async function(opts = {}) {
    let User = require('../User')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/content/${opts.post.id || opts.post}/smiles`, {
        limit: opts.limit || instance.paginated_size,
        key: 'users',
        next: opts.next,
        headers: await instance.headers
    })
    data.items = data.items
        .map(item => new User(item.id, { client: instance, data: item }))

    return data
}

/**
 * Get a chunk of comments of a post
 * @param  {Object}  opts={}        Optional parameters
 * @param  {Post|String}  opts.post Post to get the comments of
 * @param  {String}  opts.query     Search query
 * @param  {Number}  opts.limit=25  Number of items to fetch
 * @param  {Number}  opts.next=null Nextpage token
 * @return {Promise<Object>}          Chunk of users with paging info
 */
Client.prototype.post_comments_paginated = async function(opts = {}) {
    let Comment = require('../Comment')
    let instance = opts.instance || this

    let data = await methods.paginated_data(`${instance.api}/content/${opts.post.id || opts.post}/comments`, {
        limit: opts.limit || instance.paginated_size,
        key: 'comments',
        next: opts.next,
        headers: await instance.headers
    })
    data.items = data.items
        .map(item => new Comment(item.id, item.cid, { client: instance, data: item }))

    return data
}

module.exports = Client
