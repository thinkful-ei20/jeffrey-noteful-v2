'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

const knex = require('../knex');

// Get All (and search by query)
router.get('/notes', (req, res, next) => {
  const { searchTerm, folderId } = req.query;

  knex
    .select('notes.id', 'title', 'content', 'folders.id as folder_id', 'folders.name as folder_name', 'note_tags.tag_id as note_tags_tag_id', 'tags.id as tag_id', 'tags.name as tag_name')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('note_tags', 'notes.id', 'note_tags.note_id')
    .leftJoin('tags', 'note_tags.tag_id', 'tags.id')
    .modify(function (queryBuilder) {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .modify(function (queryBuilder) {
      if (folderId) {
        queryBuilder.where('folder_id', folderId);
      }
    })
    .orderBy('notes.id')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

// Get a single item
router.get('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;

  knex
    .select('notes.id', 'title', 'content', 'folders.id as folder_id', 'folders.name as folderName')
    .from('notes')
    .innerJoin('folders', 'notes.folder_id', 'folders.id')
    .where({ 'notes.id': noteId })
    .orderBy('notes.id')
    .then(([result]) => {
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
});

// Put update an item
router.put('/notes/:id', (req, res, next) => {
  const id = req.params.id;

  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content', 'folder_id'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex('notes')
    .update(updateObj)
    .where('id', id)
    .returning('id')
    .then(([id]) => {
      return knex.select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folder_name')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .where('notes.id', id);
    })
    .then(([result]) => {
      res.json(result);
    })
    .catch(err => {
      next(err);
    });
});

// Post (insert) an item
router.post('/notes', (req, res, next) => {
  const { title, content, folder_id } = req.body;

  const newItem = { title, content, folder_id };
  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  let noteId;

  knex.insert(newItem)
    .into('notes')
    .returning('id')
    .then(([id]) => {
      noteId = id;
      return knex.select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folder_name')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .where('notes.id', noteId);
    })
    .then(([result]) => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});

// Delete an item
router.delete('/notes/:id', (req, res, next) => {
  const id = req.params.id;

  knex.del()
    .from('notes')
    .where('id', req.params.id)
    .then(() => {
      res.status(204).end();
    })
    .catch(err => next(err));
});

module.exports = router;