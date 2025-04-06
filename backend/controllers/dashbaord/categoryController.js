import formidable from 'formidable';
import responseReturn from '../../utils/response.js';
import { v2 as cloudinary } from 'cloudinary';
import categoryModel from "../../models/categoryModel.js"

class categoryController{
    add_category = async(req, res) => {
        const form = formidable()
        form.parse(req, async(err, fields, files) => {
            if(err){
                responseReturn(res, 404, {error: "something went wrong"})
            }else{
                let name = fields.name[0]
                let image = files.image[0]

                name = name.trim()
                const slug = name.split(' ').join('-')

                cloudinary.config({
                    cloud_name: process.env.cloud_name,
                    api_key: process.env.api_key,
                    api_secret: process.env.api_secret,
                    secure: true
                })

                try{
                    const result = await cloudinary.uploader.upload(image.filepath, {folder: 'categorys'})
                    if (result){
                        const category = await categoryModel.create({
                            name, slug, image: result.url
                        })
                        responseReturn(res, 201, {category, message: 'Category Added Successfully'})
                    }else{
                        responseReturn(res, 404, {error: 'Image Upload File'})
                    }

                }catch(error){
                    responseReturn(res, 500, {error: 'Internal Server Error'})
                }
            }
        })
    }

    get_category = async(req, res) => {
        const {page, searchValue, parPage} = req.query

        try{
            let skipPage = ''
            if(parPage && page){
                skipPage = parseInt(parPage) * (parseInt(page) - 1)
            }
            
            if(searchValue && page && parPage){
                const categorys = await categoryModel.find({
                    $text: { $search: searchValue}
                }).skip(skipPage).limit(parPage).sort({createdAt: -1})

                const totalCategory = await categoryModel.find({
                    $text: { $search: searchValue }
                }).countDocuments()
                responseReturn(res, 200, {categorys, totalCategory})
            }else if (searchValue === '' && page && parPage){
                const categorys = await categoryModel.find({ }).skip(skipPage).limit(parPage).sort({createdAt: -1})
                const totalCategory = await categoryModel.find({ }).countDocuments()
                responseReturn(res, 200, {categorys, totalCategory})
            }
            else{
                const categorys = await categoryModel.find({ }).sort({createdAt: -1})
                const totalCategory = await categoryModel.find({ }).countDocuments()
                responseReturn(res, 200, {categorys, totalCategory})
            }
            
        }catch(error){
            console.log(error)
            responseReturn(res, 500, {error: "Internal Server Error"})
        }
    }

    update_category = async(req, res) => {
        const form = formidable()
        form.parse(req, async(err, fields, files) => {
            if(err) {
                responseReturn(res, 404, {error: "something went wrong"})
            }else{
                let name = fields.name[0]

                let image = null;
                if (files.image) {
                    image = files.image[0];
                }

                const {id} = req.params;

                name = name.trim()
                const slug = name.split(' ').join('-')

                try{
                    let result = null;
                    if (image) {
                        cloudinary.config({
                            cloud_name: process.env.cloud_name,
                            api_key: process.env.api_key,
                            api_secret: process.env.api_secret,
                            secure: true
                        })
                        result = await cloudinary.uploader.upload(image.filepath, {folder: 'categorys'})
                    }

                    const updateData = {
                        name, slug,
                    }
                    if (result){
                        updateData.image = result.url
                    }

                    const category = await categoryModel.findByIdAndUpdate(id, updateData, {new: true});
                    responseReturn(res, 200, {category, message: 'Category Updated Successfully'})
                }catch(error){
                    console.log(error)
                    responseReturn(res, 500, {error: "Internal Server Error"})
                }
            }
        })
    }

    deleteCategory = async(req, res) => {
        try{
            const categoryId = req.params.id;
            const deleteCategory = await categoryModel.findByIdAndDelete(categoryId);

            if (!deleteCategory){
                responseReturn(res, 404, {error: "Category Not Found"})
            }
            responseReturn(res, 200, "Category deleted successfully")
        }catch(error){
            responseReturn(res, 500, {error: "Internal Server Error"})
        }
    }
}

export default new categoryController();