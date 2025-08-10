const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { title } = require('process');
const recipes = require("./models/schema.js");

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

// Main route
app.get('/', async (req, res) => {
  let dish = recipes.find()
  res.render("index",{dish});
});

// loginPage route
app.get("/login", async(req,res)=>{
  res.render("loginPage");
})

const PORT = 8080;
app.listen(PORT, () =>{ 
  console.log(`Server running on port ${PORT}`);
});
