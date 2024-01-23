import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: process.env.BODY_PARSER,
  })
);

//url fire
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.BODY_PARSER,
  })
);

//to store the static file(like images and pdf files) into a server folder
app.use(express.static("public"));

export default app;
