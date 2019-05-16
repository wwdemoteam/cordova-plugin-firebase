var utils = require('./utilities');

module.exports = function (context) {
  var newCordova = utils.isNewCordova(context);
  var child_process;
  var deferral;
  
  if (newCordova) {
    child_process = require('child_process');
    deferral = require('q').defer();
  } else {
    child_process = context.requireCordovaModule('child_process');
    deferral = context.requireCordovaModule('q').defer();
  }

  var output = child_process.exec('npm install', {cwd: __dirname}, function (error) {
    if (error !== null) {
      console.log('exec error: ' + error);
      deferral.reject('npm installation failed');
    }
    else {
      deferral.resolve();
    }
  });

  return deferral.promise;
};
