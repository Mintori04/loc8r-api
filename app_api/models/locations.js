const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    author: {type: String, required: true},
    rating: {type: Number, required: true, min: 0, max: 5},
    reviewText: {type: String, required: true},
    createdOn: {type: Date, 'default': Date.now}
});

const openingTimeSchema = new mongoose.Schema({
    days: {type: String, required: true},
    opening: String,
    closing: String,
    closed: {type: Boolean, required: true}
});

const locationSchema = new mongoose.Schema({
    name: {type: String, required: true},
    address: String,
    rating: {type: Number, 'default': 0, min: 0, max: 5},
    facilities: [String],
    coords: {type: {type: String}, coordinates: [Number]},
    openingTimes: [openingTimeSchema],
    reviews: [reviewSchema]
});

locationSchema.index({coords: '2dsphere'});

const Location = mongoose.model('Location', locationSchema);

// API 함수들
const locationsListByDistance = async (lng, lat, maxDistance) => {
  const point = {
    type: "Point",
    coordinates: [lng, lat]
  };
  
  const geoOptions = {
    distanceField: "distance",
    spherical: true,
    maxDistance: maxDistance,
    num: 10
  };
  
  return await Location.aggregate([
    {
      $geoNear: {
        near: point,
        ...geoOptions
      }
    }
  ]);
};

const locationsCreate = async (reqBody) => {
  const location = new Location(reqBody);
  return await location.save();
};

const locationsReadOne = async (locationid) => {
  return await Location.findById(locationid);
};

const locationsUpdateOne = async (locationid, reqBody) => {
  return await Location.findByIdAndUpdate(locationid, reqBody, { new: true });
};

const locationsDeleteOne = async (locationid) => {
  return await Location.findByIdAndDelete(locationid);
};

const reviewsCreate = async (locationid, reqBody) => {
  const location = await Location.findById(locationid);
  if (!location) {
    throw new Error('Location not found');
  }
  
  location.reviews.push(reqBody);
  await location.save();
  return location.reviews[location.reviews.length - 1];
};

const reviewsReadOne = async (locationid, reviewid) => {
  const location = await Location.findById(locationid);
  if (!location) {
    return null;
  }
  
  return location.reviews.id(reviewid);
};

const reviewsUpdateOne = async (locationid, reviewid, reqBody) => {
  const location = await Location.findById(locationid);
  if (!location) {
    return null;
  }
  
  const review = location.reviews.id(reviewid);
  if (!review) {
    return null;
  }
  
  Object.assign(review, reqBody);
  await location.save();
  return review;
};

const reviewsDeleteOne = async (locationid, reviewid) => {
  const location = await Location.findById(locationid);
  if (!location) {
    return null;
  }
  
  const review = location.reviews.id(reviewid);
  if (!review) {
    return null;
  }
  
  review.remove();
  await location.save();
  return review;
};

module.exports = {
  locationsListByDistance,
  locationsCreate,
  locationsReadOne,
  locationsUpdateOne,
  locationsDeleteOne,
  reviewsCreate,
  reviewsReadOne,
  reviewsUpdateOne,
  reviewsDeleteOne
};