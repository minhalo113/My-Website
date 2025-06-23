import formidable from 'formidable'
import {v2 as cloudinary} from 'cloudinary'
import responseReturn from '../../utils/response.js'
import homeSwiperModel from '../../models/homeSwiperModel.js';

class homeSwiperController {
    add_item = async(req, res) => {
        const form = formidable({});
        form.parse(req, async(err, fields, files) => {
            if(err) {
                return responseReturn(res, 400, {error: err.message, message: err.message});
            }
            try{
                let {link} = fields;
                if(Array.isArray(link)){
                    link = link[0];
                }
                cloudinary.config({
                    cloud_name: process.env.cloud_name,
                    api_key: process.env.api_key,
                    api_secret: process.env.api_secret,
                    secure: true
                });
                let result = {url: '', public_id: ''}
                if(files.image){
                    const upload = await cloudinary.uploader.upload(Array.isArray(files.image) ? files.image[0].filepath : files.image.filepath, {folder: 'swiper'});
                    result = {url: upload.url, publicId: upload.public_id}
                }
                const item = await homeSwiperModel.create({image: result, link})
                return responseReturn(res, 201, {item, message: 'Swiper item added'})

            }catch(error){
                return responseReturn(res, 500, {error: error.message, message: error.message});
            }
        })
    };

    get_items = async(req, res) => {
        try{
            const items = await homeSwiperModel.find().sort({createdAt: -1});
            return responseReturn(res, 200, {items});
        }catch(error){
            return responseReturn(res, 500, {error: error.message, message: error.message})
        }
    }

    delete_item = async(req, res)=> {
        const {id} = req.params;
        try{
            const item = await homeSwiperModel.findById(id);
            if(!item) {
                return responseReturn(res, 404, {error: 'Item not found', message: 'Item not found'})
            }

            if(item.image?.publicId){
                await cloudinary.uploader.destroy(item.image.publicId);
            }

            await homeSwiperModel.findByIdAndDelete(id);
            return responseReturn(res, 200, {message: 'Item deleted'})
        }catch(error){
            return responseReturn(res, 500, {error: error.message, message: error.message})
        }
    }
}

export default new homeSwiperController();