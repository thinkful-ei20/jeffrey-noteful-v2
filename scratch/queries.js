// 'use strict';

// const knex = require('../knex');

// let searchTerm = 'gaga';
// knex
//   .select('notes.id', 'title', 'content')
//   .from('notes')
//   .modify(queryBuilder => {
//     if (searchTerm) {
//       queryBuilder.where('title', 'like', `%${searchTerm}%`);
//     }
//   })
//   .orderBy('notes.id')
//   .then(results => {
//     console.log(JSON.stringify(results, null, 2));
//   })
//   .catch(err => {
//     console.error(err);
//   });

// let noteId = '1009';
// knex
//   .select('notes.id', 'title', 'content')
//   .from('notes')
//   .modify(queryBuilder => {
//     if (noteId) {
//       queryBuilder.where('id', noteId);
//     }
//   })
//   .then(results => {
//     console.log(JSON.stringify(results[0], null, 2));
//   })
//   .catch(err => {
//     console.error(err);
//   });

// let updateNoteId = '1000';
// knex('notes')
//   .where('id', updateNoteId)
//   .update({ title: 'Update title', content: 'Update content' })
//   .returning(['notes.id', 'title', 'content'])
//   .then(results => {
//     console.log(JSON.stringify(results[0], null, 2));
//   })
//   .catch(err => {
//     console.error(err);
//   });

// knex('notes')
//   .insert({ title: 'New title', content: 'New content' })
//   .returning(['notes.id', 'title', 'content'])
//   .then(results => {
//     console.log(JSON.stringify(results[0], null, 2));
//   })
//   .catch(err => {
//     console.error(err);
//   });

// let deleteNoteId = '1011';
// knex('notes')
//   .where('id', deleteNoteId)
//   .del()
//   .then(console.log);
