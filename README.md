# auditlog
Meteor package to add logging of modifications to collections.

### Installation
```meteor add schlegz76:auditlog```

### Usage

To record changes to a collection, look at the following example:

```
import AuditLog from 'meteor/schlegz76:auditlog';

const YourCollection = new Mongo.Collection('yourCollection');\

AuditLog.addLogger(YourCollection, { omit: ['createdAt', 'editedAt'] });
```
