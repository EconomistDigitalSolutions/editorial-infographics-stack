/**
 * Takes a request without a file name and adds index.html to it
 *
 * @param {Object} event - The request event
 * @returns {Object} The modified request event
 */
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Check whether the URI is missing a file name.
  if (uri.endsWith('/')) {
    request.uri += 'index.html';
  } else if (!uri.includes('.')) {
    // Check whether the URI is missing a file extension.
    request.uri += '/index.html';
  }

  // A small edit.

  return request;
}
