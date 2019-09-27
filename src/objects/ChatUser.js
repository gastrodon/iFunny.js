const User = require('./User')

/**
 * iFunny chat user object, representing a user in a chat
 * @extends {User}
 * @param {String|Number} id                id of this object
 * @param {String|Chat}                     chat that this user is in
 * @param {Object} opts                     optional parameters
 * @param {Client} opts.client=Client       Client that this object belongs to
 * @param {Number} opts.paginated_size=25   size of each paginated request
 * @param {Object} opts.data={}             data of this object, that can be used before fetching new info
 */
class ChatUser extends User {
    constructor(id, chat, opts = {}) {
        super(id, opts)
    }
}

module.exports = ChatUser
