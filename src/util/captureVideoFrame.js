export function captureVideoFrame(video, format, quality) {
  if (typeof video === 'string') {
    video = document.getElementById(video);
  }

  format = format || 'jpeg';
  quality = quality || 0.92;

  if (!video || (format !== 'png' && format !== 'jpeg')) {
    return false;
  }

  const canvas = document.createElement("canvas");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  canvas.getContext('2d').drawImage(video, 0, 0);

  const dataUri = canvas.toDataURL('image/' + format, quality);
  const data = dataUri.split(',')[1];
  const mimeType = dataUri.split(';')[0].slice(5);

  const bytes = window.atob(data);
  const buf = new ArrayBuffer(bytes.length);
  const arr = new Uint8Array(buf);

  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }

  const blob = new Blob([arr], {type: mimeType});
  return {blob: blob, dataUri: dataUri, format: format};
}
