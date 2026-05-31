module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // NOTE: react-native-reanimated/plugin is intentionally omitted in Phase 1.
    // Reanimated (and its react-native-worklets peer) get wired in Phase 2 for
    // the Butter mascot animations. Nothing in Phase 1 imports Reanimated.
  };
};
