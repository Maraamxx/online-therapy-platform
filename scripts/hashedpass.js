const bcrypt = require("bcrypt");

async function generateHashedPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  console.log("Hashed Password:", hashedPassword);
}

generateHashedPassword("maramxx");
