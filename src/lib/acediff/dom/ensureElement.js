/**
 * Search for element in parent and create it if it can't be found
 * @param {*HTMLElement} parent
 * @param {string} elClass Element class
 *
 * Returns ID of the element
 */
module.exports = function ensureElement(parent, elClass, tagName) {
  const guid = Math.random().toString(36).substr(2, 5);
  const newId = `js-${elClass}-${guid}`;

  const currentEl = parent.querySelector(`.${elClass}`);
  if (currentEl) {
    currentEl.id = currentEl.id || newId;
    return currentEl.id;
  }
  
  if(tagName === undefined) tagName = 'div';
  
  const el = document.createElement(tagName);
  parent.appendChild(el);
  el.className = elClass;
  el.id = newId;
  return el.id;
};
