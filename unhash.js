(async () => {
  const bcrypt = await import('bcryptjs');

  const hash = '$2b$10$imlf.0w23LDl4RBMJ57mWO95BRmgjYH2PKXsiqefoqUIxo211loNq';
  const password = 'xyz123';

  bcrypt.compare(password, hash, (err, result) => {
    if (result) {
      console.log('Password matches!');
    } else {
      console.log('Password does not match.');
    }
  });
})();
