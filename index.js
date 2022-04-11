var fs = require("fs");
var express = require("express");
var app = express();
const path = require("path");
const axios = require("axios");
var JSZip = require("jszip");
var zip = new JSZip();

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/views"));
const { exec } = require("child_process");

// app.use(express.static("K://Xtreme Tech//Globe/Backend/Media"));
app.use(express.static("/home/yawar/xtremebackend/media"))

// read a zip file

app.get("/", async (req, res) => {
  try {
    //    var currentdate = new Date();

    // //  convert to msec
    // //  subtract local time zone offset
    // //  get UTC time in msec
    //   var utc = currentdate.getTime() + (currentdate.getTimezoneOffset() * 60000);

    //  // create new Date object for different city
    //  // using supplied offset
    //  var nd = new Date(utc + (3600000*'-4'));

    //  var re =
    //    nd.getFullYear() +
    //    "/" +
    //    (nd.getMonth() + 1) +
    //    "/" +
    //    nd.getDate() +
    //   "/";

    //   const { year, month, date, slot  } = req.query;
    //    if (year && month && date && slot) {
    //      re = year + "/" + month + "/" + date + "/" + slot ;
    //      console.log(re);
    //  } else {

    //      if (
    //         nd.getHours()  >= 0 &&
    //        nd.getHours()  <= 5
    //      ) {
    //        re += "00";
    //      } else if (
    //        nd.getHours()  >= 6 &&
    //       nd.getHours()  <= 11
    //      ) {
    //        re += "06";
    //      } else if (
    //        nd.getHours()  >= 12 &&
    //        nd.getHours()  <= 17
    //      ) {
    //        re += "12";
    //      } else {
    //        re += "18";
    //      }

    //    }

    var currentdate = new Date();
    var utc = currentdate.getTime() + currentdate.getTimezoneOffset() * 60000;
    var datetime = new Date(utc + 3600000 * "-4.0");

    current_d = datetime.getDate().toString();
    current_m = (datetime.getMonth() + 1).toString();
    current_y = datetime.getFullYear().toString();
    current_t = datetime.getHours().toString();

    current_d = "14";
    current_m = "3";
    current_slot = "12";
    current_t = "12";

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

    let { year, month, day, slot } = req.query;

    // console.log("[req query]", req.query);

    // console.log("[date]", month, day, slot);

    if(!month || !day || !slot){
      month = current_m;
      day = current_d;
      slot = current_slot;
    }

    let Slot_map = { "00": 1, "06": 2, "12": 3, "18": 4 };
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

    // wind
    //  fs.writeFileSync("public/data/weather/current/dummy.json", "", {
    //    encoding: "utf8",
    //    flag: "w",
    //  });

    //    const result = await axios.get(
    //      `http://20.198.64.102/sea_api/wind/` + re
    //    );
    //    console.log(result);
    //    if(result.data !="Data not available")
    //    {
    //     fs.writeFileSync(
    //       "public/data/weather/current/dummy.json",
    //      JSON.stringify(result.data),
    //       { encoding: "utf8", flag: "w" }
    //     );
    //    }

    // //   //  //wave
    // //   // fs.writeFileSync("public/data/weather/wave/dummy.json", "", {
    // //   //   encoding: "utf8",
    // //   //   flag: "w",
    // //   // });
    // const result1 = await axios.get(
    //   "http://20.198.64.102/sea_api/wave/" + re
    // );
    // if(result1.data != "Data not available")
    // {
    // fs.writeFileSync(
    //   "public/data/weather/wave/dummy.json",
    //   JSON.stringify(result1.data),
    //   { encoding: "utf8", flag: "w" }
    // );
    // }

    // // //   //current
    // // //   // fs.writeFileSync("public/data/oscar/currentdummy.json", "", {
    // // //   //   encoding: "utf8",
    // // //   //   flag: "w",
    // // //   // });
    // // //   /*
    //   const result2 = await axios.get(
    //     "http://20.198.64.102/sea_api/current/" + re
    //   );
    //   if(result2.data != "Data not available")

    //   {
    //     fs.writeFileSync(
    //       "public/data/oscar/currentdummy.json",
    //       JSON.stringify(result2.data),
    //       { encoding: "utf8", flag: "w" }
    //     );

    //   }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////



    // const result1 = await axios.get(
    //   `http://61.246.36.252/sea_api/wave/${month}_${data_day}_${data_slot}_${hours_to_be_added}_wave.zip`
    // );

    // console.log("[result wave]", result1);

    // console.log(`${month}_${data_day}_${data_slot}_${hours_to_be_added}`);

    // fs.readFile(`../Backend/Media/wave/${month}_${data_day}_${data_slot}_${hours_to_be_added}_wave.zip`, function (err, data) {
      // console.log("[data wave]", data);
      // if(err){
      //   console.log("[error]", err);
      // }
      // fs.writeFileSync("./public/data/weather/wave/wave.zip", data);

      // JSZip.loadAsync(data).then(function (zip) {
      //   Object.keys(zip.files).forEach(function (filename) {
      //     zip.files[filename].async("string").then(function (fileData) {
      //       console.log(JSON.parse(fileData));
      //       file = JSON.parse(fileData); // These are your file contents

      //       fs.writeFileSync("./public/data/weather/wave/wave.json", JSON.stringify(fileData))

      //       // var uData = file[2].data,
      //       //   vData = file[3].data;
      //       // return {
      //       //   header: file[0].header,
      //       //   interpolate: bilinearInterpolateVector,
      //       //   data: function (i) {
      //       //     return [uData[i], vData[i]];
      //       //   },
      //       // };
      //     });
      //   });
      // });
    // });

    // console.log("[slot, time]", month, data_day, data_slot, hours_to_be_added);

    // fs.readFile(`../Backend/Media/wind/${month}_${data_day}_${data_slot}_${hours_to_be_added}_wind.zip`, function (err, data) {
    //   // console.log("[data wind]", data);
    //   // if(err){
    //   //   console.log("[error]", err);
    //   // }

    //   fs.writeFileSync("./public/data/weather/wind/wind.zip", data);

    //   // JSZip.loadAsync(data).then(function (zip) {
    //   //   Object.keys(zip.files).forEach(function (filename) {
    //   //     zip.files[filename].async("string").then(function (fileData) {
    //   //       console.log(JSON.parse(fileData));
    //   //       file = JSON.parse(fileData); // These are your file contents

    //   //       fs.writeFileSync("./public/data/weather/wind/wind.json", file)

    //   //       // var uData = file[2].data,
    //   //       //   vData = file[3].data;
    //   //       // return {
    //   //       //   header: file[0].header,
    //   //       //   interpolate: bilinearInterpolateVector,
    //   //       //   data: function (i) {
    //   //       //     return [uData[i], vData[i]];
    //   //       //   },
    //   //       // };
    //   //     });
    //   //   });
    //   // });
    // });

    // fs.readFile("../Backend/Media/current/current.zip", function (err, data) {
    //   fs.writeFileSync("./public/data/weather/current/current.zip", data)
    // });

    res.render("home");
  } catch (err) {
    console.log(err);
    res.render("home");
  }
});

