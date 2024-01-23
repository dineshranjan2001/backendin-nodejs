import dotenv from "dotenv";
import connectDB from "./db/DbConfig.js";
dotenv.config({
  path: "./env",
});

connectDB();
