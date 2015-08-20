'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  archive = require('./archive.js');


var DiscussionSchema = new Schema({
  created: {
    type: Date
  },
  updated: {
    type: Date
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String
  },
  creator: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  manager: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  date: {
    type: Date
  },
  active: {
    type: Boolean
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['Set', 'Done', 'Postponed', 'Cancelled', 'Archived'],
    default: 'Set'
  },
  //should we maybe have finer grain control on this

  /*
  Should we do roles or have set structure - how do we grow this

  Should eg membership/watchers be separate and and stored in user or in the model itself of the issue etc

  */
  members: [{
    type: Schema.ObjectId,
    ref: 'User'
  }],
  //should we maybe have finer grain control on this
  watchers: [{
    type: Schema.ObjectId,
    ref: 'User'
  }]
});

/**
 * Validations
 */
DiscussionSchema.path('title').validate(function(title) {
  return !!title;
}, 'Title cannot be blank');

DiscussionSchema.path('content').validate(function(content) {
  return !!content;
}, 'Content cannot be blank');

/**
 * Statics
 */
DiscussionSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  }).populate('creator', 'name username').exec(cb);
};
/**
 * Post middleware
 */
var elasticsearch = require('../controllers/elasticsearch');
DiscussionSchema.post('save', function() {
  elasticsearch.save(this, 'discussion');
});
DiscussionSchema.pre('remove', function(next) {
  elasticsearch.delete(this, 'discussion', null, next);
});

DiscussionSchema.plugin(archive, 'discussion');

mongoose.model('Discussion', DiscussionSchema);