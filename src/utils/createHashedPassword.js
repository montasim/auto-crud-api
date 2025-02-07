import bcrypt from 'bcrypt';

const createHashedPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

export default createHashedPassword;
