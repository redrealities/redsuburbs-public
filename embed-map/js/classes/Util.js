class Util {
  static isMobileWidth(width = 768) { return window.innerWidth <= width; }
  static get isDev() { return document.location.href.indexOf('redsuburbs.com.au') === -1; }
}
