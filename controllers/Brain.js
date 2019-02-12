const path = require('path')
const opn = require('opn')
const fs = require('fs')
const jsonfile = require('jsonfile')
const Context = require('../helpers/Context')
const readline = require('readline')
const google = require('googleapis')
const googleAuth = require('google-auth-library')
const inspect = require('eyes').inspector({
  maxLength: Infinity
})
const to = require('await-to-js').default

function Brain() {
  let self = {
    auth: undefined,
    drive: google.drive('v3'),
    folder: undefined,
  }


  self.init = async () => {
    // Do something
    if (!self.auth) {
      console.log(">_ Initiating brain")
      await self.getToken()
    }
    await self.initBrainFolder()
    await self.getBrainFolder()
    console.log(">_ Brain Initiated")


  }
  self.getToken = () => {

    return new Promise(resolve => {
      // Load client secrets from a local file.
      fs.readFile('data/client_id.json',
        (err, content) => {
          if (err) {
            console.log('Error loading client secret file: ' + err)
            return
          }
          // Authorize a client with the loaded credentials, then call the
          // Drive API.
          authorize(JSON.parse(content),
            (auth) => {
              self.auth = auth
              resolve()
            })
        })
    })
  }
  self.initBrainFolder = () => {
    return new Promise(async (bigResolve, bigReject) => {

      let context = await Context.get()
      //inspect(context.brainFolder, 'Context.brainFolder')

      // Verify the brain Folder
      if (!context.brainFolder) {
        console.log('New folder ...')
        const id = await self.createBrainFolder()
        inspect(id, 'Folder created id')
        context = await Context.setItem('brainFolder', id)
        inspect(context, 'New context')
      }


      // Check if it really exist
      let response = await new Promise((resolve, reject) => {
        self.drive.files.list({
            q: 'mimeType = "application/vnd.google-apps.folder" and name = "Brain"',
            auth: self.auth,
            maxResults: 10,
          },
          (err, res) => {
            if (err) {
              console.error('The API returned an error: ' + err)
              throw new Error(err)
            } else
              resolve(res)
          })
      })
      //inspect(response, 'Drive file list response')
      let folders = response.files
      let folder

      // No folder : Create one
      if (folders && folders.length == 0) {
        console.info('No folder "Brain" found. Creating one and Reloading ...')
        Context.deleteItem('brainFolder')
          .then(() => {
            self.initBrainFolder()
          })
        return
      }

      // Many folders : Select the right one
      if (folders.length > 1) {
        console.info('Many BRAIN folder found. Selecting one ...')
        folders.forEach((file) => {
          if (file.id == context.brainFolder)
            folder = file
          else
            self.drive.files.delete({
              auth: self.auth,
              fileId: file.id
            })
        })
        Context.setItem('brainFolder', folder.id)
        self.folder = folder
        bigResolve()
        inspect(folder, 'Folder selected')
      } else {

        // Only one folder
        folder = folders[0]
        //inspect(folder.id, 'Folder.id')

        if (context.brainFolder == folder.id) {
          //console.log('Folder id matching !')
          self.folder = folder
          bigResolve()
        } else {
          console.error('Error : No Match')
          Context.deleteItem('brainFolder')
            .then(() => {
              self.initBrainFolder()
            })
        }
      }
    })
  }
  self.createBrainFolder = () => {
    return new Promise((resolve, reject) => {
      const fileMetadata = {
        'name': 'Brain',
        'mimeType': 'application/vnd.google-apps.folder'
      }
      self.drive.files.create({
        auth: self.auth,
        resource: fileMetadata,
        fields: 'id'
      }, (err, file) => {
        if (err) {
          console.error(err)
          reject(err)
        } else {
          inspect(file, 'Folder created')
          resolve(file.id)
        }
      })
    })
  }
  self.getBrainFolder = () => {
    return new Promise((resolve, reject) => {
      if (!self.folder.id) {
        throw new Error('No folder id found')
      }
      self.drive.files.get({
          auth: self.auth,
          fileId: self.folder.id
        },
        (err, res) => {
          if (err) {
            inspect(err, 'err')
            reject(err)
          } else {
            resolve(res)
            self.folder = res
          }
        })
    })
  }






  return self
}


// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/drive-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/drive'];
var TOKEN_DIR = path.join(__dirname, "../data/");
var TOKEN_PATH = TOKEN_DIR + 'token.json';
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
authorize = function authorize(credentials, callback) {
  var clientSecret = credentials.web.client_secret;
  var clientId = credentials.web.client_id;
  var redirectUrl = credentials.web.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function (err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  opn(authUrl);

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function (code) {
    rl.close();
    oauth2Client.getToken(code, function (err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  var service = google.drive('v3');
  service.files.list({
    auth: auth,
    maxResults: 10,
  }, function (err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var files = response.items;
    if (files.length == 0) {
      console.log('No files found.');
    } else {
      console.log('Files:');
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        console.log('%s (%s)', file.title, file.id);
      }
    }
  });
}
module.exports = new Brain()
