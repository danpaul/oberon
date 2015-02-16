This module is designed to be a simple back end component for user authentication but is considered incomplete on its own. The module requires intialization of a [Knex object](http://knexjs.org).

This module prvoides:
* Basic user email and password storage, hashing and verification backed by knex compatible SQL DB (Postgres, MySQL, MariaDB, SQLite3).

This module does not provide:
* Session management.
* Credential validation (i.e. email validation)
* Password reset ability (i.e. sending password reset notices).

See test/test.js for usage example. Check out the code or message me if you have any questions.