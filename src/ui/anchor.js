const anchorTranslate = {
  center: 'translate(-50%,-50%)',
  top: 'translate(-50%,0)',
  'top-left': 'translate(0,0)',
  'top-right': 'translate(-100%,0)',
  bottom: 'translate(-50%,-100%)',
  'bottom-left': 'translate(0,-100%)',
  'bottom-right': 'translate(-100%,-100%)',
  left: 'translate(0,-50%)',
  right: 'translate(-100%,-50%)'
};

function applyAnchorClass(element, anchor, prefix) {
  const classList = element.classList;
  for (const key in anchorTranslate) {
    classList.remove(`mapboxgl-${prefix}-anchor-${key}`);
  }
  classList.add(`mapboxgl-${prefix}-anchor-${anchor}`);
}

module.exports = {
  anchorTranslate,
  applyAnchorClass
};
