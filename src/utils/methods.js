const axios = require('axios')
const Client = require('../objects/Client')

async function paginated_params(limit, prev, next) {
    params = {
        limit: limit
    }

    if (prev) {
        params.prev = prev
    }

    if (next) {
        params.next = next
    }

    return params
}

async function short_cursors(data) {
    let paging = {
        prev: data.paging.hasPrev ? data.paging.cursors.prev : null,
        next: data.paging.hasNext ? data.paging.cursors.next : null
    }

    return { items: data.items, paging: paging }
}

async function paginated_data(url, opts = { ex_params: {}, next: null }) {
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
    params = await paginated_params(opts.limit || 25, opts.prev || null, opts.next || null)
    ex_params = opts.ex_params || {}

    response = await axios({
        method: opts.method || 'get',
        url: url,
        headers: opts.headers || {},
        params: { ...params, ...ex_params }
    })

    if (opts.key) {
        return await short_cursors(response.data.data[opts.key])

        return await short_cursors(response.data.data)
    }
}

async function* paginated_generator(source, opts = {}) {
    buffer = await source(opts)


    while (true) {
        for (let item of buffer.items) {
            yield item
        }

        if (!buffer.paging.next) {
            break
        }

        buffer = await source({ ...opts, next: buffer.paging.next })
    }
}

module.exports = {
    paginated_params: paginated_params,
    paginated_data: paginated_data,
    paginated_generator: paginated_generator
}
