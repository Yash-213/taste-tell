const express = require("express");
const mongoose = require("mongoose");
const Review = require("../models/Review");
const router = express.Router();

router.post("/:id/rate", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Login required to rate." });
    }

    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.session.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Invalid rating value." });
    }

    const review = await Review.findOneAndUpdate(
      { recipeId: id, userId }, 
      { rating },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const stats = await Review.aggregate([
      { $match: { recipeId: new mongoose.Types.ObjectId(id), rating: { $gte: 1 } } },
      {
        $group: {
          _id: "$recipeId",
          avgRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    const avgRating = stats.length ? stats[0].avgRating.toFixed(1) : 0;
    const totalRatings = stats.length ? stats[0].totalRatings : 0;

    return res.json({
      success: true,
      userRating: review.rating,
      avgRating,
      totalRatings
    });
  } catch (err) {
    console.error("Rate error:", err);
    return res.status(500).json({ message: "Server error while rating." });
  }
});
  

router.post("/:id/comment", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Login required to comment." });
    }

    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.session.userId;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty." });
    }

    const newComment = await Review.create({
      recipeId: id,
      userId,
      comment
    });

    return res.json({
      success: true,
      comment: {
        _id: newComment._id,
        text: newComment.comment,
        date: newComment.date
      }
    });
  } catch (err) {
    console.error("Comment error:", err);
    return res.status(500).json({ message: "Server error while commenting." });
  }
});

router.delete("/:id/comment/:commentId", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Login required." });
    }

    const { id, commentId } = req.params;
    const userId = req.session.userId;

    const deleted = await Review.findOneAndDelete({
      _id: commentId,
      recipeId: id,
      userId
    });

    if (!deleted) return res.status(403).json({ message: "Not allowed" });

    return res.json({ success: true, deletedId: commentId });
  } catch (err) {
    console.error("Delete comment error:", err);
    return res.status(500).json({ message: "Server error while deleting." });
  }
});
