
const jwt = require('jsonwebtoken');

exports.generateToken=(user) => {
  const token=jwt.sign(
    {id: user.id, email: user.email, phone: user.phone },
    process.env.JWT_SECRET,
    {expiresIn: "1h"},
    
  );
  return token;
};