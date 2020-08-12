// Copyright (c) 2020 CookieX
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const entries: {
  <O>( object: O ): [ [ keyof O, O[keyof O] ] ]
} = ( object: any ) => {
  const keys: ( string | symbol )[] = Object.keys( object )
  keys.push( ...Object.getOwnPropertySymbols( object ) )

  return keys.map( ( key ) => [ key, object[key] ] ) as any
}

const forEachUnlisteners = ( unlistener: () => void ) => unlistener()

class Emitter<E> {

  private __events: Emitter.Events<E> = {}

  private __all: Emitter.Listeners.All<E>[] = []

  private __onAll = ( ...listeners: Emitter.Listeners.All<E>[] ) => {
    this.__all.push( ...listeners )
    return () => this.all.off( ...listeners )
  }

  private __onOnce = ( ...listeners: Emitter.Listeners.All<E>[] ) => {
    const middlewares = listeners.map(
      listener => <K extends keyof E>( event: K, ...args: Emitter.Listeners.Args<E, K> ) => {
        this.all.off( listener )
        return listener( event, ...args )
      } )
    return this.all( ...middlewares )
  }

  private __offAll = ( ...listeners: Emitter.Listeners.All<E>[] ) => {
    listeners.forEach(
      listener => this.__all.splice( this.__all.indexOf( listener ), 1 )
    )
  }

  public all = Object.assign( this.__onAll, {
    off: this.__offAll,
    once: this.__onOnce
  } )

  public count = <K extends keyof E>( event: K ) => this.listeners( event ).length

  public listeners = <K extends keyof E>( event: K ): Emitter.Listeners.Type<E, K>[] => {
    if ( !this.__events[event] ) return this.__events[event] = []
    return this.__events[event] ?? []
  }

  public once: Emitter.Once<E> = <K extends keyof E>(
    event: K | Emitter.Listeners.Object<E>,
    listener?: Emitter.Listeners.Type<E, K>,
    ...listeners: Emitter.Listeners.Type<E, K>[]
  ) => {
    if ( typeof event === 'object' )
      entries( event )
        .map( ( [ event, listeners ] ) => {
          if ( Array.isArray( listeners ) )
            if ( listeners.length ) return this.once( event, listeners[0], ...listeners.slice( 1 ) )
            else return () => {}
          return this.once( event, listeners as Emitter.Listeners.Type<E, K> )
        } )
    
    else Array( listener ).concat( listeners ).forEach( listener => {
      const middleware = ( ( ...args: any[] ) => {
        this.off( event, middleware )
        return listener?.( ...args )
      } ) as Emitter.Listeners.Type<E, K>
      this.on( event, middleware )
    } )
  }

  public on: Emitter.On<E> = <K extends keyof E>(
    event: K | Emitter.Listeners.Object<E>,
    listener?: Emitter.Listeners.Type<E, K>,
    ...listeners: Emitter.Listeners.Type<E, K>[]
  ) => {
    if ( typeof event === 'object' ) {
      const unlisteners = entries( event )
        .map( ( [ event, listeners ] ) => {
          if ( Array.isArray( listeners ) ) return this.on( event, listeners[0], ...listeners.slice( 1 ) )
          return this.on( event, listeners as Emitter.Listeners.Type<E, K> )
        } )

      return () => unlisteners.forEach( forEachUnlisteners )
    }

    if ( !listener ) return () => {}

    this.listeners( event ).push( listener, ...listeners )

    return () => this.off( event, listener, ...listeners )
  }

  public off: Emitter.Off<E> = <K extends keyof E>(
    event: K,
    listener?: Emitter.Listeners.Type<E, K>,
    ...anothers: Emitter.Listeners.Type<E, K>[]
  ) => {
    if ( !listener ) this.__events[event] = []
    else {
      const listeners = Array( listener ).concat( anothers )
      this.__events[event] = this.listeners( event )
        .filter( listener => !listeners.includes( listener ) )
    }
  }

  public emit = <K extends keyof E>( event: K, ...args: Emitter.Listeners.Args<E, K> ) => {
    this.__all.forEach( listener => listener( event, ...args ) )
    this.listeners( event ).forEach( listener => listener( ...args ) )
  }
}

namespace Emitter {
  export namespace Listeners {

    export type Args<E, K extends keyof E> = 
      E[K] extends ( ...args: infer A ) => any ? A : never

    export type Type<E, K extends keyof E> =
      E[K] extends ( ...args: infer Args ) => infer R ? ( ...args: Args ) => R : never

    export type Object<E> = {
      [K in keyof E]: Type<E, K> | Type<E, K>[]
    }

    export interface All<E> {
      <K extends keyof E>( event: K, ...args: Args<E, K> ): void
    }

  }

  export type Unlistener = () => void

  export interface Off<E> {
    <K extends keyof E>( event: K, listener: Listeners.Type<E, K>, ...listeners: Listeners.Type<E, K>[] ): void
    <K extends keyof E>( event: K ): void
  }
  export interface On<E> {
    <K extends keyof E>( event: K, listener: Listeners.Type<E, K>, ...listeners: Listeners.Type<E, K>[] ): Unlistener
    ( listeners: Listeners.Object<E> ): Unlistener
  }
  export interface Once<E> {
    <K extends keyof E>( event: K, listener: Listeners.Type<E, K>, ...listeners: Listeners.Type<E, K>[] ): void
    ( listeners: Listeners.Object<E> ): void
  }

  export type Events<E> = {
    [K in keyof E]?: ( Listeners.Type<E, K> )[]
  }
}

export default Emitter
