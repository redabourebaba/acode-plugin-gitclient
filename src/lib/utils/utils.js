export function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

export function str2ab(str) {
  var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

export function arrayToString(buffer, encoding = "utf-8") {
  const decoder = new TextDecoder(encoding);
  return decoder.decode(new Uint8Array(buffer));
}

export function stringToArray(text, encoding = "utf-8") {
  const encoder = new TextEncoder(encoding);
  return encoder.encode(text);
}

/**
* returns the extension of the path, from the last occurrence of the . (period)
* character to end of string in the last portion of the path.
* If there is no . in the last portion of the path, or if there are no . characters
* other than the first character of the basename of path (see path.basename()) , an
* empty string is returned.
* @param {string} path
*/
export function extname(path) {
  const filename = path.split('/').slice(-1)[0];
  if (/.+\..*$/.test(filename)) {
    return /(?:\.([^.]*))?$/.exec(filename)[0] || '';
  }

  return '';
}

/**
* The path.basename() methods returns the last portion of a path,
* similar to the Unix basename command.
* Trailing directory separators are ignored, see path.sep.
* @param {string} path
* @returns {string}
*/
export function basename(path, ext = '') {
  ext = ext || '';
  if (path === '' || path === '/') return path;
  const ar = path.split('/');
  const last = ar.slice(-1)[0];
  if (!last) return ar.slice(-2)[0];
  let res = decodeURI(last.split('?')[0] || '');
  if (extname(res) === ext) res = res.replace(new RegExp(ext + '$'), '');
  return res;
}