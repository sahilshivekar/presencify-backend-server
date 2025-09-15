now write test cases that covers all the cases for all controllers of #file:controller_name  
you have to do it step by step 
meaning you must write tests for one controller then test it and solve if there is any issue depending on whehther the issue is in controller or test and then move to next controller in same controller file until all the controllers are done in that file

remember following key info
If you need to create a instances for testing purpose in beforeEach() of any of these models:
  [Admin, Teacher, Student, University, Branch, Scheme, Semester, Division, Batch, Course, Room, Timetable, Class, Attendance, AttendanceStudent, StudentSemester, StudentDivision, StudentBatch]
  then copy paste them directly from src\test\integration\attendance.controller.tests\addStudentsAttendance.test.js, this will save time to read whole files of models. If the model creation is not done in this file then you have to search it in models 


  don't stop until you are done with all controllers from timetable.controller.js