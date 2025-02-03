import useragent from 'useragent';

const sendResponse = (
    req,
    res,
    headers,
    status,
    success,
    message,
    data,
    pagination,
    errors
) => {
    const timeStamp = new Date().toTimeString();
    const timeZoneDetails =
        req.headers['Time-Zone'] ||
        Intl.DateTimeFormat().resolvedOptions().timeZone;
    const route = req.url;

    // Detecting device details using the 'User-Agent' header
    const agent = useragent.parse(req.headers['user-agent']);
    const deviceDetails = agent.toString();

    // Detecting IP address (support for proxies)
    const ipAddress =
        req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    return res
        .status(status)
        .set(headers)
        .json({
            meta: {
                // ...(timeStamp && { timeStamp }),
                // ...(timeZoneDetails && { timeZone: timeZoneDetails }),
                // ...(deviceDetails && { device: deviceDetails }),
                // ...(ipAddress && { ip: ipAddress }),
                ...(route && { route }),
            },
            status: {
                ...(success && { success }),
                ...(message && { message }),
            },
            ...(data && { data }),
            ...(errors && { errors }),
        });
};

export default sendResponse;
