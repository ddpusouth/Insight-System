const bcrypt = require('bcryptjs');

const password = 'xyz123';

bcrypt.genSalt(10, (err, salt) => {
  bcrypt.hash(password, salt, (err, hash) => {
    if (err) throw err;
    console.log('Hashed Password:', hash);
  });
});
