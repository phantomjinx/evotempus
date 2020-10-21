 // server/routes.js
 /*
  * Copyright (C) 2020 Paul G. Richardson
  *
  * This program is free software: you can redistribute it and/or modify
  * it under the terms of the GNU General Public License as published by
  * the Free Software Foundation, either version 3 of the License, or
  * (at your option) any later version.
  *
  * This program is distributed in the hope that it will be useful,
  * but WITHOUT ANY WARRANTY; without even the implied warranty of
  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  * GNU General Public License for more details.
  *
  * You should have received a copy of the GNU General Public License
  * along with this program.  If not, see <http://www.gnu.org/licenses/>.
  */

 // grab the interval model we just created
 var Interval = require('./models/interval').Interval;
 var Subject = require('./models/subject').Subject;
 var mongoose = require('mongoose');
 var path = require('path');

 module.exports = function(app) {
   // server routes ===========================================================
   // handle things like api calls
   // authentication routes

   // subjects api route
   app.get('/api/subjects', function(req, res) {
     // use mongoose to get all subjects in the database
     Subject.find(function(err, subjects) {

       // if there is an error retrieving, send the error.
       // nothing after res.send(err) will execute
       if (err)
         res.send(err);

       res.json(subjects); // return all subjects in JSON format
     });
   });

   // intervals api route
   app.get('/api/intervals', function(req, res) {
     // use mongoose to get all intervals in the database
     Interval.find(function(err, intervals) {

       // if there is an error retrieving, send the error.
       // nothing after res.send(err) will execute
       if (err)
         res.send(err);

       res.json(intervals); // return all intervals in JSON format
     });
   });

   app.post('/api/search/subjects', function(req, res) {
     var intervalId = req.body.interval;
     if (!intervalId)
       intervalId = "";

     var intervalObjectId = mongoose.Types.ObjectId(intervalId);

     var response = {};

     //
     // use mongoose to get all subjects in the database
     // that conform to the given intervalId
     //
     var parentCondition = {
       "parent": {
         "$in": intervalObjectId
       }
     };

     Subject.find(parentCondition).sort({
       from: 1
     }).exec(function(err, subjects) {
       if (err) {
         response = {
           "error": true,
           "message": "Error occurred whilst searching for subjects"
         };
       } else {
         if (subjects) {
           console.log("Found subjects: " + subjects.length);
           subjects.forEach(function(subject) {
             console.log("Subject name: " + subject.name);
           })
         } else
           console.log("Found no subjects");

         response = subjects;
       }

       res.json(response);
     });
   });
 };
