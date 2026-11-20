class Util {
  static isMobileWidth(width = 768) { return window.innerWidth <= width; }
  // 'local'      = served by the redsuburbs-dev workspace at http://redsuburbs.localhost/embed-map/
  // 'standalone' = served from the repo root by server.sh (port 3000)
  // 'prod'       = anything else (redsuburbs.com.au, staging)
  static get env() {
    if (location.hostname.endsWith('.localhost')) return 'local';
    if (location.port === '3000') return 'standalone';
    return 'prod';
  }
  static get isDev() { return Util.env !== 'prod'; }
  // Pro site (accounts, JWT, Plus data API) for the current environment
  static get proUrl() {
    if (Util.env === 'local') return `${location.protocol}//pro.${location.host}`;
    if (Util.env === 'standalone') return 'http://pro.redsuburbs.localhost';
    return 'https://pro.redsuburbs.com.au';
  }
}
