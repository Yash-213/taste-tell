const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { title } = require('process');

const app = express();

// Middleware
app.use(cors());
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public"))); 

// MongoDB Connection
main()
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/test');
}

// Recipe Schema
const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  ingredients: { type: [String], required: true },
  instructions: { type: [String], required: true },
  category: { type: String, enum: ['Veg', 'Non-Veg', 'Dessert', 'Other'] },
  imageUrl: String,
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

const recipes = mongoose.model("Recipe", recipeSchema);

// Main route
app.get('/', async (req, res) => {
  res.render("index",{
    recipes:[]
  });
});


app.get("/login", async(req,res)=>{
  res.render("loginPage");
})

const PORT = 8080;
app.listen(PORT, () =>{ 
  console.log(`Server running on port ${PORT}`);
});


// recipes.find().then((res)=>{
//   console.log(res);
// }).catch((err)=>{
//   console.log(err);
// })