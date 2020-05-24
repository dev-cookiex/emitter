import Emitter from '../'

const control: control = <
  E extends Emitter<any>,
  Ev extends E extends Emitter<infer Events> ? Events : never,
  K extends keyof Ev
>(
    emitter: E,
    event: K,
    ...args: Emitter.Listeners.Args<Ev, K>
  ) => {
  return <R>( control: control.Control<E, Ev, K, R> ) => {

    function* steps () {
      for ( let listener of emitter.listeners( event ) as Emitter.Listeners.Type<Ev, K>[] )
        yield listener

      return void 0
    }

    const step = steps()

    const looping = ( ...args: Emitter.Listeners.Args<Ev, K> ): R => {
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
    ...args: Emitter.Listeners.Args<Ev, K>
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
    args: Emitter.Listeners.Args<E, K>
    result: ReturnType<Emitter.Listeners.Type<E, K>>
    remove(): void
    next( ...args: Emitter.Listeners.Args<E, K> ): R | null
  }
  export type Control<
    E extends Emitter<any>,
    Ev extends E extends Emitter<infer Events> ? Events : never,
    K extends keyof Ev,
    R> = { ( manager: Manager<Ev, K, R> ): R }
}

export default control
