const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors')
const knex = require('knex');

const db = knex({
  client: 'pg', // Use 'mysql' for MySQL
  connection: {
    host: process.env.DB_HOST, // Database host (Render provides this)
    user: process.env.DB_USER, // Database username (Render provides this)
    password: process.env.DB_PASSWORD, // Database password (Render provides this)
    database: process.env.DB_NAME, // Database name (Render provides this)
  },
});


const app = express();

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.json(database.users);
})

app.post('/signin', (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json('Incorrect form submission');
  }
  db.select('email', 'hash').from('login')
  .where('email', '=', req.body.email)
  .then(data => {
   const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
    if (isValid) {
      return db.select('*').from('users')
      .where('email', '=', req.body.email)
      .then(user => {
        res.json(user[0])
      })
      .catch(err => res.status(400).json('Unable to get user'))
    }
  })
  .catch(err => res.status(400).json('Wrong credentials'))
})

app.post('/register', (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json('Incorrect form submission');
  }

  const hash = bcrypt.hashSync(password);
  db.transaction(trx => {
    trx.insert({
      hash: hash,
      email: email
    })
      .into('login')
      .returning('email')
      .then(loginEmail => {
       return trx('users')
          .returning('*')
          .insert({
            email: loginEmail[0].email,
            name: name,
            joined: new Date()
        })
        .then(user => {
          res.json(user[0]);
        })
      })
      .then(trx.commit)
      .catch(trx.rollback)
    })
  .catch(err => res.status(400).json('Unable to register'));
})

app.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  db.select('*').from('users').where({id})
  .then(user => {
    console.log(user)
    if (user.length) {
      res.json(user[0])
    } else {
      res.status(400).json('Not found')
    }
  })
  .catch(err => res.status(400).json('Error getting user')) 
})

app.put('/image', (req, res) => {
  const { id } = req.body;
  return db('users').where('id', '=', id)
  .increment('entries', 1)
  .returning('entries')
  .then(entries => {
    res.json(entries[0].entries);
  })
  .catch(err => res.status(400).json('Unable to get entries'))
})

app.listen(3000, ()=> {
  console.log('app is running on port 3000');
})