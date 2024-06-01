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