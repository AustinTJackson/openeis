var settings = {
    /**
     * If application will not be served at the domain root, set BASE_HREF to
     * URL path component of the application root. (e.g. if application root
     * URL is 'https://example.com/openeis/', set BASE_HREF to '/openeis/')
     */
    BASE_HREF: '/',

    /**
     * URL of OpenEIS API
     */
    API_URL: '/api/',

    /**
     * Redirect destination for anonymous users (root-relative to BASE_HREF)
     */
    LOGIN_PAGE: '/',

    /**
     * Redirect destination for authenticated users (root-relative to BASE_HREF)
     */
    AUTH_HOME: '/projects',

    SENSORMAP_DEFINITION_URL: '/static/projects/json/general_definition.json',
    SENSORMAP_SCHEMA_URL: 'sensormap-schema.json',
    SENSORMAP_UNITS_URL: '/static/projects/json/units.json',
    SENSORMAP_TOPIC_SEPARATOR: '/',
};