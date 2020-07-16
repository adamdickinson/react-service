import React, { createContext, useContext } from 'react'

export interface ServiceProps {
  fallback?: React.FC | string
}

type ServiceComponent<P> = React.FC<P & ServiceProps>
type ServiceHook<A> = () => A

export const createService = <A, P = {}>(
  useApi: (props: P) => A
): [ServiceComponent<P>, ServiceHook<A>, React.Context<A>] => {
  const context = createContext<A>(undefined)
  const { Provider } = context

  const ServiceComponent = createServiceComponent<A, P>(context, useApi)

  const useService: ServiceHook<A> = () => useContext(context)
  return [ServiceComponent, useService, context]
}

const createServiceComponent = <A, P = {}>(
  context: React.Context<A>,
  useApi: (props: P) => A
): ServiceComponent<P> => {
  const { Provider } = context
  const Service: ServiceComponent<P> = props => {
    const Fallback = props.fallback
    const api = useApi(props)
    if (api !== undefined) {
      return <Provider value={api}>{props.children}</Provider>
    }

    return Fallback ? <Fallback /> : null
  }

  return Service
}

export const extendService = createServiceComponent

export default createService
