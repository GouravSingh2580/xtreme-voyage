var d,
  m,
  y,
  t,
  slot = "00",
  forecast = "000",
  current_d,
  current_m,
  current_slot = "00",
  current_y,
  current_t;

var currentdate = new Date();
console.log("[Local Date]", currentdate);
var utc = currentdate.getTime() + currentdate.getTimezoneOffset() * 60000;
var datetime = new Date(utc + 3600000 * "-4.0");
console.log("[Sync date]", datetime);

current_d = datetime.getDate().toString();
current_m = (datetime.getMonth() + 1).toString();
current_y = datetime.getFullYear().toString();
current_t = datetime.getHours().toString();

current_slot = "00";
if (current_t >= 0 && current_t <= 5) {
  current_slot = "00";
} else if (current_t >= 6 && current_t <= 11) {
  current_slot = "06";
} else if (current_t >= 12 && current_t <= 17) {
  current_slot = "12";
} else {
  current_slot = "18";
}

if (sessionStorage.getItem("m") === null) {
  d = current_d;
  m = current_m;
  t = current_t;
  slot = current_slot;
} else {
  d = sessionStorage.getItem("d");
  m = sessionStorage.getItem("m");
  slot = sessionStorage.getItem("slot");
}

console.log("[Latest date]", m + " " + d + " " + slot);
console.log("[Current date]", current_m + " " + current_d + " " + current_slot + " " + current_t);

// product.js start

/**
 * products - defines the behavior of weather data grids, including grid construction, interpolation, and color scales.
 *
 * Copyright (c) 2014 Cameron Beccario
 * The MIT License - http://opensource.org/licenses/MIT
 *
 * https://github.com/cambecc/earth
 */
var products = (function () {
  "use strict";

  // var WEATHER_PATH = "./data/weather";
  var WEATHER_PATH = "../../../Backend/Media";
  var OSCAR_PATH = "./data/oscar";
  var height;
  var period;
  var index = 0;
  var catalogs = {
    // The OSCAR catalog is an array of file names, sorted and prefixed with yyyyMMdd. Last item is the
    // most recent. For example: [ 20140101-abc.json, 20140106-abc.json, 20140112-abc.json, ... ]
    oscar: µ.loadJson([OSCAR_PATH, "catalog.json"].join("/")),
  };

  function buildProduct(overrides) {
    return _.extend(
      {
        description: "",
        paths: [],
        date: null,
        navigate: function (step) {
          return gfsStep(this.date, step);
        },
        load: function (cancel) {
          var me = this;
          return when.map(this.paths, µ.loadJson).then(function (files) {
            return cancel.requested
              ? null
              : _.extend(me, buildGrid(me.builder.apply(me, files)));
          });
        },
      },
      overrides
    );
  }

  /**
   * @param attr
   * @param {String} type
   * @param {String?} surface
   * @param {String?} level
   * @returns {String}
   */

  function gfsDate(attr) {
    if (attr.date === "current") {
      // Construct the date from the current time, rounding down to the nearest three-hour block.
      var now = new Date(Date.now()),
        hour = Math.floor(now.getUTCHours() / 6);
      return new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          hour
        )
      );
    }
    var parts = attr.date.split("/");
    return new Date(
      Date.UTC(+parts[0], parts[1] - 1, +parts[2], +attr.hour.substr(0, 2))
    );
  }

  /**
   * Returns a date for the chronologically next or previous GFS data layer. How far forward or backward in time
   * to jump is determined by the step. Steps of ±1 move in 3-hour jumps, and steps of ±10 move in 24-hour jumps.
   */
  function gfsStep(date, step) {
    var offset = (step > 1 ? 8 : step < -1 ? -8 : step) * 6,
      adjusted = new Date(date);
    adjusted.setHours(adjusted.getHours() + offset);
    return adjusted;
  }

  function netcdfHeader(time, lat, lon, center) {
    return {
      lo1: lon.sequence.start,
      la1: lat.sequence.start,
      dx: lon.sequence.delta,
      dy: -lat.sequence.delta,
      nx: lon.sequence.size,
      ny: lat.sequence.size,
      refTime: time.data[0],
      forecastTime: 0,
      centerName: center,
    };
  }

  function describeSurface(attr) {
    return attr.surface === "surface" ? "Surface" : µ.capitalize(attr.level);
  }

  function describeSurfaceJa(attr) {
    return attr.surface === "surface" ? "地上" : µ.capitalize(attr.level);
  }

  /**
   * Returns a function f(langCode) that, given table:
   *     {foo: {en: "A", ja: "あ"}, bar: {en: "I", ja: "い"}}
   * will return the following when called with "en":
   *     {foo: "A", bar: "I"}
   * or when called with "ja":
   *     {foo: "あ", bar: "い"}
   */
  function localize(table) {
    return function (langCode) {
      var result = {};
      _.each(table, function (value, key) {
        result[key] = value[langCode] || value.en || value;
      });
      return result;
    };
  }

  function gfs1p0degPath(type, year, month, day, slot) {
    console.log("gfs called");

    if(type === "currents"){
      console.log("[Currents]");
      return `./current/current.json`;
    }

    let Slot_map = { "00": 1, "06": 2, 12: 3, 18: 4 };
    let days_diff = day - current_d;

    let hours_to_be_added =
      days_diff * 24 + (Slot_map[slot] - Slot_map[current_slot]) * 6;

    if (parseInt(hours_to_be_added) < 100) {
      hours_to_be_added = "0" + hours_to_be_added;
    }

    if (parseInt(hours_to_be_added) < 10) {
      hours_to_be_added = "0" + hours_to_be_added;
    }

    var data_day, data_slot;

    if (
      days_diff < 0 ||
      (days_diff === 0 && Slot_map[slot] - Slot_map[current_slot] < 0)
    ) {
      hours_to_be_added = "000";
      data_day = day;
      data_slot = slot;
    } else {
      data_slot = current_slot;
      data_day = current_d;
    }

    console.log(
      "./" +
        type +
        "_" +
        month +
        "_" +
        data_day +
        "_" +
        data_slot +
        "_" +
        hours_to_be_added +
        "_" +
        type +
        ".json"
    );

    return `./${type}/${month}_${data_day}_${data_slot}_${hours_to_be_added}_${type}.json`;
  }

  var FACTORIES = {
    wind: {
      matches: _.matches({
        param: "wind",
        surface: "surface",
        level: "level",
        overlayType: "off",
      }),
      create: function (attr) {
        console.log(attr);
        return buildProduct({
          field: "vector",
          type: "wind",
          description: localize({
            name: { en: "Wind", ja: "風速" },
            qualifier: {
              en: " @ " + describeSurface(attr),
              ja: " @ " + describeSurfaceJa(attr),
            },
          }),

          // paths: ["./data/weather/current/dummy.json"],
          // paths: ["./data/weather/current/3_14_12_000_wind.json"],
          // paths: [gfs1p0degPath("wind", y, m, d, slot)],

          paths: [gfs1p0degPath("wind", y, m, d, slot)],

          // paths: ["F:/Globe/Backend/Media/wind/3_16_12_000_wind.json"],
          // paths: ["./Media/wind/3_14_12_073_wind.json"],
          // paths: ["./3_14_12_000_wind.json"],

          date: gfsDate(attr),
          builder: function (file) {
            var uData = file[2].data,
              vData = file[3].data;
            return {
              header: file[0].header,
              interpolate: bilinearInterpolateVector,
              data: function (i) {
                return [uData[i], vData[i]];
              },
            };
          },
          units: [
            {
              label: "km/h",
              conversion: function (x) {
                return x * 3.6;
              },
              precision: 0,
            },
            {
              label: "m/s",
              conversion: function (x) {
                return x;
              },
              precision: 1,
            },
            {
              label: "kn",
              conversion: function (x) {
                return x * 1.943844;
              },
              precision: 0,
            },
            {
              label: "mph",
              conversion: function (x) {
                return x * 2.236936;
              },
              precision: 0,
            },
          ],
          scale: {
            bounds: [0, 100],
            gradient: function (v, a) {
              return µ.extendedSinebowColor(Math.min(v, 100) / 100, a);
            },
          },
          particles: { velocityScale: 1 / 60000, maxIntensity: 17 },
        });
      },
    },

    waves: {
      matches: _.matches({
        param: "ocean",
        surface: "surface",
        level: "waves",
      }),
      create: function (attr) {
        return when(catalogs.oscar).then(function (catalog) {
          return buildProduct({
            field: "vector",
            type: "currents",
            description: localize({
              name: { en: "Peak Wave Period", ja: "海流" },
              qualifier: { en: " ", ja: " @ 地上" },
            }),
            // paths: ["./data/weather/wave/wavedummy.json"],
            paths: [gfs1p0degPath("wave", y, m, d, slot)],
            date: oscarDate(catalog, attr),
            navigate: function (step) {
              return oscarStep(catalog, this.date, step);
            },
            builder: function (file) {
              var uData = file[0].data,
                vData = file[1].data;
              height = file[2].data;
              period = file[3].data;
              var maxi = 0;
              for (var i = 0; i < period.length; i++) {
                if (!isNaN(period[i])) {
                  maxi = Math.max(period[i], maxi);
                }
              }

              return {
                header: file[0].header,
                interpolate: bilinearInterpolateVector,
                data: function (i) {
                  var u = uData[i],
                    v = vData[i];
                  return µ.isValue(u) && µ.isValue(v)
                    ? [u, v, height[i], period[i]]
                    : null;
                },
              };
            },
            units: [
              {
                label: "m/s",
                conversion: function (x) {
                  return x;
                },
                precision: 2,
              },
              {
                label: "km/h",
                conversion: function (x) {
                  return x * 3.6;
                },
                precision: 1,
              },
              {
                label: "kn",
                conversion: function (x) {
                  return x * 1.943844;
                },
                precision: 1,
              },
              {
                label: "mph",
                conversion: function (x) {
                  return x * 2.236936;
                },
                precision: 1,
              },
            ],
            scale: {
              bounds: [0, 20],
              gradient: µ.segmentedColorScale([
                [0, [10, 25, 68]],
                [1, [10, 25, 206]],
                [3, [17, 146, 166]],
                [5, [62, 251, 94]],
                [7, [237, 234, 101]],
                [12, [255, 219, 15]],
                [14, [255, 79, 15]],
                [20, [255, 20, 15]],
              ]),
            },
            particles: { velocityScale: 1 / 440000, maxIntensity: 0.7 },
          });
        });
      },
    },
    /* 
            "temp": {
                matches: _.matches({param: "wind", overlayType: "temp"}),
                create: function(attr) {
                    return buildProduct({
                        field: "scalar",
                        type: "temp",
                        description: localize({
                            name: {en: "Temp", ja: "気温"},
                            qualifier: {en: " @ " + describeSurface(attr), ja: " @ " + describeSurfaceJa(attr)}
                        }),
                        paths: [gfs1p0degPath(attr, "temp", attr.surface, attr.level)],
                        date: gfsDate(attr),
                        builder: function(file) {
                            var record = file[0], data = record.data;
                            return {
                                header: record.header,
                                interpolate: bilinearInterpolateScalar,
                                data: function(i) {
                                    return data[i];
                                }
                            }
                        },
                        units: [
                            {label: "°C", conversion: function(x) { return x - 273.15; },       precision: 1},
                            {label: "°F", conversion: function(x) { return x * 9/5 - 459.67; }, precision: 1},
                            {label: "K",  conversion: function(x) { return x; },                precision: 1}
                        ],
                        scale: {
                            bounds: [193, 328],
                            gradient: µ.segmentedColorScale([
                                [193,     [37, 4, 42]],
                                [206,     [41, 10, 130]],
                                [219,     [81, 40, 40]],
                                [233.15,  [192, 37, 149]],  // -40 C/F
                                [255.372, [70, 215, 215]],  // 0 F
                                [273.15,  [21, 84, 187]],   // 0 C
                                [275.15,  [24, 132, 14]],   // just above 0 C
                                [291,     [247, 251, 59]],
                                [298,     [235, 167, 21]],
                                [311,     [230, 71, 39]],
                                [328,     [88, 27, 67]]
                            ])
                        }
                    });
                }
            },
    
            "relative_humidity": {
                matches: _.matches({param: "wind", overlayType: "relative_humidity"}),
                create: function(attr) {
                    return buildProduct({
                        field: "scalar",
                        type: "relative_humidity",
                        description: localize({
                            name: {en: "Relative Humidity", ja: "相対湿度"},
                            qualifier: {en: " @ " + describeSurface(attr), ja: " @ " + describeSurfaceJa(attr)}
                        }),
                        paths: [gfs1p0degPath(attr, "relative_humidity", attr.surface, attr.level)],
                        date: gfsDate(attr),
                        builder: function(file) {
                            var vars = file.variables;
                            var rh = vars.Relative_humidity_isobaric || vars.Relative_humidity_height_above_ground;
                            var data = rh.data;
                            return {
                                header: netcdfHeader(vars.time, vars.lat, vars.lon, file.Originating_or_generating_Center),
                                interpolate: bilinearInterpolateScalar,
                                data: function(i) {
                                    return data[i];
                                }
                            };
                        },
                        units: [
                            {label: "%", conversion: function(x) { return x; }, precision: 0}
                        ],
                        scale: {
                            bounds: [0, 100],
                            gradient: function(v, a) {
                                return µ.sinebowColor(Math.min(v, 100) / 100, a);
                            }
                        }
                    });
                }
            },
    
            "air_density": {
                matches: _.matches({param: "wind", overlayType: "air_density"}),
                create: function(attr) {
                    return buildProduct({
                        field: "scalar",
                        type: "air_density",
                        description: localize({
                            name: {en: "Air Density", ja: "空気密度"},
                            qualifier: {en: " @ " + describeSurface(attr), ja: " @ " + describeSurfaceJa(attr)}
                        }),
                        paths: [gfs1p0degPath(attr, "air_density", attr.surface, attr.level)],
                        date: gfsDate(attr),
                        builder: function(file) {
                            var vars = file.variables;
                            var air_density = vars.air_density, data = air_density.data;
                            return {
                                header: netcdfHeader(vars.time, vars.lat, vars.lon, file.Originating_or_generating_Center),
                                interpolate: bilinearInterpolateScalar,
                                data: function(i) {
                                    return data[i];
                                }
                            };
                        },
                        units: [
                            {label: "kg/m³", conversion: function(x) { return x; }, precision: 2}
                        ],
                        scale: {
                            bounds: [0, 1.5],
                            gradient: function(v, a) {
                                return µ.sinebowColor(Math.min(v, 1.5) / 1.5, a);
                            }
                        }
                    });
                }
            },
    
            "wind_power_density": {
                matches: _.matches({param: "wind", overlayType: "wind_power_density"}),
                create: function(attr) {
                    var windProduct = FACTORIES.wind.create(attr);
                    var airdensProduct = FACTORIES.air_density.create(attr);
                    return buildProduct({
                        field: "scalar",
                        type: "wind_power_density",
                        description: localize({
                            name: {en: "Wind Power Density", ja: "風力エネルギー密度"},
                            qualifier: {en: " @ " + describeSurface(attr), ja: " @ " + describeSurfaceJa(attr)}
                        }),
                        paths: [windProduct.paths[0], airdensProduct.paths[0]],
                        date: gfsDate(attr),
                        builder: function(windFile, airdensFile) {
                            var windBuilder = windProduct.builder(windFile);
                            var airdensBuilder = airdensProduct.builder(airdensFile);
                            var windData = windBuilder.data, windInterpolate = windBuilder.interpolate;
                            var airdensData = airdensBuilder.data, airdensInterpolate = airdensBuilder.interpolate;
                            return {
                                header: _.clone(airdensBuilder.header),
                                interpolate: function(x, y, g00, g10, g01, g11) {
                                    var m = windInterpolate(x, y, g00[0], g10[0], g01[0], g11[0])[2];
                                    var ρ = airdensInterpolate(x, y, g00[1], g10[1], g01[1], g11[1]);
                                    return 0.5 * ρ * m * m * m;
                                },
                                data: function(i) {
                                    return [windData(i), airdensData(i)];
                                }
                            };
                        },
                        units: [
                            {label: "kW/m²", conversion: function(x) { return x / 1000; }, precision: 1},
                            {label: "W/m²", conversion: function(x) { return x; }, precision: 0}
                        ],
                        scale: {
                            bounds: [0, 80000],
                            gradient: µ.segmentedColorScale([
                                [0, [15, 4, 96]],
                                [250, [30, 8, 180]],
                                [1000, [121, 102, 2]],
                                [2000, [118, 161, 66]],
                                [4000, [50, 102, 219]],
                                [8000, [19, 131, 193]],
                                [16000, [59, 204, 227]],
                                [64000, [241, 1, 45]],
                                [80000, [243, 0, 241]]
                            ])
                        }
                    });
                }
            },
    
            "total_cloud_water": {
                matches: _.matches({param: "wind", overlayType: "total_cloud_water"}),
                create: function(attr) {
                    return buildProduct({
                        field: "scalar",
                        type: "total_cloud_water",
                        description: localize({
                            name: {en: "Total Cloud Water", ja: "雲水量"},
                            qualifier: ""
                        }),
                        paths: [gfs1p0degPath(attr, "total_cloud_water")],
                        date: gfsDate(attr),
                        builder: function(file) {
                            var record = file[0], data = record.data;
                            return {
                                header: record.header,
                                interpolate: bilinearInterpolateScalar,
                                data: function(i) {
                                    return data[i];
                                }
                            }
                        },
                        units: [
                            {label: "kg/m²", conversion: function(x) { return x; }, precision: 3}
                        ],
                        scale: {
                            bounds: [0, 1],
                            gradient: µ.segmentedColorScale([
                                [0.0, [5, 5, 89]],
                                [0.2, [170, 170, 230]],
                                [1.0, [255, 255, 255]]
                            ])
                        }
                    });
                }
            },
    
            "total_precipitable_water": {
                matches: _.matches({param: "wind", overlayType: "total_precipitable_water"}),
                create: function(attr) {
                    return buildProduct({
                        field: "scalar",
                        type: "total_precipitable_water",
                        description: localize({
                            name: {en: "Total Precipitable Water", ja: "可降水量"},
                            qualifier: ""
                        }),
                        paths: [gfs1p0degPath(attr, "total_precipitable_water")],
                        date: gfsDate(attr),
                        builder: function(file) {
                            var record = file[0], data = record.data;
                            return {
                                header: record.header,
                                interpolate: bilinearInterpolateScalar,
                                data: function(i) {
                                    return data[i];
                                }
                            }
                        },
                        units: [
                            {label: "kg/m²", conversion: function(x) { return x; }, precision: 3}
                        ],
                        scale: {
                            bounds: [0, 70],
                            gradient:
                                µ.segmentedColorScale([
                                    [0, [230, 165, 30]],
                                    [10, [120, 100, 95]],
                                    [20, [40, 44, 92]],
                                    [30, [21, 13, 193]],
                                    [40, [75, 63, 235]],
                                    [60, [25, 255, 255]],
                                    [70, [150, 255, 255]]
                                ])
                        }
                    });
                }
            },
    
            "mean_sea_level_pressure": {
                matches: _.matches({param: "wind", overlayType: "mean_sea_level_pressure"}),
                create: function(attr) {
                    return buildProduct({
                        field: "scalar",
                        type: "mean_sea_level_pressure",
                        description: localize({
                            name: {en: "Mean Sea Level Pressure", ja: "海面更正気圧"},
                            qualifier: ""
                        }),
                        paths: [gfs1p0degPath(attr, "mean_sea_level_pressure")],
                        date: gfsDate(attr),
                        builder: function(file) {
                            var record = file[0], data = record.data;
                            return {
                                header: record.header,
                                interpolate: bilinearInterpolateScalar,
                                data: function(i) {
                                    return data[i];
                                }
                            }
                        },
                        units: [
                            {label: "hPa", conversion: function(x) { return x / 100; }, precision: 0},
                            {label: "mmHg", conversion: function(x) { return x / 133.322387415; }, precision: 0},
                            {label: "inHg", conversion: function(x) { return x / 3386.389; }, precision: 1}
                        ],
                        scale: {
                            bounds: [92000, 105000],
                            gradient: µ.segmentedColorScale([
                                [92000, [40, 0, 0]],
                                [95000, [187, 60, 31]],
                                [96500, [137, 32, 30]],
                                [98000, [16, 1, 43]],
                                [100500, [36, 1, 93]],
                                [101300, [241, 254, 18]],
                                [103000, [228, 246, 223]],
                                [105000, [255, 255, 255]]
                            ])
                        }
                    });
                }
            },
     */
    currents: {
      matches: _.matches({
        param: "ocean",
        surface: "surface",
        level: "currents",
      }),
      create: function (attr) {
        return when(catalogs.oscar).then(function (catalog) {
          return buildProduct({
            field: "vector",
            type: "currents",
            description: localize({
              name: { en: "Ocean Currents", ja: "海流" },
              qualifier: { en: " @ Surface", ja: " @ 地上" },
            }),
            paths: ["./current/current.json"],
            // paths: [gfs1p0degPath("currents", y, m, d, slot)],
            date: oscarDate(catalog, attr),
            navigate: function (step) {
              return oscarStep(catalog, this.date, step);
            },
            builder: function (file) {
              var uData = file[0].data,
                vData = file[1].data;
              return {
                header: file[0].header,
                interpolate: bilinearInterpolateVector,
                data: function (i) {
                  var u = uData[i],
                    v = vData[i];
                  return µ.isValue(u) && µ.isValue(v) ? [u, v] : null;
                },
              };
            },
            units: [
              {
                label: "m/s",
                conversion: function (x) {
                  return x;
                },
                precision: 2,
              },
              {
                label: "km/h",
                conversion: function (x) {
                  return x * 3.6;
                },
                precision: 1,
              },
              {
                label: "kn",
                conversion: function (x) {
                  return x * 1.943844;
                },
                precision: 1,
              },
              {
                label: "mph",
                conversion: function (x) {
                  return x * 2.236936;
                },
                precision: 1,
              },
            ],
            scale: {
              bounds: [0, 1.5],
              gradient: µ.segmentedColorScale([
                [0, [10, 25, 68]],
                [0.15, [10, 25, 250]],
                [0.4, [24, 255, 93]],
                [0.65, [255, 233, 102]],
                [1.0, [255, 233, 15]],
                [1.5, [255, 15, 15]],
              ]),
            },
            particles: { velocityScale: 1 / 4400, maxIntensity: 0.7 },
          });
        });
      },
    },

    off: {
      matches: _.matches({ overlayType: "off" }),
      create: function () {
        return null;
      },
    },
  };

  /**
   * Returns the file name for the most recent OSCAR data layer to the specified date. If offset is non-zero,
   * the file name that many entries from the most recent is returned.
   *
   * The result is undefined if there is no entry for the specified date and offset can be found.
   *
   * UNDONE: the catalog object itself should encapsulate this logic. GFS can also be a "virtual" catalog, and
   *         provide a mechanism for eliminating the need for /data/weather/current/* files.
   *
   * @param {Array} catalog array of file names, sorted and prefixed with yyyyMMdd. Last item is most recent.
   * @param {String} date string with format yyyy/MM/dd or "current"
   * @param {Number?} offset
   * @returns {String} file name
   */
  function lookupOscar(catalog, date, offset) {
    offset = +offset || 0;
    if (date === "current") {
      return catalog[catalog.length - 1 + offset];
    }
    var prefix = µ.ymdRedelimit(date, "/", ""),
      i = _.sortedIndex(catalog, prefix);
    i = (catalog[i] || "").indexOf(prefix) === 0 ? i : i - 1;
    return catalog[i + offset];
  }

  function oscar0p33Path(catalog, attr) {
    var file = lookupOscar(catalog, attr.date);
    return file ? [OSCAR_PATH, file].join("/") : null;
  }

  function oscarpath(catalognew, attr) {
    var file = lookupOscar(catalognew, attr.date);
    return file ? [OSCAR_PATH, file].join("/") : null;
  }

  function oscarDate(catalog, attr) {
    var file = lookupOscar(catalog, attr.date);
    var parts = file ? µ.ymdRedelimit(file, "", "/").split("/") : null;
    return parts
      ? new Date(Date.UTC(+parts[0], parts[1] - 1, +parts[2], 0))
      : null;
  }

  /**
   * @returns {Date} the chronologically next or previous OSCAR data layer. How far forward or backward in
   * time to jump is determined by the step and the catalog of available layers. A step of ±1 moves to the
   * next/previous entry in the catalog (about 5 days), and a step of ±10 moves to the entry six positions away
   * (about 30 days).
   */
  function oscarStep(catalog, date, step) {
    var file = lookupOscar(
      catalog,
      µ.dateToUTCymd(date, "/"),
      step > 1 ? 6 : step < -1 ? -6 : step
    );
    var parts = file ? µ.ymdRedelimit(file, "", "/").split("/") : null;
    return parts
      ? new Date(Date.UTC(+parts[0], parts[1] - 1, +parts[2], 0))
      : null;
  }

  function dataSource(header) {
    // noinspection FallthroughInSwitchStatementJS
    switch (header.center || header.centerName) {
      case -3:
        return "OSCAR / Earth & Space Research";
      case 7:
      case "US National Weather Service, National Centres for Environmental Prediction (NCEP)":
        return "GFS / NCEP / US National Weather Service";
      default:
        return header.centerName;
    }
  }

  function bilinearInterpolateScalar(x, y, g00, g10, g01, g11) {
    var rx = 1 - x;
    var ry = 1 - y;
    return g00 * rx * ry + g10 * x * ry + g01 * rx * y + g11 * x * y;
  }

  function bilinearInterpolateVector(x, y, g00, g10, g01, g11) {
    // index++

    var rx = 1 - x;
    var ry = 1 - y;
    var a = rx * ry,
      b = x * ry,
      c = rx * y,
      d = x * y;
    var u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
    var v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;

    if (height && period) {
      return [u, v, Math.sqrt(u * u + v * v), g01[2], g01[3]];
    } else {
      return [u, v, Math.sqrt(u * u + v * v)];
    }
  }

  /**
   * Builds an interpolator for the specified data in the form of JSON-ified GRIB files. Example:
   *
   *     [
   *       {
   *         "header": {
   *           "refTime": "2013-11-30T18:00:00.000Z",
   *           "parameterCategory": 2,
   *           "parameterNumber": 2,
   *           "surface1Type": 100,
   *           "surface1Value": 100000.0,
   *           "forecastTime": 6,
   *           "scanMode": 0,
   *           "nx": 360,
   *           "ny": 181,
   *           "lo1": 0,
   *           "la1": 90,
   *           "lo2": 359,
   *           "la2": -90,
   *           "dx": 1,
   *           "dy": 1
   *         },
   *         "data": [3.42, 3.31, 3.19, 3.08, 2.96, 2.84, 2.72, 2.6, 2.47, ...]
   *       }
   *     ]
   *
   */
  function buildGrid(builder) {
    // var builder = createBuilder(data);

    var header = builder.header;
    var λ0 = header.lo1,
      φ0 = header.la1; // the grid's origin (e.g., 0.0E, 90.0N)
    var Δλ = header.dx,
      Δφ = header.dy; // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)
    var ni = header.nx,
      nj = header.ny; // number of grid points W-E and N-S (e.g., 144 x 73)
    var date = new Date(header.refTime);
    date.setHours(date.getHours() + header.forecastTime);

    // Scan mode 0 assumed. Longitude increases from λ0, and latitude decreases from φ0.
    // http://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_table3-4.shtml
    var grid = [],
      p = 0;
    var isContinuous = Math.floor(ni * Δλ) >= 360;
    for (var j = 0; j < nj; j++) {
      var row = [];
      for (var i = 0; i < ni; i++, p++) {
        row[i] = builder.data(p);
      }
      if (isContinuous) {
        // For wrapped grids, duplicate first column as last column to simplify interpolation logic
        row.push(row[0]);
      }
      grid[j] = row;
    }

    function interpolate(λ, φ) {
      var i = µ.floorMod(λ - λ0, 360) / Δλ; // calculate longitude index in wrapped range [0, 360)
      var j = (φ0 - φ) / Δφ;
      // calculate latitude index in direction +90 to -90

      //         1      2           After converting λ and φ to fractional grid indexes i and j, we find the
      //        fi  i   ci          four points "G" that enclose point (i, j). These points are at the four
      //         | =1.4 |           corners specified by the floor and ceiling of i and j. For example, given
      //      ---G--|---G--- fj 8   i = 1.4 and j = 8.3, the four surrounding grid points are (1, 8), (2, 8),
      //    j ___|_ .   |           (1, 9) and (2, 9).
      //  =8.3   |      |
      //      ---G------G--- cj 9   Note that for wrapped grids, the first column is duplicated as the last
      //         |      |           column, so the index ci can be used without taking a modulo.

      var fi = Math.floor(i),
        ci = fi + 1;
      var fj = Math.floor(j),
        cj = fj + 1;
      var row;
      if ((row = grid[fj])) {
        var g00 = row[fi];
        var g10 = row[ci];
        if (µ.isValue(g00) && µ.isValue(g10) && (row = grid[cj])) {
          var g01 = row[fi];
          var g11 = row[ci];
          if (µ.isValue(g01) && µ.isValue(g11)) {
            // All four points found, so interpolate the value.
            return builder.interpolate(i - fi, j - fj, g00, g10, g01, g11);
          }
        }
      }
      // console.log("cannot interpolate: " + λ + "," + φ + ": " + fi + " " + ci + " " + fj + " " + cj);
      return null;
    }

    return {
      source: dataSource(header),
      date: date,
      interpolate: interpolate,
      forEachPoint: function (cb) {
        for (var j = 0; j < nj; j++) {
          var row = grid[j] || [];
          for (var i = 0; i < ni; i++) {
            cb(µ.floorMod(180 + λ0 + i * Δλ, 360) - 180, φ0 - j * Δφ, row[i]);
          }
        }
      },
    };
  }

  function productsFor(attributes) {
    var attr = _.clone(attributes),
      results = [];
    _.values(FACTORIES).forEach(function (factory) {
      if (factory.matches(attr)) {
        results.push(factory.create(attr));
      }
    });
    return results.filter(µ.isValue);
  }

  return {
    overlayTypes: d3.set(_.keys(FACTORIES)),
    productsFor: productsFor,
  };
})();

