const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = mongoose.model('Url', new Schema({
    url: { type: String, required: true },
    hash: { type: String, required: true},
}));