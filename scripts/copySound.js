"use strict";

var path = require("path");
var fs = require("fs");

var constants = {
  platforms: "platforms",
  android: {
    platform: "android",
    wwwFolder: "assets/www"
  },
  ios: {
    platform: "ios",
    wwwFolder: "www"
  },
  stringsXml: {
    path1: "platforms/android/app/src/main/res/values/strings.xml",
    path2: "platforms/android/res/values/strings.xml",
  }
};

function handleError(errorMessage, defer) {
  console.log(errorMessage);
  defer.reject();
}

function fileExists(path, fs) {
  try {
    return fs.statSync(path).isFile();
  } catch (e) {
    return false;
  }
}

function getResourcesFolderPath(context, platform, platformConfig) {
  var platformPath = path.join(context.opts.projectRoot, constants.platforms, platform);
  return path.join(platformPath, platformConfig.wwwFolder);
}

function getPlatformConfigs(platform) {
  if (platform === constants.android.platform) {
    return constants.android;
  } else if (platform === constants.ios.platform) {
    return constants.ios;
  }
}

module.exports = function (context) {
  var defer = context.requireCordovaModule("q").defer();

  var platform = context.opts.plugin.platform;
  var platformConfig = getPlatformConfigs(platform);
  if (!platformConfig) {
    handleError("Invalid platform", defer);
  }

  var wwwPath = getResourcesFolderPath(context, platform, platformConfig);
  var soundFile;
  var files = fs.readdirSync(wwwPath);
  for (var i = 0; i < files.length; i++) {
    if (files[i].endsWith('.mp3')) {
      soundFile = files[i];
    }
  }

  if (!soundFile) {
    console.log("No sound file found");
    return defer.promise;
  }

  return defer.promise;
}