# Node.js Helix Participant

[Apache Helix](http://helix.incubator.apache.org/) is a cluster management framework that is
currently being incubated by the Apache Incubator project. The Helix participant is the
component of the Helix architecture that hosts the distributed resources.

`node-helix-participant` is a node.js module that aims to provide a subset of the Helix library
necessary to create native node.js Helix participants.

## Motivation

The original Helix library is written in Java for the JVM. For node.js applications and
services, however, the is no way to directy instantiate a participant. In lieu of this, some
interprocess communication must occur between the node.js process and the JVM process hosting the
Helix participant. A few poblems emerge from this separation of the true resource owner and the
Helix participant that acts as a representative.

The major concern is that there is now inconsistency between actual ownership of the resource and
what is known to the participant, meaning the guarantee of atomic region ownership is no longer
strictly true. In additon, state transitions may fail due to to either the Helix participant or the
application hosting the resource, and because the two exist without shared memory or logic, managing
failed transitions becomes a much more difficult task.

## Contributing

### Code Style

The APIs for these modules are meant to stay consistent with those in the Java-based Helix
distribution. However, the APIs will be written in a fashion that is consistent with node.js and
JavaScript conventions.

Code style should abide by the following:

* Use `strict` mode
* Use [JSDoc 3](http://usejsdoc.org/) for documenting code
* Always use semicolons
* Indent with two (2) spaces
* Use Unix-style newline characters (single `LF`)
* End files with new lines

## Dependencies

* [node-zookeeper-client](https://github.com/alexguan/node-zookeeper-client)
* [async](https://github.com/caolan/async)
* [async-stacktrace](https://github.com/Pita/async-stacktrace)
