const User = require('../models/User');

const isAuthenticated = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).send('Unauthorized');
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).send('Server error');
  }
};

const hasRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).send('Forbidden');
  }
  next();
};

module.exports = {
  isAuthenticated,
  hasRole
};