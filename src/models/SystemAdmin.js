import { Schema, model } from 'mongoose';

import modelShared from '../lib/schema.js';

const { stringField, dateField, passwordField } = modelShared;

const adminSchema = new Schema(
    {
        name: stringField('Name', true),
        dateOfBirth: stringField('Date of Birth', false),
        email: stringField('Email', true, true),
        hashedPassword: passwordField('Password', true, 8, 200),
        emailVerifyToken: stringField('Email Verify Token'),
        resetPasswordToken: stringField('Reset Password Token'),
        resetPasswordTokenExpiration: dateField(
            'Reset Password Token Expiration'
        ),
    },
    { timestamps: true }
);

const AdminModel = model('Admins', adminSchema);

export default AdminModel;
