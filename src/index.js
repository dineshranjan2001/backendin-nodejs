import dotenv from "dotenv";
import connectDB from "./db/DbConfig.js";
import app from "./app.js";
dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8080, () => {
      console.log("Application is listening on the the port", process.env.PORT);
    });
  })
  .catch((error) => {
    console.log("error ", error);
  });
