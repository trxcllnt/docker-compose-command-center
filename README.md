# docker-compose-command-center
A blessed UI for docker-compose output

![docker-compose-command-center](https://raw.githubusercontent.com/trxcllnt/docker-compose-command-center/master/dccc.gif)

## Prerequisites
Requires node >= v10.0.0.

Use the [node version manager](https://github.com/creationix/nvm#install-script) to easily install and switch between multiple versions of node.

## Installation (optional)
```sh
# use -g to install globally
npm install docker-compose-command-center
```

## Use
```sh
# If installed globally
$ docker-compose up | dccc
# If installed locally
$ docker-compose up | npx dccc
# If using without installing first
$ docker-compose up | npx docker-compose-command-center
```

### Notes
- Press `Q` or `Ctrl-C` to kill `dccc`. Press `Ctrl-C` again to terminate `docker-compose`
- Terminal dependent: hold `shift` to select text with the mouse (e.g. in Ubuntu's default terminal)
- Refer to the [`blessed`](https://github.com/chjj/blessed) package for general usability questions
