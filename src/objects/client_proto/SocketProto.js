const Client = require('../Client')
const methods = require('../../utils/methods')


// chat websocket methods

/**
 * Send a text message to a chat
 * @param  {String}       content Message content
 * @param  {Chat|String}  chat    Chat or channel_url of the chat to send this message to
 * @return {Promise<Chat|String>} Chat or channel_url, whichever was passed to the method
 */
Client.prototype.send_text_message = async function(content, chat) {
    let data = {
        'channel_url': chat.channel_url || chat,
        'message': content
    }

    this.send_to_socket(`MESG${JSON.stringify(data)}\n`)
    return chat
}

/**
 * Send an image message to a chat
 * @param {String}  url             Url pointing to this image
 * @param {Chat|String}  chat       Chat or channel_url of the chat to send this image to
 * @param {Object} opts={}          Optional parameters
 * @param {Number} opts.height=780  Height of this image
 * @param {Number} opts.width=780   Width of this image
 * @param {String} opts.file_name   File name to send this file as
 * @param {String} opts.file_type   MIME type of this file
 */
Client.prototype.send_image_message = async function(url, chat, opts = {}) {
    let height = opts.height || 780
    let width = opts.width || 780
    let lower_ratio = Math.min(width / height, height / width)
    let type = height >= width ? 'tall' : 'wide'
    let data = {
        'thumbnails': [{
            'url': url,
            'real_height': parseInt(type === 'tall' ? 780 : 780 * lower_ratio),
            'real_width': parseInt(type === 'wide' ? 780 : 780 * lower_ratio),
            'height': height,
            'width': width
        }],
        'channel_url': chat.channel_url || chat,
        'url': url,
        'name': opts.file_name || url.split('/')[url.split('/')
            .length - 1],
        'type': opts.file_type || await methods.determine_mime(url)
    }

    this.send_to_socket(`FILE${JSON.stringify(data)}\n`)
}

/**
 * Mark the messages in a chat as read
 * @param  {Chat|String}  chat Chat to mark as read
 */
Client.prototype.mark_chat_read = async function(chat) {
    let data = {
        'channel_url': chat.channel_url || chat,
        'req_id': this.next_req_id
    }

    this.send_to_socket(`READ${JSON.stringify(data)}\n`)
}


module.exports = Client
