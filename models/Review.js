const mongoose = require("mongoose");

main()
.then(()=>{
  console.log("Connected to Review");
})
.catch((err)=>{
  console.log(err);
})
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/test');
}

const { Schema } = mongoose;

const reviewSchema = new Schema({
  recipeId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Recipe', 
    required: true, 
    index: true 
  },
  userId: { type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  rating: { 
    type: Number, 
    min: 1, 
    max: 5 
  },        
  comment: { 
    type: String, 
    default: '' 
  },          
  date: { type: Date, 
    default: Date.now 
  }
}, 
{ timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
