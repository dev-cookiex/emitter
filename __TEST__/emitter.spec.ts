// Copyright (c) 2020 CookieX
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import Emitter from '../src'

describe( 'emitter tests suits', () => {
  it( 'counter', () => {
    interface Events { increment( counter: number ): void }

    const emitter = new Emitter<Events>()
  
    let counter = 0

    emitter.on( 'increment', () => counter++ )

    while( counter < 10 ) emitter.emit( 'increment', counter )

    expect( counter ).toEqual( 10 )

    emitter.once( 'increment', counter => {
      expect( counter + 2 ).toEqual( 12 )
    } )

    expect( emitter.count( 'increment' ) ).toEqual( 2 )

    emitter.emit( 'increment', counter )

    expect( emitter.count( 'increment' ) ).toEqual( 1 )

    expect( counter ).toEqual( 11 )

    emitter.off( 'increment' )

    expect( emitter.count( 'increment' ) ).toEqual( 0 )

  } )

  it( 'multiple listeners with counter', () => {
    interface Events {
      increment: () => void
      decrement: () => void
    }
    const emitter = new Emitter<Events>()

    let counter = 0

    const unlistener = emitter.on( {
      increment: () => { counter++ },
      decrement: [ () => { counter-- }, () => {} ]
    } )

    expect( emitter.count( 'increment' ) ).toEqual( 1 )
    expect( emitter.count( 'decrement' ) ).toEqual( 2 )

    emitter.emit( 'increment' )
    emitter.emit( 'increment' )

    expect( counter ).toEqual( 2 )

    emitter.emit( 'decrement' )

    expect( counter ).toEqual( 1 )

    unlistener()

    expect( emitter.count( 'increment' ) ).toEqual( 0 )
    expect( emitter.count( 'decrement' ) ).toEqual( 0 )

    emitter.emit( 'increment' )

    expect( counter ).toEqual( 1 )

  } )
} )
