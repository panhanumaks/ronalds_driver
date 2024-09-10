import express from "express";
import {
  getAllUsers,
  blockUser,
  unblockUser,
} from "../services/userService.js";

const router = express.Router();

router.get("/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.render("userTable", { users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/users/:id/block", async (req, res) => {
  try {
    const userId = req.params.id;
    await blockUser(userId);
    res.redirect("/users");
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/users/:id/unblock", async (req, res) => {
  try {
    const userId = req.params.id;
    await unblockUser(userId);
    res.redirect("/users");
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
