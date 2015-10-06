'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  archive = require('./archive.js');

var TaskSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date
  },
  title: {
    type: String
  },
  project: {
    type: Schema.ObjectId,
    ref: 'Project'
  },
  parent: {
    type: Schema.ObjectId,
    ref: 'Task'
  },
  creator: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  manager: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  tags: [String],
  status: {
    type: String,
    enum: ['New', 'Assigned', 'In progress', 'Review', 'Rejected', 'Done'],
    default: 'New'
  },
  due: {
    type: Date
  },
  //should we maybe have finer grain control on this
  watchers: [{
    type: Schema.ObjectId,
    ref: 'User'
  }],
  assign: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  description: {
    type: String
  },
  discussions: [{
    type: Schema.ObjectId,
    ref: 'Discussion'
  }]
});

var starVirtual = TaskSchema.virtual('star');
starVirtual.get(function() {
  return this._star;
});
starVirtual.set(function(value) {
  this._star = value;
});
TaskSchema.set('toJSON', { virtuals: true });
TaskSchema.set('toObject', { virtuals: true });

/**
 * Statics
 */
TaskSchema.statics.load = function (id, cb) {
  this.findOne({
    _id: id
  }).populate('creator', 'name username')
    .populate('assign', 'name username').exec(cb);
};
TaskSchema.statics.project = function (id, cb) {
  require('./project');
  var Project = mongoose.model('Project');
  Project.findById(id, function (err, project) {
    cb(err, project || {});
  })
};
/**
 * Post middleware
 */
var elasticsearch = require('../controllers/elasticsearch'),
  profile = require('../controllers/profile');

TaskSchema.post('save', function (req, next) {
  var task = this;
  TaskSchema.statics.project(this.project, function (err, project) {
    if (err) {
      return err
    }

    elasticsearch.save(task, 'task', project.room);
  });
  next();
});

TaskSchema.pre('remove', function (next) {
  var task = this;
  TaskSchema.statics.project(this.project, function (err, project) {
    if (err) {
      return err
    }
    elasticsearch.delete(task, 'task', project.room, next);
    profile.removeStarEntity(task._id, 'Tasks', next);
  });
  next();
});

TaskSchema.plugin(archive, 'task');

module.exports = mongoose.model('Task', TaskSchema);