app.get("/clientversion", async (req, res) => {
  try {
    //    var currentdate = new Date();

    //    // convert to msec
    //    // subtract local time zone offset
    //    // get UTC time in msec
    //    var utc = currentdate.getTime() + (currentdate.getTimezoneOffset() * 60000);

    //    // create new Date object for different city
    //    // using supplied offset
    //    var nd = new Date(utc + (3600000*'-4'));

    //    var re =
    //      nd.getFullYear() +
    //      "/" +
    //      (nd.getMonth() + 1) +
    //      "/" +
    //      nd.getDate() +
    //     "/";
    //   const { year, month, date, slot } = req.query;
    //    if (year && month && date && slot) {
    //      re = year + "/" + month + "/" + date + "/" + slot;
    //      console.log(re);
    //  } else {
    //      if (
    //         nd.getHours()  >= 0 &&
    //        nd.getHours()  <= 5
    //      ) {
    //        re += "00";
    //      } else if (
    //        nd.getHours()  >= 6 &&
    //       nd.getHours()  <= 11
    //      ) {
    //        re += "06";
    //      } else if (
    //        nd.getHours()  >= 12 &&
    //        nd.getHours()  <= 17
    //      ) {
    //        re += "12";
    //      } else {
    //        re += "18";
    //      }
    //    }

    // wind
    //  fs.writeFileSync("public/data/weather/current/dummy.json", "", {
    //    encoding: "utf8",
    //    flag: "w",
    //  });

    // const data = fs.readFileSync('./input.txt',
    //  const result = fs.readFileSync(
    //    './wind.zip',
    //    {encoding:'utf8', flag:'r'}

    //  );
    //  console.log("[result]", result);
    //  fs.writeFileSync(
    //    "public/data/weather/current/dummy.json",
    //   JSON.stringify(result.data),
    //    { encoding: "utf8", flag: "w" }
    //  );

    //  //wave
    // fs.writeFileSync("public/data/weather/wave/dummy.json", "", {
    //   encoding: "utf8",
    //   flag: "w",
    // });
    // const result1 = await axios.get(
    //   "http://20.198.115.176/sea_api/wave" + re
    // );
    // fs.writeFileSync(
    //   "public/data/weather/wave/wavedummy.json",
    //   JSON.stringify(result1.data),
    //   { encoding: "utf8", flag: "w" }
    // );

    // //current
    // fs.writeFileSync("public/data/oscar/current/currentdummy.json", "", {
    //   encoding: "utf8",
    //   flag: "w",
    // });
    // const result2 = await axios.get(
    //   "http://20.198.115.176/sea_api/current" + re
    // );
    // fs.writeFileSync(
    //   "public/data/oscar/current/currentdummy.json",
    //   JSON.stringify(result2.data),
    //   { encoding: "utf8", flag: "w" }
    // );

    res.sendFile(path.join(__dirname, "/views/send.html"));
  } catch (err) {
    console.log(err);
    res.json("No data");
  }
});

