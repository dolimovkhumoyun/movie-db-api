const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const Joi = require("@hapi/joi");
const bcrypt = require("bcrypt");

const CONFIG = require("../config/config");

const schemaLocal = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  option: Joi.string()
});

const saltRounds = 10;

const schemaGoogle = Joi.object({
  googleId: Joi.string().required(),
  imageUrl: Joi.string().required(),
  email: Joi.string()
    .email()
    .required(),
  name: Joi.string().required(),
  givenName: Joi.string().required(),
  familyName: Joi.string().required()
});

router.post("/", (req, res) => {
  const { error, value } = schemaLocal.validate(req.body);

  if (error)
    return res.send({
      status: 400,
      message: "Bad request",
      error: error.details[0].message
    });

  const query = `SELECT id, email, name FROM users WHERE email = '${value.username}' AND password = '${value.password}' LIMIT 1`;

  const pool = new Pool(CONFIG.DB);
  pool.query(query, (error, results) => {
    if (error) return res.send({ status: 500, message: "Internal error", error });
    if (results.rowCount > 0) {
      const token = jwt.sign({ data: results.rows }, CONFIG.SECRET, {
        expiresIn: parseInt(CONFIG.SESSION_TIMEOUT)
      });
      return res.send({ status: 200, token });
    }
    return res.send({ status: 404, message: "User not found" });
  });
});

router.post("/google", (req, res) => {
  const { error, value } = schemaGoogle.validate(req.body);
  if (error) return res.send({ status: 400, message: "Bad request", error: error.details[0].message });

  const query = `SELECT id, email,name,img_url FROM users WHERE email = '${value.email}' LIMIT 1`;
  const insert_query = `INSERT INTO users(email, name, img_url) values ('${value.email}', '${value.name}', '${value.imageUrl}')`;
  const pool = new Pool(CONFIG.DB);
  pool.query(query, (error, results) => {
    if (error) return res.send({ status: 500, message: "Internal error", error });
    if (results.rowCount > 0) {
      const token = jwt.sign({ data: results.rows[0] }, CONFIG.SECRET, {
        expiresIn: parseInt(CONFIG.SESSION_TIMEOUT)
      });
      return res.send({ status: 200, token });
    } else {
      pool.query(insert_query, (error, results) => {
        if (error) return res.send({ status: 500, message: "Internal error", error });
        const token = jwt.sign({ data: results }, CONFIG.SECRET, {
          expiresIn: parseInt(CONFIG.SESSION_TIMEOUT)
        });
        return res.send({ status: 200, user: results, token });
      });
    }
  });
});

module.exports = router;
