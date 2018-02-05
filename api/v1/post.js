const helpers = require('../helpers.js')
const bcrypt = require('bcrypt')
const saltRounds = 10


// ...
function createUser(req, res, next) {
  bcrypt.hash(req.params.password, saltRounds, (err, hash) => {
    let now = new Date()
    helpers.db.one('insert into users(email, password_digest, created_at, updated_at) values(${email}, ${password_digest}, ${created_at}, ${updated_at}) RETURNING id', {
      email: req.params.email,
      password_digest: hash,
      created_at: now,
      updated_at: now,
    })
    .then((result) => {
      res.status(200).json({
        status: 'success',
        id: result.id,
      })
    })
    .catch((error) => {
      res.status(500).json({
        status: 'failure',
        id: error.message,
      })
    })
  })
}


// ...
function createAccount(req, res, next) {
  let now = new Date()
  helpers.db.one(
    'insert into accounts\
      (pubkey, alias, user_id, visible, created_at, updated_at)\
    values (\
      ${pubkey}, ${alias}, ${user_id}, ${visible}, ${created_at}, ${updated_at}\
    )\
    RETURNING id', {
      pubkey: req.params.pubkey,
      alias: alias => {
        return (req.query.alias !== 'undefined' ? req.query.alias : null)
      },
      user_id: req.params.user_id,
      visible: visible => {
        return (req.query.visible == 'false' ? false : true)
      },
      created_at: now,
      updated_at: now,
    })
    .then((result) => {
      res.status(200).json({
        success: true,
        account_id: result.id
      })
    })
    .catch((error) => {
      res.status(500).json({
        error: error.message
      })
    })
}


// ...
function authenticate(req, res, next) {
  helpers.db.any('select * from users where email = ${email}', {email: req.params.email})
    .then((dbData) => {
      // user found
      if (dbData.length === 1) {
        bcrypt.compare(req.params.password, dbData[0].password_digest, (err, auth) => {
          if (auth) {
            helpers.db.one('select pubkey from accounts where user_id = ${user_id}', {
              user_id: dbData[0].id
            })
            .then((dbAccount) => {
              // authenticated
              res.status(200).json({
                authenticated: true,
                user_id: dbData[0].id,
                pubkey: dbAccount.pubkey,
              })
            })
          } else {
            // not authenticated
            res.status(401).json({
              authenticated: false,
              user_id: null,
              pubkey: null,
            })
          }
        })
      }
      // user not found in DB
      else {
        res.status(401).json({
          authenticated: false,
          user_id: null,
          pubkey: null,
        })
      }

    }).catch((error) => {
      console.log(error)
      res.status(500).json({
        error: error.message
      })
    })
}


//...
module.exports = {
  createUser: createUser,
  authenticate: authenticate,
  createAccount: createAccount,
}
