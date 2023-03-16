const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

mongoose.connect(process.env.MONGODB_URL);

app.use(cors());
app.use(express.json());

const authRouter = require("./routers/auth");
app.use(authRouter);

const usersRouter = require("./routers/users");
app.use(usersRouter);

const emailsVerificationsRouter = require("./routers/emailsVerifications");
app.use(emailsVerificationsRouter);

const passwordResetRouter = require("./routers/passwordsReset");
app.use(passwordResetRouter);

const postRouter = require("./routers/posts");
app.use(postRouter);

app.get("/", (req, res) => {
  res.send("Bienvenue sur mon API ECOM");
});

app.get("*", (req, res) => {
  res.send("Ce chemin n'existe pas");
});

app.listen(process.env.PORT || 3338, (req, res) => {
  console.log(`Le serveur est connecté au port ${process.env.PORT}`);
});
