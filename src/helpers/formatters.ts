export const formatSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export const formatDate = (date: number) => {
  return new Date(date).toLocaleTimeString();
}
