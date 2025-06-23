const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notesModel = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
      default: "General",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__V;
        return ret;
      },
    },
  }
);
const Notes = mongoose.model("notes", notesModel);
module.exports = Notes;
