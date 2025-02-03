const getDeviceType = (userAgent) => {
    if (/mobile/i.test(userAgent)) return 'Mobile';
    if (/tablet/i.test(userAgent)) return 'Tablet';

    return 'Desktop';
};

export default getDeviceType;
