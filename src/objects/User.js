const axios = require('axios')
const FreshObject = require('./FreshObject')

class User extends FreshObject {
    constructor(id, opts = {}) {
        super(id, opts)
        this.url = `${this.api}/users/${this.api}`
    }
}

module.exports = User
