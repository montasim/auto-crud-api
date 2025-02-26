import axios from 'axios';
import httpStatus from 'http-status-lite';
import contentTypes from 'content-types-lite';
import configuration from '../configuration/configuration.js';

const verifyTurnstile = async (req, res) => {
    const { token } = req.body;
    const response = await axios.post(
        configuration.service.cloudFlareTurnstile.url,
        {
            secret: configuration.service.cloudFlareTurnstile.secretKey,
            response: token,
        },
        { headers: { 'Content-Type': contentTypes.FORM_URLENCODED } }
    );

    if (response.data.success) {
        res.json({ success: true, message: 'Verification successful' });
    } else {
        res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Verification failed' });
    }
};

export default verifyTurnstile;