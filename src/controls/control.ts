import Emitter from '../'

const control: control = <
  E extends Emitter<any>,
  Ev extends E extends Emitter<infer Events> ? Events : never,
  K extends keyof Ev
>(
    emitter: E,
    event: K,
    ...args: Emitter.ListenerArgs<Ev, K>
  ) => {
  return <R>( control: control.Control<E, Ev, K, R> ) => {

    function* steps () {
      for ( let listener of emitter.listeners( event ) as Emitter.ListenerAssert<Ev, K>[] )
        yield listener

      return void 0
    }

    const step = steps()

    const looping = ( ...args: Emitter.ListenerArgs<Ev, K> ): R => {
      const next = step.next()

      if ( next.done ) return null

      const result = next.value( args )

      return control( {
        result,
        args,
        next: looping,
        remove: () => emitter.off( event, next.value )
      } )
    }

    return looping( ...args )
  }
}

interface control {
  <E extends Emitter<any>,
  Ev extends E extends Emitter<infer Events> ? Events : never,
  K extends keyof Ev>(
    emmiter: E,
    event: K,
    ...args: Emitter.ListenerArgs<Ev, K>
  ): control.Controller<E, Ev, K>
}

namespace control {
  export interface Controller<
    E extends Emitter<any>,
    Ev extends E extends Emitter<infer Events> ? Events : never,
    K extends keyof Ev
  > {
    <R>( control: Control<E, Ev, K, R> ): R
  }
  export interface Manager<E, K extends keyof E, R> {
    args: Emitter.ListenerArgs<E, K>
    result: ReturnType<Emitter.ListenerAssert<E, K>>
    remove(): void
    next( ...args: Emitter.ListenerArgs<E, K> ): R | null
  }
  export type Control<
    E extends Emitter<any>,
    Ev extends E extends Emitter<infer Events> ? Events : never,
    K extends keyof Ev,
    R> = { ( manager: Manager<Ev, K, R> ): R }
}

export default control
