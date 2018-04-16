'use strict';
let BaseCache = require('./BaseCache');

/**
 * Cache responsible for storing message related data
 * @extends BaseCache
 */
class MessageCache extends BaseCache {
    /**
     * Create a new MessageCache
     *
     * **This class is automatically instantiated by RainCache**
     * @param {StorageEngine} storageEngine - Storage engine to use for this cache
     * @param {Message} boundObject - Optional, may be used to bind a message object to the cache
     * @property {String} namespace=message - namespace of the cache, defaults to `message`
     */
    constructor(storageEngine, boundObject) {
        super();
        this.storageEngine = storageEngine;
        this.namespace = 'message';
        if (boundObject) {
            this.bindObject(boundObject);
        }
    }

    /**
     * Get a message via id
     * @param {String} id - id of the message
     * @return {Promise.<MessageCache|null>} Returns a Message Cache with a bound message or null if no message was found
     */
    async get(id) {
        if (this.boundObject) {
            return this.boundObject;
        }
        let message = await this.storageEngine.get(this.buildId(id));
        if (!message) {
            return null;
        }
        return new MessageCache(this.storageEngine, message);
    }

    /**
     * Update a message
     * @param {String} id - id of the message
     * @param {Message} data - new message data
     * @return {Promise.<MessageCache>} - returns a bound MessageCache once the data was updated.
     */
    async update(id, data) {
        if (this.boundObject) {
            this.bindObject(data);
            await this.update(this.boundObject.id, data);
            return this;
        }
        if (!data.id) {
            data.id = id;
        }
        await this.addToIndex(id);
        await this.storageEngine.upsert(this.buildId(id), data);
        return new MessageCache(this.storageEngine, data);
    }

    /**
     * Remove a message from the cache
     * @param {String} id - id of the message
     * @return {Promise.<void>}
     */
    async remove(id) {
        if (this.boundObject) {
            return this.remove(this.boundObject.id);
        }
        let message = await this.storageEngine.get(this.buildId(id));
        if (message) {
            await this.removeFromIndex(id);
            return this.storageEngine.remove(this.buildId(id));
        } else {
            return null;
        }
    }

    /**
     * Filter for messages by providing a filter function which returns true upon success and false otherwise
     * @param {Function} fn - filter function to use for the filtering
     * @param {String[]} ids - array of message ids that should be used for the filtering
     * @return {Promise.<MessageCache[]>} - array of bound message caches
     */
    async filter(fn, ids = null) {
        let message = await this.storageEngine.filter(fn, ids);
        return message.map(r => new MessageCache(this.storageEngine, r));
    }

    /**
     * Find a message by providing a filter function which returns true upon success and false otherwise
     * @param {Function} fn - filter function to use for filtering for a single message
     * @param {String[]} ids - array of message ids that should be used for the filtering
     * @return {Promise.<MessageCache>} - bound message cache
     */
    async find(fn, ids = null) {
        let message = await this.storageEngine.find(fn, ids);
        return new MessageCache(this.storageEngine, message);
    }

    /**
     * Build a unique key for the message cache entry
     * @param {String} messageId - id of the message
     * @return {String} - the prepared key
     */
    buildId(messageId) {
        return `${this.namespace}.${messageId}`;
    }
}

module.exports = MessageCache;
