const express = require("express");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

mongoose.connect(process.env.MONGODB_URL);

const port = process.env.Port || 3000;

app.use(express.json());

const usersRouter = require("./routers/users");
app.use(usersRouter);

const emailsVerificationsRouter = require("./routers/emailsVerifications");
app.use(emailsVerificationsRouter);

const passwordResetRouter = require("./routers/passwordsReset");
app.use(passwordResetRouter);

const authRouter = require("./routers/auth");
app.use(authRouter);

app.get("/", (req, res) => {
  res.send("Bienvenue sur mon API ECOM");
});

app.get("*", (req, res) => {
  res.send("Ce chemin n'existe pas");
});

app.listen(port, (req, res) => {
  console.log(`Le serveur est connecté au port ${port}`);
});
