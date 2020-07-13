<!--
 Copyright (c) 2020 CookieX
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

# CX. Emitter
[![npm version](https://img.shields.io/badge/npm-v1.0.0-blueviolet?style=for-the-badge)](https://www.npmjs.com/package/@cookiex/deep)

## Install
---
```
yarn add @cookiex/emitter
```
or
```
npm install --save @cookiex/emitter
```

## Usage
---
```ts
import Emitter from '@cookiex/emitter'

interface Events {
  increment( value: number ): void
  decrement( value: number ): void
}

const emitter = new Emitter<Events>()

let value = 0

emitter.on( 'increment', value => console.log( `++${value}` ) )
// ++1, ++2, ++3, ++4, ++5, ++6, ++7, ++8, ++9, ++10

emitter.on( 'decrement', value => console.log( `--${value}` ) )
// --9, --7, --6, --5, --4

emitter.once( 'decrement', value => value-- )

while( value < 10 ) emitter.emit( 'increment', value++ )

while( value >= 5 ) emitter.emit( 'decrement', value-- )

console.log( value ) // 4
```

## License
---
CookieX Emitter is MIT licensed, as found in the [LICENSE](https://github.com/dev-cookiex/emitter/blob/master/LICENSE) file
