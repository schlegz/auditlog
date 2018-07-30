import { Mongo } from 'meteor/mongo';
import { diff } from 'deep-diff'; // eslint-disable-line import/no-unresolved
import { check, Match } from 'meteor/check';
import AuditLogSchema from './schema/auditlog';

const AuditLogs = new Mongo.Collection('auditlog');

AuditLogs.schema = AuditLogSchema;

/**
 * Add a log entry when a document is added to a collection.
 *
 * @param {*} userId Owner of document.
 * @param {*} doc The document to add.
 * @param {*} collectionName The name of collection the document belongs to.
 * @param {*} logOptions Additional logging options.
 */
function logInsert(userId, doc, collectionName, logOptions) {
  AuditLogs.insert({
    userId,
    collection: collectionName,
    docId: doc._id,
    action: 'insert',
    createdAt: new Date(),
  });
}

/**
 * Add a log entry when a document is removed from a collection.
 *
 * @param {String} userId Owner of document.
 * @param {Object} doc The document to remove.
 * @param {String} collectionName The name of collection the document belongs to.
 * @param {Object} logOptions Additional logging options.
 */
function logRemove(userId, doc, collectionName, logOptions) {
  AuditLogs.insert({
    userId,
    collection: collectionName,
    docId: doc._id,
    action: 'remove',
    createdAt: new Date(),
  });
}

/**
 * Add a log entry when a document is modified.
 * @param {*} userId Owner of document.
 * @param {*} doc The document to remove.
 * @param {*} collectionName The name of collection the document belongs to.
 * @param {*} logOptions Additional logging options.
 * @param {*} fieldNames Array of modified fields.
 * @param {*} modifier Mongo document modifier.
 * @param {*} options Modification options.
 * @param {*} previousDoc Previous instance of document for modification.
 */
function logUpdate(
  userId, doc, collectionName, logOptions,
  fieldNames, modifier, options,
  previousDoc,
) {
  const delta = diff(previousDoc, doc, (path, key) => logOptions.omit.includes(key));

  AuditLogs.insert({
    userId,
    collection: collectionName,
    docId: doc._id,
    action: 'update',
    createdAt: new Date(),
    delta,
  });
}

if (Meteor.isServer) {
  AuditLogs.rawCollection().createIndex({ userId: 1 }); // index, ascending
  AuditLogs.rawCollection().createIndex({ docId: 1 }); // index, ascending

  Meteor.publish('auditlogs.all', function () {
    // if not logged in, indicate that we are done and have sent everything
    if (!this.userId) {
      return this.ready();
    }

    return AuditLogs.find({}, { sort: { createdAt: -1 } });
  });

  Meteor.publish('auditlogs.paginate', function (sort, limit, search) {
    check(sort, Object);
    check(limit, Number);
    check(search, Match.OneOf(String, null, undefined));

    // if not logged in, indicate that we are done and have sent everything
    if (!this.userId) {
      return this.ready();
    }

    let query = {};
    const projection = { sort, limit };

    if (search) {
      const regex = new RegExp(search, 'i');

      query = {
        $or: [
          { name: regex },
        ],
      };
    }

    return AuditLogs.find(query, projection);
  });

  Meteor.methods({
    'auditlogs.count'({ search }) {
      if (!this.isSimulation) {
        // let query = {};
        // const regex = new RegExp(search, 'i');

        // query = {
        //   $or: [
        //     { name: regex },
        //   ],
        // };

        return AuditLogs.find(query).count();
      }

      return 0;
    },
  });

  /**
   * Attach event handler to the collection to log add/remove/update
   * modifications to documents.
   * @param {*} collection Collection to monitor.
   * @param {*} logOptions Additional logging options.
   */
  AuditLogs.addLogger = function (collection, logOptions) {
    const collectionName = collection._name || 'unknown';

    collection.after.insert((userId, doc) => {
      logInsert(userId, doc, collectionName, logOptions);
    });

    collection.after.remove((userId, doc) => {
      logRemove(userId, doc, collectionName, logOptions);
    });

    collection.after.update(function (userId, doc, fieldNames, modifier, options) {
      logUpdate(
        userId, doc, collectionName, logOptions,
        fieldNames, modifier, options,
        this.previous,
      );
    });
  };
} else {
  AuditLogs.subscribeAll = function () {
    return Meteor.subscribe('auditlogs.all');
  };

  AuditLogs.subscribePaginate = function (sort, limit, search) {
    return Meteor.subscribe(
      'auditlogs.paginate',
      sort,
      limit,
      search,
    );
  };

  AuditLogs.count = function (search, callback) {
    return Meteor.call('auditlogs.count', { search }, callback);
  };
}

export default AuditLogs;
