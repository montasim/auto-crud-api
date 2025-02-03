const blockedUserAgents = [
    // API testing tools
    'PostmanRuntime/',
    'Insomnia',
    'RapidAPI-Client',
    'Paw/',
    'curl/',
    'HTTPie/',
    'Thunder Client',
    'AdvancedRestClient',
    'RestSharp',
    'Swagger-UI',
    'k6',
    'ApacheBench',
    'SoapUI',
    'Apache JMeter',
    'Fiddler',
    'Wget',

    // Known bots and crawlers
    'Python-urllib',
    'Java/',
    'Googlebot',
    'Bingbot',
    'Yahoo! Slurp',
    'DuckDuckBot',
    'Baiduspider',
    'YandexBot',
    'Sogou',
    'Exabot',
    'facebot',
    'ia_archiver',
    'MJ12bot',
    'AhrefsBot',
    'SemrushBot',
    'DotBot',
    'SerpstatBot',
    'Mediapartners-Google',

    // Other HTTP libraries
    'libwww-perl',
    'python-requests',
    'http-client',
    'Go-http-client',
    'axios',
    'Node-fetch',
    'okhttp',
    'WinHttp.WinHttpRequest',
    'GuzzleHttp/',
    'HttpClient/',

    // Automation tools
    'Selenium',
    'puppeteer',
    'Playwright',
    'PhantomJS',
    'CasperJS',
    'Cypress',
    'webdriver',

    // Miscellaneous tools and scrapers
    'HTTrack',
    'GoScraper',
    'Scrapy',
    'Mechanize',
    'zgrab',
    'Harvest',
    'URL Grabber',
    'Nikto',
    'Nmap',
    'Netcraft',
    'masscan',

    // Generic user-agent patterns to block
    'bot',
    'crawler',
    'spider',
    'http client',
    'scan',
    'scrape',
    'scanner',
    'fetcher',
    'probe',
];

const middlewareConstants = {
    blockedUserAgents,
};

export default middlewareConstants;
