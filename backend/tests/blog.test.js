import request from 'supertest';
import express from 'express';

const mockParse = jest.fn();

jest.mock('formidable', () => ({
  __esModule: true,
  default: jest.fn(() => ({ parse: mockParse }))
}));

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn().mockResolvedValue({ url: 'url', public_id: 'pid' }),
      destroy: jest.fn().mockResolvedValue({})
    },
    config: jest.fn()
  }
}));

jest.mock('../middlewares/authMiddleware.js', () => ({
  __esModule: true,
  default: (req, res, next) => next()
}));

import blogRouter from '../routes/dashboard/blogRoutes.js';
import blogModel from '../models/blogModel.js';

const app = express();
app.use(express.json());
app.use('/api', blogRouter);

afterEach(() => {
  jest.clearAllMocks();
  mockParse.mockReset();
});

describe('POST /api/add_blog', () => {
  test('adds a blog', async () => {
    blogModel.prototype.save = jest.fn().mockResolvedValue();
    mockParse.mockImplementationOnce((req, cb) => cb(null, {
      title: 'Test',
      content: 'Content',
      description: 'Desc',
      blockQuote: 'Quote',
      youtubeLink: 'link',
      citation: 'cite',
      tags: 'tag1,tag2'
    }, {}));

    const res = await request(app).post('/api/add_blog');

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Blog added successfully');
    expect(res.body.blog.title).toBe('Test');
    expect(blogModel.prototype.save).toHaveBeenCalled();
  });
});

describe('PATCH /api/update-blog', () => {
  test('updates a blog', async () => {
    const existingBlog = { _id: '1', image: {}, youtubeThumbnail: {} };
    blogModel.findById = jest.fn().mockResolvedValue(existingBlog);
    blogModel.findByIdAndUpdate = jest.fn().mockResolvedValue();
    mockParse.mockImplementationOnce((req, cb) => cb(null, {
      id: '1',
      title: 'Updated',
      content: 'Content',
      description: 'Desc',
      blockQuote: 'Quote',
      youtubeLink: 'link',
      citation: 'cite',
      tags: 'tag1'
    }, {}));

    const res = await request(app).patch('/api/update-blog');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Blog updated successfully');
    expect(blogModel.findByIdAndUpdate).toHaveBeenCalled();
  });
});

describe('GET /api/get_blog/:id', () => {
  test('returns a blog', async () => {
    blogModel.findById = jest.fn().mockResolvedValue({ _id: '1', title: 'One' });

    const res = await request(app).get('/api/get_blog/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.blog._id).toBe('1');
  });
});

describe('GET /api/get_blogs', () => {
  test('lists blogs', async () => {
    const blogs = [{ _id: '1', title: 'One' }];
    blogModel.find = jest.fn()
      .mockReturnValueOnce({ sort: jest.fn().mockResolvedValue(blogs) })
      .mockReturnValueOnce({ countDocuments: jest.fn().mockResolvedValue(1) });

    const res = await request(app).get('/api/get_blogs');

    expect(res.statusCode).toBe(200);
    expect(res.body.blogs).toEqual(blogs);
    expect(res.body.totalBlogs).toBe(1);
  });
});

describe('DELETE /api/delete_blog/:id', () => {
  test('deletes a blog', async () => {
    blogModel.findById = jest.fn().mockResolvedValue({ image: {}, youtubeThumbnail: {} });
    blogModel.findByIdAndDelete = jest.fn().mockResolvedValue();

    const res = await request(app).delete('/api/delete_blog/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Blog deleted successfully');
    expect(blogModel.findByIdAndDelete).toHaveBeenCalledWith('1');
  });
});

describe('GET /api/recent-blogs', () => {
  test('fetches recent blogs', async () => {
    const blogs = [{ _id: '1' }, { _id: '2' }];
    blogModel.find = jest.fn().mockReturnValue({
      sort: () => ({
        limit: jest.fn().mockResolvedValue(blogs)
      })
    });

    const res = await request(app).get('/api/recent-blogs');

    expect(res.statusCode).toBe(200);
    expect(res.body.blogs).toEqual(blogs);
  });
});