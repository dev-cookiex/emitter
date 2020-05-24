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

  public count = <K extends Emitter.Keys<E>>( event: K ) => this.listeners( event ).length

  public listeners = <K extends Emitter.Keys<E>>( event: K ): Emitter.ListenerAssert<E, K>[] => {
    if ( !this.__events[event] ) return this.__events[event] = []
    return this.__events[event] ?? []
  }

  public once: Emitter.Once<E> = <K extends Emitter.Keys<E>>(
    event: K | Emitter.ObjectListeners<E>,
    listener?: Emitter.ListenerAssert<E, K>,
    ...listeners: Emitter.ListenerAssert<E, K>[]
  ) => {
    if ( typeof event === 'object' )
      entries( event )
        .map( ( [ event, listeners ] ) => {
          if ( Array.isArray( listeners ) )
            if ( listeners.length ) return this.once( event, listeners[0], ...listeners.slice( 1 ) )
            else return () => {}
          return this.once( event, listeners as Emitter.ListenerAssert<E> )
        } )
    
    else Array( listener ).concat( listeners ).forEach( listener => {
      const middleware = ( ( ...args: any[] ) => {
        this.off( event, middleware )
        return listener?.( ...args )
      } ) as Emitter.ListenerAssert<E>
      this.on( event, middleware )
    } )
  }

  public on: Emitter.On<E> = <K extends Emitter.Keys<E>>(
    event: K | Emitter.ObjectListeners<E>,
    listener?: Emitter.ListenerAssert<E, K>,
    ...listeners: Emitter.ListenerAssert<E, K>[]
  ) => {
    if ( typeof event === 'object' ) {
      const unlisteners = entries( event )
        .map( ( [ event, listeners ] ) => {
          if ( Array.isArray( listeners ) ) return this.on( event, listeners[0], ...listeners.slice( 1 ) )
          return this.on( event, listeners as Emitter.ListenerAssert<E> )
        } )

      return () => unlisteners.forEach( forEachUnlisteners )
    }

    if ( !listener ) return () => {}

    this.listeners( event ).push( listener, ...listeners )

    return () => this.off( event, listener, ...listeners )
  }

  public off: Emitter.Off<E> = <K extends Emitter.Keys<E>>(
    event: K,
    listener?: Emitter.ListenerAssert<E, K>,
    ...anothers: Emitter.ListenerAssert<E, K>[]
  ) => {
    if ( !listener ) this.__events[event] = []
    else {
      const listeners = Array( listener ).concat( anothers )
      this.__events[event] = this.listeners( event )
        .filter( listener => !listeners.includes( listener ) )
    }
  }

  public emit = <K extends Emitter.Keys<E>>( event: K, ...args: Emitter.ListenerArgs<E, K> ) => {
    this.listeners( event ).forEach( listener => listener( ...args ) )
  }
}

namespace Emitter {
  export type ListenerArgs<E, K extends Keys<E>> =
    Value<E, K> extends ( ...args: infer A ) => any ? A : never

  export type ObjectListeners<E> = {
    [K in keyof E]?: ListenerAssert<E, K> | ListenerAssert<E, K>[]
  }

  export type ListenerAssert<E, K extends Keys<E> = Keys<E>> =
    Value<E, K> extends ( ...args: infer Args ) => infer R ? ( ...args: Args ) => R : never

  export interface Unlinester { (): void }

  export interface Off<E> {
    <K extends Keys<E>>( event: K, listener: ListenerAssert<E, K>, ...listeners: ListenerAssert<E, K>[] ): void
    <K extends Keys<E>>( event: K ): void
  }
  export interface On<E> {
    <K extends keyof E>( event: K, listener: ListenerAssert<E, K>, ...listeners: ListenerAssert<E, K>[] ): Unlinester
    ( listeners: ObjectListeners<E> ): Unlinester
  }
  export interface Once<E> {
    <K extends keyof E>( event: K, listener: ListenerAssert<E, K>, ...listeners: ListenerAssert<E, K>[] ): void
    ( listeners: ObjectListeners<E> ): void
  }
  export type Events<E> = {
    [K in Keys<E>]?: ( ListenerAssert<E, K> )[]
  }

  export type Keys<E> = keyof E
  export type Value<E, K extends Keys<E> = Keys<E>> =
    K extends keyof E ? E[K] :
    never
}

export default Emitter
