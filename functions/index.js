const functions = require("firebase-functions");
const path = require("path");
const { createRequestHandler } = require("@remix-run/express");
const express = require("express");

const BUILD_DIR = path.join(__dirname, "..", "build");
const app = express();

app.use(express.static(path.join(__dirname, "..", "public")));

app.all(
  "*",
  createRequestHandler({
    build: require("../build"),
    mode: process.env.NODE_ENV
  })
);

exports.remixServer = functions.https.onRequest(app);
