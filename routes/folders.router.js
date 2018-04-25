'use strict';

const express = require('express');

const router = express.Router();

const knex = require('../knex');

router.get('/folders', (req, res, next) => {
  knex
    .select('id', 'name')
    .from('folders')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

router.get('/folders/:id', (req, res, next) => {
  const id = req.params.id;

  knex
    .select('id', 'name')
    .from('folders')
    .where('id', id)
    .then(([result]) => {
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
});

router.put('/folders/:id', (req, res, next) => {
  const folderId = req.params.id;

  const { name } = req.body;

  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const updateItem = {
    name: name
  };

  knex('folders')
    .update(updateItem)
    .where('id', folderId)
    .returning(['id', 'name'])
    .then(([result]) => {
      if(result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;