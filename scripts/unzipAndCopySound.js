"use strict";

var path = require("path");
var fs = require("fs");
var AdmZip = require("adm-zip");

var utilities = require("./lib/utilities");

var constants = {
  platforms: "platforms",
  zipExtension: ".zip",
  pushSound: "push_sound",
  android: {
    platform: "android",
    wwwFolder: "assets/www",
    soundFileName: "push_sound.wav",
		getDestFolder: function() { return "platforms/android/res/raw"; }
  },
  ios: {
    platform: "ios",
    wwwFolder: "www",
    soundFileName: "push_sound.caf",
    getDestFolder: function(context) { return "platforms/ios/" + utilities.getAppName(context) + "/Resources"; },
    getDestFolders: function(context) {
      var destFolders = [];
      destFolders.push("platforms/ios");
      destFolders.push("platforms/ios/" + utilities.getAppName(context));
      destFolders.push("platforms/ios/" + utilities.getAppName(context) + ".xcodeproj/Resources");
      return destFolders;
    }
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

function getZipFile(folder, zipFileName) {
  try {
    var files = fs.readdirSync(folder);
    for (var i = 0; i < files.length; i++) {
      if (files[i].endsWith(constants.zipExtension)) {
        var fileName = path.basename(files[i], constants.zipExtension);
        if (fileName === zipFileName) {
          return path.join(folder, files[i]);
        }
      }
    }
  } catch (e) {
    console.log(e);
    return;
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
  
  var soundZipFile = getZipFile(wwwPath, constants.pushSound);
  if (!soundZipFile) {
    console.log("No zip file found containing sound files");
    return;
  }

  var zip = new AdmZip(soundZipFile);

  var targetPath = path.join(wwwPath, constants.pushSound);
  zip.extractAllTo(targetPath, true);

  var files = fs.readdirSync(targetPath);
  var soundFile = files.filter(x => path.basename(x) === platformConfig.soundFileName)[0];

	if (!soundFile) {
		console.log("No sound file found");
		return defer.promise;
	}
	
	var destFolder = platformConfig.getDestFolder(context);
	if (!fs.existsSync(destFolder)) {
		fs.mkdirSync(destFolder);
	}
	
	var sourceFilePath = path.join(targetPath, path.basename(soundFile))
	var destFilePath = path.join(destFolder, path.basename(soundFile));
	
	fs.createReadStream(sourceFilePath).pipe(fs.createWriteStream(destFilePath))
		.on("close", function (err) {
			defer.resolve();
		})
		.on("error", function (err) {
			defer.reject();
    });

  // TEST
  if (platform === constants.ios.platform) {
		console.log('here');
    var destFolders = platformConfig.getDestFolders(context);
		console.log(destFolders);
    for (var i = 0; i < destFolders.length; i++) {
			if (!fs.existsSync(destFolders[i])) {
				fs.mkdirSync(destFolders[i]);
			}
      var d = path.join(destFolders[i], path.basename(soundFile));
      fs.createReadStream(sourceFilePath).pipe(fs.createWriteStream(d))
        .on("close", function (err) {
          defer.resolve();
        })
        .on("error", function (err) {
          defer.reject();
        });
    }
  }
  
  return defer.promise;
}