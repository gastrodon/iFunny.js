const Client = require('../Client')
const FormData = require('form-data')
const request = require('request')
const axios = require('axios')
const util = require('util')

/**
 * Get the total message count of a chat
 * @param  {Chat|String}  chat Chat to query the message count of
 * @return {Number}            Total message count
 */
Client.prototype.chat_message_total = async function(chat) {
    let response = await axios({
        method: 'get',
        url: `${this.sendbird_api}/group_channels/${chat.channel_url || chat}/messages/total_count`,
        headers: await this.sendbird_headers
    })

    return response.data.total
}

/**
 * Modify the presence of this client in a chat (by joining or exiting)
 * @param  {String}         state HTTP request to modify with, `put` or `delete`
 * @param  {Chat|String}    chat  Chat or channel_url to modify presence in
 * @return {Promise<Object>}                    API response
 */
Client.prototype.modify_chat_presence = async function(state, chat) {
    let response = await axios({

        method: state,
        url: `${this.api}/chats/channels/${chat.channel_url || chat}/members`,
        headers: await this.headers
    })
    return response
}

/**
 * Modify the frozen state of a chat
 * @param  {Boolean}        state Should this chat be frozen?
 * @param  {Chat|String}    chat  Chat that should have it's frozen state modified
 * @return {Promise<Object>}                    API response
 */
Client.prototype.modify_chat_freeze = async function(state, chat) {
    let data = `is_frozen=${state}`

    let response = await axios({

        method: 'put',
        url: `${this.api}/chats/channels/${chat.channel_url || chat}`,
        data: data,
        headers: await this.headers
    })
    return response
}

/**
 * Invite a user or list of users to a chat
 * @param  {User|String|Array<User>|Array<String>}  users Array of or single instance of a user or id of a user to invite
 * @param  {Chat|String}                            chat  Chat or channel_url of the chat to invite a user to
 * @return {Promise<Object>}                    API response
 */
Client.prototype.invite_users_to_chat = async function(users, chat) {
    if (!(users.length)) {
        users = [users]
    }

    if (users[0].id) {
        users = users.map(it => it.id)
    }

    let data = {
        'user_ids': users
    }

    let response = await axios({
        method: 'post',
        url: `${this.sendbird_api}/group_channels/${chat.id || chat}/invite`,
        data: JSON.stringify(data),
        headers: await this.sendbird_headers

    })

    return response
}

/**
 * Modify the state of a pending invite by accepting or declining it
 * @param  {String}         state To `accept` or `decline` this invite
 * @param  {Chat|String}    chat  Chat from which the invite is broadcast
 * @return {Promise<Object>}                    API response
 */
Client.prototype.modify_pending_invite = async function(state, chat) {
    let data = {
        'user_id': await this.id
    }

    let response = await axios({
        method: 'put',
        url: `${this.sendbird_api}/group_channels/${chat.channel_url || chat}/${state}`,
        data: data,
        headers: await this.sendbird_headers
    })

    return response
}

/**
 * Kick a user from a chat
 * @param  {User|String}  user User that should be kicked
 * @param  {Chat|String}  chat Chat that a user should be kicked from
 * @return {Promise<Object>}                    API response
 */
Client.prototype.kick_chat_user = async function(user, chat) {
    let data = `users=${user.id || user}`

    let response = await axios({
        method: 'PUT',
        url: `${this.api}/chats/${chat.id || chat}/kicked_users`,
        data: data,
        headers: await this.headers
    })

    return response
}

Client.prototype.ban_chat_user = async function(user, chat, duration) {
    let data = {
        user_id: user.id || user,
        seconds: duration || -1,
        agent_id: this.id_sync
    }

    let response = await axios({
        method: 'POST',
        url: `${this.sendbird_api}/group_channels/${chat.id || chat}/ban`,
        data: data,
        headers: await this.sendbird_headers
    })

    return response
}

/**
 * Delete a message from a chat
 * @param  {Chat|String}    chat    Chat that this message is in
 * @param  {Message|String} message Message that should be deleted
 * @return {Promise<Object>}                    API response
 */
Client.prototype.delete_chat_message = async function(chat, message) {
    let response = await axios({
        method: 'delete',
        url: `${this.sendbird_api}/group_channels/${chat.channel_url || chat}/messages/${message.id || message}`,
        headers: await this.sendbird_headers
    })

    return response
}

/**
 * Delete a message from a chat
 * @param  {Chat|String}    chat    Chat that this message is in
 * @param  {Message|String} message Message that should be edited
 * @param  {String}         content Content that should replace the message's content
 * @return {Promise<Object>}                    API response
 */
Client.prototype.edit_chat_text_message = async function(chat, message, content) {
    let data = {
        message_type: 'MESG',
        message: content
    }

    let response = await axios({
        method: 'put',
        url: `${this.sendbird_api}/group_channels/${chat.channel_url || chat}/messages/${message.id || message}`,
        data: data,
        headers: await this.sendbird_headers
    })

    return response
}

