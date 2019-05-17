"use strict";

var path = require("path");
var AdmZip = require("adm-zip");

var utils = require("./utilities");

var constants = {
  googleServices: "google-services",
  folderNamePrefix: "firebase."
};

module.exports = function(context) {
  var newCordova = utils.isNewCordova(context);
  var defer;
  if (newCordova) {
    defer = require('q').defer();
  } else {
    defer = context.requireCordovaModule("q").defer();
  }
  
  var appId = utils.getAppId(context);

  var platform = context.opts.plugin.platform;
  var platformConfig = utils.getPlatformConfigs(platform);
  if (!platformConfig) {
    utils.handleError("Invalid platform", defer);
  }

  var wwwPath = utils.getResourcesFolderPath(context, platform, platformConfig);
  var sourceFolderPath;

  if (newCordova) {
    sourceFolderPath = path.join(context.opts.projectRoot, "www", constants.folderNamePrefix + appId);
  } else {
    sourceFolderPath = path.join(wwwPath, constants.folderNamePrefix + appId);
  }
  
  console.log(sourceFolderPath);

  var googleServicesZipFile = utils.getZipFile(sourceFolderPath, constants.googleServices);
  if (!googleServicesZipFile) {
    utils.handleError("No zip file found containing google services configuration file", defer);
  }

  var zip = new AdmZip(googleServicesZipFile);

  var targetPath = path.join(wwwPath, constants.googleServices);
  zip.extractAllTo(targetPath, true);

  var files = utils.getFilesFromPath(targetPath);
  if (!files) {
    utils.handleError("No directory found");
  }

  var fileName = files.find(function (name) {
    return name.endsWith(platformConfig.firebaseFileExtension);
  });
  if (!fileName) {
    utils.handleError("No file found");
  }

  var sourceFilePath = path.join(targetPath, fileName);
  var destFilePath = path.join(context.opts.plugin.dir, fileName);

  utils.copyFromSourceToDestPath(defer, sourceFilePath, destFilePath);

  if (newCordova) {
    var destFilePath = path.join(context.opts.projectRoot, "platforms", platform, "app", fileName);
    utils.copyFromSourceToDestPath(defer, sourceFilePath, destFilePath);
  }
      
  return defer.promise;
}
