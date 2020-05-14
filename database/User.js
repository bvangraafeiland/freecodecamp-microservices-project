const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
    username: { type: String, required: true },
    exercises: [{
        description: { type: String, required: true },
        duration: { type: Number, required: true },
        date: { type: Date, required: true },
    }]
}));