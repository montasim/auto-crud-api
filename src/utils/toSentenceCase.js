const toSentenceCase = (text) => {
    if (!text) return '';

    // Trim any leading or trailing whitespace and convert to lowercase
    const lowerCaseText = text.trim().toLowerCase();

    // Capitalize the first letter of the sentence
    return lowerCaseText.charAt(0).toUpperCase() + lowerCaseText.slice(1);
};

export default toSentenceCase;
