// models/Chat.js
const mongoose = require('mongoose');

// 單一訊息結構
const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: false,
    timestamps: true
  }
);

// 對話結構
const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: '未命名對話',
      trim: true
    },
    messages: {
      type: [messageSchema],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// 依更新時間排序的索引
chatSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);