const axios = require('axios')
const Client = require('../objects/Client')

const mime_types = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'jpe': 'image/jpeg',
    'bmp': 'image/bmp',
    'midi': 'audio/midi',
    'mpeg': 'video/mpeg',
    'oog': 'video/oog',
    'webm': 'video/webm',
    'wav': 'audio/wav'
}

async function determine_mime(url, bias = 'image/png') {
    let split = url.split('.')
    return mime_types[split[split.length] - 1] || bias
}

async function short_cursors(data) {
    let paging = {
        prev: data.paging.hasPrev ? data.paging.cursors.prev : null,
        next: data.paging.hasNext ? data.paging.cursors.next : null
    }

    return { items: data.items, paging: paging }
}

async function paginated_data(url, opts = {}) {
    /*
    Get a chunk of paginated data automatically

    params:
        url: source url for the data
        opts:
            prev: previous page key
            next: next page key
            key: key that the data will be under, relative to the data key
            limit: size limit of the data chunk
            method: http method, if not a get request
            headers: request headers
            ex_params: extra request parameters
    */
    params = {
        limit: opts.limit || 25,
        prev: opts.prev || null,
        next: opts.next || null
    }
    ex_params = opts.params || {}

    response = await axios({
        method: opts.method || 'get',
        url: url,
        headers: opts.headers || {},
        params: { ...params, ...ex_params }
    })

    if (opts.key) {
        return await short_cursors(response.data.data[opts.key])
    }
    return await short_cursors(response.data.data)

}

async function get_slice(source, query) {
    let index = source.indexOf(query)
    return index > -1 ? `${index}:${index + query.length - 1}` : null
}

async function compose_comment(text, attachment, mentions) {
    let data = {}

    if (text) {
        data.text = text
    }

    if (attachment) {
        data.content = attachment.id || attachment
    }

    if (mentions) {
        let formatted = []
        for (let user of mentions) {
            if (typeOf(user) === 'string') {
                let User = require('../User')
                user = new User(user, { client: this })
            }
            formatted.push([user, await get_slice(text, await user.nick)])
        }
    }

    return data
}

async function* paginated_generator(source, opts = {}) {
    let buffer = await source(opts)

    while (true) {
        yield* buffer.items

        if (!buffer.paging.next) {
            return
        }

        buffer = await source({ ...opts, next: buffer.paging.next })
    }
}

module.exports = {
    paginated_data: paginated_data,
    paginated_generator: paginated_generator,
    determine_mime: determine_mime
}
