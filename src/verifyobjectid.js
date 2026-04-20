const { Types } = require('mongoose');

/*
  Returns true if the value is a valid MongoDB ObjectId string / ObjectId instance.
  @param {*} value
  @returns {boolean}
 */
const isValidObjectId = (value) => Types.ObjectId.isValid(value);

/*
 Casts a value to a mongoose ObjectId.
 Throws if the value is not a valid ObjectId.
  @param {*} value
 @returns {Types.ObjectId}
 */
const toObjectId = (value) => {
  if (!isValidObjectId(value)) {
    throw new Error(`Invalid ObjectId: "${value}"`);
  }
  return new Types.ObjectId(value);
};

/*
  Express middleware — validates req.params.id as a MongoDB ObjectId.
  Attaches the cast ObjectId to req.objectId and calls next().
  Responds 400 if the id is invalid.
 */
const verifyObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid id: "${id}" is not a valid ObjectId`,
    });
  }
  req.objectId = new Types.ObjectId(id);
  next();
};

module.exports = { isValidObjectId, toObjectId, verifyObjectId };
