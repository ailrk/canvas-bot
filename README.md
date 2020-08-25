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

## How to use
To use this client you need a yaml config file specifies your canvas token, url and some program behavior an example config file can be found on `config-demo.yaml`. You can also generate a config file template with `canvasBot template [,-options]` command. About how to generate a canvas token please read [this](https://kb.iu.edu/d/aaja#:~:text=Log%20into%20Canvas%20and%2C%20on,fill%20out%20all%20required%20information.). Make sure you don't share your token, or invalidate the token immediately once you leak the token for some reasons.

## Demo
 [![asciicast](https://asciinema.org/a/vmFHzreI9AQI61sviQ6tr9ZCD.svg)](https://asciinema.org/a/vmFHzreI9AQI61sviQ6tr9ZCD)

## Command line autocomplete
Run the following command

```
canvasBot autocomplete on -s <your shell config file>
```
This will add a autocomplete shell script into your shell config. To remove the autocomplete feature simly remove the corresponding shell scirpt. More information on [here](https://github.com/f/omelette);


## Get help
Run local `canvasBot [command] --help` to get more help on each sub commands.
```

                                      _           _
                                      | |         | |
   ___ __ _ _ ____   ____ _ ___ ______| |__   ___ | |_
  / __/ _` | '_ \ \ / / _` / __|______| '_ \ / _ \| __|
 | (_| (_| | | | \ V / (_| \__ \      | |_) | (_) | |_
  \___\__,_|_| |_|\_/ \__,_|___/      |_.__/ \___/ \__|


Commands:
  canvasBot template              generate yaml template
  canvasBot courses               show all courses
  canvasBot user                  show user info
  canvasBot quota                 show storage quota on canvas
  canvasBot download [yaml]       download files with given yaml config
  canvasBot autocomplete [onoff]  turn on/off autocomplete

Options:
  --help, -h     Show help                                             [boolean]
  --version, -v  Show version number                                   [boolean]

more information from https://github.com/ailrk/canvas-bot
```

#### Please don't share your token!

## LICENSE
MIT
