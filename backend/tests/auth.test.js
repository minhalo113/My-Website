import request from 'supertest';
import express from 'express';
import authRouter from '../routes/authRoutes.js';
import adminModel from '../models/adminModel.js';
import bcrypt from 'bcrypt';

jest.mock('../models/adminModel.js')
jest.mock('bcrypt')

const app = express();
app.use(express.json());
app.use('/api', authRouter);

describe('POST /api/admin-login', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns 200 on successful login', async() =>{
        adminModel.findOne.mockResolveValue({
            id: '1',
            role: 'admin',
            name: 'Admin',
            email: 'admin@example.com',
            password: 'hashed',
            images: 'img'
        });

        bcrypt.compare.mockResolveValue(true);

        const res = (await request(app).post('/api/admin-login')).send({email: 'admin@example.com', password: 'secret'});
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Login Success')
    });

    it('returns 500 when admin not found', async() => {
        adminModel.findOne.mockResolveValue(null);

        const res = await request(app).post('/api/admin-login').send({email: 'nouser@example.com', password: 'secret'});
        
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe('Email Not Found')
    })
})