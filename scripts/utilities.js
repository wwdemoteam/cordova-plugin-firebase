module.exports = {
  getAppName: function (context) {
    var ConfigParser = context.requireCordovaModule("cordova-lib").configparser;
    var config = new ConfigParser("config.xml");
    console.log(config);
    return config.name();
  }
};