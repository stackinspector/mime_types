/*!
 * mime-types
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

const MIME_DB_URL = 'https://cdn.jsdelivr.net/gh/jshttp/mime-db@master/db.json'
const db = await (await fetch(MIME_DB_URL)).json()
import { extname } from 'https://deno.land/std@0.97.0/path/mod.ts'

/**
 * Module variables.
 * @private
 */

const EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/
const TEXT_TYPE_REGEXP = /^text\//i

/**
 * Get the default charset for a MIME type.
 */

export function charset (type: string): false | string {
  if (!type || typeof type !== 'string') {
    return false
  }

  // TODO: use media-typer
  const match = EXTRACT_TYPE_REGEXP.exec(type)
  const mime = match && db[match[1].toLowerCase()]

  if (mime && mime.charset) {
    return mime.charset
  }

  // default text/* to utf-8
  if (match && TEXT_TYPE_REGEXP.test(match[1])) {
    return 'UTF-8'
  }

  return false
}

/**
 * Create a full Content-Type header given a MIME type or extension.
 */

export function contentType (str: string): false | string {
  // TODO: should this even be in this module?
  if (!str || typeof str !== 'string') {
    return false
  }

  let mime = str.includes('/')
    ? lookup(str)
    : str

  if (!mime) {
    return false
  }

  // TODO: use content-type or other module
  if (mime.includes('charset')) {
    const charset1 = charset(mime)
    if (charset1) mime += '; charset=' + charset1.toLowerCase()
  }

  return mime
}

/**
 * Get the default extension for a MIME type.
 */

export function extension (type: string): false | string {
  if (!type || typeof type !== 'string') {
    return false
  }

  // TODO: use media-typer
  const match = EXTRACT_TYPE_REGEXP.exec(type)

  // get extensions
  const exts = match && extensions[match[1].toLowerCase()]

  if (!exts || !exts.length) {
    return false
  }

  return exts[0]
}

/**
 * Lookup the MIME type for a file path/extension.
 */

export function lookup (path: string): false | string {
  if (!path || typeof path !== 'string') {
    return false
  }

  // get the extension ("ext" or ".ext" or full path)
  const extension = extname('x.' + path)
    .toLowerCase()
    .substr(1)

  if (!extension) {
    return false
  }

  return types[extension] || false
}

/**
 * Populate the extensions and types maps.
 * @private
 */

function populateMaps (extensions: any, types: any) {
  // source preference (least -> most)
  const preference = ['nginx', 'apache', undefined, 'iana']

  Object.keys(db).forEach(function forEachMimeType (type) {
    const mime = db[type]
    const exts = mime.extensions

    if (!exts || !exts.length) {
      return
    }

    // mime -> extensions
    extensions[type] = exts

    // extension -> mime
    for (let i = 0; i < exts.length; i++) {
      const extension = exts[i]

      if (types[extension]) {
        const from = preference.indexOf(db[types[extension]].source)
        const to = preference.indexOf(mime.source)

        if (types[extension] !== 'application/octet-stream' &&
          (from > to || (from === to && types[extension].substr(0, 12) === 'application/'))) {
          // skip the remapping
          continue
        }
      }

      // set the extension -> mime
      types[extension] = type
    }
  })
}

/**
 * Module exports.
 * @public
 */

export const charsets = { lookup: charset }
export const extensions = Object.create(null)
export const types = Object.create(null)

// Populate the extensions/types maps
populateMaps(extensions, types)
