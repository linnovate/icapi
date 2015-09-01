'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	archive = require('./archive.js');


var UpdateSchema = new Schema({
	created: {
		type: Date
	},
	updated: {
		type: Date
	},
	issue: {
		type: String,
		required: true
	},
	issueId: {
		type: Schema.Types.ObjectId,
		required: true
	},
	creator: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	description: {
		type: String
	},
	type: {
		type: String
	}
});

/**
 * Validations
 */
UpdateSchema.path('issue').validate(function(issue) {
	return !!issue;
}, 'Issue cannot be blank');

UpdateSchema.path('issueId').validate(function(issueId) {
	return !!issueId;
}, 'Issue id cannot be blank');

/**
 * Statics
 */
UpdateSchema.statics.load = function(id, cb) {
	this.findOne({
		_id: id
	}).populate('creator', 'name username').exec(cb);
};

UpdateSchema.statics.task = function(id, cb) {
	require('./task');
	var Task = mongoose.model('Task');
	Task.findById(id).populate('project').exec(function(err, task) {
		cb(err, {room: task.project ? task.project.room : null, title: task.title});
	})
};

UpdateSchema.statics.project = function(id, cb) {
	require('./project');
	var Project = mongoose.model('Project');
	Project.findById(id, function(err, project) {
		cb(err, {room: project.room, title: project.title});
	})
};

/**
 * Post middleware
 */
var elasticsearch = require('../controllers/elasticsearch');

UpdateSchema.post('save', function(req, next) {
	var update = this;
  if (UpdateSchema.statics[update.issue]) {
    UpdateSchema.statics[update.issue](update.issueId, function(err, result) {
      if (err) {
        return err;
      }
      elasticsearch.save(update, 'update', result.room, result.title);
      next();
    });
  } else {
      elasticsearch.save(update, 'update');
  }
});

UpdateSchema.pre('remove', function(next) {
	elasticsearch.delete(this, 'update', this.room, next);
	next();
});

UpdateSchema.plugin(archive, 'update');

mongoose.model('Update', UpdateSchema);
