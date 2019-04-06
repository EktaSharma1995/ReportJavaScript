const express = require('express');
const app = express();
const fs = require('fs');

const util = require('util');
const rpt_file = fs.createWriteStream(__dirname + '/report.txt', {flags : 'w'});
const log_stdout = process.stdout;
const csv = require('csvtojson')

// Overriding console.log to generate report
console.log = function(d) { //
   rpt_file.write(util.format(d) + '\n');
   log_stdout.write(util.format(d) + '\n');
};

// Async file reading
const readFile = function (filename) {
    return new Promise(function (resolve, reject) {
        csv()
            .fromFile(filename)
            .then((jsonObj) => {
                resolve(jsonObj);
            })
    });
};

// Parallel file reading
Promise.all([
    readFile('tests.csv'),
    readFile('students.csv'),
    readFile('marks.csv'),
    readFile('courses.csv')
]).then((results) => {
    let [testResults, studentsResults, marksResults, coursesResults] = results;

    studentsResults.forEach((student) => {
        const studentReport = {
            id: student.id,
            name: student.name,
            average: 0,
            courses: []
        }

        let studentId = student.id;
        let name = student.name;
        console.log("Student Id: " + studentId + ", " + "name: " + name);

        const allMarsks = marksResults.filter(marks => marks.student_id === student.id);

        let average = 0;
        let studentCourses = [];

        allMarsks.forEach((markOfEachTest) => {
            const studentCourse = {};

            let mark = markOfEachTest.mark;

            const testCourseInfo = testResults.filter(test => 
                                                            test.id === markOfEachTest.test_id)[0];

            const coursesInfo = coursesResults.filter(course =>
                                                                course.id === testCourseInfo.course_id)[0];

            studentCourse.courseName = coursesInfo.name;
            studentCourse.teacherName = coursesInfo.teacher;

            getWeight = parseInt(testCourseInfo.weight);

            studentCourse.weightage = (mark * getWeight) / 100;

            if (studentCourses.filter(e => e.courseName === coursesInfo.name).length > 0) {
                studentCourses.filter(e => e.courseName === coursesInfo.name)[0].weightage += studentCourse.weightage;
            } else {
                studentCourses.push(studentCourse);
            }
        });

        let sum = 0;
        studentCourses.forEach((eachCourseMarks) => {
            sum += eachCourseMarks.weightage;
        });

        average = sum / studentCourses.length;
        studentReport.average = average.toFixed(2);
        studentReport.courses = studentCourses;

        console.log("Total Average: " + studentReport.average + "%" + "\n") ;

        studentCourses.sort((a, b) => parseInt(a.id) - parseInt(b.id));

        studentCourses.forEach((iterateCourse) => {
            
            console.log("         " + "Course: " + iterateCourse.courseName + ", " 
                    + "Teacher: " + iterateCourse.teacherName
                       );

            console.log("         " + "Final Grade:  " 
                        + iterateCourse.weightage.toFixed(2) +"%" + "\n"
                       );   
            
            if(iterateCourse.weightage > 100){
                console.log("***** Can't be more than 100 *****");
            }
        });

        if (studentCourses.length < coursesResults.length) {
            console.log("***** Student is not enrolled into all the courses *****");
        }
        console.log("");
        console.log("");

    });

}).catch(err => {
    console.log(err)
});
