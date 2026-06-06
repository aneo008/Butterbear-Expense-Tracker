import appConfig from '../../app.json';

// Single source of truth = app.json, imported directly (bundled at build time, so
// it's reliable on web + native — unlike Constants.expoConfig, which doesn't surface
// the version consistently on web). SemVer MAJOR.MINOR.PATCH = product.phase.pass;
// the build number (ios.buildNumber / android.versionCode) is the "part" of a pass.
const expo = appConfig.expo;

export const APP_VERSION = expo.version;

export const BUILD_NUMBER =
  expo.ios?.buildNumber ??
  (expo.android?.versionCode != null ? String(expo.android.versionCode) : '0');

export const VERSION_LABEL = `Butter v${APP_VERSION} (build ${BUILD_NUMBER})`;