/**
 * Modify the operators in a chat
 * @param  {String}         mode HTTP request type to modify with, `put` or `delete`
 * @param  {User|String}    user User or user id of the user to modify the operator status of
 * @param  {Chat|String}    chat Chat in which to modify operators
 * @return {Promise<Object>}                    API response
 */
Client.prototype.modify_chat_operator = async function(mode, user, chat) {
    let data = `operators=${user.id || user}`

    let response = await axios({
        method: mode,
        url: `${this.api}/chats/channels/${chat.channel_url || chat}/operators`,
        data: data,
        headers: await this.headers
    })

    return response
}

Client.prototype.add_chat_operators = async function(users, chat) {
    if (!chat.id) {
        let Chat = require("../Chat")
        chat = new Chat(chat, { client: this })
    }

    if (users[0] && users[0].id) {
        users = users.map(it => it.id)
    }

    let data = JSON.parse(await chat.get('data'))
    let admin_ids = new Set([...((await chat.meta)
        .operatorsIdList || []), ...users])

    data.chatInfo.operatorsIdList = [...admin_ids]

    let response = await axios({
        method: 'PUT',
        url: `${this.sendbird_api}/group_channels/${chat.id || chat}`,
        data: JSON.stringify({ data: JSON.stringify(data) }),
        headers: await this.sendbird_headers
    })

    return response
}

Client.prototype.remove_chat_operators = async function(users, chat) {
    if (!chat.id) {
        let Chat = require("../Chat")
        chat = new Chat(chat, { client: this })
    }

    if (users[0] && users[0].id) {
        users = users.map(it => it.id)
    }


    let data = JSON.parse(await chat.get('data'))

    data.chatInfo.operatorsIdList = ((await chat.meta)
            .operatorsIdList || [])
        .filter(it => !users.includes(it))

    let response = await axios({
        method: 'PUT',
        url: `${this.sendbird_api}/group_channels/${chat.id || chat}`,
        data: JSON.stringify({ data: JSON.stringify(data) }),
        headers: await this.sendbird_headers
    })

    return response
}

/**
 * Add an admin to a chat
 * @param  {User|String}    user User that should be an admin
 * @param  {Array<Chat|String>}    chat Chat to add an admin to
 * @return {Promise<Object>}     API response
 */
Client.prototype.add_chat_admins = async function(users, chat) {
    if (!chat.id) {
        let Chat = require("../Chat")
        chat = new Chat(chat, { client: this })
    }

    if (users[0] && users[0].id) {
        users = users.map(it => it.id)
    }

    let data = JSON.parse(await chat.get('data'))
    let admin_ids = new Set([...((await chat.meta)
        .adminsIdList || []), ...users])

    data.chatInfo.adminsIdList = [...admin_ids]

    let response = await axios({
        method: 'PUT',
        url: `${this.sendbird_api}/group_channels/${chat.id || chat}`,
        data: JSON.stringify({ data: JSON.stringify(data) }),
        headers: await this.sendbird_headers
    })

    return response
}

/**
 * Remove an admin from a chat
 * @param  {User|String}    user User that should not be an admin
 * @param  {Array<Chat|String>}    chat Chat to remove an admin from
 * @return {Promise<Object>}     API response
 */
Client.prototype.remove_chat_admins = async function(users, chat) {
    if (!chat.id) {
        let Chat = require("../Chat")
        chat = new Chat(chat, { client: this })
    }

    if (users[0] && users[0].id) {
        users = users.map(it => it.id)
    }


    let data = JSON.parse(await chat.get('data'))

    data.chatInfo.adminsIdList = ((await chat.meta)
            .adminsIdList || [])
        .filter(it => !users.includes(it))

    let response = await axios({
        method: 'PUT',
        url: `${this.sendbird_api}/group_channels/${chat.id || chat}`,
        data: JSON.stringify({ data: JSON.stringify(data) }),
        headers: await this.sendbird_headers
    })

    return response
}

/**
 * Upload a file to sendbird's CDN for use in chats
 * @param  {Stream}         image_data Stream of this image
 * @param  {Chat|String}    chat=null  Chat to upload this image for
 * @return {Promise<Object>}                    API response
 */
Client.prototype.sendbird_upload = async function(image_data, chat) {
    let data = {
        thumbnail1: '780, 780',
        thumbnail2: '320, 320',
        file: image_data
    }

    if (chat) {
        data.channel_url = chat.channel_url || chat
    }

    let response = await util.promisify(request)({
        method: 'post',
        url: `${this.sendbird_api}/storage/file`,
        formData: data,
        headers: await this.sendbird_headers
    })

    return JSON.parse(response.body)

}

module.exports = Client
