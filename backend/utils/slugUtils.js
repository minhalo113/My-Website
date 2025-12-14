import slugify from 'slugify';

export const generateSlug = (name) => {
    if (!name) return '';
    return slugify(name, {
        lower: true,
        strict: true,
        trim: true
    });
};
