module.exports.controlRequest = (userReq, controller) => {
  const keys = Object.keys(userReq);
  if (keys.filter((key) => !controller.includes(key)).length > 0) return false;
  return true;
};
