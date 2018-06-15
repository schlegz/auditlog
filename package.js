Package.describe({
  name: 'schlegz76:auditlog',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Creates a log of changes to a collection.',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md',
});

Npm.depends({
  'deep-diff': '1.0.1',
  'simpl-schema': '1.5.0',
});

Package.onUse(function(api) {
  api.versionsFrom('1.7.0.1');
  api.use('ecmascript');
  api.use(['meteor', 'mongo'], ['server']);
  api.use(['matb33:collection-hooks@0.8.4'], ['server']);
  api.mainModule('auditlog.js');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('schlegz76:auditlog');
  api.mainModule('auditlog-tests.js');
});
