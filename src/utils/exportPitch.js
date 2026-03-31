function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function inlineSvgImages(svgNode) {
  const imageNodes = Array.from(svgNode.querySelectorAll('image'));

  await Promise.all(
    imageNodes.map(async (imageNode) => {
      const href =
        imageNode.getAttribute('href') ||
        imageNode.getAttributeNS('http://www.w3.org/1999/xlink', 'href');

      if (!href || href.startsWith('data:')) return;

      try {
        const absoluteUrl = new URL(href, window.location.origin).toString();
        const response = await fetch(absoluteUrl);

        if (!response.ok) throw new Error('Falha ao embutir imagem');

        const blob = await response.blob();
        const dataUrl = await blobToDataUrl(blob);

        imageNode.setAttribute('href', dataUrl);
        imageNode.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
      } catch {
        imageNode.remove();
      }
    })
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportPitchRaster(svgElement, format = 'png') {
  if (!svgElement) return;

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const svgClone = svgElement.cloneNode(true);
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  await inlineSvgImages(svgClone);

  const serializer = new XMLSerializer();
  const svgMarkup = serializer.serializeToString(svgClone);
  const svgBlob = new Blob([svgMarkup], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);
    const scale = 3;
    const width = Math.round((svgElement.viewBox.baseVal.width || svgElement.clientWidth) * scale);
    const height = Math.round((svgElement.viewBox.baseVal.height || svgElement.clientHeight) * scale);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    if (!context) return;

    if (format === 'jpg' || format === 'jpeg') {
      context.fillStyle = '#0F1117';
      context.fillRect(0, 0, width, height);
    }

    context.drawImage(image, 0, 0, width, height);

    const mimeType =
      format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png';

    const outputBlob = await new Promise((resolve) => {
      canvas.toBlob(resolve, mimeType, 0.94);
    });

    if (outputBlob) {
      downloadBlob(outputBlob, `tatica.${extension}`);
    }
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
