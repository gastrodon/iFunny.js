### 2.5.4
- `Client.command_help` is now sync
- `User.by_nick` does now return `null` for calls resulting in `error not_found` and `error user_is_unavailable`
- `SocketProto` was missing methods import
- `User.cover_image` typo fix
- `User.cover_image` was not getting the correct cover background color

### 2.5.3
- Admin methods are now plural, and accept arrays instead of single users
- Filter non-strings from chat admin and operator metadata
- Fix bad `Chat.kick` endpoint
- `Command.on` now does accept an optional docstring third argument for a help message
- `Client.command_help` does retrieve the docstring of a command

### 2.5.1
- Fix `Client.basic_token` length
- Move `sleep` to `utils/methods` namespace

### 2.5.0
- `Client` methods `add_chat_admin` and `remove_chat_admin`
- `Chat` methods `add_admin` and `remove_admin`
- `Chat` getter `admins`

### 2.4.0
- `User` generators `guests`, `subscriptions`, `subscribers`, `bans`
- `Post` generators `smiles`, `comments`
- `Client` generators `guests`, `subscriptions`, `subscribers`, `bans`
- `Client` paginated methods `guests`, `user_subscribers_paginated`, `user_subscriptions_paginated`, `user_bans_paginated`, `post_smiles_paginated`, `post_comments_paginated`
- Some documentation fixes

### 2.3.1
- Fix a bug where paginated mehtods are not passing the correct `Client` instance to new objects

### 2.3.0
- `Channel` class
- `Digest` class
- `Client` can now listen for notifications with `Client.on('notification')` every `Client.notification_interval` ms. `notification_interval` is a new optional parameter when constructing the client
- `Client` getters for generators `reads`, `collective`, `features`, `digests`, `channels`, `chats`, `home`, `unread_notifications`
- `Client` property for `unread_notification_count`
- `Client` explore methods `digests_paginated`
- `Client` feed methods `reads_paginated`, `collective_paginated`, `features_paginated`, `home_paginated`
- `Client` paginated search methods `search_chats_paginated`, `search_users_paginated`, `search_tags_paginated`
- `Client.login` does now check for passwords where no stored token exists
- Docs now specify return type of `Promise<*>`

### 2.2.1
- async config getter

### 2.2.0
- Fix a bug where `Chat.messages` is not getting the next token (why didn't I fix it before?)
- Move `small/Command.js` -> `ext/Command.js`
- Add `own_message` handler emitter, for getting messages that were sent by this client (possibly from another connection)

### 2.1.5
- Fix a bug where `Chat.messages` is not fully iterating
- Add docs for paginated prototype methods
- TODO: add docs for the remaining undoc `User` methods

### 2.1.4
- Fix a bug where `Chat.messages` generator is not passing the correct Client
- Include all important objects in `index.js`

### 2.1.3
- Add property `last_message` to the `Chat` class

### 2.1.2
- Update User-Agent to most recent beta version
- Add methods to the `Post` class
- Add methods to the `User` class
- Add generators to the `Chat` class

### 2.1.1
- Add `Chat` methods `read`, `add_operator`, `remove_operator`, `join`, `exit`, `invite`, and `kick`
- Add `Message` methods `delete` and `edit`
- Add `Invite` methods `accept` and `decline`
- Add `ChatUser` get method and getters
- Add Client methods for interactions with `Chat`s, `Comment`s, `Post`s, `User`s, as well as the client instance of `Socket` and the account of a client
- Add Client methods for uploading images to iFunny and sendbird
- Update docs and package info for publishing the library

### 2.1.0
- Add basic (mostly read-only) classes for objects
- `Client.login` method
- `Client.notifications_paginated` and `client.notifications`
- WebSocket events are starting to be implemented
- `Chat.send_text_message`, `Message.send_text_message` and `Client.send_text_message` work (and all do the same thing)
