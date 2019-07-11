"use strict"

module.exports = {
    // "Root" classes starting point.

    // Primary
    Client: require('./client/BaseClient'),
    //BaseClient: require('./client/Client'),

    Post: require('./constructs/post')
/*

    // Utils
    Version: require('../package.json').version,
    Collection: require('./util/Collection'),
    HTTPError: require('./err/HTTPError'),
    PackageError: require('./err/PackageError'),
    Util: Util,
    util: this.Util,

    // Structures

    Base: require('./structures/Base'),
    APIMessage: require('./structures/APIMessage'),
    Post: require('./structures/Post'),
    Message: require('./structures/Message'),
    User: require('./structures/User'),


    //
    get Self() {

        return require('./structures/Self')
    }
*/
}