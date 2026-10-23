var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var Comment_exports = {};
__export(Comment_exports, {
  Comment: () => Comment
});
module.exports = __toCommonJS(Comment_exports);
var import_mongoose = require("mongoose");
const commentSchema = new import_mongoose.Schema(
  {
    task: { type: import_mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    author: { type: import_mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, minlength: 1, maxlength: 3e3 }
  },
  { timestamps: true, strict: "throw" }
);
commentSchema.index({ task: 1, createdAt: 1 });
const Comment = import_mongoose.models.Comment || (0, import_mongoose.model)("Comment", commentSchema);
