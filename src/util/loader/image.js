module.exports = image;

function image(data, fn) {
  if (!data) {
    return fn(new Error('image data not loaded'));
  }
  if (data.byteLength === 0) {
    transparentImage(fn);
  } else {
    // 24 hours for cached tiles
    imageFromData({ data, cacheControl: 'max-age=3600' }, fn);
  }
}

async function imageFromData(imgData, fn) {
  const blob = new window.Blob([imgData.data], { type: imgData.type || 'image/png' });
  const img = new window.Image();

  img.onload = () => {
    fn(null, img);
    window.URL.revokeObjectURL(img.src);
  };
  img.cacheControl = imgData.cacheControl;
  img.expires = imgData.expires;
  img.src = await window.URL.createObjectURL(blob);
}

const transparentPngUrl =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=';

function transparentImage(fn) {
  const img = new window.Image();
  img.onload = () => fn(null, img);
  img.src = transparentPngUrl;
}
