const Client = require('../Client')
const axios = require('axios');

/**
 * Read posts in a digest
 * @param  {Digest|String} digest Digest to mark posts as read in
 * @param  {Number}        count  Number of posts to mark as read
 * @return {Promise<Object>}               API response
 */
Client.prototype.read_digest = async function(digest, count) {
    let response = await axios({
        method: 'get',
        url: `${this.api}/digests/${digest.id || digest}/reads/${count}`,
        headers: await this.headers
    })

    return response
}

module.exports = Client
