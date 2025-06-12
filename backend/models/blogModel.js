import { Schema, model } from "mongoose";

const blogSchema = new Schema({
    image: {
      url: String,
      publicId: String
    },
    title: { type: String, required: true },
    desc: { type: String, required: true },
    content: { type: String, required: true },

    slug: { type: String, unique: true },
    commentCount: { type: Number, default: 0 },
    comments: [
      {
        user: {type: Schema.Types.ObjectId, ref: 'Customer'},
        userImage: {
            public_id: {type: String},
            url: {type: String}
        },
        name: {type: String, required: false},
        message: String,
        date: { type: Date, default: Date.now }
      }
    ],
    btnText: { type: String, default: "Read More" },
    metaList: [
      {
        key: String,
        value: String
      }
    ],
    blockquote: String,
    citation: String,
    youtubeThumbnail: {
        url: String, publicId: String
    },
    youtubeLink: String,
    tags: [String]
  }, { timestamps: true });
  
  export default model('blogs', blogSchema)