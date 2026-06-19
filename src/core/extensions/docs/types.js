/**
 * @typedef {Object} ExtensionManifest
 * @property {string} id
 * @property {string} name
 * @property {string} version
 * @property {string=} description
 * @property {string=} author
 * @property {ExtensionPermission[]=} permissions
 * @property {ExtensionRoute[]=} routes
 * @property {ExtensionMenu[]=} menus
 * @property {ExtensionEvent[]=} events
 * @property {Record<string, unknown>=} metadata
 */

/**
 * @typedef {Object} ExtensionContext
 * @property {ExtensionManifest} manifest
 * @property {Record<string, unknown>} api
 * @property {Record<string, unknown>} permissions
 * @property {Record<string, unknown>} events
 * @property {Record<string, unknown>} registry
 */

/**
 * @typedef {Object} Extension
 * @property {ExtensionManifest} manifest
 * @property {(context: ExtensionContext) => Promise<void> | void=} install
 * @property {(context: ExtensionContext) => Promise<void> | void=} enable
 * @property {(context: ExtensionContext) => Promise<void> | void=} disable
 * @property {(context: ExtensionContext) => Promise<void> | void=} uninstall
 * @property {(context: ExtensionContext) => Promise<void> | void=} update
 */

/**
 * @typedef {Object} ExtensionPermission
 * @property {string} key
 * @property {string} description
 * @property {boolean=} required
 */

/**
 * @typedef {Object} ExtensionRoute
 * @property {string} path
 * @property {string} label
 * @property {string=} componentKey
 * @property {string[]=} permissions
 * @property {Record<string, unknown>=} metadata
 */

/**
 * @typedef {Object} ExtensionMenu
 * @property {string} id
 * @property {string} label
 * @property {string=} path
 * @property {string=} icon
 * @property {number=} order
 * @property {string[]=} permissions
 * @property {Record<string, unknown>=} metadata
 */

/**
 * @typedef {Object} ExtensionEvent
 * @property {string} name
 * @property {string=} description
 * @property {string=} direction
 * @property {Record<string, unknown>=} payloadSchema
 */

export {}
