const express = require("express");
const router = express.Router();
const Joi = require("@hapi/joi");

const schema = Joi.object({
  user_id: Joi.number().required(),
  movie_id: Joi.number().required(),
  movie_title: Joi.string().required(),
  vote_average: Joi.number(),
  poster_path: Joi.string(),
  token: Joi.string().required()
});

router.post("/", (req, res) => {
  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.send({
      status: 400,
      message: "Bad request her",
      error: error.details[0].message
    });
  }

  let is_exist_query = `SELECT id FROM movies WHERE id = ${value.movie_id};`;
  let add_fav_query = `INSERT INTO fav_movies(user_id, movie_id)  VALUES (${value.user_id}, ${value.movie_id});`;
  let add_fav_movie_query = `INSERT INTO movies(id, title, vote_average, poster_path) VALUES (${value.movie_id}, '${value.movie_title}', ${value.vote_average}, '${value.poster_path}');`;

  req.pgPool.query(is_exist_query, (err, result) => {
    if (err) {
      req.pgPool.end();
      return res.send({ status: 500, message: "Server error occured", err: err });
    }
    if (result.rowCount > 0) {
      req.pgPool.query(add_fav_query, (err, res1) => {
        if (err) {
          req.pgPool.end();
          return res.send({ status: 500, message: "Server error occured" });
        }
        return res.send({ status: 200, message: "Item has been added" });
      });
    } else if (result.rowCount === 0) {
      console.log(add_fav_movie_query + add_fav_query);
      req.pgPool.query(add_fav_movie_query + add_fav_query, (err, res2) => {
        if (err) {
          req.pgPool.end();
          return res.send({ status: 500, message: "Server error occured", err: err });
        }
        return res.send({ status: 200, message: "Item has been added" });
      });
    }
  });
});

module.exports = router;
