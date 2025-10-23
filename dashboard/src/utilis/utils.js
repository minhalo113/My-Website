export const overrideStyle = {
    display: 'flex',
    margin: '0 auto',
    height: '24px',
    justifyContent: 'center',
    alignItems: 'center'
}

export const extractColors = (str = '') => 
    String(str)
        .split(',')
        .map(p => p.split(':')[0].trim())
        .filter(Boolean);

export const parseColorPriceEntries = (value = '') =>
    String(value)
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean)
        .map(entry => {
            const [option, price = ''] = entry.split(':');

            return {
                option: option ? option.trim() : '',
                price: price ? price.trim() : '',
                raw: entry
            };
        });