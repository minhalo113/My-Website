
export const ensureHttps = (url) => {
    if (typeof url === 'string' && url.startsWith('http://')) {
        return url.replace('http://', 'https://');
    }
    return url;
};
