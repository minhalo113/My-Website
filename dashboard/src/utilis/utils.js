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