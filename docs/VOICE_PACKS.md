# Voice Packs

The complete Windows archive contains all voices. The base archive contains the same app without recordings.

Each language archive extracts into this structure:

```text
apexping-voice-pack.json
voices/
  en/                 # or zh-CN
    bloodhound/
      variants/
        ...ogg
```

The JSON descriptor uses `version: 1`, `language: "en"` or `"zh-CN"`, and an informational `appVersion`.
Only paths listed in the app's original `voice-manifest.json` are imported. Every recording must match its SHA-256.
Unknown files are ignored. Missing, corrupted, or redirected files abort the import before replacing an installed language.
Files are staged in the app data folder and installed by renaming the completed directory.

Imported voices live under `%APPDATA%\ApexPing\voice-packs\<language>` and take precedence over bundled audio.
Import never writes to the source folder or the game installation. The original OGG files are preserved.

`voice-details.json` records duration, active-sample RMS-derived playback gain, tone, original basename, and peak amplitude.
Gain targets an active-sample RMS of 0.13, is limited to 0.25-2.0, and capped so the measured peak stays below 0.92.
Playback applies gain through Web Audio. This is amplitude balancing, not a claim of equal perceived loudness or manual listening to every line.

Selected mode uses unblocked favorites for the current hero, language, and action. Without favorites, it uses at most five calm lines no longer than four seconds, if available; otherwise the first five unblocked entries. Blocking every entry intentionally leaves only the ping sound.

Windows releases are built with `npm run dist`, then `npm run package:editions` creates and verifies four ZIPs using electron-builder's bundled 7-Zip. The existing full archive remains available alongside the base and language packs.
