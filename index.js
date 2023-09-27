const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
require('dotenv').config()
let mongoose = require('mongoose');



mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  log: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }] 
});


let User = mongoose.model('User', userSchema);

const exerciseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: false,
    default: new Date().toDateString()
  }
});

let Exercise = mongoose.model('Exercise', exerciseSchema);

const createAndSaveUser = (username) => {
  
};




app.post('/api/users', async (req, res) => {
  const { username } = req.body;

  const user = new User({ username });

  try {
    const savedUser = await user.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const formattedDate = date ? new Date(date).toDateString() : new Date().toDateString();
    
    const exercise = new Exercise({ username: user.username, description, duration, date: formattedDate });
    await exercise.save();
    
    user.log.push(exercise);
    await user.save();
    
    return res.json({
      username: user.username,
      _id: user._id,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});


app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users); 
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



// Ruta para obtener el registro de ejercicio de un usuario (GET /api/users/:_id/logs)
app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id;
  try {
    const user =  await User.findById(userId).populate('log');;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let log = user.log;
    
    // Aplicar filtros si se proporcionan los parámetros from, to y limit
    const { from, to, limit } = req.query;
    if (from) {
      log = log.filter(exercise => new Date(exercise.date) >= new Date(from));
    }
    if (to) {
      log = log.filter(exercise => new Date(exercise.date) <= new Date(to));
    }
    if (limit) {
      log = log.slice(0, parseInt(limit));
    }

    const formattedLog = log.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString() // Formato de fecha
    })); 

    return res.json({
      username: user.username,
      _id: user._id,
      count: log.length,
      log: formattedLog
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});






const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
