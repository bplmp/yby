# Mapas Coletivos

[Mapas Coletivos](http://www.mapascoletivos.com.br) is a collaborative mapping platform that currently uses  [Ushahidi](http://www.ushahidi.com/). Ecolab team is rewriting this platform to make it easier to create custom maps, re-mixing user generated content and OpenStreetMap data.

## The new platform

We don't exactly how it is going to be, but it should have this data from the current platform:

* [mapascoletivos-20141001.zip](https://dl.dropboxusercontent.com/u/3291375/mapascoletivos/mapascoletivos-20141001.zip)


## Development

Requirements:

* Node.js 0.10.x
* npm 1.2.x
* MongoDB

Clone locally: `git clone git@github.com:oeco/mapascoletivos.git`

Install: `npm install`

Copy `.env.example` to `.env` and fill authentication credentials for third party services, like SMTP, Facebook, Twitter, Google. 

Run: `npm run install`.