import SimpleSchema from 'simpl-schema';

export default new SimpleSchema({
  _id: {
    type: String,
    optional: true,
  },
  userId: {
    type: String,
  },
  collection: {
    type: String,
  },
  docId: {
    type: String,
  },
  action: {
    type: String,
    allowedValues: [
      'update',
      'delete',
      'insert',
    ],
  },
  delta: {
    type: Array,
    optional: true,
    blackbox: true,
  },
  'delta.$': Object,
});
