"use strict";

var path = require("path");
var fs = require("fs");
var AdmZip = require("adm-zip");

var constants = {
  platforms: "platforms",
  android: {
    platform: "android",
    wwwFolder: "assets/www",
    fileExtension: ".json"
  },
  ios: {
    platform: "ios",
    wwwFolder: "www",
    fileExtension: ".plist"
  },
  googleServices: "google-services",
  zipExtension: ".zip",
  folderNamePrefix: "firebase.",
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

function getAppId(context) {
  var config_xml = path.join(context.opts.projectRoot, 'config.xml');
  var et = context.requireCordovaModule('elementtree');
  var data = fs.readFileSync(config_xml).toString();
  var etree = et.parse(data);
  return etree.getroot().attrib.id;
}

// Android only
function updateStringsXml(contents, appId) {
  var json = JSON.parse(contents);
  var stringsXmlPath = fileExists(constants.stringsXml.path1) ? constants.stringsXml.path1 : constants.stringsXml.path2;
  var strings = fs.readFileSync(stringsXmlPath).toString();
  var search = "</resources>";

  strings = strings.substr(0, strings.indexOf(search));

  var client = json.client.filter(x => x.client_info.android_client_info.package_name === appId)[0];

  if (client) {
    strings += '<string name="google_app_id">' + client.client_info.mobilesdk_app_id + '</string>';
    strings += '<string name="google_api_key">' + client.api_key[0].current_key + '</string>';
    strings += search;
    fs.writeFileSync(stringsXmlPath, strings);
  }
}

module.exports = function (context) {
  var defer = context.requireCordovaModule("q").defer();
	
  var appId = getAppId(context);

  var platform = context.opts.plugin.platform;
  var platformConfig = getPlatformConfigs(platform);
  if (!platformConfig) {
    handleError("Invalid platform", defer);
  }

  var wwwPath = getResourcesFolderPath(context, platform, platformConfig);
  var sourceFolderPath = path.join(wwwPath, constants.folderNamePrefix + appId);

  var googleServicesZipFile = getZipFile(sourceFolderPath, constants.googleServices);
  if (!googleServicesZipFile) {
    handleError("No zip file found containing google services configuration file", defer);
  }

  var zip = new AdmZip(googleServicesZipFile);

  var targetPath = path.join(wwwPath, constants.googleServices);
  zip.extractAllTo(targetPath, true);

  var files = fs.readdirSync(targetPath);
  if (!files) {
    handleError("No directory found");
  }

  var fileName = files.find(function (name) {
    return name.endsWith(platformConfig.fileExtension);
  });
  if (!fileName) {
    handleError("No file found");
  }

  var sourceFilePath = path.join(targetPath, fileName);
  var destFilePath = path.join(context.opts.plugin.dir, fileName);

  fs.createReadStream(sourceFilePath).pipe(fs.createWriteStream(destFilePath))
    .on("close", function (err) {
      defer.resolve();
    })
    .on("error", function () {
      defer.reject();
    });
		
	/*
  if (platform === constants.android.platform) {
    var contents = fs.readFileSync(sourceFilePath).toString();
    updateStringsXml(contents, appId);
  }
	*/
	
  return defer.promise;
}