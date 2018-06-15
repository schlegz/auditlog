// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from 'meteor/tinytest';

// Import and rename a variable exported by auditlog.js.
import { name as packageName } from 'meteor/auditlog';

// Write your tests here!
// Here is an example.
Tinytest.add('auditlog - example', function (test) {
  test.equal(packageName, 'auditlog');
});
