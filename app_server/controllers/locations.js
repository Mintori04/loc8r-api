var request = require('request');

const apiOptions = {
  server: 'http://localhost:3000'
};
if(process.env.NODE_ENV === 'production'){
  apiOptions.server = 'https://loc8r-api.herokuapp.com';
}

const requestOptions = {
  url: `${apiOptions.server}`,
  method: 'GET',
  json: {},
  qs: {
    offset: 20
  }
};
request(requestOptions, (err, response, body) => {
  if (err){
    console.log(err);
  } if (response.statusCode === 200){
    console.log(body);
  } else {
    console.log(response.statusCode);
  }
});

const homelist = (req, res) => {
  const path = '/api/locations';
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'GET',
    json: {},
    qs: {
      lng: 127.265204,
      lat: 37.011349,
      maxDistance: 200000
    }
  };
  request(
    requestOptions,
    (err, response, body) => {
      let data = [];
      if (response.statusCode === 200 && body.length > 0){
      data = body.map( (item) => {
        item.distance = formatDistance(item.distance);
        return item;
      });
      }
      renderHomepage(req, res, data);
    }
  );
};

const formatDistance = (distance) => {
  let thisDistance = 0;
  let unit = 'm';
  if (distance > 1000){
    thisDistance = (distance / 1000).toFixed(1);
    unit = 'km';
  } else {
    thisDistance = Math.floor(distance);
  }
  return thisDistance + unit;
};

const renderHomepage = (req, res, responseBody) => {
  let message = null;
  if (!(responseBody instanceof Array)) {
    message = 'API lookup error';
    responseBody = [];
  } else {
    if (!responseBody.length) {
      message = 'No places found nearby';
    }
  }
  res.render('locations-list', {
    title: 'Loc8r - find a place to work with wifi',
    pageHeader: {
      title: 'Loc8r',
      strapLine: 'Find places to work with wifi near you!'
    },
    sidebar: "Looking for wifi and a seat? Loc8r helps you find places to work when out and about. Perhaps with coffee, cake or a pint? Let Loc8r help you find the place you're looking for.",
    locations: responseBody,
    message
  });
};

const renderDetailPage = (req, res, location) => {
  res.render('location-info', {
    title: location.name,
    pageHeader: { title: location.name },
    sidebar: {
      context: 'is on Loc8r because it has accessible wifi and\ space to sit down with your laptop and get some work done.',
      callToAction: 'If you\'ve been and you like it - or if you\ don\'t - please leave a review to help other people just like you.',
    },
    location
  });
};


const getLocationInfo = (req, res, callback) => {
  const path = `/api/locations/${req.params.locationid}`;
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'GET',
    json: {},
  };
  request(
    requestOptions,
    (err, {statusCode}, body) => {
      let data = body;
      if (statusCode === 200){
        data.coords = {
          lng: data.coords[0],
          lat: data.coords[1],
        };
        callback(req, res, data);
      } else {
        showError(req, res, statusCode);
      }
    }
  );
};

const locationInfo = (req, res) => {
  getLocationInfo(req, res, 
    (req, res, responseData) => {
      renderDetailPage(req, res, responseData);
    }
  );
};

const showError = (req, res, status) => {
  let title = '';
  let content = '';
  if(status === 404){
      title = '404, page note found';
      content = 'Oh dear. Looks like you can\'t find this page. Sorry.'; 
  } else{
      title = `${status}, something's gone wrong`;
      contetn = 'Something, somewhere, hase gone just a little bit wrong.';
  }
  res.status(status);
  res.render('generic-text',{
      title,
      content
  });
};

const renderReviewForm = (req, res, {name}) => {
  res.render('location-review-form', {
    title: `Review ${name} on Loc8r`,
    pageHeader: { title: `Review ${name}` },
    error: req.query.err
  });
};

const addReview = (req, res) => {
  getLocationInfo(req, res, 
    (req, res, responseData) => {
      renderReviewForm(req, res, responseData);
    }
  );
};

const doAddReview = (req, res) => {
  const locationid = req.params.locationid;
  const path = `/api/locations/${locationid}/reviews`;
  const postdata = {
    author: req.body.name,
    rating: parseInt(req.body.rating, 10),
    reviewText: req.body.review,
  };
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'POST',
    json: postdata,
  };
  if (!postdata.author || !postdata.rating || !postdata.reviewText) {
    res.redirect(`/location/${locationid}/review/new?err=val`);
  } else {
  request(requestOptions,
    (err, {statusCode}, {name}) => {
      if (statusCode === 201){
        res.redirect(`/location/${locationid}`);
      } else if (statusCode === 400 && name && name === 'ValidationError') {
        res.redirect(`/location/${locationid}/review/new?err=val`);
      } else {
          showError(req, res, statusCode);
        }
      }
    );
  }
};

const about = function(req, res){
  res.render('generic-text', {
  title: 'About Loc8r',
    content: 'Loc8r was created to help people find places to sit down \
    and get a bit of work done.<br/><br/>Lorem ipsum dolor sit \
    amet, consectetur adipiscing elit. Nunc sed lorem ac nisi digni \
    ssim accumsan. Nullam sit amet interdum magna. Morbi quis \
    faucibus nisi. Vestibulum mollis purus quis eros adipiscing \
    tristique. Proin posuere semper tellus, id placerat augue dapibus \
    ornare. Aenean leo metus, tempus in nisl eget, accumsan interdum \
    dui. Pellentesque sollicitudin volutpat ullamcorper.'
  });
};

module.exports = {
  homelist,
  locationInfo,
  addReview,
  doAddReview,
  about
};