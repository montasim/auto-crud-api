const getCallerFunctionName = () => {
    const stack = new Error().stack || '';
    const stackArray = stack.split('\n');

    // Get the second stack frame (the caller function's name)
    const callerFrame = stackArray[2] || '';

    // Extract the function name using regex (matches words before the parentheses)
    const match = callerFrame.match(/at (\w+)/);

    return match ? match[1] : 'UNKNOWN';
};

export default getCallerFunctionName;
