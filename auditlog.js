import { Mongo } from 'meteor/mongo';
import { diff } from 'deep-diff'; // eslint-disable-line import/no-unresolved

import AuditLogSchema from './schema/auditlog';

const AuditLogs = new Mongo.Collection('auditlog');

AuditLogs.schema = AuditLogSchema;

if (Meteor.isServer) {
  AuditLogs.rawCollection().createIndex({ userId: 1 }); // index, ascending
  AuditLogs.rawCollection().createIndex({ docId: 1 }); // index, ascending
}

/**
 * Generate a object detailing the difference between two documents.
 * @param {Object} doc1 LHS document to compare.
 * @param {Object} doc2 RHS document to compare.
 * @param {Object} options Additional comparison options.
 */
function getDocDelta(doc1, doc2, options) {
  const delta = diff(doc1, doc2);
  return delta;
}

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
  const delta = getDocDelta(previousDoc, doc);

  AuditLogs.insert({
    userId,
    collection: collectionName,
    docId: doc._id,
    action: 'update',
    delta,
  });
}

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

export default AuditLogs;