import sequelize from '../config/database';
import User from './User';
import Class from './Class';
import Teacher from './Teacher';
import Student from './Student';
import Subject from './Subject';
import Grade from './Grade';
import Payment from './Payment';
import Attendance from './Attendance';
import SchoolSettings from './SchoolSettings';
import Evaluation from './Evaluation';
import Expense from './Expense';
import Staff from './Staff';

// Associations

// Class <-> Student
Class.hasMany(Student, { foreignKey: 'classe_id', as: 'students' });
Student.belongsTo(Class, { foreignKey: 'classe_id', as: 'class' });

// Teacher <-> Subject
Teacher.hasMany(Subject, { foreignKey: 'teacher_id', as: 'subjects' });
Subject.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

// Class <-> Subject
Class.hasMany(Subject, { foreignKey: 'classe_id', as: 'subjects' });
Subject.belongsTo(Class, { foreignKey: 'classe_id', as: 'class' });

// Student <-> Grade
Student.hasMany(Grade, { foreignKey: 'eleve_id', as: 'grades' });
Grade.belongsTo(Student, { foreignKey: 'eleve_id', as: 'student' });

// Subject <-> Grade
Subject.hasMany(Grade, { foreignKey: 'matiere_id', as: 'grades' });
Grade.belongsTo(Subject, { foreignKey: 'matiere_id', as: 'subject' });

// Student <-> Payment
Student.hasMany(Payment, { foreignKey: 'eleve_id', as: 'payments' });
Payment.belongsTo(Student, { foreignKey: 'eleve_id', as: 'student' });

// Student <-> Attendance
Student.hasMany(Attendance, { foreignKey: 'eleve_id', as: 'attendance' });
Attendance.belongsTo(Student, { foreignKey: 'eleve_id', as: 'student' });

// User <-> Teacher (for teacher accounts)
Teacher.hasOne(User, { foreignKey: 'teacher_id', as: 'user' });
User.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

// Expense associations
Expense.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });
Teacher.hasMany(Expense, { foreignKey: 'teacher_id', as: 'expenses' });

Expense.belongsTo(Staff, { foreignKey: 'staff_id', as: 'staffMember' });
Staff.hasMany(Expense, { foreignKey: 'staff_id', as: 'expenses' });

export {
    sequelize,
    User,
    Class,
    Teacher,
    Student,
    Subject,
    Grade,
    Payment,
    Attendance,
    SchoolSettings,
    Evaluation,
    Expense,
    Staff,
};