/**
 * earth - a project to visualize global air data.
 *
 * Copyright (c) 2014 Cameron Beccario
 * The MIT License - http://opensource.org/licenses/MIT
 *
 * https://github.com/cambecc/earth
 */
var forecastednum = 0;
(function () {
  "use strict";

  var breakpoints = 0;

  var rldis = [];
  var gcdis = [];
  var totalrldis = 0;
  var totalgcdis = 0;
  let velocityarr = [];
  var isocoordinates = [];
  var isoToggle = false;
  var totaltimetaken = 0;

  var SECOND = 1000;
  var MINUTE = 60 * SECOND;
  var HOUR = 60 * MINUTE;
  var MAX_TASK_TIME = 100; // amount of time before a task yields control (millis)
  var MIN_SLEEP_TIME = 25; // amount of time a task waits before resuming (millis)
  var MIN_MOVE = 4; // slack before a drag operation beings (pixels)
  var MOVE_END_WAIT = 1; // time to wait for a move operation to be considered done (millis)

  var OVERLAY_ALPHA = Math.floor(0.4 * 255); // overlay transparency (on scale [0, 255])
  var INTENSITY_SCALE_STEP = 10; // step size of particle intensity color scale
  var MAX_PARTICLE_AGE = 100; // max number of frames a particle is drawn before regeneration
  var PARTICLE_LINE_WIDTH = 1.0; // line width of a drawn particle
  var PARTICLE_MULTIPLIER = 7; // particle count scalar (completely arbitrary--this values looks nice)
  var PARTICLE_REDUCTION = 0.75; // reduce particle count to this much of normal for mobile devices
  var FRAME_RATE = 10; // desired milliseconds per frame

  var NULL_WIND_VECTOR = [NaN, NaN, null]; // singleton for undefined location outside the vector field [u, v, mag]
  var HOLE_VECTOR = [NaN, NaN, null]; // singleton that signifies a hole in the vector field
  var TRANSPARENT_BLACK = [0, 0, 0, 0]; // singleton 0 rgba
  var REMAINING = "▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫"; // glyphs for remaining progress bar
  var COMPLETED = "▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪"; // glyphs for completed progress bar

  var loadedPointsCSV = []; //stores points from the uploaded csv

  var view = µ.view();
  var log = µ.log();

  /**
   * An object to display various types of messages to the user.
   */
  var report = (function () {
    var s = d3.select("#status"),
      p = d3.select("#progress"),
      total = REMAINING.length;
    return {
      status: function (msg) {
        return s.classed("bad") ? s : s.text(msg); // errors are sticky until reset
      },
      error: function (err) {
        var msg = err.status ? err.status + " " + err.message : err;
        switch (err.status) {
          case -1:
            msg = "Server Down";
            break;
          case 404:
            msg = "No Data";
            break;
        }
        log.error(err);
        return s.classed("bad", true).text(msg);
      },
      reset: function () {
        return s.classed("bad", false).text("");
      },
      progress: function (amount) {
        // amount of progress to report in the range [0, 1]
        if (0 <= amount && amount < 1) {
          var i = Math.ceil(amount * total);
          var bar = COMPLETED.substr(0, i) + REMAINING.substr(0, total - i);
          return p.classed("invisible", false).text(bar);
        }
        return p.classed("invisible", true).text(""); // progress complete
      },
    };
  })();

  function newAgent() {
    return µ.newAgent().on({ reject: report.error, fail: report.error });
  }

  // Construct the page's main internal components:

  var configuration = µ.buildConfiguration(globes, products.overlayTypes); // holds the page's current configuration settings
  var inputController = buildInputController(); // interprets drag/zoom operations
  var meshAgent = newAgent(); // map data for the earth
  var globeAgent = newAgent(); // the model of the globe
  var gridAgent = newAgent(); // the grid of weather data
  var rendererAgent = newAgent(); // the globe SVG renderer
  var fieldAgent = newAgent(); // the interpolated wind vector field
  var animatorAgent = newAgent(); // the wind animator
  var overlayAgent = newAgent(); // color overlay over the animation

  /**
   * The input controller is an object that translates move operations (drag and/or zoom) into mutations of the
   * current globe's projection, and emits events so other page components can react to these move operations.
   *
   * D3's built-in Zoom behavior is used to bind to the document's drag/zoom events, and the input controller
   * interprets D3's events as move operations on the globe. This method is complicated due to the complex
   * event behavior that occurs during drag and zoom.
   *
   * D3 move operations usually occur as "zoomstart" -> ("zoom")* -> "zoomend" event chain. During "zoom" events
   * the scale and mouse may change, implying a zoom or drag operation accordingly. These operations are quite
   * noisy. What should otherwise be one smooth continuous zoom is usually comprised of several "zoomstart" ->
   * "zoom" -> "zoomend" event chains. A debouncer is used to eliminate the noise by waiting a short period of
   * time to ensure the user has finished the move operation.
   *
   * The "zoom" events may not occur; a simple click operation occurs as: "zoomstart" -> "zoomend". There is
   * additional logic for other corner cases, such as spurious drags which move the globe just a few pixels
   * (most likely unintentional), and the tendency for some touch devices to issue events out of order:
   * "zoom" -> "zoomstart" -> "zoomend".
   *
   * This object emits clean "moveStart" -> ("move")* -> "moveEnd" events for move operations, and "click" events
   * for normal clicks. Spurious moves emit no events.
   */
  function buildInputController() {
    var globe,
      op = null;
      
    /**
     * @returns {Object} an object to represent the state for one move operation.
     */
    function newOp(startMouse, startScale) {
      return {
        type: "click", // initially assumed to be a click operation
        startMouse: startMouse,
        startScale: startScale,
        manipulator: globe.manipulator(startMouse, startScale),
      };
    }

    //Fullscreen code on button click
    var Fullscreen = false;
    d3.select("#fullscreen_btn").on("click", () => {
      Fullscreen = !Fullscreen;
      if (Fullscreen) {
        document.documentElement.requestFullscreen().catch((e) => {
          console.log(e.message);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          /* Safari */
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          /* IE11 */
          document.msExitFullscreen();
        }
      }
    });
    // Check if an velocity value is valid or not
    function checkvelocityarr(velocityarr) {
      for (var j = 0; j < velocityarr.length - 1; j++) {
        if (isNaN(velocityarr[j]) || velocityarr[j] === 0) {
          return true;
        }
      }
      return false;
    }

    d3.select(".calculateVelocity").on("click", () => {
      totaltimetaken = 0;
      for (var i = 0; i < rldis.length; i++) {
        if (document.getElementById("velocity-data-" + i) != null) {
          velocityarr[i] =
            parseInt(document.getElementById("velocity-data-" + i).value) *
            0.514444;
        }
      }
      console.log(velocityarr);

      if (checkvelocityarr(velocityarr)) {
        alert("please enter valid velocities");
      } else if (confirm("Are you sure you want to save velocities")) {
        // Save it!
        // totaltimetaken=0;
        // for(var i=0;i<rldis.length;i++)
        // {
        //   velocityarr[i]=parseInt(document.getElementById("velocity-data-" + i).value)
        // }

        for (var i = 0; i < rldis.length; i++) {
          if (parseInt(velocityarr[i]) != 0) {
            totaltimetaken = Math.floor(
              totaltimetaken +
                (parseInt(rldis[i]) * 1000) / parseInt(velocityarr[i]) / 3600
            );
          }
        }

        let sliderOne = document.getElementById("slider-1");
        document.getElementById("slider-1").value = 0;

        document.getElementById("slider-2").value = Math.min(
          totaltimetaken,
          240
        );

        let bufferSliderTwo = document.getElementById("slider-2").value;
        let bufferSliderOne = document.getElementById("slider-1").value;
        document.querySelector(".sliderfinal").style.left =
          (bufferSliderTwo / 240) * 100 - 1 + "%";
        document.querySelector(".sliderinitial").style.left = -7 + "%";
        sliderTwoLabel.textContent =
          parseDate(sliderTwo.value) +
          "   (" +
          Math.floor(totaltimetaken / 24) +
          "days" +
          (totaltimetaken % 24) +
          "hrs" +
          ")";

        fillColor();
        if (d3.select("#functionality_table").classed("invisible")) {
          d3.select("#table_btn").style("background-color", "#000");
          d3.select(".functionality_table").classed(
            "invisible",
            !d3.select(".functionality_table").classed("invisible")
          );
        }

        if (d3.select("#time_slider").classed("invisible")) {
          d3.select(".time_slider").classed(
            "invisible",
            !d3.select(".time_slider").classed("invisible")
          );
        }
      } else {
        // Do nothing!
        console.log("do nothing");
      }
    });

    var zoom = d3.behavior
      .zoom()
      .on("zoomstart", function () {
        op = op || newOp(d3.mouse(this), zoom.scale()); // a new operation begins
      })
      .on("zoom", function () {
        var currentMouse = d3.mouse(this),
          currentScale = d3.event.scale;

        op = op || newOp(currentMouse, 1); // Fix bug on some browsers where zoomstart fires out of order.
        if (op.type === "click" || op.type === "spurious") {
          var distanceMoved = µ.distance(currentMouse, op.startMouse);
          if (currentScale === op.startScale && distanceMoved < MIN_MOVE) {
            // to reduce annoyance, ignore op if mouse has barely moved and no zoom is occurring
            op.type = distanceMoved > 0 ? "click" : "spurious";
            return;
          }
          dispatch.trigger("moveStart");
          op.type = "drag";
        } else {
        }
        if (currentScale != op.startScale) {
          op.type = "zoom"; // whenever a scale change is detected, (stickily) switch to a zoom operation
        }

        // when zooming, ignore whatever the mouse is doing--really cleans up behavior on touch devices
        op.manipulator.move(
          op.type === "zoom" ? null : currentMouse,
          currentScale
        );
        dispatch.trigger("move");
      })
      .on("zoomend", function () {
        op.manipulator.end();
        // d3.select("#insert_point_blank").style("display", "none");
        // d3.selectAll(".iso-mark-new").remove();

        if (op.type === "click") {
          dispatch.trigger(
            "click",
            op.startMouse,
            globe.projection.invert(op.startMouse) || []
          );
        } else if (op.type !== "spurious") {
          console.log("Actuall zooming");
          signalEnd();
        }
        op = null; // the drag/zoom/click operation is over
      });

    var signalEnd = _.debounce(function () {
      if (!op || (op.type !== "drag" && op.type !== "zoom")) {
        // configuration.save(
        //   { orientation: globe.orientation() },
        //   { source: "moveEnd" }
        // );
        dispatch.trigger("moveEnd");
      }
    }, MOVE_END_WAIT); // wait for a bit to decide if user has stopped moving the globe

    d3.select("#display").call(zoom);
    d3.select("#show-location").on("click", function () {
      if (navigator.geolocation) {
        report.status("Finding current position...");
        navigator.geolocation.getCurrentPosition(function (pos) {
          report.status("");
          var coord = [pos.coords.longitude, pos.coords.latitude],
            rotate = globe.locate(coord);
          if (rotate) {
            globe.projection.rotate(rotate);
            configuration.save({ orientation: globe.orientation() }); // triggers reorientation
          }
          dispatch.trigger("click", globe.projection(coord), coord);
        }, log.error);
      }
    });

    function reorient() {
      var options = arguments[3] || {};
      if (!globe || options.source === "moveEnd") {
        // reorientation occurred because the user just finished a move operation, so globe is already
        // oriented correctly.
        return;
      }
      dispatch.trigger("moveStart");
      globe.orientation(configuration.get("orientation"), view);
      zoom.scale(globe.projection.scale());
      dispatch.trigger("moveEnd");
    }

    var dispatch = _.extend(
      {
        globe: function (_) {
          if (_) {
            globe = _;
            zoom.scaleExtent(globe.scaleExtent());
            reorient();
          }
          return _ ? this : globe;
        },
      },
      Backbone.Events
    );
    return dispatch.listenTo(configuration, "change:orientation", reorient);
  }

  /**
   * @param resource the GeoJSON resource's URL
   * @returns {Object} a promise for GeoJSON topology features: {boundaryLo:, boundaryHi:}
   */
  function buildMesh(resource) {
    var cancel = this.cancel;
    report.status("Downloading...");
    return µ.loadJson(resource).then(function (topo) {
      if (cancel.requested) return null;
      log.time("building meshes");
      var o = topo.objects;
      var coastLo = topojson.feature(
        topo,
        µ.isMobile() ? o.coastline_tiny : o.coastline_110m
      );
      var coastHi = topojson.feature(
        topo,
        µ.isMobile() ? o.coastline_110m : o.coastline_50m
      );
      var lakesLo = topojson.feature(
        topo,
        µ.isMobile() ? o.lakes_tiny : o.lakes_110m
      );
      var lakesHi = topojson.feature(
        topo,
        µ.isMobile() ? o.lakes_110m : o.lakes_50m
      );
      log.timeEnd("building meshes");
      return {
        coastLo: coastLo,
        coastHi: coastHi,
        lakesLo: lakesLo,
        lakesHi: lakesHi,
      };
    });
  }

  /**
   * @param {String} projectionName the desired projection's name.
   * @returns {Object} a promise for a globe object.
   */
  function buildGlobe(projectionName) {
    var builder = globes.get(projectionName);
    if (!builder) {
      return when.reject("Unknown projection: " + projectionName);
    }
    return when(builder(view));
  }

  // Some hacky stuff to ensure only one download can be in progress at a time.
  var downloadsInProgress = 0;

  function buildGrids() {
    report.status("Downloading...");
    log.time("build grids");
    // UNDONE: upon failure to load a product, the unloaded product should still be stored in the agent.
    //         this allows us to use the product for navigation and other state.
    var cancel = this.cancel;
    downloadsInProgress++;
    var loaded = when.map(
      products.productsFor(configuration.attributes),
      function (product) {
        return product.load(cancel);
      }
    );
    return when
      .all(loaded)
      .then(function (products) {
        log.time("build grids");
        return {
          primaryGrid: products[0],
          overlayGrid: products[1] || products[0],
        };
      })
      .ensure(function () {
        downloadsInProgress--;
      });
  }

  /**
   * Modifies the configuration to navigate to the chronologically next or previous data layer.
   */
  function navigate(step) {
    if (downloadsInProgress > 0) {
      log.debug("Download in progress--ignoring nav request.");
      return;
    }
    var next = gridAgent.value().primaryGrid.navigate(step);
    if (next) {
      configuration.save(µ.dateToConfig(next));
    }
  }

  window.addEventListener("load", () => {
    setTimeout(() => {
      document.getElementById("overlay-wind").click();
      //    window.history.pushState('', 'basic', `/#current/wind/surface/level/overlay=none/${configuration.attributes.projection}=-277.50,0.00,261`)
    }, 1000);
  });

  configuration.on("change:projection", () => {
    setTimeout(() => {
      //    window.history.pushState('', 'basic', `/#current/wind/surface/level/overlay=none/${configuration.attributes.projection}=-277.50,0.00,261`)
    }, 1000);
  });

  // //  handle double range slider in fuctionality table below//////////////////////

  const parseDate = (val) => {
    var date_now = new Date();
    let options = { weekday: "long", hour: "2-digit" };
    if (val == 0) {
      return date_now.toLocaleString("en-IN", options);
    } else {
      var newdate = new Date(Date.now() + val * (60 * 60 * 1000));

      return newdate.toLocaleString("en-IN", options);
    }
  };
  const dategiver = (val) => {
    if (val % 4 == 0) {
      val = val / 4;
      var date_now = new Date();
      let options = { weekday: "short", day: "numeric" };

      if (val == 0) {
        return date_now.toLocaleString("en-IN", options);
      } else {
        var newdate = new Date(Date.now() + val * 24 * (60 * 60 * 1000));

        return newdate.toLocaleString("en-IN", options);
      }
    } else if (val % 4 == 1) {
      return "";
    } else if (val % 4 == 2) {
      return "";
    } else if (val % 4 == 3) {
      return "";
    }
  };

  document.getElementById("slider-1").oninput = slideOne;
  document.getElementById("slider-2").oninput = slideTwo;

  window.onload = function () {
    slideOne();
    // slideTwo();
  };

  let sliderOne = document.getElementById("slider-1");
  let sliderTwo = document.getElementById("slider-2");
  let sliderOneLabel = document.querySelector(".sliderinitial");
  let sliderTwoLabel = document.querySelector(".sliderfinal");

  let minGap = totaltimetaken;
  let sliderTrack = document.querySelector(".slider-track");
  let sliderMaxValue = document.getElementById("slider-1").max;

  function slideOne() {
    if (
      parseInt(sliderTwo.value) - parseInt(sliderOne.value) <= minGap &&
      parseInt(sliderTwo.value) < 480
    ) {
      sliderOne.value = parseInt(sliderTwo.value) - minGap;
    }

    sliderTwo.value = parseInt(sliderOne.value) + totaltimetaken;

    sliderTwo.value = parseInt(sliderOne.value) + totaltimetaken;
    sliderOneLabel.style.left =
      (sliderOne.value / sliderMaxValue) * 100 - 7 + "%";
    sliderTwoLabel.style.left =
      (sliderTwo.value / sliderMaxValue) * 100 - 1 + "%";

    fillColor();
  }
  function slideTwo() {
    if (sliderTwo.value <= totaltimetaken) {
      console.log("do nothing");
    } else {
      if (parseInt(sliderTwo.value) - parseInt(sliderOne.value) <= minGap) {
        sliderTwo.value = parseInt(sliderOne.value) + minGap;
      }

      sliderOne.value = parseInt(sliderTwo.value) - totaltimetaken;
      sliderOneLabel.style.left =
        (sliderOne.value / sliderMaxValue) * 100 - 7 + "%";
      sliderTwoLabel.style.left =
        (sliderTwo.value / sliderMaxValue) * 100 - 1 + "%";

      fillColor();
    }

    sliderOne.value = parseInt(sliderTwo.value) - totaltimetaken;

    fillColor();
  }
  function fillColor() {
    // document.getElementById("diff-slid").textContent = Math.floor((totaltimetaken)/24)+"days" + (totaltimetaken)%24+"hrs";

    if (
      parseInt(sliderTwo.value) - parseInt(sliderOne.value) < totaltimetaken &&
      parseInt(sliderTwo.value) == 240
    ) {
      // displayValTwo.textContent = "Finish - Far Further";
      sliderTwoLabel.textContent = "Far Further";
    } else {
      // displayValTwo.textContent = "Finish - "+parseDate(sliderTwo.value )
      sliderTwoLabel.textContent =
        parseDate(sliderTwo.value) +
        "   (" +
        Math.floor(totaltimetaken / 24) +
        "days" +
        (totaltimetaken % 24) +
        "hrs" +
        ")";
    }
    // displayValOne.textContent ="Start - "+ parseDate(sliderOne.value)
    sliderOneLabel.textContent = parseDate(sliderOne.value);

    let percent1 = (sliderOne.value / sliderMaxValue) * 100;
    let percent2 = (sliderTwo.value / sliderMaxValue) * 100;
    sliderTrack.style.background = `linear-gradient(to right, #dadae5 ${percent1}% , #3264fe ${percent1}% , #3264fe ${percent2}%, #dadae5 ${percent2}%)`;
  }
  for (let i = 0; i < 44; i++) {
    d3
      .select("#time_marker")
      .append("span")
      .attr("class", "time_marker_table")
      .node().innerHTML = `<h5>|</h5><h6>${dategiver(i)}</h6>`;
  }
  /////////////////////////////////////////////////////////////////

  function buildRenderer(mesh, globe) {
    if (!mesh || !globe) return null;

    report.status("Rendering Globe...");
    log.time("rendering map");

    // UNDONE: better way to do the following?
    var dispatch = _.clone(Backbone.Events);
    if (rendererAgent._previous) {
      rendererAgent._previous.stopListening();
    }
    rendererAgent._previous = dispatch;

    // First clear map and foreground svg contents.
    µ.removeChildren(d3.select("#map").node());
    µ.removeChildren(d3.select("#foreground").node());
    // Create new map svg elements.
    globe.defineMap(d3.select("#map"), d3.select("#foreground"));

    var path = d3.geo.path().projection(globe.projection).pointRadius(10);

    var coastline = d3.select(".coastline");
    var lakes = d3.select(".lakes");
    d3.selectAll("path").attr("d", path); // do an initial draw -- fixes issue with safari

    //It does undo action
    d3.select("#backBtnFunct").on("click", function () {
      if (arr.length != 0) {
        d3.select("#row-" + arr.length).remove();
        d3.select(".location-line-" + arr.length).remove();
        breakpoints--;
        console.log(breakpoints);
      }
      d3.select(`.location-mark-${arr.length}`).remove();
      arr.pop();
    });

    d3.select("#addBtnFunct").on("click", function () {
      addCoorRow();
    });

    //Creates a new row each time we click + option in waypoints table
    function addCoorRow() {
      var row = d3
        .select("#coordinates-table")
        .append("tr")
        .attr("id", "row-" + (breakpoints + 1));
      row
        .append("td")
        .text("Point " + (breakpoints + 1))
        .attr("class", "cell1")
        .attr("id", `cell1-${breakpoints + 1}`);
      row
        .append("td")
        .append("input")
        .attr("id", "break-point-" + breakpoints)
        .attr("type", "text")
        .attr("class", "cell2")
        .property("readonly", true);

      row
        .append("td")
        .append("input")
        .attr("id", "weather-data-" + breakpoints)
        .attr("type", "text")
        .attr("class", "cell3")
        .property("readonly", true);

      breakpoints++;
    }

    configuration.on("change:level", (event) => {
      var time_delay = 300;
      if (configuration.changed.level === "waves") {
        document.getElementById("overlay-currents").innerHTML = "Waves";
        console.log("Fetching Wave Data...");
        time_delay = 1000;
      } else if (configuration.changed.level === "currents") {
        document.getElementById("overlay-currents").innerHTML = "Currents";
      }
      setTimeout(() => {
        redrawTable();
        d3.select("#insert_point_blank").style("display", "none");
      }, time_delay);
    });

    d3.select("#dynamic-condition-col").on("click", () => {
      redrawTable();
    });

    // Function to draw waypoints table
    function redrawTable() {
      var table = d3.select("#coordinates-table");
      table.selectAll(".disposable").remove();
      d3.select("#condition-column").text(
        `${
          configuration.changed.level === "currents"
            ? "Current Speed"
            : configuration.changed.level === "waves"
            ? "Wave Data"
            : "Wind Speed"
        }`
      );

      document.getElementById("insertPointBtn").disabled = false;

      document.querySelectorAll(".insert_after_class").forEach((elem) => {
        elem.disabled = false;
      });

      for (let i = 0; i < arr.length; i++) {
        let row = table
          .append("tr")
          .attr("id", "row-" + (i + 1))
          .attr("class", "disposable");

        row
          .append("td")
          .style("background-color", "black")
          .attr("class", "insert_point_between")
          .attr("id", `insert_after_${i + 1}`)
          .style("display", "none")
          .append("button")
          .attr("class", `insert_after_class`)
          .attr("id", `insert_after_${i + 1}btn`)
          .text("+")
          .style("font-size", "20px")
          .on("click", () => {
            insertAfter(i + 1);
            document.querySelectorAll(".insert_after_class").forEach((elem) => {
              elem.disabled = true;
            });
          });

        d3.select(`#insert_after_${i + 1}`)
          .append("button")
          .attr("class", "delete_point")
          .attr("id", `delete_point_${i + 1}`)
          .text("-")
          .style("font-size", "20px")
          .style("padding-left", "8px")
          .style("padding-right", "8px")
          .on("click", () => {
            deletePoint(i);
            d3.select("#insert_point_blank").style("display", "none");
          });

        row
          .append("td")
          .style("text-align", "center")
          .style("background-color", "#000005")
          .append("button")
          .text(i + 1)
          .attr("class", "cell1")
          .attr("id", `cell1-${i + 1}`);
        row
          .append("td")
          .append("input")
          .attr("id", "break-point-" + i)
          .attr("type", "text")
          .attr("readonly", true)
          .attr("class", "cell2");
        row
          .append("td")
          .append("input")
          .attr("id", "weather-data-" + i)
          .attr("type", "text")
          .attr("readonly", true)
          .attr("class", "cell3");

        if (d3.select("#break-point-" + i).node() != null) {
          var formattedCoordinates = formatLatitudeAndLongtitude(arr[i]);
          d3.select("#break-point-" + i).node().value =
            formattedCoordinates["latitude"] +
            " , " +
            formattedCoordinates["longitude"];
          var [v1, v2] = getWindAtLocation(arr[i]);
          d3.select("#weather-data-" + i).node().value = `${v1} ${v2}`;
        }

        row
          .append("td")
          .append("input")
          .attr("id", "velocity-data-" + i)
          .attr("type", "text")
          .attr("class", "cell4");

        if (velocityarr[i] != "undefined" && velocityarr[i] != "") {
          d3.select("#velocity-data-" + i).node().value =
            velocityarr[i] / 0.514444;
        }

        var lastAppendedIndex = i;
      }

      if (lastAppendedIndex) {
        document.getElementById(
          "velocity-data-" + lastAppendedIndex
        ).disabled = true;
      }
    }
    // Finds the weather data of the clicked point
    function getWindAtLocation(coord) {
      var grids = gridAgent.value(),
        product = grids.primaryGrid;
      var λ = coord[0],
        φ = coord[1];
      var wind = grids.primaryGrid.interpolate(λ, φ);
      if (µ.isValue(wind)) {
        var unitToggle = createUnitToggle("#location-wind-units", product),
          units = unitToggle.value();
        if (wind[3] !== undefined) {
          if (isNaN(wind[3])) {
            return [
              µ.formatVector(wind.slice(0, 3), units).split("@")[0] +
                " @ " +
                "Not",
              "Available",
            ];
          } else {
            return [
              µ.formatVector(wind.slice(0, 3), units).split("@")[0] +
                " @ " +
                wind[3] +
                "m |",
              wind[4] + "s",
            ];
          }
        } else {
          return [µ.formatVector(wind, units), units.label];
        }
      }
      return [];
    }
    function formatLatitudeAndLongtitude(coord) {
      var signLat = coord[1] >= 0 ? "N" : "S";
      var latitude =
        " " + Math.abs(parseFloat(coord[1]).toFixed(2)) + " " + signLat;

      var signLong = coord[0] >= 0 ? "E" : "W";
      var longitude =
        " " + Math.abs(parseFloat(coord[0]).toFixed(2)) + " " + signLong;
      return {
        latitude: latitude,
        longitude: longitude,
      };
    }

    var pointsArr;
    let arr = [];
    let coorarr = [];

    var marked = false;
    var clicked = -1;
    var selected_point = null;
    var currentshiplocation = 0;
    var currentmode = "rl";

    var line_hovered = {
      status: false,
      index: null,
    };

    let previous_state = null;

    //Great circle logic added
    if (currentmode == "rl") {
      d3.select("#rl-route").style("color", "#e2b42e");
    }
    d3.select("#gc-route").on("click", function () {
      currentmode = "gc";
      currentmode == "rl"
        ? (document.getElementById("totaldistance").innerHTML =
            Math.round(totalrldis * 0.539957).toLocaleString("en-IN") + "NM")
        : (document.getElementById("totaldistance").innerHTML =
            Math.round(totalgcdis * 0.539957).toLocaleString("en-IN") + "NM");
      d3.select("#gc-route").style("color", "#e2b42e");
      d3.select("#rl-route").style("color", "white");
      d3.selectAll(".line-route").style("visibility", " hidden");
      d3.selectAll(".gc-route").style("visibility", "visible");

      d3.selectAll(".gc-dist").style("visibility", "visible");
      d3.selectAll(".rl-dist").style("visibility", "hidden");
    });

    d3.select("#rl-route").on("click", function () {
      currentmode = "rl";
      currentmode == "rl"
        ? (document.getElementById("totaldistance").innerHTML =
            Math.round(totalrldis * 0.539957).toLocaleString("en-IN") + "NM")
        : (document.getElementById("totaldistance").innerHTML =
            Math.round(totalgcdis * 0.539957).toLocaleString("en-IN") + "NM");
      d3.select("#rl-route").style("color", "#e2b42e");
      d3.select("#gc-route").style("color", "white");
      d3.selectAll(".line-route").style("visibility", "visible");

      d3.selectAll(".gc-route").style("visibility", " hidden");

      d3.selectAll(".gc-dist").style("visibility", "hidden");
      d3.selectAll(".rl-dist").style("visibility", "visible");
    });

    // Run each time we click reset button
    d3.select("#resetBtn").on("click", function () {
      d3.selectAll(".disposable").remove();
      d3.selectAll(".div-mark").remove();
      d3.selectAll(".line-route").remove();
      d3.selectAll(".text-mark").remove();
      d3.selectAll(".cross-mark").remove();
      d3.selectAll(".gc-route").remove();
      d3.selectAll(".gc-dist").remove();
      d3.select("#msl_isolines").remove();
      d3.select("#ship").remove();
      d3.select("#new_ship").remove();
      d3.selectAll("#dangermark").remove();
      d3.select("#dot1").remove();
      d3.select(".node_position").remove();
      d3.selectAll(".hurricanedangermarkphoto").remove();
      d3.selectAll(".tsunamidangermarkphoto").remove();
      d3.selectAll(".sandstormdangermarkphoto").remove();
      d3.selectAll(".stormdangermarkphoto").remove();
      d3.selectAll(".galedangermarkphoto").remove();
      d3.selectAll(".d3-tip").remove();

      nooftsunamisymbol = 0;
      noofgalesymbol = 0;
      noofhurricanesymbol = 0;
      noofstormsymbol = 0;
      noofsandstormsymbol = 0;
      arr = [];
      coorarr = [];
      isocoordinates = [];
      velocityarr = [];
      rldis = [];
      gcdis = [];
    });

    // Call each time when we click isobar button
    const msl_display = () => {
      console.log("isobar clicked");
      let Slot_map = { "00": 1, "06": 2, 12: 3, 18: 4 };
      let days_diff = d - current_d;

      let hours_to_be_added =
        days_diff * 24 + (Slot_map[slot] - Slot_map[current_slot]) * 6;

      if (parseInt(hours_to_be_added) < 100) {
        hours_to_be_added = "0" + hours_to_be_added;
      }

      if (parseInt(hours_to_be_added) < 10) {
        hours_to_be_added = "0" + hours_to_be_added;
      }

      var data_day,
        data_slot,
        month = m;

      if (
        days_diff < 0 ||
        (days_diff === 0 && Slot_map[slot] - Slot_map[current_slot] < 0)
      ) {
        hours_to_be_added = "000";
        data_day = d;
        data_slot = slot;
      } else {
        data_slot = current_slot;
        data_day = current_d;
      }
      console.log(
        "[Path]" +
          "./isobar/3_" +
          data_day +
          "_" +
          data_slot +
          "_" +
          hours_to_be_added +
          "_isobar.tif"
      );

      var xhr = new XMLHttpRequest();
      xhr.open(
        "GET",
        `./isobar/${month}_${data_day}_${data_slot}_${hours_to_be_added}_isobar.tif`,
        true
      );

      //  xhr.open("GET", `./Media/isobar/3_14_12_000_isobar.tif`, true);
    
      xhr.responseType = "arraybuffer";
      xhr.onload = function () {
        var tiff = GeoTIFF.parse(this.response);
        var image = tiff.getImage();
        var tiffWidth = image.getWidth();
        var tiffHeight = image.getHeight();
        var rasters = image.readRasters();
        var tiepoint = image.getTiePoints()[0];
        var pixelScale = image.getFileDirectory().ModelPixelScale;
        var geoTransform = [
          tiepoint.x,
          pixelScale[0],
          0,
          tiepoint.y,
          0,
          -1 * pixelScale[1],
        ];

        var pressData = new Array(tiffHeight);
        for (var j = 0; j < tiffHeight; j++) {
          pressData[j] = new Array(tiffWidth);
          for (var i = 0; i < tiffWidth; i++) {
            pressData[j][i] = (rasters[0][i + j * tiffWidth] / 100).toFixed(2);
          }
        }
        var intervals = [
          970, 974, 978, 982, 986, 990, 994, 998, 1002, 1006, 1010, 1014, 1018,
          1022, 1026, 1030,
        ];
        var isobars = rastertools.isolines(pressData, geoTransform, intervals);

        // Add data labels to isobar lines
        var width = "100%";
        var height = "100%";

        var path1 = d3.geo.path().projection(globe.projection);
        if (isoToggle) {
          d3.select("#msl_isolines").remove();
          d3.select("#isobar").style("background-color", "#1e70e9");
          isoToggle = !isoToggle;
        } else {
          isoToggle = !isoToggle;
          d3.select("#isobar").style("background-color", "#000");

          var svg = d3
            .select("#foreground")
            .append("svg")
            .attr("id", "msl_isolines")
            .attr("width", width)
            .attr("height", height);

          var maskZones = svg
            .append("defs")
            .append("mask")
            .attr("id", "labelsMask")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height);

          maskZones
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "white");

          isobars.features.forEach(function (d, i) {
            var separation = 300;
            var properties = spp.svgPathProperties(path(d));

            var text = d.properties[0].value;
            var textEl = svg
              .append("text")
              .attr("x", 0)
              .attr("y", 0)
              .style("font-family", "Georgia")

              .text(text)
              .style("visibility", "hidden");

            var bbox = textEl.node().getBBox();

            svg
              .insert("path", ".streamline")
              .datum(d)
              .attr("d", path1)
              .attr("mask", "url(#labelsMask)")
              .style("stroke", "#A9A9A9")
              .style("stroke-width", "1.0px")
              .style("fill", "None");

            for (
              var j = 0;
              j < Math.floor(properties.getTotalLength() / separation);
              j++
            ) {
              var pos = properties.getPropertiesAtLength(75 + separation * j);
              var degrees =
                (180 / Math.PI) * Math.atan(pos.tangentY / pos.tangentX);

              svg
                .append("text")
                .attr("font-weight", "low")
                .style("background-color", "white")
                .attr("fill", "white")
                .attr("x", -bbox.width / 2)
                .attr("y", 7.5)
                .attr("font-family", "Georgia")
                .attr("font-size", "15px")
                .attr(
                  "transform",
                  "translate(" +
                    pos.x +
                    ", " +
                    pos.y +
                    ")rotate(" +
                    degrees +
                    ")"
                )
                .text(text);

              maskZones
                .append("rect")
                .attr("x", -2 - bbox.width / 2)
                .attr("y", -8)
                .attr("width", bbox.width + 4)
                .attr("height", bbox.height)
                .attr("fill", "white")
                .attr(
                  "transform",
                  "translate(" +
                    pos.x +
                    ", " +
                    pos.y +
                    ")rotate(" +
                    degrees +
                    ")"
                );
            }
          });
        }
      };
      xhr.send();
    };
    /////////////////////////////////////////////////////////
    //Calculates great circle distance between two points
    d3.select("#isobar").on("click", msl_display);

    function gcDistance(lat1, lon1, lat2, lon2) {
      lon1 = (lon1 * Math.PI) / 180;
      lon2 = (lon2 * Math.PI) / 180;
      lat1 = (lat1 * Math.PI) / 180;
      lat2 = (lat2 * Math.PI) / 180;

      let dlon = lon2 - lon1;
      let dlat = lat2 - lat1;
      let a =
        Math.pow(Math.sin(dlat / 2), 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);

      let c = 2 * Math.asin(Math.sqrt(a));

      let r = 6371;
      gcdis.push(Math.ceil(c * r));
      totalgcdis = gcdis.reduce((a, b) => a + b, 0);

      currentmode == "rl"
        ? (document.getElementById("totaldistance").innerHTML =
            Math.round(totalrldis * 0.539957).toLocaleString("en-IN") + "NM")
        : (document.getElementById("totaldistance").innerHTML =
            Math.round(totalgcdis * 0.539957).toLocaleString("en-IN") + "NM");

      return Math.ceil(c * r);
    }

    //calculates rhumb line distance between two points
    function distance(lat1, lon1, lat2, lon2) {
      let R = 6371;

      var φ2 = (Math.PI * lat2) / 180;
      var φ1 = (Math.PI * lat1) / 180;

      var Δφ = φ1 - φ2;
      var Δλ = (Math.PI * (lon1 - lon2)) / 180;
      const Δψ = Math.log(
        Math.tan(Math.PI / 4 + φ2 / 2) / Math.tan(Math.PI / 4 + φ1 / 2)
      );
      const q = Math.abs(Δψ) > 10e-12 ? Δφ / Δψ : Math.cos(φ1); // E-W course becomes ill-conditioned with 0/0

      // if dLon over 180° take shorter rhumb line across the anti-meridian:
      if (Math.abs(Δλ) > Math.PI)
        Δλ = Δλ > 0 ? -(2 * Math.PI - Δλ) : 2 * Math.PI + Δλ;

      const dist = Math.sqrt(Δφ * Δφ + q * q * Δλ * Δλ) * R;
      rldis.push(Math.ceil(dist));

      totalrldis = rldis.reduce((a, b) => a + b, 0);

      currentmode == "rl"
        ? (document.getElementById("totaldistance").innerHTML =
            Math.round(totalrldis * 0.539957).toLocaleString("en-IN") + "NM")
        : (document.getElementById("totaldistance").innerHTML =
            Math.round(totalgcdis * 0.539957).toLocaleString("en-IN") + "NM");

      return Math.ceil(dist);
    }
    // Calculates mid point of the rhumb line
    var getMid = (coorarr1) => {
      let m =
        (coorarr1[coorarr1.length - 1][0] - coorarr1[coorarr1.length - 2][0]) /
        (coorarr1[coorarr1.length - 1][1] - coorarr1[coorarr1.length - 2][1]);
      m = 1 / m;

      var angleRad = Math.atan(m);
      var angleDeg = (angleRad * 180) / Math.PI;

      var midx =
        (coorarr1[coorarr1.length - 2][0] + coorarr1[coorarr1.length - 1][0]) /
        2;
      var midy =
        (coorarr1[coorarr1.length - 2][1] + coorarr1[coorarr1.length - 1][1]) /
        2;

      d3.select(`#rl-distance-${coorarr1.length - 1}`).attr(
        "style",
        `transform:rotateZ(${angleDeg}deg);transform-origin:${midx}px ${midy}px`
      );

      d3.select(`#gc-distance-${coorarr1.length - 1}`).attr(
        "style",
        `transform:rotateZ(${angleDeg}deg);transform-origin:${midx}px ${midy}px`
      );

      return [
        (coorarr1[coorarr1.length - 2][0] + coorarr1[coorarr1.length - 1][0]) /
          2 -
          10,
        (coorarr1[coorarr1.length - 2][1] + coorarr1[coorarr1.length - 1][1]) /
          2,
      ];
    };

    var getMidGC = (arr1) => {
      var φ1 = (arr1[arr1.length - 2][1] * Math.PI) / 180;
      var λ1 = (arr1[arr1.length - 2][0] * Math.PI) / 180;
      var φ2 = (arr1[arr1.length - 1][1] * Math.PI) / 180;
      var λ2 = (arr1[arr1.length - 1][0] * Math.PI) / 180;
      const Bx = Math.cos(φ2) * Math.cos(λ2 - λ1);
      const By = Math.cos(φ2) * Math.sin(λ2 - λ1);
      const φ3 = Math.atan2(
        Math.sin(φ1) + Math.sin(φ2),
        Math.sqrt((Math.cos(φ1) + Bx) * (Math.cos(φ1) + Bx) + By * By)
      );
      const λ3 = λ1 + Math.atan2(By, Math.cos(φ1) + Bx);
    };

    // call to add distance text on the line
    var insertDistance = (arr1, coorarr1) => {
      d3
        .select("#line-" + (arr1.length - 1))
        .append("text")
        .attr("id", `rl-distance-${arr1.length - 1}`)
        .attr("class", `rl-dist distance distance-${arr1.length - 1}`)
        .attr("x", getMid(coorarr1)[0] + 10)
        .attr("y", getMid(coorarr1)[1] + 15)
        .style("font-size", "12px")
        .style("visibility", currentmode === "rl" ? "visible" : "hidden")
        .node().innerHTML =
        Math.round(
          distance(
            arr1[arr1.length - 2][1],
            arr1[arr1.length - 2][0],
            arr1[arr1.length - 1][1],
            arr1[arr1.length - 1][0]
          ) * 0.539957
        ) + "NM";

      d3
        .select("#foreground")
        .insert("text", "#gc-line" + arr1.length)
        .attr("id", `gc-distance-${arr1.length - 1}`)
        .attr("class", `gc-dist distance distance-${arr1.length - 1}`)
        .attr("x", getMid(coorarr1)[0] + 10)
        .attr("y", getMid(coorarr1)[1] + 15)
        .style("font-size", "12px")
        .style("visibility", currentmode === "gc" ? "visible" : "hidden")
        .node().innerHTML =
        Math.round(
          gcDistance(
            arr1[arr1.length - 2][1],
            arr1[arr1.length - 2][0],
            arr1[arr1.length - 1][1],
            arr1[arr1.length - 1][0]
          ) * 0.539957
        ) + "NM";

      drawFunctionTable();
    };
    // Logic for weather picker
    var weaterpickerselected = false;
    var timeselected = 0;

    d3.select("#weather_picker_btn").on("click", () => {
      weaterpickerselected = !weaterpickerselected;
      //  d3.select("#weather_picker_btn").classed("inactive",weaterpickerselected);
      if (weaterpickerselected) {
        d3.select("#weather_picker_btn").style("background-color", "#000");
      } else if (!weaterpickerselected) {
        d3.select("#weather_picker_btn").style("background-color", "#1e70e9");
        d3.select("#dot1").remove();
        timeselected = 0;
      }
    });
    /////////////////////////////////////////////////////////////
    // Logic for extreme weather symbols
    var tsunamisymbolselected = false;
    var nooftsunamisymbol = 0;
    d3.select("#dangerdot-tsunami").on("click", () => {
      d3.select("#dangerdot-tsunami").classed("active", true);
      nooftsunamisymbol += 1;
      tsunamisymbolselected = true;
    });

    var sandstormsymbolselected = false;
    var noofsandstormsymbol = 0;
    d3.select("#dangerdot-sandstorm").on("click", () => {
      d3.select("#dangerdot-sandstorm").classed("active", true);
      noofsandstormsymbol += 1;
      sandstormsymbolselected = true;
    });
    var stormsymbolselected = false;
    var noofstormsymbol = 0;
    d3.select("#dangerdot-storm").on("click", () => {
      d3.select("#dangerdot-storm").classed("active", true);
      noofstormsymbol += 1;
      stormsymbolselected = true;
    });
    var galesymbolselected = false;
    var noofgalesymbol = 0;
    d3.select("#dangerdot-gale").on("click", () => {
      d3.select("#dangerdot-gale").classed("active", true);
      noofgalesymbol += 1;
      galesymbolselected = true;
    });
    var hurricanesymbolselected = false;
    var noofhurricanesymbol = 0;
    d3.select("#dangerdot-hurricane").on("click", () => {
      d3.select("#dangerdot-hurricane").classed("active", true);
      noofhurricanesymbol += 1;
      hurricanesymbolselected = true;
      d3.select("#dangerdot-hurricane").classed("active", false);
    });
    //////////////////////////////////////////////////////////
    // Checking if user has clicked right or not
    var rightclicked = false;
    window.oncontextmenu = function () {
      rightclicked = true;
    };

    function drawLocationMark(point, coord) {
      // show the location on the map if defined
      if (
        fieldAgent.value() &&
        !fieldAgent.value().isInsideBoundary(point[0], point[1])
      ) {
        // UNDONE: Sometimes this is invoked on an old, released field, because new one has not been
        //         built yet, causing the mark to not get drawn.
        return; // outside the field boundary, so ignore.
      }
      if (coord && _.isFinite(coord[0]) && _.isFinite(coord[1])) {
        document.addEventListener("contextmenu", function (e) {
          e.preventDefault();
        });
        if (rightclicked == true) {
          console.log("right_clicked");
          rightclicked = false;
          return;
        }
        var path = d3.geo.path().projection(globe.projection).pointRadius(10);

        d3.select("#foreground")
          .append("defs")
          .append("pattern")
          .attr("id", "imgts")
          .attr("width", 30)
          .attr("height", 30)
          .append("image")
          .attr(
            "xlink:href",
            "https://raw.githubusercontent.com/erikflowers/weather-icons/bb80982bf1f43f2d57f9dd753e7413bf88beb9ed/svg/wi-tsunami.svg"
          )
          .attr("width", 30)
          .attr("height", 30);

        d3.select("#foreground")
          .append("defs")
          .append("pattern")
          .attr("id", "imgss")
          .attr("width", 30)
          .attr("height", 30)
          .append("image")
          .attr(
            "xlink:href",
            "https://raw.githubusercontent.com/erikflowers/weather-icons/bb80982bf1f43f2d57f9dd753e7413bf88beb9ed/svg/wi-sandstorm.svg"
          )
          .attr("width", 30)
          .attr("height", 30);

        d3.select("#foreground")
          .append("defs")
          .append("pattern")
          .attr("id", "imgs")
          .attr("width", 30)
          .attr("height", 30)
          .append("image")
          .attr(
            "xlink:href",
            "https://raw.githubusercontent.com/erikflowers/weather-icons/bb80982bf1f43f2d57f9dd753e7413bf88beb9ed/svg/wi-storm-warning.svg"
          )
          .attr("width", 30)
          .attr("height", 30);

        d3.select("#foreground")
          .append("defs")
          .append("pattern")
          .attr("id", "imgg")
          .attr("width", 30)
          .attr("height", 30)
          .append("image")
          .attr(
            "xlink:href",
            "https://raw.githubusercontent.com/erikflowers/weather-icons/bb80982bf1f43f2d57f9dd753e7413bf88beb9ed/svg/wi-gale-warning.svg"
          )
          .attr("width", 30)
          .attr("height", 30);

        d3.select("#foreground")
          .append("defs")
          .append("pattern")
          .attr("id", "imgh")
          .attr("width", 30)
          .attr("height", 30)
          .append("image")
          .attr(
            "xlink:href",
            "https://raw.githubusercontent.com/erikflowers/weather-icons/bb80982bf1f43f2d57f9dd753e7413bf88beb9ed/svg/wi-hurricane-warning.svg"
          )
          .attr("width", 30)
          .attr("height", 30);
        // Tsunami selected
        if (tsunamisymbolselected) {
          if (d3.event.defaultPrevented) return;
          function dragmove(d) {
            this.x = this.x || 0;
            this.y = this.y || 0;
            // Update thee position with the delta x and y applied by the drag:
            this.x += d3.event.dx;
            this.y += d3.event.dy;

            // Apply the translation to the shape:
            d3.select(this)
              .attr("transform", "translate(" + this.x + "," + this.y + ")")
              .datum({ type: "Point", coordinates: [...coord] })
              .attr(
                "d",
                d3.geo.path().projection(globe.projection).pointRadius(10)
              );

            d3.select("#dangerdot-tsunami").classed("active", true);
          }
          var drag = d3.behavior.drag().on("drag", dragmove);

          var p = { x: point[0], y: point[1] };

          var dangermarkpointtsunami = d3.selectAll(".tsunamidangermarkphoto");
          if (dangermarkpointtsunami[0].length == 0) {
            nooftsunamisymbol = 1;
          }
          var tooltipDatatsunami = "";
          d3.select("#foreground")
            .append("g")
            .attr("id", `tsunamidangermark${nooftsunamisymbol}`)
            .append("path")
            .attr("class", `tsunamidangermarkphoto`)
            .attr("id", `ts-${nooftsunamisymbol}`)
            .datum({ type: "Point", coordinates: [...coord] })
            .attr(
              "d",
              d3.geo.path().projection(globe.projection).pointRadius(10)
            )
            .attr("fill", "url(#imgts)")
            .call(drag);

          d3.select(`#ts-${nooftsunamisymbol}`).on("mouseleave", () => {
            d3.select("#dangerdot-tsunami").classed("active", false);
            d3.select("#dangerdot-sandstorm").classed("active", false);
            d3.select("#dangerdot-storm").classed("active", false);
            d3.select("#dangerdot-gale").classed("active", false);
            d3.select("#dangerdot-hurricane").classed("active", false);
          });

          var tip = d3
            .tip()
            .attr("class", "d3-tip")
            .attr("id", `d3-tip-tsunami-${nooftsunamisymbol}`)
            .offset([-10, 0])
            .html(function () {
              return `<textarea disabled placeholder="" id="text-tooltipdata" >${tooltipDatatsunami}</textarea><br><br>`;
            });

          d3.select(`#tsunamidangermark` + `${nooftsunamisymbol}`).call(tip);

          var contstsunami = 0;
          d3.select(`#tsunamidangermark` + `${nooftsunamisymbol}`).on(
            "mouseover",
            function (d, i) {
              if (contstsunami === 1) {
                let checker = prompt("enter", tooltipDatatsunami);

                tooltipDatatsunami = checker === null ? "" : checker;
              } else if (contstsunami >= 1) {
                tip.show(d, this);
              }
              contstsunami += 1;
            }
          );
          d3.select(`#tsunamidangermark` + `${nooftsunamisymbol}`).on(
            "mouseleave",
            tip.hide
          );

          tsunamisymbolselected = false;
          return;
        }

        var dangermarkpointtsunami = d3.selectAll(".tsunamidangermarkphoto");

        for (var i = 0; i < nooftsunamisymbol; i++) {
          if (dangermarkpointtsunami[0][i]) {
            let x =
              dangermarkpointtsunami[0][i].getBoundingClientRect().left + 7;
            let y =
              dangermarkpointtsunami[0][i].getBoundingClientRect().top + 7;

            if (Math.abs(x - point[0]) <= 30 && Math.abs(y - point[1]) <= 30) {
              d3.select(`#tsunamidangermark${i + 1}`).remove();
              d3.select(`#d3-tip-tsunami-${i + 1}`).remove();

              for (var j = i + 1; j <= dangermarkpointtsunami[0].length; j++) {
                d3.select(`#tsunamidangermark${j}`).attr(
                  "id",
                  `tsunamidangermark${j - 1}`
                );
                d3.select(`#d3-tip-tsunami-${j}`).attr(
                  "id",
                  `d3-tip-tsunami-${j - 1}`
                );
              }

              return;
            }
          }
        }
        // Sandstorm selected
        if (sandstormsymbolselected) {
          if (d3.event.defaultPrevented) return;
          function dragmove(d) {
            this.x = this.x || 0;
            this.y = this.y || 0;
            // Update thee position with the delta x and y applied by the drag:
            this.x += d3.event.dx;
            this.y += d3.event.dy;

            // Apply the translation to the shape:
            d3.select(this)
              .attr("transform", "translate(" + this.x + "," + this.y + ")")
              .datum({ type: "Point", coordinates: [...coord] })
              .attr(
                "d",
                d3.geo.path().projection(globe.projection).pointRadius(10)
              );
            d3.select("#dangerdot-sandstorm").classed("active", true);
          }
          var drag = d3.behavior.drag().on("drag", dragmove);

          var p = { x: point[0], y: point[1] };

          var tooltipDataSandStorm = "";
          var dangermarkpointsandstorm = d3.selectAll(
            ".sandstormdangermarkphoto"
          );
          if (dangermarkpointsandstorm[0].length == 0) {
            noofsandstormsymbol = 1;
          }

          d3.select("#foreground")
            .append("g")
            .attr("id", `sandstormdangermark${noofsandstormsymbol}`)
            .append("path")
            .attr("class", `sandstormdangermarkphoto`)
            .attr("id", `ss-${noofsandstormsymbol}`)
            .datum({ type: "Point", coordinates: [...coord] })
            .attr(
              "d",
              d3.geo.path().projection(globe.projection).pointRadius(10)
            )
            .attr("fill", "url(#imgss)")
            .call(drag);

          d3.select(`#ss-${noofsandstormsymbol}`).on("mouseleave", () => {
            d3.select("#dangerdot-tsunami").classed("active", false);
            d3.select("#dangerdot-sandstorm").classed("active", false);
            d3.select("#dangerdot-storm").classed("active", false);
            d3.select("#dangerdot-gale").classed("active", false);
            d3.select("#dangerdot-hurricane").classed("active", false);
          });
          var tip = d3
            .tip()
            .attr("class", "d3-tip")
            .attr("id", `d3-tip-sandstorm-${noofsandstormsymbol}`)
            .offset([-10, 0])
            .html(function () {
              return `<textarea disabled placeholder="" id="text-tooltipdata" >${tooltipDataSandStorm}</textarea><br><br>`;
            });

          d3.select(`#sandstormdangermark${noofsandstormsymbol}`).call(tip);
          var contssandstorm = 0;
          d3.select(`#sandstormdangermark` + `${noofsandstormsymbol}`).on(
            "mouseover",
            function (d, i) {
              if (contssandstorm === 1) {
                let checker = prompt("enter", tooltipDataSandStorm);

                tooltipDataSandStorm = checker === null ? "" : checker;
              } else if (contssandstorm >= 1) {
                tip.show(d, this);
              }
              contssandstorm += 1;
            }
          );

          sandstormsymbolselected = false;
          return;
        }
        var dangermarkpointsandstorm = d3.selectAll(
          ".sandstormdangermarkphoto"
        );

        for (var i = 0; i < noofsandstormsymbol; i++) {
          if (dangermarkpointsandstorm[0][i]) {
            let x =
              dangermarkpointsandstorm[0][i].getBoundingClientRect().left + 7;
            let y =
              dangermarkpointsandstorm[0][i].getBoundingClientRect().top + 7;

            if (Math.abs(x - point[0]) <= 30 && Math.abs(y - point[1]) <= 30) {
              d3.select(`#sandstormdangermark${i + 1}`).remove();
              d3.select(`#d3-tip-sandstorm-${i + 1}`).remove();

              for (
                var j = i + 1;
                j <= dangermarkpointsandstorm[0].length;
                j++
              ) {
                d3.select(`#sandstormdangermark${j}`).attr(
                  "id",
                  `sandstormdangermark${j - 1}`
                );
                d3.select(`#d3-tip-sandstorm-${j}`).attr(
                  "id",
                  `d3-tip-sandstorm-${j - 1}`
                );
              }

              return;
            }
          }
        }
        //Storm selected
        if (stormsymbolselected) {
          if (d3.event.defaultPrevented) return;
          function dragmove(d) {
            this.x = this.x || 0;
            this.y = this.y || 0;
            // Update thee position with the delta x and y applied by the drag:
            this.x += d3.event.dx;
            this.y += d3.event.dy;

            // Apply the translation to the shape:
            d3.select(this)
              .attr("transform", "translate(" + this.x + "," + this.y + ")")
              .datum({ type: "Point", coordinates: [...coord] })
              .attr(
                "d",
                d3.geo.path().projection(globe.projection).pointRadius(10)
              );
            d3.select("#dangerdot-storm").classed("active", true);
          }
          var drag = d3.behavior.drag().on("drag", dragmove);

          var p = { x: point[0], y: point[1] };

          var dangermarkpointstorm = d3.selectAll(".stormdangermarkphoto");
          if (dangermarkpointstorm[0].length == 0) {
            noofstormsymbol = 1;
          }
          d3.select("#foreground")
            .append("g")
            .attr("id", `stormdangermark${noofstormsymbol}`)
            .append("path")
            .attr("class", `stormdangermarkphoto`)
            .attr("id", `s-${noofstormsymbol}`)
            .datum({ type: "Point", coordinates: [...coord] })
            .attr(
              "d",
              d3.geo.path().projection(globe.projection).pointRadius(10)
            )
            .attr("fill", "url(#imgs)")
            .call(drag);

          var tooltipDatastrom = "";
          d3.select(`#s-${noofstormsymbol}`).on("mouseleave", () => {
            d3.select("#dangerdot-tsunami").classed("active", false);
            d3.select("#dangerdot-sandstorm").classed("active", false);
            d3.select("#dangerdot-storm").classed("active", false);
            d3.select("#dangerdot-gale").classed("active", false);
            d3.select("#dangerdot-hurricane").classed("active", false);
          });
          var tip = d3
            .tip()
            .attr("class", "d3-tip")
            .attr("id", `d3-tip-storm-${noofstormsymbol}`)
            .offset([-10, 0])
            .html(function () {
              return `<textarea disabled placeholder="" id="text-tooltipdata" >${tooltipDatastrom}</textarea><br><br>`;
            });

          d3.select(`#stormdangermark${noofstormsymbol}`).call(tip);
          var contsstrom = 0;
          d3.select(`#stormdangermark` + `${noofstormsymbol}`).on(
            "mouseover",
            function (d, i) {
              if (contsstrom === 1) {
                let checker = prompt("enter", tooltipDatastrom);

                tooltipDatastrom = checker === null ? "" : checker;
              } else if (contsstrom >= 1) {
                tip.show(d, this);
              }
              contsstrom += 1;
            }
          );

          stormsymbolselected = false;
          return;
        }

        var dangermarkpointstorm = d3.selectAll(".stormdangermarkphoto");

        for (var i = 0; i < noofstormsymbol; i++) {
          if (dangermarkpointstorm[0][i]) {
            let x = dangermarkpointstorm[0][i].getBoundingClientRect().left + 7;
            let y = dangermarkpointstorm[0][i].getBoundingClientRect().top + 7;

            if (Math.abs(x - point[0]) <= 30 && Math.abs(y - point[1]) <= 30) {
              d3.select(`#stormdangermark${i + 1}`).remove();
              d3.select(`#d3-tip-storm-${i + 1}`).remove();

              for (var j = i + 1; j <= dangermarkpointstorm[0].length; j++) {
                d3.select(`#stormdangermark${j}`).attr(
                  "id",
                  `stormdangermark${j - 1}`
                );
                d3.select(`#d3-tip-storm-${j}`).attr(
                  "id",
                  `d3-tip-storm-${j - 1}`
                );
              }

              return;
            }
          }
        }

        //Gale selected
        if (galesymbolselected) {
          if (d3.event.defaultPrevented) return;
          function dragmove(d) {
            this.x = this.x || 0;
            this.y = this.y || 0;
            // Update thee position with the delta x and y applied by the drag:
            this.x += d3.event.dx;
            this.y += d3.event.dy;

            // Apply the translation to the shape:
            d3.select(this)
              .attr("transform", "translate(" + this.x + "," + this.y + ")")
              .datum({ type: "Point", coordinates: [...coord] })
              .attr(
                "d",
                d3.geo.path().projection(globe.projection).pointRadius(10)
              );
            d3.select("#dangerdot-gale").classed("active", true);
          }
          var drag = d3.behavior.drag().on("drag", dragmove);

          var p = { x: point[0], y: point[1] };

          var dangermarkpointgale = d3.selectAll(".galedangermarkphoto");

          if (dangermarkpointgale[0].length == 0) {
            noofgalesymbol = 1;
          }

          d3.select("#foreground")
            .append("g")
            .attr("id", `galedangermark${noofgalesymbol}`)
            .append("path")
            .attr("class", `galedangermarkphoto`)
            .attr("id", `gs-${noofgalesymbol}`)
            .datum({ type: "Point", coordinates: [...coord] })
            .attr(
              "d",
              d3.geo.path().projection(globe.projection).pointRadius(10)
            )
            .attr("fill", "url(#imgg)")
            .call(drag);

          d3.select(`#gs-${noofgalesymbol}`).on("mouseleave", () => {
            d3.select("#dangerdot-tsunami").classed("active", false);
            d3.select("#dangerdot-sandstorm").classed("active", false);
            d3.select("#dangerdot-storm").classed("active", false);
            d3.select("#dangerdot-gale").classed("active", false);
            d3.select("#dangerdot-hurricane").classed("active", false);
          });
          var tooltipDatagale = "";
          var tip = d3
            .tip()
            .attr("class", "d3-tip")
            .attr("id", `d3-tip-gale-${noofgalesymbol}`)
            .offset([-10, 0])
            .html(function () {
              return `<textarea disabled placeholder="" id="text-tooltipdata" >${tooltipDatagale}</textarea><br><br>`;
            });

          d3.select(`#galedangermark${noofgalesymbol}`).call(tip);
          var contsgale = 0;
          d3.select(`#galedangermark` + `${noofgalesymbol}`).on(
            "mouseover",
            function (d, i) {
              if (contsgale === 1) {
                let checker = prompt("enter", tooltipDatagale);

                tooltipDatagale = checker === null ? "" : checker;
              } else if (contsgale >= 1) {
                tip.show(d, this);
              }
              contsgale += 1;
            }
          );

          galesymbolselected = false;
          return;
        }

        var dangermarkpointgale = d3.selectAll(".galedangermarkphoto");

        for (var i = 0; i < noofgalesymbol; i++) {
          if (dangermarkpointgale[0][i]) {
            let x = dangermarkpointgale[0][i].getBoundingClientRect().left + 7;
            let y = dangermarkpointgale[0][i].getBoundingClientRect().top + 7;

            if (Math.abs(x - point[0]) <= 30 && Math.abs(y - point[1]) <= 30) {
              d3.select(`#galedangermark${i + 1}`).remove();
              d3.select(`#d3-tip-gale-${i + 1}`).remove();

              for (var j = i + 1; j <= dangermarkpointgale[0].length; j++) {
                d3.select(`#galedangermark${j}`).attr(
                  "id",
                  `galedangermark${j - 1}`
                );
                d3.select(`#d3-tip-gale-${j}`).attr(
                  "id",
                  `d3-tip-gale-${j - 1}`
                );
              }

              return;
            }
          }
        }

        //Hurricane selected
        if (hurricanesymbolselected) {
          if (d3.event.defaultPrevented) return;
          function dragmove(d) {
            this.x = this.x || 0;
            this.y = this.y || 0;
            // Update thee position with the delta x and y applied by the drag:
            this.x += d3.event.dx;
            this.y += d3.event.dy;

            // Apply the translation to the shape:
            d3.select(this)
              .attr("transform", "translate(" + this.x + "," + this.y + ")")
              .datum({ type: "Point", coordinates: [...coord] })
              .attr(
                "d",
                d3.geo.path().projection(globe.projection).pointRadius(10)
              );
            d3.select("#dangerdot-hurricane").classed("active", true);
          }
          var drag = d3.behavior.drag().on("drag", dragmove);

          var p = { x: point[0], y: point[1] };

          var dangermarkpointhurricane = d3.selectAll(
            ".hurricanedangermarkphoto"
          );
          if (dangermarkpointhurricane[0].length == 0) {
            noofhurricanesymbol = 1;
          }
          d3.select("#foreground")
            .append("g")
            .attr("id", `hurricanedangermark${noofhurricanesymbol}`)
            .append("path")
            .attr("class", `hurricanedangermarkphoto`)
            .attr("id", `hr-${noofhurricanesymbol}`)
            .datum({ type: "Point", coordinates: [...coord] })
            .attr(
              "d",
              d3.geo.path().projection(globe.projection).pointRadius(10)
            )
            .attr("fill", "url(#imgh)")
            .call(drag);

          d3.select(`#hr-${noofhurricanesymbol}`).on("mouseleave", () => {
            d3.select("#dangerdot-tsunami").classed("active", false);
            d3.select("#dangerdot-sandstorm").classed("active", false);
            d3.select("#dangerdot-storm").classed("active", false);
            d3.select("#dangerdot-gale").classed("active", false);
            d3.select("#dangerdot-hurricane").classed("active", false);
          });
          var tooltipDatahurricane = "";

          var tip = d3
            .tip()
            .attr("class", "d3-tip")
            .attr("id", `d3-tip-hurricane-${noofhurricanesymbol}`)
            .offset([-10, 0])
            .html(function () {
              return `<textarea disabled placeholder="" id="text-tooltipdata" >${tooltipDatahurricane}</textarea><br><br>`;
            });

          d3.select(`#hurricanedangermark${noofhurricanesymbol}`).call(tip);
          var contsthurricane = 0;
          d3.select(`#hurricanedangermark` + `${noofhurricanesymbol}`).on(
            "mouseover",
            function (d, i) {
              if (contsthurricane === 1) {
                let checker = prompt("enter", tooltipDatahurricane);

                tooltipDatahurricane = checker === null ? "" : checker;
              } else if (contsthurricane >= 1) {
                tip.show(d, this);
              }
              contsthurricane += 1;
            }
          );

          hurricanesymbolselected = false;
          return;
        }

        var dangermarkpointhurricane = d3.selectAll(
          ".hurricanedangermarkphoto"
        );

        for (var i = 0; i < noofhurricanesymbol; i++) {
          if (dangermarkpointhurricane[0][i]) {
            let x =
              dangermarkpointhurricane[0][i].getBoundingClientRect().left + 7;
            let y =
              dangermarkpointhurricane[0][i].getBoundingClientRect().top + 7;

            if (Math.abs(x - point[0]) <= 30 && Math.abs(y - point[1]) <= 30) {
              d3.select(`#hurricanedangermark${i + 1}`).remove();
              d3.select(`#d3-tip-hurricane-${i + 1}`).remove();

              for (
                var j = i + 1;
                j <= dangermarkpointhurricane[0].length;
                j++
              ) {
                d3.select(`#hurricanedangermark${j}`).attr(
                  "id",
                  `hurricanedangermark${j - 1}`
                );
                d3.select(`#d3-tip-hurricane-${j}`).attr(
                  "id",
                  `d3-tip-hurricane-${j - 1}`
                );
              }

              return;
            }
          }
        }

        ///////////////////////////////////////////////////////////
        var f1 = getWindAtLocation(coord)[0];
        var f2 = getWindAtLocation(coord)[1];
        if (weaterpickerselected) {
          if (d3.event.defaultPrevented) return;
          timeselected += 1;

          var weatherText =
            "<strong>Location: <span style='color:white; font-size:10px'>" +
            formatLatitudeAndLongtitude(coord)["longitude"] +
            "," +
            formatLatitudeAndLongtitude(coord)["latitude"] +
            "</strong>" +
            "</span> <br> <strong>Weather: <span style='color:white; font-size:10px'>" +
            f1 +
            f2 +
            "</strong>";

          function dragmoveWeather(d) {
            this.x = this.x || 0;
            this.y = this.y || 0;
            // Update thee position with the delta x and y applied by the drag:
            this.x += d3.event.dx;
            this.y += d3.event.dy;
            d3.select("#weather_picker_btn").classed("inactive", true);

            // Apply the translation to the shape:
            weatherText =
              "<strong>Location: <span style='color:white; font-size:10px'>" +
              formatLatitudeAndLongtitude([
                coord[0] + d3.event.dx,
                coord[1] + d3.event.dy,
              ])["longitude"] +
              "," +
              formatLatitudeAndLongtitude([
                coord[0] + d3.event.dx,
                coord[1] + d3.event.dy,
              ])["latitude"] +
              "</strong>" +
              "</span> <br> <strong>Weather: <span style='color:white; font-size:10px'>" +
              f1 +
              f2 +
              "</strong>";
            d3.select(this)
              .attr("transform", "translate(" + this.x + "," + this.y + ")")
              .attr(
                "d",
                d3.geo.path().projection(globe.projection).pointRadius(5)
              );
          }
          // Extract the click location\
          var draggerWeather = d3.behavior.drag().on("drag", dragmoveWeather);

          var p = { x: point[0], y: point[1] };

          if (timeselected > 1) {
            d3.select("#dot1").remove();
            d3.select("#foreground")
              .append("g")
              .append("path")
              .datum({ type: "Point", coordinates: [...coord] })
              .attr(
                "d",
                d3.geo.path().projection(globe.projection).pointRadius(5)
              )
              .attr("class", "dot1")
              .attr("id", "dot1")
              .style("cursor", "pointer")
              .style("fill", "white")
              .call(draggerWeather);

            var tip = d3
              .tip()
              .attr("class", "d3-tip")
              .offset([-10, 0])
              .html(function () {
                return weatherText;
              });

            d3.select("#dot1").call(tip);

            d3.select("#dot1")
              .on("mouseover", tip.show)
              .on("mouseout", tip.hide)
              .on("mouseleave", () => {
                d3.select("#weather_picker_btn").classed("inactive", false);
              });
          } else if (timeselected == 1) {
            // Append a new point
            d3.select("#foreground")
              .append("g")
              .append("path")
              .datum({ type: "Point", coordinates: [...coord] })
              .attr(
                "d",
                d3.geo.path().projection(globe.projection).pointRadius(5)
              )
              .attr("class", "dot1")
              .attr("id", "dot1")
              .style("cursor", "pointer")
              .style("fill", "white")
              .call(draggerWeather);

            var tip = d3
              .tip()
              .attr("class", "d3-tip")
              .offset([-10, 0])
              .html(function () {
                return weatherText;
              });

            d3.select("#dot1").call(tip);

            d3.select("#dot1")
              .on("mouseover", tip.show)

              .on("mouseout", tip.hide)
              .on("mouseleave", () => {
                d3.select("#weather_picker_btn").classed("inactive", false);
              });
          }

          return;
        }

        //////////////////////////////////////////////////////////////

        d3.select("#insert_point_blank").style("display", "none");

        let oldpoints = d3.selectAll(".location-mark");
        let crossmarks = d3.selectAll(".cross-mark");
        for (let i = 0; i < crossmarks[0].length; i++) {
          let x = crossmarks[0][i].getBoundingClientRect().left + 7;
          let y = crossmarks[0][i].getBoundingClientRect().top + 7;

          if (
            Math.abs(x - point[0]) <= 5 &&
            Math.abs(y - point[1]) <= 5 &&
            selected_point === null
          ) {
            return;
          }
        }

        if (line_hovered.status) {
          arr.splice(line_hovered.index - 1, 0, coord);
          coorarr.splice(line_hovered.index - 1, 0, point);
          line_hovered = {
            status: false,
            index: null,
          };
          redrawTable();
          redrawPath();
          return;
        }
        // Point relocation on dragging
        for (let i = 0; i < oldpoints[0].length; i++) {
          //oldpoints = d3.selectAll(".location-mark");

          let x = oldpoints[0][i].getBoundingClientRect().left + 7;
          let y = oldpoints[0][i].getBoundingClientRect().top + 7;

          if (
            Math.abs(x - point[0]) <= 7 &&
            Math.abs(y - point[1]) <= 7 &&
            selected_point === null
          ) {
            previous_state = {
              operation: "DRAG",
              index: i,
              coord: coord,
              point: point,
            };
            selected_point = oldpoints[0][i];
            clicked = i;
            d3.select(`.location-mark-${clicked + 1}`)
              .style("fill", "#FFC400")
              .style("stroke", "#FFC400");

            console.log("clicked point", i);
            return;
          }
        }

        if (selected_point !== null) {
          arr[clicked] = coord;
          coorarr[clicked] = point;
          d3.select(`.location-mark-${clicked + 1}`)
            .datum({ type: "Point", coordinates: coord })
            .attr("d", path)
            .style("fill", "#D32F2F")
            .style("stroke", "#D32F2F");

          // .attr("fill", "green");
          d3.select(`.text-mark-${clicked + 1}`)
            .attr("x", point[0] - 5)
            .attr("y", point[1] + 6);

          d3.select(`.cross-mark-${clicked + 1}`)
            .attr("x", point[0] + 7)
            .attr("y", point[1] + 7);

          if (currentshiplocation == clicked) {
            d3.select(".ship")
              .datum({
                type: "Point",
                coordinates: [coord[0] - 1.5, coord[1] - 1.5],
              })
              .attr("d", path);
            moveShip();
          }
          if (d3.select("#break-point-" + clicked).node() !== null) {
            var formattedCoordinates = formatLatitudeAndLongtitude(coord);
            d3.select("#break-point-" + clicked).node().value =
              formattedCoordinates["latitude"] +
              " , " +
              formattedCoordinates["longitude"];
            var [val, unit] = getWindAtLocation(coord);
            d3
              .select("#weather-data-" + clicked)
              .node().value = `${val} ${unit}`;
          }

          /* d3.select("#foreground")
             .append("g")
             .attr("id", `div-mark-${clicked + 1}`)
             .append("path")
             .attr("class", `location-mark location-mark-${clicked + 1}`)
             .datum({ type: "Point", coordinates: coord })
             .attr("d", path)
             .attr("fill", "none"); */
          //oldpoints[0][clicked] = d3.select(`.location-mark-${clicked + 1}`);

          // Modify line on dragging points
          if (clicked !== 0 && clicked !== oldpoints[0].length - 1) {
            console.log("CLicked: ", clicked);
            rldis = [];
            gcdis = [];
            totaltimetaken = 0;

            let x_previous =
              oldpoints[0][clicked - 1].getBoundingClientRect().left + 7;
            let y_previous =
              oldpoints[0][clicked - 1].getBoundingClientRect().top + 7;
            let x_next =
              oldpoints[0][clicked + 1].getBoundingClientRect().left + 7;
            let y_next =
              oldpoints[0][clicked + 1].getBoundingClientRect().top + 7;
            d3.select("#line-" + clicked)
              .select(`.location-line-${clicked + 1}`)
              .datum({
                type: "Line",
                data: [
                  [x_previous, y_previous],
                  [point[0], point[1]],
                ],
              })
              .attr(
                "d",
                d3.svg.line()([
                  [x_previous, y_previous],
                  [point[0], point[1]],
                ])
              )
              .attr(
                "value",
                d3.svg.line()([
                  [x_previous, y_previous],
                  [point[0], point[1]],
                ])
              );

            d3.selectAll(".gc-dist").remove();
            d3.selectAll(".rl-dist").remove();

            for (let j = 2; j <= arr.length; j++) {
              insertDistance(arr.slice(0, j), coorarr.slice(0, j));
            }

            d3.select(`#line-${clicked + 1}`)
              .select(`.location-line-${clicked + 2}`)
              .datum({
                type: "Line",
                data: [
                  [point[0], point[1]],
                  [x_next, y_next],
                ],
              })
              .attr(
                "d",
                d3.svg.line()([
                  [point[0], point[1]],
                  [x_next, y_next],
                ])
              )
              .attr(
                "value",
                d3.svg.line()([
                  [point[0], point[1]],
                  [x_next, y_next],
                ])
              );
            ///////////////////////////// GC logic

            var link = {
              type: "LineString",
              coordinates: [arr[clicked - 1], coord],
            };
            d3.select("#gc-line" + (clicked + 1)).attr("d", path(link));

            var link = {
              type: "LineString",
              coordinates: [coord, arr[clicked + 1]],
            };
            d3.select("#gc-line" + (clicked + 2)).attr("d", path(link));

            ///////////////////
          } else if (clicked === 0) {
            d3.selectAll(".gc-dist").remove();
            d3.selectAll(".rl-dist").remove();
            rldis = [];
            gcdis = [];
            totaltimetaken = 0;

            for (let j = 2; j <= arr.length; j++) {
              insertDistance(arr.slice(0, j), coorarr.slice(0, j));
            }

            if (arr.length > 1) {
              let x_next =
                oldpoints[0][clicked + 1].getBoundingClientRect().left + 7;
              let y_next =
                oldpoints[0][clicked + 1].getBoundingClientRect().top + 7;
              d3.select(`#line-${clicked + 1}`)
                .select(`.location-line-${clicked + 2}`)
                .datum({
                  type: "Line",
                  data: [
                    [point[0], point[1]],
                    [x_next, y_next],
                  ],
                })
                .attr(
                  "d",
                  d3.svg.line()([
                    [point[0], point[1]],
                    [x_next, y_next],
                  ])
                )
                .attr(
                  "value",
                  d3.svg.line()([
                    [point[0], point[1]],
                    [x_next, y_next],
                  ])
                );

              var link = {
                type: "LineString",
                coordinates: [arr[clicked + 1], coord],
              };
              d3.select("#gc-line" + (clicked + 2)).attr("d", path(link));
            }
            pointsArr = point;
          } else if (clicked === oldpoints[0].length - 1) {
            rldis = [];
            gcdis = [];
            totaltimetaken = 0;
            d3.selectAll(".gc-dist").remove();
            d3.selectAll(".rl-dist").remove();
            for (let j = 2; j <= arr.length; j++) {
              insertDistance(arr.slice(0, j), coorarr.slice(0, j));
            }

            let x_previous =
              oldpoints[0][clicked - 1].getBoundingClientRect().left + 7;
            let y_previous =
              oldpoints[0][clicked - 1].getBoundingClientRect().top + 7;
            d3.select("#line-" + clicked)
              .select(`.location-line-${clicked + 1}`)
              .datum({
                type: "Line",
                data: [
                  [x_previous, y_previous],
                  [point[0], point[1]],
                ],
              })
              .attr(
                "d",
                d3.svg.line()([
                  [x_previous, y_previous],
                  [point[0], point[1]],
                ])
              )
              .attr(
                "value",
                d3.svg.line()([
                  [x_previous, y_previous],
                  [point[0], point[1]],
                ])
              );
            pointsArr = point;

            var link = {
              type: "LineString",
              coordinates: [arr[clicked - 1], coord],
            };
            d3.select("#gc-line" + (clicked + 1)).attr("d", path(link));
          }
          selected_point = null;
          clicked = -1;
          drawFunctionTable();
          return;
        }
        // Adding x-y data ,coordinates and velocity
        arr = [...arr, coord];
        coorarr = [...coorarr, point];

        velocityarr = [...velocityarr, 0];

        if (arr.length > 1) {
          d3.select(`#div-mark-${arr.length - 1}`).remove();
          const index = arr.length;

          // Creating rhumb circles  , crossmarks,textmarks and line
          d3.select("#foreground")
            .append("g")
            .attr("id", "line-" + (arr.length - 1))
            .attr("class", "line-route")
            .append("path")
            .attr("class", `location-line location-line-${arr.length}`)
            .datum({
              type: "Line",
              data: [
                [point[0], point[1]],
                [pointsArr[0], pointsArr[1]],
              ],
            })
            .attr(
              "d",
              d3.svg.line()([
                [point[0], point[1]],
                [pointsArr[0], pointsArr[1]],
              ])
            )
            .attr(
              "value",
              d3.svg.line()([
                [point[0], point[1]],
                [pointsArr[0], pointsArr[1]],
              ])
            )
            .on("click", () => {
              console.log("Line Clicked");
            })
            .on("mouseover", () => {
              d3.select(`.location-line-${index}`).attr(
                "class",
                `location-line location-line-${index} line-hovered`
              );
              line_hovered = {
                status: true,
                index: index,
              };
            })
            .on("mouseout", () => {
              d3.select(`.location-line-${index}`).attr(
                "class",
                `location-line location-line-${index}`
              );
              line_hovered = {
                status: false,
                index: null,
              };
            });

          insertDistance(arr, coorarr);
          // Create gc lines
          var link = {
            type: "LineString",
            coordinates: [arr[arr.length - 2], arr[arr.length - 1]],
          };
          d3.select("#foreground")
            .append("path")
            .attr("id", "gc-line" + arr.length)
            .attr("d", path(link))
            .attr("class", "gc-route")
            .style("fill", "none")
            .style("stroke", "orange")
            .style("stroke-width", 4);

          let mark = d3
            .select("#foreground")
            .append("g")
            .attr("id", `div-mark-${arr.length - 1}`)
            .attr("class", "div-mark")
            .attr("name", `div-mark-${arr.length - 1}`)
            .append("path")
            .attr("class", `location-mark location-mark-${arr.length - 1}`)
            .datum({ type: "Point", coordinates: arr[arr.length - 2] })
            .attr("d", path);
          d3
            .select(`#div-mark-${arr.length - 1}`)
            .append("text")
            .attr("class", `text-mark text-mark-${arr.length - 1}`)
            .attr("x", coorarr[coorarr.length - 2][0] - 5)
            .attr("y", coorarr[coorarr.length - 2][1] + 6)
            .node().innerHTML = arr.length - 1;

          const delete_index = arr.length - 1;
          d3.select(`#div-mark-${arr.length - 1}`)
            .append("svg")
            .attr("class", `cross-mark cross-mark-${arr.length - 1}`)
            .attr("x", coorarr[coorarr.length - 2][0] + 7)
            .attr("y", coorarr[coorarr.length - 2][1] + 7)
            .append("image")
            .attr(
              "href",
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAMjx-6QpMneLjryXGboe7v86rJV8u6kNJPlj-IEfCgCq8R69VlQGLPGj2C1gqBaRnyB0&usqp=CAU"
            )
            .style("width", "15px")
            .style("height", "15x")
            .on("click", (event) => {
              deletePoint(delete_index - 1);
            });
          let cross_tg = d3.select(`.cross-mark-${delete_index}`);
          d3.select(`#div-mark-${delete_index}`)
            .on("mouseover", () => {
              cross_tg.style("opacity", 1);
            })
            .on("mouseleave", () => {
              cross_tg.style("opacity", 0);
            });
        }
        if (arr.length == 1) {
          /* d3.select("#foreground")
             .append("g")
             .attr("id", "ship")
             .append("path")
             .attr("class", `ship`)
             .datum({
               type: "Point",
               coordinates: [arr[0][0] - 1.5, arr[0][1] - 1.5],
             })
             .attr("d", path); */
          plotShip(coorarr[0][0], coorarr[0][1]);
        }

        let mark = d3
          .select("#foreground")
          .append("g")
          .attr("id", `div-mark-${arr.length}`)
          .attr("class", "div-mark")
          .attr("name", `div-mark-${arr.length}`)
          .append("path")
          .attr("class", `location-mark location-mark-${arr.length}`)
          .datum({ type: "Point", coordinates: coord })
          .attr("d", path);

        d3
          .select(`#div-mark-${arr.length}`)
          .append("text")
          .attr("class", `text-mark text-mark-${arr.length}`)
          .attr("x", point[0] - 5)
          .attr("y", point[1] + 6)
          .node().innerHTML = arr.length;

        const delete_index = arr.length;

        d3.select(`#div-mark-${arr.length}`)
          .append("svg")
          .attr("class", `cross-mark cross-mark-${arr.length}`)
          .attr("x", point[0] + 7)
          .attr("y", point[1] + 7)
          .append("image")
          .attr(
            "href",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAMjx-6QpMneLjryXGboe7v86rJV8u6kNJPlj-IEfCgCq8R69VlQGLPGj2C1gqBaRnyB0&usqp=CAU"
          )
          .style("width", "15px")
          .style("height", "15x")
          .on("click", (event) => {
            deletePoint(delete_index - 1);
          });
        var cross_tg = d3.select(`.cross-mark-${arr.length}`);
        d3.select(`#div-mark-${arr.length}`)
          .on("mouseover", () => {
            cross_tg.style("opacity", 1);
          })
          .on("mouseleave", () => {
            cross_tg.style("opacity", 0);
          });
        redrawTable();

        d3.select(`.nextlocation`).on("click", function () {
          console.log("Next Location");
          if (currentshiplocation < arr.length - 1) {
            currentshiplocation++;
            d3.select(".ship")
              .datum({
                type: "Point",
                coordinates: [
                  arr[currentshiplocation][0] - 1.5,
                  arr[currentshiplocation][1] - 1.5,
                ],
              })
              .attr("d", path);
            moveShip();
          }
        });

        d3.select(`.sourcelocation`).on("click", function () {
          currentshiplocation = 0;
          d3.select(".ship")
            .datum({
              type: "Point",
              coordinates: [
                arr[currentshiplocation][0] - 1.5,
                arr[currentshiplocation][1] - 1.5,
              ],
            })
            .attr("d", path);
          moveShip();
        });

        d3.select(`.destinationlocation`).on("click", function () {
          currentshiplocation = arr.length - 1;
          d3.select(".ship")
            .datum({
              type: "Point",
              coordinates: [
                arr[currentshiplocation][0] - 1.5,
                arr[currentshiplocation][1] - 1.5,
              ],
            })
            .attr("d", path);
          moveShip();
        });

        d3.select(`.previouslocation`).on("click", function () {
          if (currentshiplocation > 0) {
            currentshiplocation--;
            d3.select(".ship")
              .datum({
                type: "Point",
                coordinates: [
                  arr[currentshiplocation][0] - 1.5,
                  arr[currentshiplocation][1] - 1.5,
                ],
              })
              .attr("d", path);
            moveShip();
          }
        });

        pointsArr = point;
        var formattedCoordinates = formatLatitudeAndLongtitude(coord);

        // if (arr.length >= breakpoints) addCoorRow();

        if (d3.select("#break-point-" + (arr.length - 1)).node() != null) {
          d3.select("#break-point-" + (arr.length - 1)).node().value =
            formattedCoordinates["latitude"] +
            " , " +
            formattedCoordinates["longitude"];
          var [val, unit] = getWindAtLocation(coord);
          d3
            .select("#weather-data-" + (arr.length - 1))
            .node().value = `${val} ${unit}`;
        }

        if (currentmode == "gc") {
          d3.selectAll(".line-route").style("visibility", " hidden");

          d3.selectAll(".gc-route").style("visibility", "visible");
        } else {
          d3.selectAll(".line-route").style("visibility", "visible");

          d3.selectAll(".gc-route").style("visibility", " hidden");
        }
        drawFunctionTable();
        return mark;
      }
    }

    // Called when we click Undo button Function
    const undoOperation = () => {
      if (!previous_state) {
        return;
      }
      if (previous_state.operation === "DELETE") {
        if (previous_state.index === arr.length) {
          pointsArr = previous_state.point;
        }
        arr.splice(previous_state.index, 0, previous_state.coord);
        coorarr.splice(previous_state.index, 0, previous_state.point);
        redrawPath();
        redrawTable();
        previous_state = null;
      } else if (previous_state.operation === "DRAG") {
        arr[previous_state.index] = previous_state.coord;
        coorarr[previous_state.index] = previous_state.point;
        redrawPath();
        redrawTable();
        previous_state = null;
      }
      drawFunctionTable();
    };

    //Undo Button functionality
    d3.select("#undo_btn").on("click", () => {
      undoOperation();
    });

    d3.select(`.nextlocation`).on("click", function () {
      console.log("Next Location");
      if (currentshiplocation < arr.length - 1) {
        currentshiplocation++;
        d3.select(".ship")
          .datum({
            type: "Point",
            coordinates: [
              arr[currentshiplocation][0] - 1.5,
              arr[currentshiplocation][1] - 1.5,
            ],
          })
          .attr("d", path);
        moveShip();
      }
    });

    d3.select(`.sourcelocation`).on("click", function () {
      currentshiplocation = 0;
      d3.select(".ship")
        .datum({
          type: "Point",
          coordinates: [
            arr[currentshiplocation][0] - 1.5,
            arr[currentshiplocation][1] - 1.5,
          ],
        })
        .attr("d", path);
      moveShip();
    });

    d3.select(`.destinationlocation`).on("click", function () {
      currentshiplocation = arr.length - 1;
      d3.select(".ship")
        .datum({
          type: "Point",
          coordinates: [
            arr[currentshiplocation][0] - 1.5,
            arr[currentshiplocation][1] - 1.5,
          ],
        })
        .attr("d", path);
      moveShip();
    });

    d3.select(`.previouslocation`).on("click", function () {
      if (currentshiplocation > 0) {
        currentshiplocation--;
        d3.select(".ship")
          .datum({
            type: "Point",
            coordinates: [
              arr[currentshiplocation][0] - 1.5,
              arr[currentshiplocation][1] - 1.5,
            ],
          })
          .attr("d", path);
        moveShip();
      }
    });

    const redrawPath = () => {
      d3.selectAll(".div-mark").remove();
      d3.selectAll(".line-route").remove();
      d3.selectAll(".text-mark").remove();
      d3.selectAll(".cross-mark").remove();
      d3.selectAll(".gc-route").remove();
      d3.selectAll(".gc-dist").remove();
      d3.select("#new_ship").remove();
      localStorage.setItem("arr", JSON.stringify(arr));
      localStorage.setItem("coorarr", JSON.stringify(coorarr));

      for (let i = 0; i < arr.length; i++) {
        if (i > 0) {
          d3.select(`#div-mark-${i}`).remove();

          d3.select("#foreground")
            .append("g")
            .attr("id", "line-" + i)
            .attr("class", "line-route")
            .append("path")
            .attr("class", `location-line location-line-${i + 1}`)
            .datum({
              type: "Line",
              data: [
                [coorarr[i][0], coorarr[i][1]],
                [coorarr[i - 1][0], coorarr[i - 1][1]],
              ],
            })
            .attr(
              "d",
              d3.svg.line()([
                [coorarr[i][0], coorarr[i][1]],
                [coorarr[i - 1][0], coorarr[i - 1][1]],
              ])
            )
            .attr(
              "value",
              d3.svg.line()([
                [coorarr[i][0], coorarr[i][1]],
                [coorarr[i - 1][0], coorarr[i - 1][1]],
              ])
            )
            .on("mouseover", () => {
              d3.select(`.location-line-${i + 1}`).attr(
                "class",
                `location-line location-line-${i + 1} line-hovered`
              );
              line_hovered = {
                status: true,
                index: i + 1,
              };
            })
            .on("mouseout", () => {
              d3.select(`.location-line-${i + 1}`).attr(
                "class",
                `location-line location-line-${i + 1}`
              );
              line_hovered = {
                status: false,
                index: null,
              };
            });
          var link = {
            type: "LineString",
            coordinates: [arr[i - 1], arr[i]],
          };
          d3.select("#foreground")
            .append("path")
            .attr("id", "gc-line" + i)
            .attr("d", path(link))
            .attr("class", "gc-route")
            .style("fill", "none")
            .style("stroke", "orange")
            .style("stroke-width", 4);

          d3.select("#foreground")
            .append("g")
            .attr("id", `div-mark-${i}`)
            .attr("class", "div-mark")
            .attr("name", `div-mark-${i}`)
            .append("path")
            .attr("class", `location-mark location-mark-${i}`)
            .datum({ type: "Point", coordinates: arr[i - 1] })
            .attr("d", path);

          if (i == 0) {
            /* d3.select("#foreground")
               .append("g")
               .attr("id", "ship")
               .append("path")
               .attr("class", `ship`)
               .datum({
                 type: "Point",
                 coordinates: [arr[0][0] - 1.5, arr[0][1] - 1.5],
               })
               .attr("d", path); */
            if (currentshiplocation < 0 || currentshiplocation >= arr.length) {
              currentshiplocation = 0;
            }
            plotShip(
              coorarr[currentshiplocation][0],
              coorarr[currentshiplocation][1]
            );
          }

          d3
            .select(`#div-mark-${i}`)
            .append("text")
            .attr("class", `text-mark text-mark-${i}`)
            .attr("x", coorarr[i - 1][0] - 2)
            .attr("y", coorarr[i - 1][1] + 9)
            .node().innerHTML = i;

          d3.select(`#div-mark-${i}`)
            .append("svg")
            .attr("class", `cross-mark cross-mark-${i}`)
            .attr("x", coorarr[i - 1][0] + 7)
            .attr("y", coorarr[i - 1][1] + 7)
            .append("image")
            .attr(
              "href",
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAMjx-6QpMneLjryXGboe7v86rJV8u6kNJPlj-IEfCgCq8R69VlQGLPGj2C1gqBaRnyB0&usqp=CAU"
            )
            .style("width", "15px")
            .style("height", "15x")
            .on("click", (event) => {
              deletePoint(i - 1);
            });

          let cross_tg1 = d3.select(`.cross-mark-${i}`);
          d3.select(`#div-mark-${i}`)
            .on("mouseover", () => {
              cross_tg1.style("opacity", 1);
            })
            .on("mouseleave", () => {
              cross_tg1.style("opacity", 0);
            });
        }
        d3.select("#foreground")
          .append("g")
          .attr("id", `div-mark-${i + 1}`)
          .attr("class", "div-mark")
          .attr("name", `div-mark-${i + 1}`)
          .append("path")
          .attr("class", `location-mark location-mark-${i + 1}`)
          .datum({ type: "Point", coordinates: arr[i] })
          .attr("d", path);

        if (i == 0) {
          /* d3.select("#foreground")
             .append("g")
             .attr("id", "ship")
             .append("path")
             .attr("class", `ship`)
             .datum({
               type: "Point",
               coordinates: [arr[0][0] - 1.5, arr[0][1] - 1.5],
             })
             .attr("d", path); */
          if (currentshiplocation < 0 || currentshiplocation >= arr.length) {
            currentshiplocation = 0;
          }
          plotShip(
            coorarr[currentshiplocation][0],
            coorarr[currentshiplocation][1]
          );
        }

        d3
          .select(`#div-mark-${i + 1}`)
          .append("text")
          .attr("class", `text-mark text-mark-${i + 1}`)
          .attr("x", coorarr[i][0] - 2)
          .attr("y", coorarr[i][1] + 9)
          .node().innerHTML = i + 1;

        d3.select(`#div-mark-${i + 1}`)
          .append("svg")
          .attr("class", `cross-mark cross-mark-${i + 1}`)
          .attr("x", coorarr[i][0] + 7)
          .attr("y", coorarr[i][1] + 7)
          .append("image")
          .attr(
            "href",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAMjx-6QpMneLjryXGboe7v86rJV8u6kNJPlj-IEfCgCq8R69VlQGLPGj2C1gqBaRnyB0&usqp=CAU"
          )
          .style("width", "15px")
          .style("height", "15x")
          .on("click", (event) => {
            deletePoint(i);
          });

        let cross_tg1 = d3.select(`.cross-mark-${i + 1}`);
        d3.select(`#div-mark-${i + 1}`)
          .on("mouseover", () => {
            cross_tg1.style("opacity", 1);
          })
          .on("mouseleave", () => {
            cross_tg1.style("opacity", 0);
          });
      }
      if (currentmode == "gc") {
        d3.selectAll(".line-route").style("visibility", " hidden");

        d3.selectAll(".gc-route").style("visibility", "visible");
      } else {
        d3.selectAll(".line-route").style("visibility", "visible");

        d3.selectAll(".gc-route").style("visibility", " hidden");
      }
      if (arr.length > 1) {
        for (let j = 2; j <= arr.length; j++) {
          insertDistance(arr.slice(0, j), coorarr.slice(0, j));
        }
      }
      drawFunctionTable();
    };
    // Plot ship animation on globe
    const plotShip = (x, y) => {
      let c = d3.select("#foreground").append("g").attr("id", "new_ship");
      c.append("circle")
        .attr("id", "new_circle_ship_0")
        .attr("class", "new_circle_ship blink_ship")
        .attr("r", "5")
        .attr("cx", x)
        .attr("cy", y);
      c.append("circle")
        .attr("id", "new_circle_ship_1")
        .attr("class", "new_circle_ship_rings blink_ship")
        .attr("r", "5")
        .attr("cx", x)
        .attr("cy", y);
      c.append("circle")
        .attr("id", "new_circle_ship_2")
        .attr("class", "new_circle_ship_rings blink_ship")
        .attr("r", "9")
        .attr("cx", x)
        .attr("cy", y);
      c.append("circle")
        .attr("id", "new_circle_ship_3")
        .attr("class", "new_circle_ship_rings blink_ship")
        .attr("r", "13")
        .attr("cx", x)
        .attr("cy", y);
      c.append("circle")
        .attr("id", "new_circle_ship_4")
        .attr("class", "new_circle_ship_rings blink_ship")
        .attr("r", "17")
        .attr("cx", x)
        .attr("cy", y);
      c.append("circle")
        .attr("id", "new_circle_ship_5")
        .attr("class", "new_circle_ship_rings blink_ship")
        .attr("r", "21")
        .attr("cx", x)
        .attr("cy", y);
      c.append("circle")
        .attr("id", "new_circle_ship_6")
        .attr("class", "new_circle_ship_rings blink_ship")
        .attr("r", "25")
        .attr("cx", x)
        .attr("cy", y);
    };

    let px = null,
      py = null;
    let pd = null;

    const moveShip = () => {
      console.log("Moving ship");
      d3.select("#new_circle_ship_1")
        .attr("cx", coorarr[currentshiplocation][0])
        .attr("cy", coorarr[currentshiplocation][1]);
      d3.select("#new_circle_ship_2")
        .attr("cx", coorarr[currentshiplocation][0])
        .attr("cy", coorarr[currentshiplocation][1]);
      d3.select("#new_circle_ship_3")
        .attr("cx", coorarr[currentshiplocation][0])
        .attr("cy", coorarr[currentshiplocation][1]);
      d3.select("#new_circle_ship_4")
        .attr("cx", coorarr[currentshiplocation][0])
        .attr("cy", coorarr[currentshiplocation][1]);
      d3.select("#new_circle_ship_5")
        .attr("cx", coorarr[currentshiplocation][0])
        .attr("cy", coorarr[currentshiplocation][1]);
      d3.select("#new_circle_ship_6")
        .attr("cx", coorarr[currentshiplocation][0])
        .attr("cy", coorarr[currentshiplocation][1]);
      d3.select("#new_circle_ship_0")
        .attr("cx", coorarr[currentshiplocation][0])
        .attr("cy", coorarr[currentshiplocation][1]);
    };
    let inc_arr = [];

    // Called each time to make a distance slider table
    const drawFunctionTable = () => {
      d3.select(".node_position").remove();
      pd = 0;
      d3.select("#myRange").remove();
      d3.selectAll(".distance_marker_table").remove();
      d3.selectAll(".distance_marker_txt_table").remove();
      d3.selectAll("#data_btns_row").remove();
      let max = 0;
      inc_arr = [];
      let temp = 0;

      for (let i = 0; i < rldis.length; i++) {
        max += rldis[i];
        inc_arr.push(temp);
        temp = rldis[i] + inc_arr[inc_arr.length - 1];
      }
      let totaldistance_inNM = 0;
      var NMrldis = [];
      for (var i = 0; i < rldis.length; i++) {
        NMrldis[i] = Math.round(rldis[i] * 0.539957);
        totaldistance_inNM += NMrldis[i];
      }
      console.log(NMrldis);

      inc_arr.push(temp);
      // Dyanymically change the divs
      let divs = Math.round(max * 0.539957);
      let divider = 500;
      if (max <= 10000) {
        divs = divs / 500;
        divider = 500;
      } else if (max > 10000 && max <= 20000) {
        divs = divs / 1000;
        divider = 1000;
      } else {
        divs = divs / 5000;
        divider = 5000;
      }
      for (let i = 0; i < divs; i++) {
        d3
          .select("#table_distance_marker_meter")
          .append("span")
          .attr("class", "distance_marker_table")
          .node().innerHTML = `<h5>|</h5><h6>${(i * divider).toLocaleString(
          "en-IN"
        )} NM</h6>  `;
      }

      document.getElementById("demo").innerHTML = "0 NM";

      // Creating the slider input
      d3.select(".functionality_table")
        .append("input")
        .attr("class", "slider_distance")
        .attr("id", "myRange")
        .attr("type", "range")
        .attr("min", 0)
        .attr("max", max);

      d3.select(".graph").attr(
        "style",
        `--graph-length: ${totaldistance_inNM};`
      );

      let cumulative = 0;

      // Creating waypoints in the functionality table
      for (let ab = 0; ab < NMrldis.length - 1; ab++) {
        cumulative += NMrldis[ab];
        d3.select(".graph")
          .append("span")
          .attr("class", "node_position")
          .text(`${parseInt(ab) + 2}`)
          .attr("class", "node_position")
          .attr("style", `--start: ${cumulative}`);

        d3.select(".graph")
          .append("div")
          .attr("class", "vertical")
          .attr("style", `--start: ${cumulative}`);
      }

      var valueHover = 0;
      function calcSliderPos(e) {
        return (
          (e.offsetX / e.target.clientWidth) *
          parseInt(e.target.getAttribute("max"), 10)
        );
      }

      document
        .getElementById("myRange")
        .addEventListener("mousemove", function (e) {
          // let d = document.getElementById("myRange").value;
          let d = e.target.value;
          valueHover = calcSliderPos(e).toFixed(2);
          this.value = valueHover;

          for (let i = 0; i < inc_arr.length; i++) {
            if (d >= inc_arr[i]) {
              d3.select(`.data_btn-${currentshiplocation}`).attr(
                "class",
                `data_btns data_btn-${currentshiplocation}`
              );
              currentshiplocation = i;
              d3.select(`.data_btn-${currentshiplocation}`).attr(
                "class",
                `data_btns data_btn-${currentshiplocation} data_btn_selected`
              );
              moveShip();
            }
          }
          if (currentshiplocation < arr.length - 1) {
            let x1 = coorarr[currentshiplocation][0];
            let y1 = coorarr[currentshiplocation][1];
            let td = Math.sqrt(
              Math.pow(
                coorarr[currentshiplocation + 1][0] -
                  coorarr[currentshiplocation][0],
                2
              ) +
                Math.pow(
                  coorarr[currentshiplocation + 1][1] -
                    coorarr[currentshiplocation][1],
                  2
                )
            );
            let m =
              (coorarr[currentshiplocation + 1][0] -
                coorarr[currentshiplocation][0]) /
              (coorarr[currentshiplocation + 1][1] -
                coorarr[currentshiplocation][1]);
            m = 1 / m; // Important please donot change

            d = d - inc_arr[currentshiplocation];

            let ds = td * (d / rldis[currentshiplocation]);
            if (
              (coorarr[currentshiplocation + 1][0] -
                coorarr[currentshiplocation][0] <
                0 &&
                coorarr[currentshiplocation + 1][1] -
                  coorarr[currentshiplocation][1] >
                  0) ||
              (coorarr[currentshiplocation + 1][0] -
                coorarr[currentshiplocation][0] <
                0 &&
                coorarr[currentshiplocation + 1][1] -
                  coorarr[currentshiplocation][1] <
                  0)
            ) {
              ds = -ds;
            }
            let x, y;

            if (m === Infinity) {
              {
                x = x1;
                y = y1 + ds;
              }
            } else {
              {
                x = x1 + ds / Math.sqrt(1 + Math.pow(m, 2));
                y = y1 + m * (x - x1);
              }
            }
            d3.selectAll(".blink_ship").attr("cx", x).attr("cy", y);
          }
          var dis = parseInt(
            Math.round(e.target.value * 0.539957)
          ).toLocaleString("en-IN");

          document.getElementById("demo").innerHTML = dis + "NM";
        });

      /*document.getElementById("myRange").oninput = () => {
         let d = document.getElementById("myRange").value;
         for (let i = 0; i < inc_arr.length; i++) {
           if (d >= inc_arr[i]) {
             d3.select(`.data_btn-${currentshiplocation}`).attr(
               "class",
               `data_btns data_btn-${currentshiplocation}`
             );
             currentshiplocation = i;
             d3.select(`.data_btn-${currentshiplocation}`).attr(
               "class",
               `data_btns data_btn-${currentshiplocation} data_btn_selected`
             );
             moveShip();
           }
         }
         if (currentshiplocation < (arr.length - 1)) {
           let x1 = coorarr[currentshiplocation][0];
           let y1 = coorarr[currentshiplocation][1];
           let td = Math.sqrt(
             Math.pow(
               coorarr[currentshiplocation + 1][0] -
                 coorarr[currentshiplocation][0],
               2
             ) +
               Math.pow(
                 coorarr[currentshiplocation + 1][1] -
                   coorarr[currentshiplocation][1],
                 2
               )
           );
           let m =
             (coorarr[currentshiplocation + 1][0] -
               coorarr[currentshiplocation][0]) /
             (coorarr[currentshiplocation + 1][1] -
               coorarr[currentshiplocation][1]);
           m = 1 / m; // Important please donot change
 
           d = d - inc_arr[currentshiplocation];
 
           let ds = td * (d / rldis[currentshiplocation]);
           if (
             (coorarr[currentshiplocation + 1][0] -
               coorarr[currentshiplocation][0] <
               0 &&
               coorarr[currentshiplocation + 1][1] -
                 coorarr[currentshiplocation][1] >
                 0) ||
             (coorarr[currentshiplocation + 1][0] -
               coorarr[currentshiplocation][0] <
               0 &&
               coorarr[currentshiplocation + 1][1] -
                 coorarr[currentshiplocation][1] <
                 0)
           ) {
             ds = -ds;
           }
           let x, y;
 
           if (m === Infinity) {
             {
               x = x1;
               y = y1 + ds;
             }
           } else {
             {
               x = x1 + ds / Math.sqrt(1 + Math.pow(m, 2));
               y = y1 + m * (x - x1);
             }
           }
           d3.selectAll(".blink_ship").attr("cx", x).attr("cy", y);
         }
         var dis = parseInt(
           Math.round(document.getElementById("myRange").value * 0.539957)
         ).toLocaleString("en-IN");
 
   
         document.getElementById("demo").innerHTML =dis + "NM";
       };
       */

      d3.select(".functionality_table")
        .append("div")
        .attr("id", "data_btns_row");

      d3
        .select("#data_btns_row")
        .append("p")
        .attr("id", "data_points_text")
        .node().innerHTML = "Data Points: ";

      for (let j = 0; j < arr.length; j++) {
        const [a, b] = getWindAtLocation(arr[j]);
        d3
          .select("#data_btns_row")
          .append("button")
          .attr("class", `data_btns data_btn-${j}`)
          .node().innerHTML = `${a}, ${b}`;
      }

      if (arr.length > 0) {
        d3.select(`.data_btn-${0}`).attr(
          "class",
          `data_btns data_btn-${0} data_btn_selected`
        );
      }
    };
    var tableselected = false;
    d3.select("#table_btn").on("click", () => {
      drawFunctionTable();
      tableselected = !tableselected;
      if (tableselected) {
        d3.select("#table_btn").style("background-color", "#000");
      } else {
        d3.select("#table_btn").style("background-color", "#1e70e9");
      }

      d3.select(".functionality_table").classed(
        "invisible",
        !d3.select(".functionality_table").classed("invisible")
      );

      d3.select(".time_slider").classed(
        "invisible",
        !d3.select(".time_slider").classed("invisible")
      );

      d3.select("#menu").classed(
        "invisible",
        !d3.select("#menu").classed("invisible")
      );
    });

    // Called each time when we delete a point
    const deletePoint = (index) => {
      rldis = [];
      gcdis = [];
      totaltimetaken = 0;
      previous_state = {
        operation: "DELETE",
        index: index,
        point: coorarr[index],
        coord: arr[index],
      };
      /* if (currentshiplocation == index && index + 1 < arr.length) {
         d3.select(".ship")
           .datum({
             type: "Point",
             coordinates: [arr[index + 1][0] - 1.5, arr[index + 1][1] - 1.5],
           })
           .attr("d", path);
 
         currentshiplocation++;
       } else if (currentshiplocation == index && index != 0) {
         d3.select(".ship")
           .datum({
             type: "Point",
             coordinates: [arr[index - 1][0] - 1.5, arr[index - 1][1] - 1.5],
           })
           .attr("d", path);
 
         currentshiplocation--;
       } else if (currentshiplocation == index && index == 0) {
         d3.select(".ship").remove();
       } */
      let init = currentshiplocation;
      if (currentshiplocation === index) {
        d3.select("#new_ship").remove();
        if (index === arr.length - 1 && arr.length > 1) {
          currentshiplocation = arr.length - 2;
        } else if (index === 0) {
          currentshiplocation = 0;
        } else {
          currentshiplocation = index - 1;
        }
      }

      breakpoints--;
      // addCoorRow()

      if (index === coorarr.length - 1) {
        if (index > 0) {
          pointsArr = coorarr[index - 1];
        } else {
          pointsArr = null;
        }
      }
      arr.splice(index, 1);
      redrawTable();

      coorarr.splice(index, 1);
      d3.selectAll(".div-mark").remove();
      d3.selectAll(".line-route").remove();
      d3.selectAll(".text-mark").remove();
      d3.selectAll(".cross-mark").remove();
      d3.selectAll(".gc-route").remove();
      d3.selectAll(".gc-dist").remove();

      if (init === index) {
        if (arr.length > 1) {
          plotShip(
            coorarr[currentshiplocation][0],
            coorarr[currentshiplocation][1]
          );
        } else {
          currentshiplocation = -1;
        }
      }

      for (let i = 0; i < arr.length; i++) {
        if (i > 0) {
          d3.select(`#div-mark-${i}`).remove();
          d3.select(`#gc-line-${i + 1}`).remove();
          d3.select("#foreground")
            .append("g")
            .attr("id", "line-" + i)
            .attr("class", "line-route")
            .append("path")
            .attr("class", `location-line location-line-${i + 1}`)
            .datum({
              type: "Line",
              data: [
                [coorarr[i][0], coorarr[i][1]],
                [coorarr[i - 1][0], coorarr[i - 1][1]],
              ],
            })
            .attr(
              "d",
              d3.svg.line()([
                [coorarr[i][0], coorarr[i][1]],
                [coorarr[i - 1][0], coorarr[i - 1][1]],
              ])
            )
            .attr(
              "value",
              d3.svg.line()([
                [coorarr[i][0], coorarr[i][1]],
                [coorarr[i - 1][0], coorarr[i - 1][1]],
              ])
            )
            .on("mouseover", () => {
              d3.select(`.location-line-${i + 1}`).attr(
                "class",
                `location-line location-line-${i + 1} line-hovered`
              );
              line_hovered = {
                status: true,
                index: i + 1,
              };
            })
            .on("mouseout", () => {
              d3.select(`.location-line-${i + 1}`).attr(
                "class",
                `location-line location-line-${i + 1}`
              );
              line_hovered = {
                status: false,
                index: null,
              };
            });

          // gc code
          var link = { type: "LineString", coordinates: [arr[i], arr[i - 1]] };
          d3.select("#foreground")
            .append("path")
            .attr("id", "gc-line" + (i + 1))
            .attr("d", path(link))
            .attr("class", "gc-route")
            .style("fill", "none")
            .style("stroke", "orange")
            .style("stroke-width", 4);

          d3.select("#foreground")
            .append("g")
            .attr("id", `div-mark-${i}`)
            .attr("class", "div-mark")
            .attr("name", `div-mark-${i}`)
            .append("path")
            .attr("class", `location-mark location-mark-${i}`)
            .datum({ type: "Point", coordinates: arr[i - 1] })
            .attr("d", path);

          d3
            .select(`#div-mark-${i}`)
            .append("text")
            .attr("class", `text-mark text-mark-${i}`)
            .attr("x", coorarr[i - 1][0] - 2)
            .attr("y", coorarr[i - 1][1] + 8)
            .node().innerHTML = i;

          d3.select(`#div-mark-${i}`)
            .append("svg")
            .attr("class", `cross-mark cross-mark-${i}`)
            .attr("x", coorarr[i - 1][0] + 7)
            .attr("y", coorarr[i - 1][1] + 7)
            .append("image")
            .attr(
              "href",
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAMjx-6QpMneLjryXGboe7v86rJV8u6kNJPlj-IEfCgCq8R69VlQGLPGj2C1gqBaRnyB0&usqp=CAU"
            )
            .style("width", "15px")
            .style("height", "15px")
            .on("click", (event) => {
              deletePoint(i - 1);
            });
          let cross_tg = d3.select(`.cross-mark-${i}`);
          d3.select(`#div-mark-${i}`)
            .on("mouseover", () => {
              cross_tg.style("opacity", 1);
            })
            .on("mouseleave", () => {
              cross_tg.style("opacity", 0);
            });
        }
        d3.select("#foreground")
          .append("g")
          .attr("id", `div-mark-${i + 1}`)
          .attr("class", "div-mark")
          .attr("name", `div-mark-${i + 1}`)
          .append("path")
          .attr("class", `location-mark location-mark-${i + 1}`)
          .datum({ type: "Point", coordinates: arr[i] })
          .attr("d", path);

        d3
          .select(`#div-mark-${i + 1}`)
          .append("text")
          .attr("class", `text-mark text-mark-${i + 1}`)
          .attr("x", coorarr[i][0] - 2)
          .attr("y", coorarr[i][1] + 8)
          .node().innerHTML = i + 1;

        d3.select(`#div-mark-${i + 1}`)
          .append("svg")
          .attr("class", `cross-mark cross-mark-${i + 1}`)
          .attr("x", coorarr[i][0] + 7)
          .attr("y", coorarr[i][1] + 7)
          .append("image")
          .attr(
            "href",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAMjx-6QpMneLjryXGboe7v86rJV8u6kNJPlj-IEfCgCq8R69VlQGLPGj2C1gqBaRnyB0&usqp=CAU"
          )
          .style("width", "15px")
          .style("height", "15px")
          .on("click", (event) => {
            deletePoint(i);
          });
        let cross_tg = d3.select(`.cross-mark-${i + 1}`);
        d3.select(`#div-mark-${i + 1}`)
          .on("mouseover", () => {
            cross_tg.style("opacity", 1);
          })
          .on("mouseleave", () => {
            cross_tg.style("opacity", 0);
          });

        if (currentmode == "gc") {
          d3.selectAll(".line-route").style("visibility", " hidden");

          d3.selectAll(".gc-route").style("visibility", "visible");
        } else {
          d3.selectAll(".line-route").style("visibility", "visible");

          d3.selectAll(".gc-route").style("visibility", " hidden");
        }
      }

      if (arr.length > 1) {
        for (let j = 2; j <= arr.length; j++) {
          insertDistance(arr.slice(0, j), coorarr.slice(0, j));
        }
      }
    };

    d3.select("#insertPointBtn").on("click", function () {
      // d3.select("#dropdownContainer").style("display", "block");
      d3.selectAll(".insert_point_between").style("display", "block");
      d3.select("#insert_point_blank").style("display", "block");
      d3.event.target.disabled = true;
      if (arr.length == 0) {
        insertAfter(0);
      }
    });

    var insertAfter = (point) => {
      var table = d3.select("#coordinates-table");
      var row;
      if (point == arr.length) {
        row = table
          .append("tr")
          .attr("id", "temporary_row-" + point)
          .attr("class", "disposable");
      } else {
        row = table
          .insert("tr", `#row-${point} + *`)
          .attr("class", "disposable")
          .attr("id", "temporary_row-" + point);
      }

      row
        .append("td")
        .attr("id", `insert_after_${point}`)
        .append("button")
        .style("opacity", "0");
      row
        .append("td")
        .style("text-align", "center")
        .style("background-color", "#000005")
        .append("button")
        .text("")
        .attr("class", "cell1")
        .attr("id", `temporary_cell${point}`);
      row
        .append("td")
        .append("div")
        .attr("id", "latLong")
        .style("display", "table")
        .attr("placeholder", "Enter Coordinates")
        .attr("type", "text")
        .attr("class", "cell2");

      d3.select("#latLong")
        .append("div")
        .style("display", "table-cell")
        .append("input")
        .attr("placeholder", "lat")
        .style("width", "89px")
        .attr("id", "latTxt");

      d3.select("#latLong")
        .append("div")
        .style("display", "table-cell")
        .append("input")
        .attr("placeholder", "long")
        .style("width", "89px")
        .attr("id", "longTxt");

      row
        .append("td")
        .append("div")
        .attr("id", "cell3-filler")
        .attr("type", "text")
        .attr("class", "cell3");

      row
        .append("td")
        .append("div")
        .style("display", "table-cell")
        .append("input")
        .attr("placeholder", "Velocity")
        .attr("id", "velocity");

      row
        .append("td")
        .attr("id", "insert_go")
        .append("button")
        .text("X")
        .style("padding", "2px")
        .attr("id", "#insertPointBtnNo")
        .on("click", () => {
          d3.select("#temporary_row-" + point).remove();
          document.querySelectorAll(".insert_after_class").forEach((elem) => {
            elem.disabled = false;
          });
        });

      d3.select("#insert_go")
        .append("button")
        .text("Go")
        .style("padding", "2px")
        .attr("id", "#insertPointBtnGo")
        .on("click", () => {
          handleGo(point);
        });
    };

    function handleGo(point1) {
      document.getElementById("insertPointBtn").disabled = false;
      d3.selectAll(".headcells").style("height", "auto");
      d3.select("#insert_point_blank").style("display", "none");
      let latitude = d3.select("#latTxt").node().value;
      let longitude = d3.select("#longTxt").node().value;

      let velocity = d3.select("#velocity").node().value;
      rldis = [];
      gcdis = [];

      if (latitude[latitude.length - 1] == "S") {
        latitude = latitude.slice(0, -1);
        latitude = Number(latitude) * -1;
      } else if (latitude[latitude.length - 1] == "N") {
        latitude = latitude.slice(0, -1);
        latitude = Number(latitude);
      } else {
        alert("Invalid Point");
        redrawTable();
        return;
      }

      if (longitude[longitude.length - 1] == "E") {
        longitude = longitude.slice(0, -1);
        longitude = Number(longitude);
      } else if (longitude[longitude.length - 1] == "W") {
        longitude = longitude.slice(0, -1);
        longitude = Number(longitude) * -1;
      } else {
        alert("Invalid Point");
        redrawTable();
        return;
      }

      if (
        !latitude ||
        !longitude ||
        Math.abs(latitude) > 90 ||
        Math.abs(longitude) > 180
      ) {
        alert("Invalid Point");
        redrawTable();
        return;
      }

      // if (
      //   point1 > 0 &&
      //   point1 < arr.length - 1 &&
      //   Math.abs(point1 - point2) == 1
      // ) {
      arr.splice(point1, 0, [longitude, latitude]);

      velocityarr.splice(point1, 0, velocity);

      d3.selectAll(".location-mark").remove();

      for (let i = 0; i < arr.length; i++) {
        d3.select("#foreground")
          .append("g")
          .attr("id", `div-mark-${i + 1}`)
          .attr("class", "div-mark")
          .attr("name", `div-mark-${i + 1}`)
          .append("path")
          .attr("class", `location-mark location-mark-${i + 1}`)
          .datum({ type: "Point", coordinates: arr[i] })
          .attr("d", path);
      }

      let oldpoint = d3.select(".location-mark-" + (point1 + 1));
      console.log(JSON.stringify(oldpoint));
      let x = oldpoint[0][0].getBoundingClientRect().left + 7;
      let y = oldpoint[0][0].getBoundingClientRect().top + 7;

      coorarr.splice(point1, 0, [x, y]);

      if (coorarr.length > 0) {
        pointsArr = coorarr[coorarr.length - 1];
      }

      redrawPath();
      redrawTable();
    }
    function padLeadingZeros(num, size) {
      var s = num + "";
      while (s.length < size) s = "0" + s;
      return s;
    }
    function DMStoDecimal(coordinate) {
      var deg = coordinate.split("°")[0];
      var min = coordinate.split("°")[1].split("'")[0];
      var sec = coordinate.split("°")[1].split("'")[1].split('"')[0];

      var dd = Number(deg) + Number(min) / 60 + Number(sec) / 3600;

      return dd.toPrecision(3).toString();
    }
    function convertToDms(dd, isLng) {
      var dir = dd < 0 ? (isLng ? "W" : "S") : isLng ? "E" : "N";

      var absDd = Math.abs(dd);
      var deg = absDd | 0;
      var frac = absDd - deg;
      var min = (frac * 60) | 0;
      var sec = frac * 3600 - min * 60;

      sec = Math.round(sec * 100) / 100;
      return dir + "," + deg + "°" + min + "'" + sec + '"';
    }
    // Funcion called each time to click download button
    d3.select("#downloadCSV").on("click", function () {
      var arrClone = [];

      for (let i = 0; i < arr.length; i++) {
        arrClone[i] = arr[i].slice();
      }

      for (let i = 0; i < arrClone.length; i++) {
        arrClone[i].unshift("" + (i + 1));
      }
      arrClone.unshift([
        "Num",
        " ",
        "Latitude",
        " ",
        "Longitude",
        "Radius",
        "Speed",
      ]);
      for (let i = 1; i < arrClone.length; i++) {
        arrClone[i][0] = padLeadingZeros(arrClone[i][0], 3);
        arrClone[i][1] = convertToDms(arrClone[i][1], true);
        arrClone[i][2] = convertToDms(arrClone[i][2], false);
        var temp = arrClone[i][1];
        arrClone[i][1] = arrClone[i][2];
        arrClone[i][2] = temp;
        arrClone[i][3] = "";
        arrClone[i][4] = "0.0";
      }
      console.log(arrClone + "");

      µ.convertToCSV(arrClone);
    });

    d3.select("#closeCSVModal").on("click", function () {
      d3.select("#CSVModal").style("display", "none");
    });

    d3.select("#uploadBtn").on("click", function () {
      d3.select("#CSVModal").style("display", "block");
    });

    d3.select("#uploadCSVBtn").on("click", function () {
      var fileUpload = document.getElementById("fileUpload");
      var regex = /^([a-zA-Z0-9\s\(\)_\\.\-:])+(.csv|.txt)$/;
      if (regex.test(fileUpload.value.toLowerCase())) {
        if (typeof FileReader != "undefined") {
          var reader = new FileReader();

          reader.onload = function (e) {
            var rows = e.target.result.split("\n");
            let index = 0;
            for (var i = 1; i < rows.length; i++) {
              var cells = rows[i].split(",");

              if (cells.length == 3) {
                var points = [parseFloat(cells[1]), parseFloat(cells[2])];
                loadedPointsCSV.push(points);
              } else {
                if (cells.length == 7) {
                  let lat = parseFloat(
                    (cells[1] == "N" ? "" : "-") + DMStoDecimal(cells[2])
                  );
                  let lng = parseFloat(
                    (cells[3] == "E" ? "" : "-") + DMStoDecimal(cells[4])
                  );

                  loadedPointsCSV.push([lng, lat]);
                }
              }
            }

            let newxycoordinates = [];

            arr = loadedPointsCSV;

            for (let i = 0; i < loadedPointsCSV.length; i++) {
              d3.select("#foreground")
                .append("g")
                .attr("id", `div-mark-${i + 1}`)
                .attr("class", "div-mark")
                .attr("name", `div-mark-${i + 1}`)
                .append("path")
                .attr("class", `location-mark location-mark-${i + 1}`)
                .datum({ type: "Point", coordinates: loadedPointsCSV[i] })
                .attr("d", path);
            }

            let oldpoints = d3.selectAll(".location-mark");

            for (let i = 0; i < oldpoints[0].length; i++) {
              let x = oldpoints[0][i].getBoundingClientRect().left + 7;
              let y = oldpoints[0][i].getBoundingClientRect().top + 7;

              newxycoordinates.push([x, y]);
            }

            coorarr = newxycoordinates;
            if (coorarr.length > 0) {
              pointsArr = coorarr[coorarr.length - 1];
            }

            redrawPath();
            redrawTable();
          };
          reader.readAsText(fileUpload.files[0]);
        } else {
          alert("This browser does not support HTML5.");
        }
      } else {
        alert("Please upload a valid CSV file.");
      }
    });

    // Draw the location mark if one is currently visible.
    if (activeLocation.point && activeLocation.coord) {
      drawLocationMark(activeLocation.point, activeLocation.coord);
    }

    // Throttled draw method helps with slow devices that would get overwhelmed by too many redraw events.
    var REDRAW_WAIT = 5; // milliseconds
    var doDraw_throttled = _.throttle(doDraw, REDRAW_WAIT, { leading: false });

    function doDraw() {
      d3.selectAll("path").attr("d", path);
      rendererAgent.trigger("redraw");
      doDraw_throttled = _.throttle(doDraw, REDRAW_WAIT, { leading: false });
    }

    // Attach to map rendering events on input controller.
    dispatch.listenTo(inputController, {
      moveStart: function () {
        coastline.datum(mesh.coastLo);
        lakes.datum(mesh.lakesLo);
        rendererAgent.trigger("start");
      },
      move: function () {
        doDraw_throttled();
      },
      moveEnd: function () {
        coastline.datum(mesh.coastHi);
        lakes.datum(mesh.lakesHi);

        if (arr.length == 0) {
          // d3.selectAll("iso-mark-new").attr("d",isopath);
          d3.selectAll("path").attr("d", path);
          // drawisobar(isocoordinates);
        } else {
          d3.selectAll(".line-route").remove();
          d3.selectAll(".text-mark").remove();
          d3.selectAll(".cross-mark").remove();
          d3.selectAll(".gc-route").remove();
          // d3.selectAll(".iso-mark-new").remove();

          let newpoints = [];
          rldis = [];
          gcdis = [];
          totaltimetaken = 0;
          totalrldis = 0;
          totalgcdis = 0;

          d3.selectAll(".location-mark")[0].map((element) => {
            newpoints.push([
              element.getBoundingClientRect().left + 7,
              element.getBoundingClientRect().top + 7,
            ]);
          });

          coorarr = newpoints;

          /* for (let i = 0; i < newpoints.length; i++) {
             d3
               .select(`#div-mark-${i + 1}`)
               .append("text")
               .attr("class", `text-mark text-mark-${i + 1}`)
               .attr("x", coorarr[i][0] - 4)
               .attr("y", coorarr[i][1] + 6)
               .node().innerHTML = i + 1;
 
             d3.select(`#div-mark-${i + 1}`)
               .append("svg")
               .attr("class", `cross-mark cross-mark-${i + 1}`)
               .attr("x", coorarr[i][0] + 7)
               .attr("y", coorarr[i][1] + 7)
               .append("image")
               .attr(
                 "href",
                 "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAMjx-6QpMneLjryXGboe7v86rJV8u6kNJPlj-IEfCgCq8R69VlQGLPGj2C1gqBaRnyB0&usqp=CAU"
               )
               .style("width", "15px")
               .style("height", "15x")
               .on("click", (event) => {
                 deletePoint(i);
               });
 
             let cross_tg2 = d3.select(`.cross-mark-${i + 1}`);
             d3.select(`#div-mark-${i + 1}`)
               .on("mouseover", () => {
                 cross_tg2.style("opacity", 1);
               })
               .on("mouseleave", () => {
                 cross_tg2.style("opacity", 0);
               });
 
             if (i > 0) {
               d3.select("#foreground")
                 .append("g")
                 .attr("id", "line-" + i)
                 .attr("class", "line-route")
                 .append("path")
                 .attr("class", `location-line location-line-${i + 1}`)
                 .datum({
                   type: "Line",
                   data: [
                     [coorarr[i - 1][0], coorarr[i - 1][1]],
                     [coorarr[i][0], coorarr[i][1]],
                   ],
                 })
                 .attr(
                   "d",
                   d3.svg.line()([
                     [coorarr[i - 1][0], coorarr[i - 1][1]],
                     [coorarr[i][0], coorarr[i][1]],
                   ])
                 )
                 .attr(
                   "value",
                   d3.svg.line()([
                     [coorarr[i - 1][0], coorarr[i - 1][1]],
                     [coorarr[i][0], coorarr[i][1]],
                   ])
                 )
                 .on("mouseover", () => {
                   d3.select(`.location-line-${i + 1}`).attr(
                     "class",
                     `location-line location-line-${i + 1} line-hovered`
                   );
                   line_hovered = {
                     status: true,
                     index: i + 1,
                   };
                 })
                 .on("mouseout", () => {
                   d3.select(`.location-line-${i + 1}`).attr(
                     "class",
                     `location-line location-line-${i + 1}`
                   );
   
                
 
 
                   line_hovered = {
                     status: false,
                     index: null,
                   };
                 });
                 var link = {type: "LineString", coordinates:[arr[i],arr[i-1]]} 
                 d3.select("#foreground")
                 .append("path")
                 .attr("id","gc-line"+(i+1))
                   .attr("d", path(link))
                   .attr("class","gc-route")
                   .style("fill", "none")
                   .style("stroke", "orange")
                   .style("stroke-width",4)
             }
           } */
          for (let i = 1; i < newpoints.length; i++) {
            var link = {
              type: "LineString",
              coordinates: [arr[i], arr[i - 1]],
            };
            d3.select("#foreground")
              .append("path")
              .attr("id", "gc-line" + (i + 1))
              .attr("d", path(link))
              .attr("class", "gc-route")
              .style("fill", "none")
              .style("stroke", "orange")
              .style("stroke-width", 4);
          }

          let x = newpoints[newpoints.length - 1][0];
          let y = newpoints[newpoints.length - 1][1];
          pointsArr = [x, y];

          redrawPath();
        }

        rendererAgent.trigger("render");
      },
      click: drawLocationMark,
    });

    // Finally, inject the globe model into the input controller. Do it on the next event turn to ensure
    // renderer is fully set up before events start flowing.
    when(true).then(function () {
      inputController.globe(globe);
    });

    log.timeEnd("rendering map");
    return "ready";
  }

  function createMask(globe) {
    if (!globe) return null;

    log.time("render mask");

    // Create a detached canvas, ask the model to define the mask polygon, then fill with an opaque color.
    var width = view.width,
      height = view.height;
    var canvas = d3
      .select(document.createElement("canvas"))
      .attr("width", width)
      .attr("height", height)
      .node();
    var context = globe.defineMask(canvas.getContext("2d"));
    context.fillStyle = "rgba(255, 0, 0, 1)";
    context.fill();
    // d3.select("#display").node().appendChild(canvas);  // make mask visible for debugging

    var imageData = context.getImageData(0, 0, width, height);
    var data = imageData.data; // layout: [r, g, b, a, r, g, b, a, ...]
    log.timeEnd("render mask");
    return {
      imageData: imageData,
      isVisible: function (x, y) {
        var i = (y * width + x) * 4;
        return data[i + 3] > 0; // non-zero alpha means pixel is visible
      },
      set: function (x, y, rgba) {
        var i = (y * width + x) * 4;
        data[i] = rgba[0];
        data[i + 1] = rgba[1];
        data[i + 2] = rgba[2];
        data[i + 3] = rgba[3];
        return this;
      },
    };
  }

  function createField(columns, bounds, mask) {
    /**
     * @returns {Array} wind vector [u, v, magnitude] at the point (x, y), or [NaN, NaN, null] if wind
     *          is undefined at that point.
     */
    function field(x, y) {
      var column = columns[Math.round(x)];
      return (column && column[Math.round(y)]) || NULL_WIND_VECTOR;
    }

    /**
     * @returns {boolean} true if the field is valid at the point (x, y)
     */
    field.isDefined = function (x, y) {
      return field(x, y)[2] !== null;
    };

    /**
     * @returns {boolean} true if the point (x, y) lies inside the outer boundary of the vector field, even if
     *          the vector field has a hole (is undefined) at that point, such as at an island in a field of
     *          ocean currents.
     */
    field.isInsideBoundary = function (x, y) {
      return field(x, y) !== NULL_WIND_VECTOR;
    };

    // Frees the massive "columns" array for GC. Without this, the array is leaked (in Chrome) each time a new
    // field is interpolated because the field closure's context is leaked, for reasons that defy explanation.
    field.release = function () {
      columns = [];
    };

    field.randomize = function (o) {
      // UNDONE: this method is terrible
      var x, y;
      var safetyNet = 0;
      do {
        x = Math.round(_.random(bounds.x, bounds.xMax));
        y = Math.round(_.random(bounds.y, bounds.yMax));
      } while (!field.isDefined(x, y) && safetyNet++ < 30);
      o.x = x;
      o.y = y;
      return o;
    };

    field.overlay = mask.imageData;

    return field;
  }

  /**
   * Calculate distortion of the wind vector caused by the shape of the projection at point (x, y). The wind
   * vector is modified in place and returned by this function.
   */
  function distort(projection, λ, φ, x, y, scale, wind) {
    var u = wind[0] * scale;
    var v = wind[1] * scale;
    var d = µ.distortion(projection, λ, φ, x, y);

    // Scale distortion vectors by u and v, then add.
    wind[0] = d[0] * u + d[2] * v;
    wind[1] = d[1] * u + d[3] * v;
    return wind;
  }

  function interpolateField(globe, grids) {
    if (!globe || !grids) return null;

    var mask = createMask(globe);
    var primaryGrid = grids.primaryGrid;
    var overlayGrid = grids.overlayGrid;

    log.time("interpolating field");
    var d = when.defer(),
      cancel = this.cancel;

    var projection = globe.projection;
    var bounds = globe.bounds(view);
    // How fast particles move on the screen (arbitrary value chosen for aesthetics).
    var velocityScale = bounds.height * primaryGrid.particles.velocityScale;

    var columns = [];
    var point = [];
    var x = bounds.x;
    var interpolate = primaryGrid.interpolate;
    var overlayInterpolate = overlayGrid.interpolate;
    var hasDistinctOverlay = primaryGrid !== overlayGrid;
    var scale = overlayGrid.scale;

    function interpolateColumn(x) {
      var column = [];
      for (var y = bounds.y; y <= bounds.yMax; y += 2) {
        if (mask.isVisible(x, y)) {
          point[0] = x;
          point[1] = y;
          var coord = projection.invert(point);
          var color = TRANSPARENT_BLACK;
          var wind = null;
          if (coord) {
            var λ = coord[0],
              φ = coord[1];
            if (isFinite(λ)) {
              wind = interpolate(λ, φ);
              var scalar = null;
              if (wind) {
                wind = distort(projection, λ, φ, x, y, velocityScale, wind);
                scalar = wind[2];
              }
              if (hasDistinctOverlay) {
                scalar = overlayInterpolate(λ, φ);
              }
              if (µ.isValue(scalar)) {
                color = scale.gradient(scalar, OVERLAY_ALPHA);
              }
            }
          }
          column[y + 1] = column[y] = wind || HOLE_VECTOR;
          mask
            .set(x, y, color)
            .set(x + 1, y, color)
            .set(x, y + 1, color)
            .set(x + 1, y + 1, color);
        }
      }
      columns[x + 1] = columns[x] = column;
    }

    report.status("");

    (function batchInterpolate() {
      try {
        if (!cancel.requested) {
          var start = Date.now();
          while (x < bounds.xMax) {
            interpolateColumn(x);
            x += 2;
            if (Date.now() - start > MAX_TASK_TIME) {
              // Interpolation is taking too long. Schedule the next batch for later and yield.
              report.progress((x - bounds.x) / (bounds.xMax - bounds.x));
              setTimeout(batchInterpolate, MIN_SLEEP_TIME);
              return;
            }
          }
        }
        d.resolve(createField(columns, bounds, mask));
      } catch (e) {
        d.reject(e);
      }
      report.progress(1); // 100% complete
      log.timeEnd("interpolating field");
    })();

    return d.promise;
  }

  function animate(globe, field, grids) {
    if (!globe || !field || !grids) return;

    var cancel = this.cancel;
    var bounds = globe.bounds(view);
    // maxIntensity is the velocity at which particle color intensity is maximum
    var colorStyles = µ.windIntensityColorScale(
      INTENSITY_SCALE_STEP,
      grids.primaryGrid.particles.maxIntensity
    );
    var buckets = colorStyles.map(function () {
      return [];
    });
    var particleCount = Math.round(bounds.width * PARTICLE_MULTIPLIER);
    if (µ.isMobile()) {
      particleCount *= PARTICLE_REDUCTION;
    }
    var fadeFillStyle = µ.isFF()
      ? "rgba(0, 0, 0, 0.95)"
      : "rgba(0, 0, 0, 0.97)"; // FF Mac alpha behaves oddly

    log.debug("particle count: " + particleCount);
    var particles = [];
    for (var i = 0; i < particleCount; i++) {
      particles.push(field.randomize({ age: _.random(0, MAX_PARTICLE_AGE) }));
    }

    function evolve() {
      buckets.forEach(function (bucket) {
        bucket.length = 0;
      });
      particles.forEach(function (particle) {
        if (particle.age > MAX_PARTICLE_AGE) {
          field.randomize(particle).age = 0;
        }
        var x = particle.x;
        var y = particle.y;
        var v = field(x, y); // vector at current position
        var m = v[2];
        if (m === null) {
          particle.age = MAX_PARTICLE_AGE; // particle has escaped the grid, never to return...
        } else {
          var xt = x + v[0];
          var yt = y + v[1];
          if (field.isDefined(xt, yt)) {
            // Path from (x,y) to (xt,yt) is visible, so add this particle to the appropriate draw bucket.
            particle.xt = xt;
            particle.yt = yt;
            buckets[colorStyles.indexFor(m)].push(particle);
          } else {
            // Particle isn't visible, but it still moves through the field.
            particle.x = xt;
            particle.y = yt;
          }
        }
        particle.age += 1;
      });
    }

    var g = d3.select("#animation").node().getContext("2d");
    g.lineWidth = PARTICLE_LINE_WIDTH;
    g.fillStyle = fadeFillStyle;

    function draw() {
      // Fade existing particle trails.
      var prev = g.globalCompositeOperation;
      g.globalCompositeOperation = "destination-in";
      g.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      g.globalCompositeOperation = prev;

      // Draw new particle trails.
      buckets.forEach(function (bucket, i) {
        if (bucket.length > 0) {
          g.beginPath();
          g.strokeStyle = colorStyles[i];
          bucket.forEach(function (particle) {
            g.moveTo(particle.x, particle.y);
            g.lineTo(particle.xt, particle.yt);
            particle.x = particle.xt;
            particle.y = particle.yt;
          });
          g.stroke();
        }
      });
    }

    (function frame() {
      try {
        if (cancel.requested) {
          field.release();
          return;
        }
        evolve();
        draw();
        setTimeout(frame, FRAME_RATE);
      } catch (e) {
        report.error(e);
      }
    })();
  }

  function drawGridPoints(ctx, grid, globe) {
    if (!grid || !globe || !configuration.get("showGridPoints")) return;

    ctx.fillStyle = "rgba(255, 255, 255, 1)";
    // Use the clipping behavior of a projection stream to quickly draw visible points.
    var stream = globe.projection.stream({
      point: function (x, y) {
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      },
    });
    grid.forEachPoint(function (λ, φ, d) {
      if (µ.isValue(d)) {
        stream.point(λ, φ);
      }
    });
  }

  function drawOverlay(field, overlayType) {
    if (!field) return;

    var ctx = d3.select("#overlay").node().getContext("2d"),
      grid = (gridAgent.value() || {}).overlayGrid;

    µ.clearCanvas(d3.select("#overlay").node());
    µ.clearCanvas(d3.select("#scale").node());
    if (overlayType) {
      if (overlayType !== "off") {
        ctx.putImageData(field.overlay, 0, 0);
      }
      drawGridPoints(ctx, grid, globeAgent.value());
    }

    if (grid) {
      // Draw color bar for reference.
      var colorBar = d3.select("#scale"),
        scale = grid.scale,
        bounds = scale.bounds;
      var c = colorBar.node(),
        g = c.getContext("2d"),
        n = c.width - 1;
      for (var i = 0; i <= n; i++) {
        var rgb = scale.gradient(µ.spread(i / n, bounds[0], bounds[1]), 1);
        g.fillStyle = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
        g.fillRect(i, 0, 1, c.height);
      }

      // Show tooltip on hover.
      colorBar.on("mousemove", function () {
        var x = d3.mouse(this)[0];
        var pct = µ.clamp((Math.round(x) - 2) / (n - 2), 0, 1);
        var value = µ.spread(pct, bounds[0], bounds[1]);
        var elementId =
          grid.type === "wind"
            ? "#location-wind-units"
            : "#location-value-units";

        if (grid.type === "currents") {
          d3.select("#tooltiptext").node().innerHTML =
            value.toFixed(2) + " m/s";
          d3.select("#tooltiptext").style("visibility", " visible");
        } else if (grid.type === "wind") {
          d3.select("#tooltiptext").node().innerHTML =
            Math.floor(value * 3.6) + " Km/h";
          d3.select("#tooltiptext").style("visibility", " visible");
        } else if (grid.type === "waves") {
          d3.select("#tooltiptext").node().innerHTML = Math.floor(value) + "s";
          d3.select("#tooltiptext").style("visibility", " visible");
        }
        return;
        var units = createUnitToggle(elementId, grid).value();
        colorBar.attr(
          "title",
          µ.formatScalar(value, units) + " " + units.label
        );
      });

      colorBar.on("mouseout", function () {
        d3.select("#tooltiptext").style("visibility", " hidden");
      });
    }
  }

  /**
   * Extract the date the grids are valid, or the current date if no grid is available.
   * UNDONE: if the grids hold unloaded products, then the date can be extracted from them.
   *         This function would simplify nicely.
   */
  function validityDate(grids) {
    // When the active layer is considered "current", use its time as now, otherwise use current time as
    // now (but rounded down to the nearest three-hour block).
    var THREE_HOURS = 3 * HOUR;
    var now = grids
      ? grids.primaryGrid.date.getTime()
      // : Math.floor(Date.now() / THREE_HOURS) * THREE_HOURS;
      :datetime
    var parts = configuration.get("date").split("/"); // yyyy/mm/dd or "current"
    var hhmm = configuration.get("hour");
    return parts.length > 1
      ? Date.UTC(+parts[0], parts[1] - 1, +parts[2], +hhmm.substring(0, 2))
      : parts[0] === "current"
      ? now
      : null;
  }

  /**
   * Display the grid's validity date in the menu. Allow toggling between local and UTC time.
   */
  function showDate(grids) {
    var date = new Date(validityDate(grids)),
      isLocal = d3.select("#data-date").classed("local");
    var formatted = isLocal ? µ.toLocalISO(date) : µ.toUTCISO(date);
    d3.select("#data-date").text(formatted + " " + (isLocal ? "Local" : "UTC"));
    d3.select("#toggle-zone").text("⇄ " + (isLocal ? "UTC" : "Local"));
  }

  /**
   * Display the grids' types in the menu.
   */
  function showGridDetails(grids) {
    showDate(grids);
    var description = "",
      center = "";
    if (grids) {
      var langCode = d3.select("body").attr("data-lang") || "en";
      var pd = grids.primaryGrid.description(langCode),
        od = grids.overlayGrid.description(langCode);
      description = od.name + od.qualifier;
      if (grids.primaryGrid !== grids.overlayGrid) {
        // Combine both grid descriptions together with a " + " if their qualifiers are the same.
        description =
          (pd.qualifier === od.qualifier ? pd.name : pd.name + pd.qualifier) +
          " + " +
          description;
      }
      center = grids.overlayGrid.source;
    }
    d3.select("#data-layer").text(description);
    d3.select("#data-center").text(center);
  }

  /**
   * Constructs a toggler for the specified product's units, storing the toggle state on the element having
   * the specified id. For example, given a product having units ["m/s", "mph"], the object returned by this
   * method sets the element's "data-index" attribute to 0 for m/s and 1 for mph. Calling value() returns the
   * currently active units object. Calling next() increments the index.
   */
  function createUnitToggle(id, product) {
    var units = product.units,
      size = units.length;

    var index = +(d3.select(id).attr("data-index") || 0) % size;
    return {
      value: function () {
        return units[index];
      },
      next: function () {
        d3.select(id).attr("data-index", (index = (index + 1) % size));
      },
    };
  }

  /**
   * Display the specified wind value. Allow toggling between the different types of wind units.
   */
  function showWindAtLocation(wind, product) {
    var unitToggle = createUnitToggle("#location-wind-units", product),
      units = unitToggle.value();

    d3.select("#location-wind").text(µ.formatVector(wind, units));
    d3.select("#location-wind-units")
      .text(configuration.changed.level !== "waves" ? units.label : "m | s")
      .on("click", function () {
        if (configuration.changed.level !== "waves") {
          unitToggle.next();
          showWindAtLocation(wind, product);
        }
      });
  }

  /**
   * Display the specified overlay value. Allow toggling between the different types of supported units.
   */
  // function showOverlayValueAtLocation(value, product) {
  //   var unitToggle = createUnitToggle("#location-value-units", product),
  //     units = unitToggle.value();
  //   d3.select("#location-value").text(µ.formatScalar(value, units));
  //   d3.select("#location-value-units")
  //     .text(units.label)
  //     .on("click", function () {
  //       unitToggle.next();
  //       showOverlayValueAtLocation(value, product);
  //     });
  // }

  // Stores the point and coordinate of the currently visible location. This is used to update the location
  // details when the field changes.
  var activeLocation = {};

  /**
   * Display a local data callout at the given [x, y] point and its corresponding [lon, lat] coordinates.
   * The location may not be valid, in which case no callout is displayed. Display location data for both
   * the primary grid and overlay grid, performing interpolation when necessary.
   */
  function showLocationDetails(point, coord) {
    point = point || [];
    coord = coord || [];
    var grids = gridAgent.value(),
      field = fieldAgent.value(),
      λ = coord[0],
      φ = coord[1];
    if (!field || !field.isInsideBoundary(point[0], point[1])) {
      return;
    }

    clearLocationDetails(false); // clean the slate
    activeLocation = { point: point, coord: coord }; // remember where the current location is

    if (_.isFinite(λ) && _.isFinite(φ)) {
      d3.select("#location-coord").text(µ.formatCoordinates(λ, φ));
      d3.select("#location-close").classed("invisible", false);
    }

    if (field.isDefined(point[0], point[1]) && grids) {
      var wind = grids.primaryGrid.interpolate(λ, φ);
      if (µ.isValue(wind)) {
        showWindAtLocation(wind, grids.primaryGrid);
      }
      if (grids.overlayGrid !== grids.primaryGrid) {
        var value = grids.overlayGrid.interpolate(λ, φ);
        if (µ.isValue(value)) {
          showOverlayValueAtLocation(value, grids.overlayGrid);
        }
      }
    }
  }

  function updateLocationDetails() {
    showLocationDetails(activeLocation.point, activeLocation.coord);
  }

  function clearLocationDetails(clearEverything) {
    d3.select("#location-coord").text("");
    d3.select("#location-close").classed("invisible", true);
    d3.select("#location-wind").text("");
    d3.select("#location-wind-units").text("");
    d3.select("#location-velocity-units").text("");
    d3.select("#location-value").text("");
    d3.select("#location-value-units").text("");
    if (clearEverything) {
      activeLocation = {};
      // d3.select(".location-mark").remove();
    }
  }

  function stopCurrentAnimation(alsoClearCanvas) {
    animatorAgent.cancel();
    if (alsoClearCanvas) {
      µ.clearCanvas(d3.select("#animation").node());
    }
  }

  /**
   * Registers a click event handler for the specified DOM element which modifies the configuration to have
   * the attributes represented by newAttr. An event listener is also registered for configuration change events,
   * so when a change occurs the button becomes highlighted (i.e., class ".highlighted" is assigned or removed) if
   * the configuration matches the attributes for this button. The set of attributes used for the matching is taken
   * from newAttr, unless a custom set of keys is provided.
   */
  function bindButtonToConfiguration(elementId, newAttr, keys) {
    keys = keys || _.keys(newAttr);

    d3.select(elementId).on("click", function () {
      if (d3.select(elementId).classed("disabled")) return;
      configuration.save(newAttr);
    });

    configuration.on("change", function (model) {
      var attr = model.attributes;
      d3.select(elementId).classed(
        "highlighted",
        _.isEqual(_.pick(attr, keys), _.pick(newAttr, keys))
      );
    });
  }

  function reportSponsorClick(type) {
    if (ga) {
      ga("send", "event", "sponsor", type);
    }
  }

  /**
   * Registers all event handlers to bind components and page elements together. There must be a cleaner
   * way to accomplish this...
   */
  function init() {
    report.status("Initializing...");

    d3.select("#sponsor-link")
      .attr("target", µ.isEmbeddedInIFrame() ? "_new" : null)
      .on("click", reportSponsorClick.bind(null, "click"))
      .on("contextmenu", reportSponsorClick.bind(null, "right-click"));
    d3.select("#sponsor-hide").on("click", function () {
      sible;

      d3.select("#sponsor").classed("invisible", true);
    });

    d3.selectAll(".fill-screen")
      .attr("width", view.width)
      .attr("height", view.height);
    // Adjust size of the scale canvas to fill the width of the menu to the right of the label.
    var label = d3.select("#scale-label").node();
    d3.select("#scale")
      .attr(
        "width",
        (d3.select("#menu").node().offsetWidth - label.offsetWidth) * 0.97
      )
      .attr("height", label.offsetHeight / 2);

    d3.select("#show-menu").on("click", function () {
      if (µ.isEmbeddedInIFrame()) {
        window.open(
          "http://earth.nullschool.net/" + window.location.hash,
          "_blank"
        );
      } else {
        d3.select("#menu").classed(
          "invisible",
          !d3.select("#menu").classed("invisible")
        );
        weather_markers_menu.style = document.getElementById(
          "weather_markers_menu"
        );
        weather_markers_menu.style.display = "none";
      }
    });

    d3.select("#close_weather_btns").on("click", function () {
      weather_markers_menu.style = document.getElementById(
        "weather_markers_menu"
      );
      weather_markers_menu.style.display = "none";
    });

    d3.select("#markers_btn").on("click", function () {
      d3.select("#menu").classed(
        "invisible",
        !d3.select("#menu").classed("invisible")
      );
      weather_markers_menu.style.display = "block";
    });

    if (µ.isFF()) {
      // Workaround FF performance issue of slow click behavior on map having thick coastlines.
      d3.select("#display").classed("firefox", true);
    }

    // Tweak document to distinguish CSS styling between touch and non-touch environments. Hacky hack.
    if ("ontouchstart" in document.documentElement) {
      d3.select(document).on("touchstart", function () {}); // this hack enables :active pseudoclass
    } else {
      d3.select(document.documentElement).classed("no-touch", true); // to filter styles problematic for touch
    }

    // Bind configuration to URL bar changes.
    d3.select(window).on("hashchange", function () {
      log.debug("hashchange");
      configuration.fetch({ trigger: "hashchange" });
    });

    configuration.on("change", report.reset);

    meshAgent.listenTo(
      configuration,
      "change:topology",
      function (context, attr) {
        meshAgent.submit(buildMesh, attr);
      }
    );

    globeAgent.listenTo(
      configuration,
      "change:projection",
      function (source, attr) {
        globeAgent.submit(buildGlobe, attr);
      }
    );

    gridAgent.listenTo(configuration, "change", function () {
      var changed = _.keys(configuration.changedAttributes()),
        rebuildRequired = false;

      // Build a new grid if any layer-related attributes have changed.
      if (
        _.intersection(changed, ["date", "hour", "param", "surface", "level"])
          .length > 0
      ) {
        rebuildRequired = true;
      }
      // Build a new grid if the new overlay type is different from the current one.
      var overlayType = configuration.get("overlayType") || "default";
      if (_.indexOf(changed, "overlayType") >= 0 && overlayType !== "off") {
        var grids = gridAgent.value() || {},
          primary = grids.primaryGrid,
          overlay = grids.overlayGrid;
        if (!overlay) {
          // Do a rebuild if we have no overlay grid.
          rebuildRequired = true;
        } else if (
          overlay.type !== overlayType &&
          !(overlayType === "default" && primary === overlay)
        ) {
          // Do a rebuild if the types are different.
          rebuildRequired = true;
        }
      }

      if (rebuildRequired) {
        gridAgent.submit(buildGrids);
      }
    });
    gridAgent.on("submit", function () {
      showGridDetails(null);
    });
    gridAgent.on("update", function (grids) {
      showGridDetails(grids);
    });
    d3.select("#toggle-zone").on("click", function () {
      d3.select("#data-date").classed(
        "local",
        !d3.select("#data-date").classed("local")
      );
      showDate(gridAgent.cancel.requested ? null : gridAgent.value());
    });

    function startRendering() {
      rendererAgent.submit(
        buildRenderer,
        meshAgent.value(),
        globeAgent.value()
      );
    }
    rendererAgent.listenTo(meshAgent, "update", startRendering);
    rendererAgent.listenTo(globeAgent, "update", startRendering);

    function startInterpolation() {
      fieldAgent.submit(
        interpolateField,
        globeAgent.value(),
        gridAgent.value()
      );
    }

    function cancelInterpolation() {
      fieldAgent.cancel();
    }
    fieldAgent.listenTo(gridAgent, "update", startInterpolation);
    fieldAgent.listenTo(rendererAgent, "render", startInterpolation);
    fieldAgent.listenTo(rendererAgent, "start", cancelInterpolation);
    fieldAgent.listenTo(rendererAgent, "redraw", cancelInterpolation);

    animatorAgent.listenTo(fieldAgent, "update", function (field) {
      animatorAgent.submit(
        animate,
        globeAgent.value(),
        field,
        gridAgent.value()
      );
    });
    animatorAgent.listenTo(
      rendererAgent,
      "start",
      stopCurrentAnimation.bind(null, true)
    );
    animatorAgent.listenTo(
      gridAgent,
      "submit",
      stopCurrentAnimation.bind(null, false)
    );
    animatorAgent.listenTo(
      fieldAgent,
      "submit",
      stopCurrentAnimation.bind(null, false)
    );

    overlayAgent.listenTo(fieldAgent, "update", function () {
      overlayAgent.submit(
        drawOverlay,
        fieldAgent.value(),
        configuration.get("overlayType")
      );
    });
    overlayAgent.listenTo(rendererAgent, "start", function () {
      overlayAgent.submit(drawOverlay, fieldAgent.value(), null);
    });
    overlayAgent.listenTo(configuration, "change", function () {
      var changed = _.keys(configuration.changedAttributes());
      // if only overlay relevant flags have changed...
      if (
        _.intersection(changed, ["overlayType", "showGridPoints"]).length > 0
      ) {
        overlayAgent.submit(
          drawOverlay,
          fieldAgent.value(),
          configuration.get("overlayType")
        );
      }
    });

    // Add event handlers for showing, updating, and removing location details.
    inputController.on("click", showLocationDetails);
    fieldAgent.on("update", updateLocationDetails);
    d3.select("#location-close").on(
      "click",
      _.partial(clearLocationDetails, true)
    );

    // Modify menu depending on what mode we're in.
    configuration.on("change:param", function (context, mode) {
      if (mode == "wind") {
        document.getElementById("overlay-off").click();
      }
      d3.selectAll(".ocean-mode").classed("invisible", mode !== "ocean");
      d3.selectAll(".wind-mode").classed("invisible", mode !== "wind");
      switch (mode) {
        case "wind":
          d3.select("#nav-backward-more").attr("title", "-1 Day");
          d3.select("#nav-backward").attr("title", "-6 Hours");
          d3.select("#nav-forward").attr("title", "+6 Hours");
          d3.select("#nav-forward-more").attr("title", "+1 Day");
          break;
        case "ocean":
          d3.select("#nav-backward-more").attr("title", "-1 Day");
          d3.select("#nav-backward").attr("title", "-6 Hours");
          d3.select("#nav-forward").attr("title", "+6 Hours");
          d3.select("#nav-forward-more").attr("title", "+1 Day");
          break;
      }
    });

    // Add handlers for mode buttons.
    d3.select("#wind-mode-enable").on("click", function () {
      if (configuration.get("param") !== "wind") {
        configuration.save({
          param: "wind",
          surface: "surface",
          level: "level",
          overlayType: "off",
        });
      }
    });
    configuration.on("change:param", function (x, param) {
      d3.select("#wind-mode-enable").classed("highlighted", param === "wind");
    });
    d3.select("#ocean-mode-enable").on("click", function () {
      if (configuration.get("param") !== "ocean") {
        // When switching between modes, there may be no associated data for the current date. So we need
        // find the closest available according to the catalog. This is not necessary if date is "current".
        // UNDONE: this code is annoying. should be easier to get date for closest ocean product.
        var ocean = {
          param: "ocean",
          surface: "surface",
          level: "currents",
          overlayType: "off",
        };
        var attr = _.clone(configuration.attributes);
        if (attr.date === "current") {
          configuration.save(ocean);
        } else {
          when
            .all(products.productsFor(_.extend(attr, ocean)))
            .spread(function (product) {
              if (product.date) {
                configuration.save(
                  _.extend(ocean, µ.dateToConfig(product.date))
                );
              }
            })
            .otherwise(report.error);
        }
        stopCurrentAnimation(true); // cleanup particle artifacts over continents
      }
    });
    configuration.on("change:param", function (x, param) {
      d3.select("#ocean-mode-enable").classed("highlighted", param === "ocean");
    });

    // Add logic to disable buttons that are incompatible with each other.
    configuration.on("change:overlayType", function (x, ot) {
      d3.select("#surface-level").classed(
        "disabled",
        ot === "air_density" || ot === "wind_power_density"
      );
    });
    configuration.on("change:surface", function (x, s) {
      d3.select("#overlay-air_density").classed("disabled", s === "surface");
      d3.select("#overlay-wind_power_density").classed(
        "disabled",
        s === "surface"
      );
    });

    const change_date = (x) => {
      var date_from_dom = document.getElementById("data-date").textContent;
      var [date, time] = date_from_dom.split(" ");
      var datetime;

      if (x == 0) {
        var currentdate = new Date();
        var utc =
          currentdate.getTime() + currentdate.getTimezoneOffset() * 60000;
        datetime = new Date(utc + 3600000 * "-4.0");

        // current_d = datetime.getDate().toString();
        // current_m = (datetime.getMonth() + 1).toString();
        // current_y = datetime.getFullYear().toString();
        // current_t = datetime.getHours().toString();

        // current_slot = "00";
        // if (current_t >= 0 && current_t <= 5) {
        //   current_slot = "00";
        // } else if (current_t >= 6 && current_t <= 11) {
        //   current_slot = "06";
        // } else if (current_t >= 12 && current_t <= 17) {
        //   current_slot = "12";
        // } else {
        //   current_slot = "18";
        // }
      } else {
        datetime = new Date(date + " " + time);
      }

      console.log("[Change Date Function]", datetime);

      if (Math.abs(x) === 24) {
        datetime.setDate(datetime.getDate() + Math.sign(x) * 1);
      } else if (datetime.getHours() + x > 24) {
        datetime.setDate(datetime.getDate() + 1);
        datetime.setHours(24 - (datetime.getHours() + x));
      } else if (datetime.getHours() + x < 0) {
        datetime.setDate(datetime.getDate() - 1);
        datetime.setHours(24 + (datetime.getHours() + x));
      } else {
        datetime.setHours(datetime.getHours() + x);
      }

      d = datetime.getDate().toString();
      m = (datetime.getMonth() + 1).toString();
      y = datetime.getFullYear().toString();
      t = datetime.getHours().toString();

      slot = "00";
      if (t >= 0 && t <= 5) {
        slot = "00";
      } else if (t >= 6 && t <= 11) {
        slot = "06";
      } else if (t >= 12 && t <= 17) {
        slot = "12";
      } else {
        slot = "18";
      }

      console.log("[Change Date latest]", m + " " + d + " " + slot);
      sessionStorage.setItem("m", m);
      sessionStorage.setItem("slot", slot);
      sessionStorage.setItem("d", d);

      if (
        current_d - d > 2 ||
        (current_d - d === 2 && slot - current_slot < 0) ||
        d - current_d > 5 ||
        (d - current_d === 5 && slot - current_slot > 0)
      ) {
        alert("Out of range : Data cannot be projected");
        return;
      } 
      else {
        location.reload();
      }

      // var currenttime = new Date();
      // var utc = currenttime.getTime() + currenttime.getTimezoneOffset() * 60000;
      // currenttime = new Date(utc + 3600000 * "-4.0");

      // if (
      //   (currenttime.getTime() - datetime.getTime()) / (1000 * 3600 * 24) >
      //   2
      // ) {
      //   return;
      // } else if (
      //   (datetime.getTime() - currenttime.getTime()) / (1000 * 3600 * 24) >
      //   5
      // ) {
      //   return;
      // } else {
        // window.location.href = `http://20.198.70.56:3000/?year=${y}&month=${m}&date=${d}&slot=${slot}`;
        // window.location.href = `http://localhost:3000/?year=${y}&month=${m}&date=${d}&slot=${slot}`;
        // location.reload();

    };

    // Add event handlers for the time navigation buttons.
    d3.select("#nav-backward-more").on("click", () => {
      var mode = window.location.hash.substr(1).split("/");
      if (mode[3] === "currents") {
        change_date(0);
      } else {
        change_date(-24);
      }
    });
    // navigate.bind(null, -10));
    d3.select("#nav-forward-more").on("click", () => {
      var mode = window.location.hash.substr(1).split("/");

      if (mode[3] !== "currents") {
        change_date(+24);
      }
    });
    //  navigate.bind(null, +10));
    d3.select("#nav-backward").on("click", () => {
      var mode = window.location.hash.substr(1).split("/");

      if (mode[3] === "currents") {
        change_date(0);
      } else {
        change_date(-6);
      }
    });
    // navigate.bind(null, -1));
    d3.select("#nav-forward").on("click", () => {
      var mode = window.location.hash.substr(1).split("/");
      if (mode[3] !== "currents") {
        change_date(+6);
      }
    }); /* 
     d3.select("#nav-forward").on("click", navigate.bind(null, +1)); */
    d3.select("#nav-now").on("click", function () {
      change_date(0);
      configuration.save({ date: "current", hour: "" });
    });
    //////--------------------------
    d3.select("#calender-image").on("click", function () {
      document.getElementById("calender-input").click();
    });
    d3.select("#calender-submit").on("click", function () {
      if (document.getElementById("calender-input").value) {
        var date_from_dom = document.getElementById("data-date").textContent;
        var date_from_calender =
          document.getElementById("calender-input").value;
        var [date, time] = date_from_dom.split(" ");
        var datetime = new Date(date_from_calender + " " + time);
        d = datetime.getDate().toString();
        m = (datetime.getMonth() + 1).toString();
        y = datetime.getFullYear().toString();
        t = datetime.getHours().toString();

        slot = "00";
        if (t >= 0 && t <= 5) {
          slot = "00";
        } else if (t >= 6 && t <= 11) {
          slot = "06";
        } else if (t >= 12 && t <= 17) {
          slot = "12";
        } else {
          slot = "18";
        }

        sessionStorage.setItem("m", m);
        sessionStorage.setItem("slot", slot);
        sessionStorage.setItem("d", d);

        console.log("[new date]", m, d, slot);

        if (
          current_d - d > 2 ||
          (current_d - d === 2 && slot - current_slot < 0) ||
          d - current_d > 5 ||
          (d - current_d === 5 && slot - current_slot > 0)
        ) {
          alert("Out of range : Data cannot be projected");

          return;
        } else {
          location.reload();
        }
        // // var currenttime = new Date();
        // // var utc =
        // //   currenttime.getTime() + currenttime.getTimezoneOffset() * 60000;
        // // currenttime = new Date(utc + 3600000 * "-4.0");

        // current_d = currenttime.getDate().toString();
        // current_m = (currenttime.getMonth() + 1).toString();
        // current_y = currenttime.getFullYear().toString();
        // current_t = currenttime.getHours().toString();

        // current_slot = "00";
        // if (current_t >= 0 && current_t <= 5) {
        //   current_slot = "00";
        // } else if (current_t >= 6 && current_t <= 11) {
        //   current_slot = "06";
        // } else if (current_t >= 12 && current_t <= 17) {
        //   current_slot = "12";
        // } else {
        //   current_slot = "18";
        // }

        // if (
        //   (currenttime.getTime() - datetime.getTime()) / (1000 * 3600 * 24) >
        //   2
        // ) {
        //   return;
        // } else if (
        //   (datetime.getTime() - currenttime.getTime()) / (1000 * 3600 * 24) >
        //   5
        // ) {
        //   return;
        // } else {
        //   console.log("latest", m, d, t, slot, forecast);
        //   console.log(
        //     "current",
        //     current_m,
        //     current_d,
        //     current_t,
        //     current_slot,
        //     forecast
        //   );

        //   let Slot_map = { "00": 1, "06": 2, 12: 3, 18: 4 };
        //   let days_diff = d - current_d;
        //   let hours_to_be_added =
        //     days_diff * 24 + (Slot_map[slot] - Slot_map[current_slot]) * 6;
        //   console.log("hours: ", hours_to_be_added);
          // setTimeout(()=>{
          // window.location.href = `http://20.198.70.56:3000/?year=${y}&month=${m}&date=${d}&slot=${slot}`;
          // window.location.href = `http://localhost:3000/?year=${y}&month=${m}&date=${d}&slot=${slot}`;
          // location.reload();
          // }, 2000)
        // }
      }
    });

    ///////------------------------------------------------
    d3.select("#option-show-grid").on("click", function () {
      configuration.save({
        showGridPoints: !configuration.get("showGridPoints"),
      });
    });
    configuration.on("change:showGridPointFs", function (x, showGridPoints) {
      d3.select("#option-show-grid").classed("highlighted", showGridPoints);
    });

    // Add handlers for all wind level buttons.
    d3.selectAll(".surface").each(function () {
      var id = this.id,
        parts = id.split("-");
      bindButtonToConfiguration("#" + id, {
        param: "wind",
        surface: parts[0],
        level: parts[1],
      });
    });

    // Add handlers for ocean animation types.
    bindButtonToConfiguration("#animate-currents", {
      param: "ocean",
      surface: "surface",
      level: "currents",
    });
    bindButtonToConfiguration("#animate-winds", {
      param: "wind",
      surface: "surface",
      level: "level",
    });
    bindButtonToConfiguration("#animate-waves", {
      param: "ocean",
      surface: "surface",
      level: "waves",
    });

    bindButtonToConfiguration("#animate-currents-back", {
      param: "ocean",
      surface: "surface",
      level: "currents",
    });
    bindButtonToConfiguration("#animate-winds-back", {
      param: "wind",
      surface: "surface",
      level: "level",
    });
    bindButtonToConfiguration("#animate-waves-back", {
      param: "ocean",
      surface: "surface",
      level: "waves",
    });

    // Add handlers for all overlay buttons.
    products.overlayTypes.forEach(function (type) {
      bindButtonToConfiguration("#overlay-" + type, { overlayType: type });
    });
    // bindButtonToConfiguration("#overlay-wind", {param: "wind", overlayType: "default"});
    bindButtonToConfiguration("#overlay-ocean-off", { overlayType: "off" });
    // bindButtonToConfiguration("#overlay-currents", {overlayType: "default"});

    // Add handlers for all projection buttons.
    globes.keys().forEach(function (p) {
      bindButtonToConfiguration("#" + p, { projection: p, orientation: "" }, [
        "projection",
      ]);
    });

    // When touch device changes between portrait and landscape, rebuild globe using the new view size.
    d3.select(window).on("orientationchange", function () {
      view = µ.view();
      globeAgent.submit(buildGlobe, configuration.get("projection"));
    });
  }

  function start() {
    // Everything is now set up, so load configuration from the hash fragment and kick off change events.
    configuration.fetch();
  }

  when(true).then(init).then(start).otherwise(report.error);
})();