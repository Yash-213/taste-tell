const mongoose = require("mongoose");

main()
    .then(() => console.log('Connected to Recipe'))
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/test');
}

const recipeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        String
    },
    ingredients: {
        type: [String],
        required: true
    },
    instructions: {
        type: [String],
        required: true
    },
    category: {
        type: String,
        enum: ['Veg', 'Non-Veg', 'Dessert', 'Other']
    },
    imageUrl: {
        type: String

    },
    tags: [
        String
    ],
    createdAt: {
        type: Date, default: Date.now
    }
});

module.exports = mongoose.model('Recipe', recipeSchema);