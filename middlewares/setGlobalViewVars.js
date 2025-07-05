// middlewares/setGlobalViewVars.js

const setGlobalViewVars = (req, res, next) => {
  res.locals.loggedIn = !!req.session.user;
  res.locals.user = req.session.user || null;

  console.log("--- setGlobalViewVars Middleware ---");
  console.log("Timestamp:", new Date().toISOString());
  console.log("req.session.user:", req.session.user);
  console.log("res.locals.loggedIn (after processing):", res.locals.loggedIn);
  // *** CHANGE THIS LINE TO LOG THE WHOLE OBJECT ***
  console.log("res.locals.user (after processing):", res.locals.user);
  console.log("------------------------------------");
  next();
};

module.exports = setGlobalViewVars;