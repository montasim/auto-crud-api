const mongooseIdRegex = /^[a-f\d]{24}$/i;
const uppercaseRegex = /[A-Z]/;
const lowercaseRegex = /[a-z]/;
const numberRegex = /[0-9]/;
const specialCharacterRegex = /[@$!%*?&#]/;
const passwordRegex = new RegExp(
    `^(?=.*${uppercaseRegex.source})(?=.*${lowercaseRegex.source})(?=.*${numberRegex.source})(?=.*${specialCharacterRegex.source})`
);
const bangladeshMobileRegex = /^(?:\+8801|01)[3-9]\d{8}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const bangliLanguageRegex = /^[\u0980-\u09FF\s]*$/;
const englishLanguageRegex = /^[A-Za-z\s]*$/;

const bangladeshNidRegex = /^\d{10}$/;

const bloodGroupTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const constants = {
    mongooseIdRegex,
    uppercaseRegex,
    lowercaseRegex,
    numberRegex,
    specialCharacterRegex,
    passwordRegex,
    bangladeshMobileRegex,
    emailRegex,
    bangliLanguageRegex,
    englishLanguageRegex,
    bangladeshNidRegex,
    bloodGroupTypes,
};

export default constants;
