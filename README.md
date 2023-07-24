<!-- PROJECT LOGO -->
<p align="center">
  <img src="src/res/icon.ico" alt="Logo" width="80" height="80">
  <h3 align="center">Mega Soundboard</h3>

  <p align="center">
    Play and manage sounds with keybinds
    <br/>
    <a href="https://github.com/Tom4nt/Mega-Soundboard/releases">Download</a>
    ·
    <a href="https://github.com/Tom4nt/Mega-Soundboard/issues/new?assignees=&labels=bug&template=bug_report.md&title=">Report a Bug</a>
    ·
    <a href="https://github.com/Tom4nt/Mega-Soundboard/issues/new?assignees=Tom4nt&labels=New+Feature&projects=&template=feature_request.md&title=">Request Feature</a>
  </p>
</p>

---

Mega Soundboard is an app that allows you to organize sound files and play them to two output devices at the same time, optionally with keybinds.

![d](doc/images/main.png)
![d](doc/images/addSoundboard.png)
![d](doc/images/settings.png)
![d](doc/images/quickSettings.png)
![d](doc/images/devices.png)

## Main features
* Arrange sounds in soundboards.
* Use global keybinds to switch to a different soundboard, play a sound, stop all sounds or disable/enable keybinds.
* Configure volume per output device, soundboard and sound.
* Folder-linked Soundboards: Sounds can synced between a folder on your system and a Soundboard. They are synced instantly and based on events (no polling).
* Move the source file to a specified folder before importing a sound.

## Built With
* [Electron](https://www.electronjs.org/)
* [uiohook-napi](https://github.com/SnosMe/uiohook-napi/)

## Installation
Download a release of Mega Soundboard [here](https://github.com/Tom4nt/Mega-Soundboard/releases). Currently prebuilt and tested only on Windows.

## Contributing
### Prerequisites
* npm
### Build and run
1. Clone repo
2. Install dependencies with `npm install`
3. Run with `npm run start`

## License
Distributed under the MIT License. [More information](https://github.com/Tom4nt/Mega-Soundboard/blob/master/LICENSE).
