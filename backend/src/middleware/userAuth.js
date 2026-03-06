const jwt = require("jsonwebtoken");
const User = require("../models/user");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set");
}

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    
    if (!token) {
      return res.status(401).json({ message: "Token not found" });
    }

    const decodedObj = jwt.verify(token, JWT_SECRET);
    const userId = decodedObj.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user to request for later use
    req.user = user;

    // Proceed to next middleware or route
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res
      .status(401)
      .json({ message: "Unauthorized" });
  }
};

module.exports = { userAuth };
