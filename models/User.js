const { DataTypes } = require("sequelize");

const sequelize = require("../config/db");

const User = sequelize.define("user",{
  firstname:  {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    validate: { isEmail: true }
  },                        
  phone: {
    type: DataTypes.STRING,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  provider: {
    type: DataTypes.STRING,
    defaultValue: "local"
  }
});

module.exports = User;
