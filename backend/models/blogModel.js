import { Schema, model } from "mongoose";

const commentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'Customer' },
    userImage: {
      public_id: { type: String },
      url: { type: String }
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'approved'
    },
    moderationReason: { type: String },
    isEdited: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

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
  comments: [commentSchema],
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
  tags: [String],
  status: {
    type: String,
    enum: ['approved', 'pending'],
    default: 'approved'
  },
  products: [{ type: Schema.Types.ObjectId, ref: 'products' }]
}, { timestamps: true });

export default model('blogs', blogSchema)