app.get("/winddata/:date/:time", async (req, res) => {
  var datestamp = req.params.date;
  var timestamp = req.params.time;

  var url = `https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_1p00.pl?file=gfs.t00z.pgrb2.1p${timestamp}.f000&leftlon=0&rightlon=360&toplat=90&bottomlat=-90&dir=%2Fgfs.${datestamp}%2F00%2Fatmos`;
  /*
Uncomment these only after downloading one time
exec('del output.json', (error, stdout, stderr) => {
  if (error) {
    console.error(`error: ${error.message}`);
    return;
  }

  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }

  console.log(`Output.json deleted`);
});

exec('del gfs.t00z.pgrb2.1p00.f000', (error, stdout, stderr) => {
  if (error) {
    console.error(`error: ${error.message}`);
    return;
  }

  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }

  console.log('Grib file deleted');
});
*/

  res.redirect(url);

  setInterval(function () {
    exec(
      "grib2json -d -n -o output.json gfs.t00z.pgrb2.1p00.f000",
      (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
        }

        console.log(`New grib file downloaded and Converted to json`);
      }
    );
  }, 10000);
});

app.get("/getdata", (req, res) => {
  exec(
    "start chrome  http://localhost:3000/winddata/20220105/00",
    (error, stdout, stderr) => {
      if (error) {
        console.error(`error: ${error.message}`);
        return;
      }

      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }

      console.log(`stdout:\n${stdout}`);
    }
  );
});

app.listen(3500, function () {
  console.log("Welcome you to XtremeTechnologies");
});
