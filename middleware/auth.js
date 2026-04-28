const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader)
    return res.status(401).json({ message: "Access denied. No token provided." });

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required." });
    }
    next();
  });
};

const verifySelfOrAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    const routeUserId = req.params.userId || req.body.userId;
    if (!routeUserId) return res.status(400).json({ message: "User id is required." });

    if (req.user.role === 'admin' || req.user.id === routeUserId) return next();
    return res.status(403).json({ message: "You can only access your own resources." });
  });
};

module.exports = { verifyToken, verifyAdmin, verifySelfOrAdmin };