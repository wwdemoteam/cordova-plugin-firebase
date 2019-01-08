"use strict";

var path = require("path");
var fs = require("fs");

var utilities = require("./lib/utilities");

var constants = {
  platforms: "platforms",
	soundFileName: "push_sound.mp3",
  android: {
    platform: "android",
    wwwFolder: "assets/www",
		getDestFolder: function() { return "platforms/android/res/raw"; }
  },
  ios: {
    platform: "ios",
    wwwFolder: "www",
		getDestFolder: function(context) { return "platforms/ios/" + utilities.getAppName(context) + "/Resources"; }
  }
};

function handleError(errorMessage, defer) {
  console.log(errorMessage);
  defer.reject();
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
	
	var files = fs.readdirSync(wwwPath);
	var soundFile = files.filter(x => path.basename(x) === constants.soundFileName)[0];
	if (!soundFile) {
		console.log("No sound file found");
		return defer.promise;
	}
	
	var destFolder = platformConfig.getDestFolder(context);
	if (!fs.existsSync(destFolder)) {
		fs.mkdirSync(destFolder);
	}
	
	var sourceFilePath = path.join(wwwPath, path.basename(soundFile))
	var destFilePath = path.join(destFolder, path.basename(soundFile));
	
	fs.createReadStream(sourceFilePath).pipe(fs.createWriteStream(destFilePath))
		.on("close", function (err) {
			defer.resolve();
		})
		.on("error", function (err) {
			defer.reject();
		});

  return defer.promise;
}