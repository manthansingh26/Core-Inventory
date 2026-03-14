const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'manager', 'staff'), defaultValue: 'staff' },
  avatar: { type: DataTypes.STRING, defaultValue: '' },
  profilePicture: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
  resetOtp: { type: DataTypes.STRING },
  resetOtpExpiry: { type: DataTypes.DATE },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.resetOtp;
  delete values.resetOtpExpiry;
  return values;
};

module.exports = User;
