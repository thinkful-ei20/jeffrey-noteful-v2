'use strict';

const express = require('express');
const router = express.Router();

const knex = require('../knex');
const { hydrateNotes } = require('../utils/hydrateNotes');

router.get('/notes', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;

  knex('notes').select('notes.id', 'title', 'content',
    'folders.id as folderId', 'folders.name as folderName',
    'note_tags.tag_id as note_tags_tag_id',
    'tags.id as tagId', 'tags.name as tagName')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('note_tags', 'notes.id', 'note_tags.note_id')
    .leftJoin('tags', 'note_tags.tag_id', 'tags.id')
    .modify(function (queryBuilder) {
      if (searchTerm) { queryBuilder.where('title', 'like', `%${searchTerm}%`); }
    })
    .modify(function (queryBuilder) {
      if (folderId) { queryBuilder.where('folder_id', folderId); }
    })
    .modify(function (queryBuilder) {
      if (tagId) { queryBuilder.where('tag_id', tagId); }
    })
    .orderBy('notes.id')
    .then(results => res.json(hydrateNotes(results)))
    .catch(err => next(err));
});

router.get('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;

  knex('notes').select('notes.id', 'title', 'content',
    'folders.id as folderId', 'folders.name as folderName',
    'note_tags.tag_id as note_tags_tag_id',
    'tags.id as tagId', 'tags.name as tagName')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('note_tags', 'notes.id', 'note_tags.note_id')
    .leftJoin('tags', 'note_tags.tag_id', 'tags.id')
    .where('notes.id', noteId)
    .orderBy('notes.id')
    .then((results) => {
      const hydrated = hydrateNotes(results);
      res.json(hydrated[0]);
    })
    .catch(err => next(err));
});

router.put('/notes/:id', (req, res, next) => {
  const id = req.params.id;

  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content', 'folder_id, tags'];

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


  knex('notes').update(updateObj).where('id', id).returning('id')
    .then(([id]) => {
      return knex.del().from('note_tags').where('note_id', id);
    })
    .then(([id]) => {
      // Insert related tags into notes_tags table
      const tagsInsert = updateObj.tags.map(tagId => ({ note_id: id, tag_id: tagId }));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(([result]) => {
      res.json(hydrateNotes(result));
    })
    .catch(err => {
      next(err);
    });
});

router.post('/notes', (req, res, next) => {
  const { title, content, folder_id, tags } = req.body;

  const newItem = { title, content, folder_id, tags };
  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  let noteId;
  // Insert new note into notes table
  knex.insert(newItem).into('notes').returning('id')
    .then(([id]) => {
      // Insert related tags into notes_tags table
      noteId = id;
      const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
      // Select the new note and leftJoin on folders and tags
      return knex.select('notes.id', 'title', 'content',
        'folders.id as folder_id', 'folders.name as folderName',
        'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', noteId);
    })
    .then(result => {
      if (result) {
        // Hydrate the results
        const hydrated = hydrateNotes(result)[0];
        // Respond with a location header, a 201 status and a note object
        res.location(`${req.originalUrl}/${hydrated.id}`).status(201).json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

router.delete('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;

  knex('notes').del().where('id', noteId)
    .then(() => res.status(204).end())
    .catch(err => next(err));
});

module.exports = router;