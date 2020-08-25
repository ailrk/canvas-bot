# Canvas command line client.

A easy to use canvas command line client.

## Features:
- [x] Synchronize canvas courses files to local directory.
- [x] Incremental download and.
- [x] Query canvas user, courses, and group information.
- [ ] Submit assignment.
- [ ] Upload Files to canvas user folder.

## Install
`npm install -g canvas-spider`

## Get help
Run local `canvasSpider [command] --help` to get more help on each sub commands.
```
                                                  (_)   | |
     ___ __ _ _ ____   ____ _ ___ ______ ___ _ __  _  __| | ___ _ __                                                 │
    / __/ _` | '_ \ \ / / _` / __|______/ __| '_ \| |/ _` |/ _ \ '__|
   | (_| (_| | | | \ V / (_| \__ \      \__ \ |_) | | (_| |  __/ |
    \___\__,_|_| |_|\_/ \__,_|___/      |___/ .__/|_|\__,_|\___|_|
                                            | |
                                            |_|


Commands:
  canvasSpider template         generate yaml template
  canvasSpider courses          show all courses
  canvasSpider user             show user info
  canvasSpider quota            show storage quota on canvas
  canvasSpider download [yaml]  download files with given yaml config

Options:
  --help, -h     Show help                                             [boolean]
  --version, -v  Show version number                                   [boolean]

more information from https://github.com/ailrk/canvas-spider
```
