const Client = require('../Client')
const axios = require('axios')

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
 */
Client.prototype.modify_chat_presence = async function(state, chat) {
    await axios({
        method: state,
        url: `${this.api}/chats/channels/${chat.channel_url || chat}/members`,
        headers: await this.headers
    })
}

/**
 * Modify the frozen state of a chat
 * @param  {Boolean}        state Should this chat be frozen?
 * @param  {Chat|String}    chat  Chat that should have it's frozen state modified
 */
Client.prototype.modify_chat_freeze = async function(state, chat) {
    let data = `is_frozen=${state}`

    await axios({
        method: 'put',
        url: `${this.api}/chats/channels/${chat.channel_url || chat}`,
        data: data,
        headers: await this.headers
    })
}

/**
 * Invite a user or list of users to a chat
 * @param  {User|String|Array<User>|Array<String>}  users Array of or single instance of a user or id of a user to invite
 * @param  {Chat|String}                            chat  Chat or channel_url of the chat to invite a user to
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

    await axios({
        method: 'post',
        url: `${this.sendbird_api}/group_channels/${chat.id || chat}/invite`,
        data: JSON.stringify(data),
        headers: await this.sendbird_headers

    })
}

/**
 * Modify the state of a pending invite by accepting or declining it
 * @param  {String}         state To `accept` or `decline` this invite
 * @param  {Chat|String}    chat  Chat from which the invite is broadcast
 */
Client.prototype.modify_pending_invite = async function(state, chat) {
    let data = {
        'user_id': await this.id
    }

    await axios({
        method: 'put',
        url: `${this.sendbird_api}/group_channels/${chat.channel_url || chat}/${state}`,
        data: data,
        headers: await this.sendbird_headers
    })
}

/**
 * Kick a user from a chat
 * @param  {User|String}  user User that should be kicked
 * @param  {Chat|String}  chat Chat that a user should be kicked from
 */
Client.prototype.kick_chat_user = async function(user, chat) {
    let data = `members=${user.id || user}`

    await axios({
        method: 'put',
        url: `${this.api}/chats/channels/${chat.channel_url || chat}/kicked_members`,
        data: data,
        headers: await this.headers
    })
}

/**
 * Delete a message from a chat
 * @param  {Chat|String}    chat    Chat that this message is in
 * @param  {Message|String} message Message that should be deleted
 */
Client.prototype.delete_chat_message = async function(chat, message) {
    await axios({
        method: 'delete',
        url: `${this.sendbird_api}/group_channels/${chat.channel_url || chat}/messages/${message.id || message}`,
        headers: await this.sendbird_headers
    })
}

/**
 * Delete a message from a chat
 * @param  {Chat|String}    chat    Chat that this message is in
 * @param  {Message|String} message Message that should be edited
 * @param  {String}         content Content that should replace the message's content
 */
Client.prototype.edit_chat_text_message = async function(chat, message, content) {
    let data = {
        message_type: 'MESG',
        message: content
    }

    await axios({
        method: 'put',
        url: `${this.sendbird_api}/group_channels/${chat.channel_url || chat}/messages/${message.id || message}`,
        data: data,
        headers: await this.sendbird_headers
    }).catch(e => { console.log(e); })
}

/**
 * Modify the operators in a chat
 * @param  {String}         mode HTTP request type to modify with, `put` or `delete`
 * @param  {User|String}    user User or user id of the user to modify the operator status of
 * @param  {Chat|String}    chat Chat in which to modify operators
 */
Client.prototype.modify_chat_operator = async function(mode, user, chat) {
    let data = `operators=${user.id || user}`

    await axios({
        method: mode,
        url: `${this.api}/chats/channels/${chat.channel_url || chat}/operators`,
        data: data,
        headers: await this.headers
    })
}

module.exports = Client
