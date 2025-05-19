SEV Database
============
A webapp to list and manage Estonian social enterprises for the Social Enterprise Estonia non-profit. The database app, available online at <https://kell.ee/andmebaas>, is built with JavaScript on Node.js, [JSX](https://github.com/moll/js-j6pack/) for templates and [Sass](https://sass-lang.com/) for CSS. It uses SQLite for its database, which comes bundled with the [Better Sqlite3][better-sqlite3] Node.js package. No external database servers required.

[better-sqlite3]: https://github.com/JoshuaWise/better-sqlite3


Development
-----------
After installing a stable version of [Node.js](https://nodejs.org) (so far tested against both Node.js v10 and Node.js v12, and NPM v6), follow these steps:

1. Install the JavaScript modules necessary for the server and client-side components.

   ```sh
   npm install
   cd assets && npm install
   ```

   There are `npm-shrinkwrap.json` files to ensure you get the same versions as originally developed with.

2. Compile the client-side stylesheets with Make:

   ```sh
   make -C assets
   ```

   There are no client-side JavaScript files to generate. The few bits of JavaScript used are inlined in templates.

3. Initialize the development SQLite3 database:

   ```sh
   make db/create
   ```

4. Run the server (defaults to port 6090):

   ```sh
   make web
   ```

   For a different port, pass `PORT` to Make:
   ```sh
   make web PORT=8888
   ```

5. Generate an admin account invite link.

   ```sh
   ./bin/sev accounts create user@example.com
   ```

6. Open your local domain (e.g. <http://localhost:6090>) in your browser, accept the admin invite and proceed to click around.

### Autocompiling
To have stylesheets be compiled automatically as you edit them, use `autocompile` in `assets/Makefile`:

```sh
make -C assets autocompile
```

### LiveReloading
If you wish to have CSS reloaded automatically during development, run LiveReload in addition to the web server and the autocompiling Make target above:

```sh
make livereload
```


Production
----------
The process to deploy and run on production is divided into two section — generating the stylesheets on the developer machine and then rsyncing everything to the server.

1. Install the JavaScript modules necessary for stylesheet generation:
   ```sh
   cd assets && npm install
   ```

2. Compile the client-side stylesheets with Make:
   ```sh
   make -C assets
   ```

3. Deploy to production via Rsync:
   ```sh
   make production
   ```

   This also deploys the contents of the `node_modules` folder, apart from `better-sqlite3`, which needs recompiling as described below.

   Configure the server address and path via the `RSYNC_TARGET` variable. Feel free to edit the `Makefile` for that.

   If you wish to see what `rsync` uploads prior to doing so, use `make production/diff`, which adds the `--dry-run` flag to Rsync.

4. Reinstall the [Better Sqlite3][better-sqlite3] package as it contains native code and therefore can't be merely rsynced from the development machine:

   ```sh
   npm install --production --legacy-bundling true --ignore-scripts false
   ```

5. Initialize the SQLite3 database:
   ```sh
   make db/create ENV=production
   ```

6. Run the server (defaults to port 6090):
   ```sh
   make web ENV=production
   ```

   If you want to run the server without Make, just copy the necessary Node options over. For example, when using the Node Version Manager:

   ```sh
   ENV=production ~/.nvm/versions/node/v12.22.10/bin/node ./bin/web --use-strict --require j6pack/register
   ```

7. Configure the production environment by creating `config/production.json`.

   The first thing to do is to add a new `cookieSecret`. Generate 20–40 random characters for that:

   ```json
   {
     "cookieSecret": "<SOMETHING_RANDOM_HERE>"
   }
   ```

   For other configurable options, see `config/index.json`.

8. Generate an admin account invite link.

   ```sh
   ./bin/sev accounts create user@example.com
   ```

9. Configure your web server to proxy requests to the webapp.

   If you're running on a host whose Apache you lack control over, you can use a `.htaccess` file to proxy requests:

   ```htaccess
    DirectoryIndex disabled

    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule (.*) http://127.0.164.162:6090/$1 [proxy]
   ```

   If you decided to run the app under a subdirectory, like the official SEV website does (at <https://kell.ee/andmebaas>, with the subdirectory being `/andmebaas`), you should also add a `Location` header override as currently all redirects presume the app is mounted at root (`/`):

   ```htaccess
   Header edit Location ^(?:/andmebaas)?/(.*) /andmebaas/$1
   ```

   And finally, ensure proper cache headers are set:

   ```htaccess
   Header unset Expires

   <FilesMatch "\.(html|js|json|css|eot|woff|woff2|ttf|ico|jpg|jpeg|png|svg)$">
     Header set Cache-Control "max-age=0, public, must-revalidate"
   </FilesMatch>
   ```

9. Open the configured production web address and proceed to profit.


Extra
-----
### Updating Texts and Translations
Texts of the app live in Google Spreadsheets and are preprocessed locally. Use Make to update the local copy:

```sh
make translations --always-make
```

Review the changes, commit them and then just deploy to production.

The header and footer menu are reloaded from the primary SEV website's Wordpress API during start up. There are also cached versions available should the primary site be unavailable. You can use Make to update the cached versions:

```sh
make menus --always-make
```

### Tests
Tests can be run with Make:

```sh
make spec
```

For running tests automatically during development:

```sh
make autospec
```

To just see dots instead of test titles, use `test` and `autotest` respectively.

### Command Line Interface
There's an executable under `bin/sev` that has a set of commands useful for administration. The first, admin account generation, you saw above. There are also commands for deleting accounts and creating organizations.

Run `bin/sev --help` for the full list.

### Database Migrations
Database migrations live under `db/migrations` and are run via a script living under `vendor/shange`. There are Make targets set up with the correct configuration.

Create a new migration:
```sh
make db/migration NAME=rename_this_to_that
```

Run all migrations:
```sh
make db/migrate
```

Use the `ENV` environment variable to run migrations in production, for example:
```sh
make db/status ENV=production
make db/migrate ENV=production
```

Migrations require the presence of the `sqlite3` binary on your system.


License
-------
SEV Database is released under the *GNU Affero General Public License*, which in
summary means:

- You **can** use this program for **no cost**.
- You **can** use this program for **both personal and commercial reasons**.
- You **have to share the source code** when you run it online.
- You **have to share modifications** (e.g bug-fixes) you've made to this program.

For more details, see the `LICENSE` file.
